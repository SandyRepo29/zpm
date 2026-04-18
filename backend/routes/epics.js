const express = require('express');
const router = express.Router();
const sql = require('../db');

const VALID_STATUS = ['backlog', 'in_progress', 'done', 'cancelled'];

// GET all epics (optionally filtered by ?release_id=)
router.get('/', async (req, res) => {
  try {
    const { release_id } = req.query;
    const rows = await sql`
      SELECT
        e.*,
        r.version                                                                    AS release_version,
        r.name                                                                       AS release_name,
        COUNT(DISTINCT t.id)::int                                                    AS ticket_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done')::int                  AS done_count,
        COALESCE(SUM(t.story_points), 0)::int                                        AS total_points,
        COALESCE(SUM(t.story_points) FILTER (WHERE t.status = 'done'), 0)::int       AS done_points
      FROM epics e
      LEFT JOIN releases r ON r.id = e.release_id
      LEFT JOIN tickets  t ON t.epic_id = e.id
      ${release_id ? sql`WHERE e.release_id = ${release_id}` : sql``}
      GROUP BY e.id, r.version, r.name
      ORDER BY e.created_at DESC`;
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch epics' }); }
});

// GET single epic with full ticket details + assignee
router.get('/:id', async (req, res) => {
  try {
    const [epic] = await sql`
      SELECT e.*, r.version AS release_version, r.name AS release_name
      FROM epics e LEFT JOIN releases r ON r.id = e.release_id
      WHERE e.id = ${req.params.id}`;
    if (!epic) return res.status(404).json({ error: 'Epic not found' });

    const tickets = await sql`
      SELECT
        t.*,
        r.first_name  AS resource_first_name,
        r.last_name   AS resource_last_name,
        r.department  AS resource_department,
        r.job_title   AS resource_job_title
      FROM tickets t
      LEFT JOIN resources r ON r.id = t.resource_id
      WHERE t.epic_id = ${req.params.id}
      ORDER BY t.ticket_no`;
    res.json({ ...epic, tickets });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch epic' }); }
});

// POST create epic
router.post('/', async (req, res) => {
  const { title, description = null, release_id = null, status = 'backlog' } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!VALID_STATUS.includes(status)) return res.status(400).json({ error: 'invalid status' });
  try {
    const [row] = await sql`
      INSERT INTO epics (title, description, release_id, status)
      VALUES (${title.trim()}, ${description}, ${release_id}, ${status}::epic_status)
      RETURNING *`;
    res.status(201).json({ ...row, ticket_count: 0, done_count: 0, total_points: 0, done_points: 0 });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create epic' }); }
});

// PUT update epic
router.put('/:id', async (req, res) => {
  const { title, description = null, release_id = null, status } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (status && !VALID_STATUS.includes(status)) return res.status(400).json({ error: 'invalid status' });
  try {
    const [row] = await sql`
      UPDATE epics SET title=${title.trim()}, description=${description},
        release_id=${release_id}, status=${status}::epic_status
      WHERE id=${req.params.id} RETURNING *`;
    if (!row) return res.status(404).json({ error: 'Epic not found' });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update epic' }); }
});

// DELETE epic (cascades tickets)
router.delete('/:id', async (req, res) => {
  try {
    const [row] = await sql`DELETE FROM epics WHERE id=${req.params.id} RETURNING id`;
    if (!row) return res.status(404).json({ error: 'Epic not found' });
    res.json({ deleted: row.id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete epic' }); }
});

module.exports = router;
