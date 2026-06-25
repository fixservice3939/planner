// ============================================
// СОСТОЯНИЕ
// ============================================
let tasks = [];
let currentTab = 'active';
let editingId = null;

// DOM-элементы
const taskListEl = document.getElementById('taskList');
const taskInput = document.getElementById('taskInput');
const categorySelect = document.getElementById('categorySelect');
const addBtn = document.getElementById('addBtn');
const searchInput = document.getElementById('searchInput');
const categoryFilter = document.getElementById('categoryFilter');
const sortSelect = document.getElementById('sortSelect');

const tabBtns = document.querySelectorAll('.tab-btn');
const activeCount = document.getElementById('activeCount');
const doneCount = document.getElementById('doneCount');
const allCount = document.getElementById('allCount');

const totalTasks = document.getElementById('totalTasks');
const totalActive = document.getElementById('totalActive');
const totalDone = document.getElementById('totalDone');

const exportBtn = document.getElementById('exportBtn');
const importBtn = document.getElementById('importBtn');
const fileInput = document.getElementById('fileInput');

const editModal = document.getElementById('editModal');
const editInput = document.getElementById('editInput');
const editCategory = document.getElementById('editCategory');
const editSaveBtn = document.getElementById('editSaveBtn');
const editCancelBtn = document.getElementById('editCancelBtn');

// ============================================
// ЗАГРУЗКА / СОХРАНЕНИЕ
// ============================================
function loadTasks() {
    const stored = localStorage.getItem('todoTasks');
    if (stored) {
        try {
            tasks = JSON.parse(stored);
        } catch {
            tasks = [];
        }
    } else {
        // Демо-данные
        tasks = [
            { id: Date.now() + 1, text: 'Сделать зарядку', category: 'здоровье', done: false, createdAt: Date.now() - 86400000, doneAt: null },
            { id: Date.now() + 2, text: 'Прочитать главу книги', category: 'учеба', done: false, createdAt: Date.now() - 172800000, doneAt: null },
            { id: Date.now() + 3, text: 'Купить продукты', category: 'личное', done: true, createdAt: Date.now() - 259200000, doneAt: Date.now() - 3600000 },
        ];
    }
}

function saveTasks() {
    localStorage.setItem('todoTasks', JSON.stringify(tasks));
}

