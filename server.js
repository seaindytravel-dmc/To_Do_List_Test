// ==============================
// server.js — Express HTTP Server
// ==============================

const express = require('express');
const path = require('path');

const app = express();

// อ่าน PORT จาก environment variable ถ้าไม่มีให้ใช้ 3000
const PORT = process.env.PORT || 3000;

// Middleware: แปลง JSON body จาก request เป็น JavaScript object
app.use(express.json());

// Middleware: Serve static files (HTML, CSS, JS) จากโฟลเดอร์ /public
app.use(express.static(path.join(__dirname, 'public')));

// ==============================
// In-memory data store
// เก็บ todos ไว้ใน array (ข้อมูลจะหายเมื่อ restart server)
// ==============================
let todos = [];
let nextId = 1; // ใช้เป็น auto-increment ID

// ==============================
// REST API Routes
// ==============================

// GET /api/todos — ดึง todo ทั้งหมด
app.get('/api/todos', (req, res) => {
  res.json(todos);
});

// POST /api/todos — สร้าง todo ใหม่
// Body: { "text": "Buy groceries" }
app.post('/api/todos', (req, res) => {
  const { text } = req.body;

  // ตรวจสอบว่ามี text ส่งมาหรือไม่
  if (!text || text.trim() === '') {
    return res.status(400).json({ error: 'Todo text is required' });
  }

  const todo = {
    id: nextId++,
    text: text.trim(),
    completed: false,
    createdAt: new Date().toISOString(),
  };

  todos.push(todo);
  res.status(201).json(todo);
});

// PATCH /api/todos/:id — อัปเดตสถานะ completed ของ todo
// Body: { "completed": true }
app.patch('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const todo = todos.find((t) => t.id === id);

  if (!todo) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  // อัปเดตเฉพาะ field ที่ส่งมา
  if (typeof req.body.completed === 'boolean') {
    todo.completed = req.body.completed;
  }
  if (req.body.text && req.body.text.trim() !== '') {
    todo.text = req.body.text.trim();
  }

  res.json(todo);
});

// DELETE /api/todos/:id — ลบ todo ตาม id
app.delete('/api/todos/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = todos.findIndex((t) => t.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Todo not found' });
  }

  todos.splice(index, 1);
  res.status(204).send(); // 204 No Content
});

// ==============================
// Fallback: ส่ง index.html สำหรับทุก route ที่ไม่ใช่ API
// (รองรับ Single Page App)
// ==============================
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==============================
// Start Server
// ==============================
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
