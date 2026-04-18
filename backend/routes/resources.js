const express = require('express');
const router = express.Router();
const sql = require('../db');

const VALID_DEPTS = ['BE', 'FE', 'AR', 'QM', 'QA', 'RE', 'EM'];

// GET all resources (with optional ?search= and ?department= filters)
router.get('/', async (req, res) => {
  try {
    const { department, search } = req.query;

    let rows;
    if (department && search) {
      rows = await sql`
        SELECT * FROM resources
        WHERE department = ${department}::department_code
          AND (first_name ILIKE ${'%' + search + '%'} OR last_name ILIKE ${'%' + search + '%'})
        ORDER BY last_name, first_name`;
    } else if (department) {
      rows = await sql`
        SELECT * FROM resources
        WHERE department = ${department}::department_code
        ORDER BY last_name, first_name`;
    } else if (search) {
      rows = await sql`
        SELECT * FROM resources
        WHERE first_name ILIKE ${'%' + search + '%'} OR last_name ILIKE ${'%' + search + '%'}
        ORDER BY last_name, first_name`;
    } else {
      rows = await sql`SELECT * FROM resources ORDER BY last_name, first_name`;
    }

    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resources' });
  }
});

// GET single resource
router.get('/:id', async (req, res) => {
  try {
    const rows = await sql`SELECT * FROM resources WHERE id = ${req.params.id}`;
    if (!rows.length) return res.status(404).json({ error: 'Resource not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch resource' });
  }
});

// POST create resource
router.post('/', async (req, res) => {
  const { first_name, last_name, department, job_title = null, location = null, is_active = true } = req.body;
  if (!first_name?.trim() || !last_name?.trim() || !department)
    return res.status(400).json({ error: 'first_name, last_name, and department are required' });
  if (!VALID_DEPTS.includes(department))
    return res.status(400).json({ error: `department must be one of: ${VALID_DEPTS.join(', ')}` });

  try {
    const rows = await sql`
      INSERT INTO resources (first_name, last_name, job_title, department, location, is_active)
      VALUES (${first_name.trim()}, ${last_name.trim()}, ${job_title}, ${department}::department_code, ${location}, ${is_active})
      RETURNING *`;
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create resource' });
  }
});

// PUT update resource
router.put('/:id', async (req, res) => {
  const { first_name, last_name, department, job_title = null, location = null, is_active = true } = req.body;
  if (!first_name?.trim() || !last_name?.trim() || !department)
    return res.status(400).json({ error: 'first_name, last_name, and department are required' });
  if (!VALID_DEPTS.includes(department))
    return res.status(400).json({ error: `department must be one of: ${VALID_DEPTS.join(', ')}` });

  try {
    const rows = await sql`
      UPDATE resources
      SET first_name = ${first_name.trim()}, last_name = ${last_name.trim()},
          job_title = ${job_title}, department = ${department}::department_code,
          location = ${location}, is_active = ${is_active}
      WHERE id = ${req.params.id}
      RETURNING *`;
    if (!rows.length) return res.status(404).json({ error: 'Resource not found' });
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update resource' });
  }
});

// DELETE resource
router.delete('/:id', async (req, res) => {
  try {
    const rows = await sql`DELETE FROM resources WHERE id = ${req.params.id} RETURNING id`;
    if (!rows.length) return res.status(404).json({ error: 'Resource not found' });
    res.json({ deleted: rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete resource' });
  }
});

module.exports = router;
