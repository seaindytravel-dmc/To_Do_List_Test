// ==============================
// app.js — Client-side Logic
// ==============================

let todos = [];
let currentFilter = 'all';

const input      = document.getElementById('todo-input');
const addBtn     = document.getElementById('add-btn');
const list       = document.getElementById('todo-list');
const emptyState = document.getElementById('empty-state');
const filterBtns = document.querySelectorAll('.filter-btn');
const template   = document.getElementById('todo-template');

// Stat elements
const statTotal  = document.getElementById('stat-total');
const statActive = document.getElementById('stat-active');
const statDone   = document.getElementById('stat-done');
const statPct    = document.getElementById('stat-pct');
const progressBar = document.getElementById('progress-bar');

const API = '/api/todos';

// ===== API =====

async function fetchTodos() {
  const res = await fetch(API);
  todos = await res.json();
  render();
}

async function createTodo(text) {
  const res = await fetch(API, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) return;
  todos.push(await res.json());
  render();
}

async function toggleTodo(id) {
  const res = await fetch(`${API}/${id}`, { method: 'PUT' });
  if (!res.ok) return;
  const updated = await res.json();
  todos = todos.map((t) => (t.id === updated.id ? updated : t));
  render();
}

async function deleteTodo(id) {
  const res = await fetch(`${API}/${id}`, { method: 'DELETE' });
  if (!res.ok) return;
  todos = todos.filter((t) => t.id !== id);
  render();
}

// ===== Render =====

function getFiltered() {
  if (currentFilter === 'active')    return todos.filter((t) => !t.done);
  if (currentFilter === 'completed') return todos.filter((t) => t.done);
  return todos;
}

function updateStats() {
  const total  = todos.length;
  const done   = todos.filter((t) => t.done).length;
  const active = total - done;
  const pct    = total === 0 ? 0 : Math.round((done / total) * 100);

  statTotal.textContent  = total;
  statActive.textContent = active;
  statDone.textContent   = done;
  statPct.textContent    = `${pct}%`;
  progressBar.style.width = `${pct}%`;
}

function render() {
  updateStats();

  const filtered = getFiltered();
  list.innerHTML = '';

  // Empty state
  emptyState.classList.toggle('hidden', filtered.length > 0);

  filtered.forEach((todo) => {
    const item      = template.content.cloneNode(true).querySelector('li');
    const checkbox  = item.querySelector('input[type="checkbox"]');
    const textEl    = item.querySelector('.todo-text');
    const badge     = item.querySelector('.badge');
    const deleteBtn = item.querySelector('.delete-btn');

    checkbox.checked   = todo.done;
    textEl.textContent = todo.text;

    if (todo.done) {
      textEl.classList.add('line-through', 'text-gray-400');
      badge.textContent = 'Completed';
      badge.className  += ' bg-emerald-50 text-emerald-600';
    } else {
      badge.textContent = 'In Progress';
      badge.className  += ' bg-primary/10 text-primary';
    }

    checkbox.addEventListener('change', () => toggleTodo(todo.id));
    deleteBtn.addEventListener('click', () => deleteTodo(todo.id));

    list.appendChild(item);
  });
}

// ===== Filter Tabs =====

filterBtns.forEach((btn) => {
  btn.addEventListener('click', () => {
    filterBtns.forEach((b) => {
      b.classList.remove('bg-white', 'text-gray-800', 'shadow-sm');
      b.classList.add('text-gray-500');
    });
    btn.classList.add('bg-white', 'text-gray-800', 'shadow-sm');
    btn.classList.remove('text-gray-500');
    currentFilter = btn.dataset.filter;
    render();
  });
});

// ===== Input =====

addBtn.addEventListener('click', () => {
  const text = input.value.trim();
  if (!text) return;
  input.value = '';
  createTodo(text);
});

input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addBtn.click();
});

// ===== Init =====
fetchTodos();
