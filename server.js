// ==============================
// server.js — Express REST API Server
// ==============================

const express = require('express');
const path    = require('path');

const app  = express();
const PORT = process.env.PORT || 3000;

// ===== Middleware =====
app.use(express.json());                                      // parse JSON body
app.use(express.static(path.join(__dirname, 'public')));      // serve static files

// ===== In-memory Store =====
let todos  = [];
let nextId = 1;

// ==============================
// Helper: หา todo ด้วย id แล้วคืนค่า { todo, index }
// ถ้าไม่เจอ ส่ง 404 ทันที
// ==============================
function findTodo(id, res) {
  const index = todos.findIndex((t) => t.id === id);
  if (index === -1) {
    res.status(404).json({ error: `Todo id ${id} not found` });
    return null;
  }
  return { todo: todos[index], index };
}

// ==============================
// GET /api/todos
// ดึง todo ทั้งหมด
// Response: Todo[]
// ==============================
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// ==============================
// POST /api/todos
// เพิ่ม todo ใหม่
// Body:     { "text": "..." }
// Response: Todo (201 Created)
// ==============================
app.post('/api/todos', (req, res) => {
  const { text } = req.body;

  // Validate
  if (!text || typeof text !== 'string' || text.trim() === '') {
    return res.status(400).json({ error: 'Field "text" is required and must be a non-empty string' });
  }

  const todo = {
    id:        nextId++,
    text:      text.trim(),
    done:      false,
    createdAt: new Date().toISOString(),
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// ==============================
// PUT /api/todos/:id
// Toggle done ↔ undone
// Response: Todo (updated)
// ==============================
app.put('/api/todos/:id', (req, res) => {
  const id     = parseInt(req.params.id, 10);

  // ตรวจ id ว่าเป็นตัวเลขจริงหรือเปล่า
  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id — must be a number' });
  }

  const result = findTodo(id, res);
  if (!result) return; // findTodo ส่ง 404 ไปแล้ว

  // Toggle สถานะ done
  result.todo.done = !result.todo.done;
  res.json(result.todo);
});

// ==============================
// DELETE /api/todos/:id
// ลบ todo ตาม id
// Response: { message, deleted } (200 OK)
// ==============================
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    return res.status(400).json({ error: 'Invalid id — must be a number' });
  }

  const result = findTodo(id, res);
  if (!result) return;

  const [deleted] = todos.splice(result.index, 1);
  res.json({ message: 'Todo deleted', deleted });
});

// ==============================
// Global Error Handler
// รับ error ที่หลุดจาก route ทั้งหมด
// ==============================
app.use((err, req, res, next) => {
  console.error('[Error]', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ===== Fallback → index.html (SPA) =====
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
