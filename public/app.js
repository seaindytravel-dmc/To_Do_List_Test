// ==============================
// app.js — Client-side Logic
// ทำงานบน Browser, ติดต่อกับ server ผ่าน REST API
// ==============================

// ===== State =====
let todos = [];           // เก็บข้อมูล todo ทั้งหมดที่ fetch มาจาก server
let currentFilter = 'all'; // ตัวกรองปัจจุบัน: 'all' | 'active' | 'completed'

// ===== DOM Elements =====
const input    = document.getElementById('todo-input');
const addBtn   = document.getElementById('add-btn');
const list     = document.getElementById('todo-list');
const statsEl  = document.getElementById('stats');
const filterBtns = document.querySelectorAll('.filter-btn');

// ==============================
// API Helpers — ห่อ fetch ให้ใช้งานง่ายขึ้น
// ==============================

const API = '/api/todos';

/** ดึง todos ทั้งหมดจาก server */
async function fetchTodos() {
  const res = await fetch(API);
  todos = await res.json();
  render();
}

/** สร้าง todo ใหม่ */
async function createTodo(text) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });

  if (!res.ok) {
    const err = await res.json();
    alert(err.error || 'เกิดข้อผิดพลาด');
    return;
  }

  const newTodo = await res.json();
  todos.push(newTodo); // อัปเดต local state โดยไม่ต้อง fetch ใหม่ทั้งหมด
  render();
}

/** สลับสถานะ completed ของ todo */
async function toggleTodo(id, completed) {
  const res = await fetch(`${API}/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  });

  if (!res.ok) return;

  // อัปเดต local state
  const updated = await res.json();
  todos = todos.map((t) => (t.id === updated.id ? updated : t));
  render();
}

/** ลบ todo */
async function deleteTodo(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (!res.ok) return;

  // กรอง todo ที่ถูกลบออกจาก local state
  todos = todos.filter((t) => t.id !== id);
  render();
}

// ==============================
// Render — วาด UI จาก state ปัจจุบัน
// ==============================

function getFilteredTodos() {
  if (currentFilter === 'active')    return todos.filter((t) => !t.completed);
  if (currentFilter === 'completed') return todos.filter((t) => t.completed);
  return todos; // 'all'
}

function render() {
  const filtered = getFilteredTodos();

  // ล้างรายการเก่าออก
  list.innerHTML = '';

  if (filtered.length === 0) {
    // แสดง empty state เมื่อไม่มีรายการ
    list.innerHTML = `<li class="empty">ไม่มีรายการ${currentFilter === 'all' ? '' : currentFilter === 'active' ? 'ที่ยังไม่เสร็จ' : 'ที่เสร็จแล้ว'}</li>`;
  } else {
    filtered.forEach((todo) => {
      const li = document.createElement('li');
      li.className = 'todo-item';
      li.dataset.id = todo.id;

      li.innerHTML = `
        <input type="checkbox" ${todo.completed ? 'checked' : ''} aria-label="toggle" />
        <span class="todo-text ${todo.completed ? 'done' : ''}">${escapeHtml(todo.text)}</span>
        <button class="delete-btn" aria-label="delete">&#x2715;</button>
      `;

      // Event: toggle checkbox
      li.querySelector('input').addEventListener('change', (e) => {
        toggleTodo(todo.id, e.target.checked);
      });

      // Event: ปุ่มลบ
      li.querySelector('.delete-btn').addEventListener('click', () => {
        deleteTodo(todo.id);
      });

      list.appendChild(li);
    });
  }

  // อัปเดตสถิติ
  const total     = todos.length;
  const done      = todos.filter((t) => t.completed).length;
  const remaining = total - done;
  statsEl.textContent = `เหลืออีก ${remaining} รายการ จากทั้งหมด ${total} รายการ`;
}

// ==============================
// Utility: ป้องกัน XSS โดย escape HTML entities
// ==============================
function escapeHtml(str) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// ==============================
// Event Listeners
// ==============================

// ปุ่ม "เพิ่ม" — เพิ่ม todo ใหม่
addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  createTodo(text);
});

// กด Enter ใน input ก็เพิ่มได้เลย
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// ปุ่ม Filter
filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    // สลับ active class
    filterBtns.forEach((b) => b.classList.remove('active'));
    btn.classList.add('active');

    currentFilter = btn.dataset.filter;
    render(); // render ใหม่โดยไม่ต้อง fetch (ข้อมูลอยู่ใน memory แล้ว)
  });
});

// ==============================
// Init — โหลดข้อมูลตอนเปิดหน้า
// ==============================
fetchTodos();
