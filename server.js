// ==============================
// server.js — Express REST API + PostgreSQL
// ==============================

require('dotenv').config();

const express  = require('express');
const path     = require('path');
const { Pool } = require('pg');

const app  = express();
const PORT = process.env.PORT || 3000;

// ===== PostgreSQL Connection Pool =====
const pool = new Pool({ connectionString: process.env.DATABASE_URL });

// ทดสอบการเชื่อมต่อตอน startup
pool.connect()
  .then(() => console.log('Connected to PostgreSQL'))
  .catch((err) => console.error('DB connection error:', err.message));

// ===== Middleware =====
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// GET /api/todos
// ดึง todo ทั้งหมด เรียงตาม created_at
// ==============================
app.get('/api/todos', async (req, res) => {
  try {
    const { rows } = await pool.query('SELECT * FROM todos ORDER BY created_at ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

// ==============================
// POST /api/todos
// เพิ่ม todo ใหม่
// Body: { "text": "..." }
// ==============================
app.post('/api/todos', async (req, res) => {
  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Field "text" is required and must be a non-empty string' });
  }

  try {
    const { rows } = await pool.query(
      'INSERT INTO todos (text) VALUES ($1) RETURNING *',
      [text.trim()]
    );
    res.status(201).json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

// ==============================
// PUT /api/todos/:id
// Toggle done ↔ undone
// ==============================
app.put('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id — must be a number' });
  }

  try {
    const { rows } = await pool.query(
      'UPDATE todos SET done = NOT done WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `Todo id ${id} not found` });
    }

    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

// ==============================
// DELETE /api/todos/:id
// ลบ todo ตาม id
// ==============================
app.delete('/api/todos/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id — must be a number' });
  }

  try {
    const { rows } = await pool.query(
      'DELETE FROM todos WHERE id = $1 RETURNING *',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: `Todo id ${id} not found` });
    }

    res.json({ message: 'Todo deleted', deleted: rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// ===== Global Error Handler =====
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== Fallback → index.html =====
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ===== Start =====
app.listen(PORT, () => {
  console.log(`Server running → http://localhost:${PORT}`);
  console.log('Endpoints:');
  console.log('  GET    /api/todos');
  console.log('  POST   /api/todos');
  console.log('  PUT    /api/todos/:id');
  console.log('  DELETE /api/todos/:id');
});
