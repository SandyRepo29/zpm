const express = require('express');
const router = express.Router();
const sql = require('../db');

// GET all teams with member count + dept breakdown
router.get('/', async (req, res) => {
  try {
    const teams = await sql`
      SELECT
        t.id, t.name, t.description, t.created_at,
        COUNT(tm.resource_id)::int AS member_count,
        COALESCE(
          json_agg(
            json_build_object('department', r.department)
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS members
      FROM teams t
      LEFT JOIN team_members tm ON tm.team_id = t.id
      LEFT JOIN resources r ON r.id = tm.resource_id
      GROUP BY t.id
      ORDER BY t.name`;
    res.json(teams);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

// GET single team with full member details
router.get('/:id', async (req, res) => {
  try {
    const rows = await sql`
      SELECT
        t.id, t.name, t.description, t.created_at,
        COALESCE(
          json_agg(
            json_build_object(
              'id',         r.id,
              'first_name', r.first_name,
              'last_name',  r.last_name,
              'job_title',  r.job_title,
              'department', r.department,
              'location',   r.location,
              'is_active',  r.is_active
            ) ORDER BY r.last_name, r.first_name
          ) FILTER (WHERE r.id IS NOT NULL),
          '[]'
        ) AS members
      FROM teams t
      LEFT JOIN team_members tm ON tm.team_id = t.id
      LEFT JOIN resources r ON r.id = tm.resource_id
      WHERE t.id = ${req.params.id}
      GROUP BY t.id`;
    if (!rows.length) return res.status(404).json({ error: 'Team not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// POST create team
router.post('/', async (req, res) => {
  const { name, description = null } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const rows = await sql`
      INSERT INTO teams (name, description)
      VALUES (${name.trim()}, ${description})
      RETURNING *`;
    res.status(201).json({ ...rows[0], member_count: 0, members: [] });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Team name already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// PUT update team
router.put('/:id', async (req, res) => {
  const { name, description = null } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'name is required' });
  try {
    const rows = await sql`
      UPDATE teams SET name = ${name.trim()}, description = ${description}
      WHERE id = ${req.params.id} RETURNING *`;
    if (!rows.length) return res.status(404).json({ error: 'Team not found' });
    res.json(rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Team name already exists' });
    console.error(err);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// DELETE team
router.delete('/:id', async (req, res) => {
  try {
    const rows = await sql`DELETE FROM teams WHERE id = ${req.params.id} RETURNING id`;
    if (!rows.length) return res.status(404).json({ error: 'Team not found' });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// POST add member to team
router.post('/:id/members', async (req, res) => {
  const { resource_id } = req.body;
  if (!resource_id) return res.status(400).json({ error: 'resource_id is required' });
  try {
    await sql`
      INSERT INTO team_members (team_id, resource_id)
      VALUES (${req.params.id}, ${resource_id})
      ON CONFLICT DO NOTHING`;
    const team = await getTeamWithMembers(req.params.id);
    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// DELETE remove member from team
router.delete('/:id/members/:resourceId', async (req, res) => {
  try {
    await sql`
      DELETE FROM team_members
      WHERE team_id = ${req.params.id} AND resource_id = ${req.params.resourceId}`;
    const team = await getTeamWithMembers(req.params.id);
    res.json(team);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

async function getTeamWithMembers(id) {
  const rows = await sql`
    SELECT t.id, t.name, t.description, t.created_at,
      COALESCE(
        json_agg(
          json_build_object(
            'id', r.id, 'first_name', r.first_name, 'last_name', r.last_name,
            'job_title', r.job_title, 'department', r.department,
            'location', r.location, 'is_active', r.is_active
          ) ORDER BY r.last_name, r.first_name
        ) FILTER (WHERE r.id IS NOT NULL), '[]'
      ) AS members
    FROM teams t
    LEFT JOIN team_members tm ON tm.team_id = t.id
    LEFT JOIN resources r ON r.id = tm.resource_id
    WHERE t.id = ${id}
    GROUP BY t.id`;
  return rows[0];
}

module.exports = router;
