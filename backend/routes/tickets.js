const express = require('express');
const router = express.Router();
const sql = require('../db');

const VALID_STATUS = ['backlog', 'todo', 'in_progress', 'review', 'done'];
const VALID_TYPES  = ['story', 'bug', 'task', 'sub_task'];
const VALID_POINTS = [1, 2, 3, 5, 8, 13, 21];

// GET tickets (optionally ?epic_id=)
router.get('/', async (req, res) => {
  try {
    const { epic_id } = req.query;
    const rows = await sql`
      SELECT t.*,
        r.first_name AS resource_first_name, r.last_name AS resource_last_name,
        r.department AS resource_department
      FROM tickets t
      LEFT JOIN resources r ON r.id = t.resource_id
      ${epic_id ? sql`WHERE t.epic_id = ${epic_id}` : sql``}
      ORDER BY t.ticket_no`;
    res.json(rows);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch tickets' }); }
});

// GET single ticket
router.get('/:id', async (req, res) => {
  try {
    const [row] = await sql`
      SELECT t.*,
        r.first_name AS resource_first_name, r.last_name AS resource_last_name,
        r.department AS resource_department, r.job_title AS resource_job_title
      FROM tickets t LEFT JOIN resources r ON r.id = t.resource_id
      WHERE t.id = ${req.params.id}`;
    if (!row) return res.status(404).json({ error: 'Ticket not found' });
    res.json(row);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to fetch ticket' }); }
});

// POST create ticket
router.post('/', async (req, res) => {
  const { epic_id, title, description = null, type = 'story', status = 'backlog',
          resource_id = null, story_points = null, start_date = null, end_date = null } = req.body;
  if (!epic_id)       return res.status(400).json({ error: 'epic_id is required' });
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (!VALID_STATUS.includes(status)) return res.status(400).json({ error: 'invalid status' });
  if (!VALID_TYPES.includes(type))    return res.status(400).json({ error: 'invalid type' });
  if (story_points !== null && !VALID_POINTS.includes(Number(story_points)))
    return res.status(400).json({ error: 'story_points must be 1,2,3,5,8,13 or 21' });

  try {
    const [row] = await sql`
      INSERT INTO tickets (epic_id, title, description, type, status, resource_id, story_points, start_date, end_date)
      VALUES (${epic_id}, ${title.trim()}, ${description}, ${type}::ticket_type, ${status}::ticket_status,
              ${resource_id}, ${story_points}, ${start_date}, ${end_date})
      RETURNING *`;
    // Re-fetch with resource join
    const [full] = await sql`
      SELECT t.*, r.first_name AS resource_first_name, r.last_name AS resource_last_name,
        r.department AS resource_department
      FROM tickets t LEFT JOIN resources r ON r.id = t.resource_id WHERE t.id = ${row.id}`;
    res.status(201).json(full);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to create ticket' }); }
});

// PUT update ticket
router.put('/:id', async (req, res) => {
  const { title, description = null, type, status, resource_id = null,
          story_points = null, start_date = null, end_date = null } = req.body;
  if (!title?.trim()) return res.status(400).json({ error: 'title is required' });
  if (status && !VALID_STATUS.includes(status)) return res.status(400).json({ error: 'invalid status' });
  if (type   && !VALID_TYPES.includes(type))    return res.status(400).json({ error: 'invalid type' });

  try {
    const [row] = await sql`
      UPDATE tickets SET title=${title.trim()}, description=${description},
        type=${type}::ticket_type, status=${status}::ticket_status,
        resource_id=${resource_id}, story_points=${story_points},
        start_date=${start_date}, end_date=${end_date}
      WHERE id=${req.params.id} RETURNING *`;
    if (!row) return res.status(404).json({ error: 'Ticket not found' });
    const [full] = await sql`
      SELECT t.*, r.first_name AS resource_first_name, r.last_name AS resource_last_name,
        r.department AS resource_department
      FROM tickets t LEFT JOIN resources r ON r.id = t.resource_id WHERE t.id = ${row.id}`;
    res.json(full);
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to update ticket' }); }
});

// DELETE ticket
router.delete('/:id', async (req, res) => {
  try {
    const [row] = await sql`DELETE FROM tickets WHERE id=${req.params.id} RETURNING id`;
    if (!row) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ deleted: row.id });
  } catch (err) { console.error(err); res.status(500).json({ error: 'Failed to delete ticket' }); }
});

module.exports = router;