// ============================================
// ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
// ============================================
function generateId() {
    return Date.now() + Math.floor(Math.random() * 10000);
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(timestamp) {
    if (!timestamp) return '—';
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Только что';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} мин. назад`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} ч. назад`;
    if (diff < 172800000) return 'Вчера';
    
    return date.toLocaleDateString('ru-RU', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

function getCategoryEmoji(category) {
    const map = {
        'работа': '💼',
        'личное': '❤️',
        'учеба': '📚',
        'здоровье': '💪',
        'другое': '📌'
    };
    return map[category] || '📌';
}

function getCategoryColor(category) {
    const map = {
        'работа': '#3b82f6',
        'личное': '#ec4899',
        'учеба': '#8b5cf6',
        'здоровье': '#22c55e',
        'другое': '#f59e0b'
    };
    return map[category] || '#94a3b8';
}

// ============================================
// ФИЛЬТРАЦИЯ И СОРТИРОВКА
// ============================================
function getFilteredTasks() {
    let filtered = [...tasks];
    
    // Фильтр по вкладке
    if (currentTab === 'active') {
        filtered = filtered.filter(t => !t.done);
    } else if (currentTab === 'done') {
        filtered = filtered.filter(t => t.done);
    }
    // 'all' — показываем все
    
    // Поиск
    const search = searchInput.value.toLowerCase().trim();
    if (search) {
        filtered = filtered.filter(t => t.text.toLowerCase().includes(search));
    }
    
    // Фильтр по категории
    const category = categoryFilter.value;
    if (category !== 'all') {
        filtered = filtered.filter(t => t.category === category);
    }
    
    // Сортировка
    const sort = sortSelect.value;
    if (sort === 'newest') {
        filtered.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sort === 'oldest') {
        filtered.sort((a, b) => a.createdAt - b.createdAt);
    } else if (sort === 'alphabet') {
        filtered.sort((a, b) => a.text.localeCompare(b.text));
    }
    
    return filtered;
}

// ============================================
// РЕНДЕР
// ============================================
function render() {
    const filtered = getFilteredTasks();
    
    // Обновляем счетчики
    updateCounters();
    
    if (filtered.length === 0) {
        const messages = {
            'active': '🎯 Нет активных задач',
            'done': '✅ Нет выполненных задач',
            'all': '📭 Нет задач'
        };
        taskListEl.innerHTML = `
            <div class="empty-msg">
                ${messages[currentTab] || 'Нет задач'}
            </div>
        `;
        return;
    }
    
    let html = '';
    filtered.forEach(task => {
        const categoryEmoji = getCategoryEmoji(task.category);
        const categoryColor = getCategoryColor(task.category);
        const isDone = task.done;
        const doneClass = isDone ? 'done' : '';
        const dateLabel = isDone ? 'Выполнено' : 'Создано';
        const dateValue = isDone ? task.doneAt : task.createdAt;
        
        html += `
            <div class="task-item ${doneClass}" data-id="${task.id}">
                <div class="task-left">
                    <span class="task-text" onclick="openEditModal(${task.id})" title="Двойной клик для редактирования">
                        ${escapeHtml(task.text)}
                    </span>
                    <div class="task-meta">
                        <span class="task-category" style="background: ${categoryColor}20; color: ${categoryColor}">
                            ${categoryEmoji} ${task.category}
                        </span>
                        <span class="task-date">${dateLabel}: ${formatDate(dateValue)}</span>
                    </div>
                </div>
                <div class="task-actions">
                    ${!isDone 
                        ? `<button class="btn-done" onclick="markDone(${task.id})">✅ Выполнено</button>
                           <button class="btn-delete" onclick="deleteTask(${task.id})">🗑 Удалить</button>`
                        : `<button class="btn-remove-done" onclick="deleteTask(${task.id})">🗑 Удалить</button>`
                    }
                </div>
            </div>
        `;
    });
    
    taskListEl.innerHTML = html;
}

// ============================================
// ОБНОВЛЕНИЕ СЧЕТЧИКОВ
// ============================================
function updateCounters() {
    const total = tasks.length;
    const active = tasks.filter(t => !t.done).length;
    const done = tasks.filter(t => t.done).length;
    
    activeCount.textContent = active;
    doneCount.textContent = done;
    allCount.textContent = total;
    
    totalTasks.textContent = total;
    totalActive.textContent = active;
    totalDone.textContent = done;
}

// ============================================
// ОСНОВНЫЕ ДЕЙСТВИЯ
// ============================================
function markDone(id) {
    const task = tasks.find(t => t.id === id);
    if (task) {
        task.done = true;
        task.doneAt = Date.now();
        saveTasks();
        render();
    }
}

function deleteTask(id) {
    if (confirm('Удалить задачу?')) {
        tasks = tasks.filter(t => t.id !== id);
        saveTasks();
        render();
    }
}

function addTask() {
    const text = taskInput.value.trim();
    if (!text) {
        alert('Напишите задачу!');
        return;
    }
    
    const category = categorySelect.value;
    tasks.push({
        id: generateId(),
        text,
        category,
        done: false,
        createdAt: Date.now(),
        doneAt: null
    });
    
    saveTasks();
    taskInput.value = '';
    taskInput.focus();
    
    // Если мы на вкладке "Выполненные" — переключаем на "Активные"
    if (currentTab === 'done') {
        switchTab('active');
    } else {
        render();
    }
}

// ============================================
// РЕДАКТИРОВАНИЕ
// ============================================
function openEditModal(id) {
    const task = tasks.find(t => t.id === id);
    if (!task) return;
    
    editingId = id;
    editInput.value = task.text;
    editCategory.value = task.category;
    editModal.classList.add('active');
    editInput.focus();
    editInput.select();
}

function closeEditModal() {
    editModal.classList.remove('active');
    editingId = null;
}

function saveEdit() {
    const text = editInput.value.trim();
    if (!text) {
        alert('Текст не может быть пустым!');
        return;
    }
    
    const task = tasks.find(t => t.id === editingId);
    if (task) {
        task.text = text;
        task.category = editCategory.value;
        saveTasks();
        render();
    }
    closeEditModal();
}

// ============================================
// ПЕРЕКЛЮЧЕНИЕ ВКЛАДОК
// ============================================
function switchTab(tab) {
    currentTab = tab;
    tabBtns.forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tab);
    });
    render();
}

// ============================================
// ЭКСПОРТ / ИМПОРТ
// ============================================
function exportTasks() {
    const data = JSON.stringify(tasks, null, 2);
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `todo_backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
}

function importTasks(file) {
    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const imported = JSON.parse(e.target.result);
            if (Array.isArray(imported)) {
                if (confirm(`Импортировать ${imported.length} задач? Текущие задачи будут заменены.`)) {
                    tasks = imported;
                    saveTasks();
                    render();
                    alert('✅ Импорт успешно выполнен!');
                }
            } else {
                alert('❌ Неверный формат файла');
            }
        } catch {
            alert('❌ Ошибка при чтении файла');
        }
    };
    reader.readAsText(file);
}

// ============================================
// ОБРАБОТЧИКИ СОБЫТИЙ
// ============================================
// Добавление задачи
addBtn.addEventListener('click', addTask);
taskInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') addTask();
});

// Вкладки
tabBtns.forEach(btn => {
    btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

// Поиск и фильтры с дебаунсом
let searchTimeout;
searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(render, 300);
});

categoryFilter.addEventListener('change', render);
sortSelect.addEventListener('change', render);

// Экспорт/Импорт
exportBtn.addEventListener('click', exportTasks);
importBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
        importTasks(e.target.files[0]);
        fileInput.value = '';
    }
});

// Модальное окно
editSaveBtn.addEventListener('click', saveEdit);
editCancelBtn.addEventListener('click', closeEditModal);
editInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') saveEdit();
    if (e.key === 'Escape') closeEditModal();
});
editModal.addEventListener('click', (e) => {
    if (e.target === editModal) closeEditModal();
});

// ============================================
// ЗАПУСК
// ============================================
loadTasks();
render();

// Делаем функции глобальными для onclick в HTML
window.markDone = markDone;
window.deleteTask = deleteTask;
window.openEditModal = openEditModal;
window.closeEditModal = closeEditModal;
window.switchTab = switchTab;