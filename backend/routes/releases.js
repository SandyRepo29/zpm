const express = require('express');
const router = express.Router();
const sql = require('../db');

const VALID_STATUS = ['planning', 'in_progress', 'released', 'cancelled'];

// GET all releases with epic + ticket stats
router.get('/', async (req, res) => {
  try {
    const rows = await sql`
      SELECT
        r.*,
        COUNT(DISTINCT e.id)::int                                                   AS epic_count,
        COUNT(DISTINCT t.id)::int                                                   AS ticket_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done')::int                 AS done_count,
        COALESCE(SUM(t.story_points), 0)::int                                       AS total_points,
        COALESCE(SUM(t.story_points) FILTER (WHERE t.status = 'done'), 0)::int      AS done_points
      FROM releases r
      LEFT JOIN epics   e ON e.release_id = r.id
      LEFT JOIN tickets t ON t.epic_id    = e.id
      GROUP BY r.id
      ORDER BY r.version DESC`;
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch releases' }); }
});

// GET single release with epics + ticket stats per epic
router.get('/:id', async (req, res) => {
  try {
    const [release] = await sql`SELECT * FROM releases WHERE id = ${req.params.id}`;
    if (!release) return res.status(404).json({ error: 'Release not found' });

    const epics = await sql`
      SELECT
        e.*,
        COUNT(DISTINCT t.id)::int                                               AS ticket_count,
        COUNT(DISTINCT t.id) FILTER (WHERE t.status = 'done')::int             AS done_count,
        COALESCE(SUM(t.story_points), 0)::int                                   AS total_points,
        COALESCE(SUM(t.story_points) FILTER (WHERE t.status = 'done'), 0)::int  AS done_points
      FROM epics e
      LEFT JOIN tickets t ON t.epic_id = e.id
      WHERE e.release_id = ${req.params.id}
      GROUP BY e.id
      ORDER BY e.created_at`;
    res.json({ ...release, epics });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch release' }); }
});

// POST create release
router.post('/', async (req, res) => {
  const { version, name = null, description = null, release_date = null, status = 'planning' } = req.body;
  if (!version?.trim()) return res.status(400).json({ error: 'version is required' });
  if (!VALID_STATUS.includes(status)) return res.status(400).json({ error: 'invalid status' });
  try {
    const [row] = await sql`
      INSERT INTO releases (version, name, description, release_date, status)
      VALUES (${version.trim()}, ${name}, ${description}, ${release_date}, ${status}::release_status)
      RETURNING *`;
    res.status(201).json({ ...row, epic_count: 0, ticket_count: 0, done_count: 0, total_points: 0, done_points: 0 });
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Version already exists' });
    console.error(err); res.status(500).json({ error: 'Failed to create release' });
  }
});

// PUT update release
router.put('/:id', async (req, res) => {
  const { version, name = null, description = null, release_date = null, status } = req.body;
  if (!version?.trim()) return res.status(400).json({ error: 'version is required' });
  if (status && !VALID_STATUS.includes(status)) return res.status(400).json({ error: 'invalid status' });
  try {
    const [row] = await sql`
      UPDATE releases SET version=${version.trim()}, name=${name}, description=${description},
        release_date=${release_date}, status=${status}::release_status
      WHERE id=${req.params.id} RETURNING *`;
    if (!row) return res.status(404).json({ error: 'Release not found' });
    res.json(row);
  } catch (err) {
    if (err.code === '23505') return res.status(409).json({ error: 'Version already exists' });
    console.error(err); res.status(500).json({ error: 'Failed to update release' });
  }
});

// DELETE release
router.delete('/:id', async (req, res) => {
  try {
    const [row] = await sql`DELETE FROM releases WHERE id=${req.params.id} RETURNING id`;
    if (!row) return res.status(404).json({ error: 'Release not found' });
    res.json({ deleted: row.id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete release' }); }
});

module.exports = router;
