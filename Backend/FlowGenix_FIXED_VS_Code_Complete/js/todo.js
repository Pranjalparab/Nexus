// FlowGenix TODO JavaScript

let todos = [];
let currentFilter = 'all';

// Load todos when tab is accessed
function loadTodos() {
    const savedTodos = localStorage.getItem('flowgenix_todos');
    if (savedTodos) {
        todos = JSON.parse(savedTodos);
    } else {
        // Sample todos for new users
        todos = [
            {
                id: Date.now() - 1000,
                title: 'Complete math homework',
                description: 'Algebra chapter 5 exercises',
                date: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
                priority: 'high',
                completed: false,
                createdAt: new Date().toISOString()
            },
            {
                id: Date.now() - 2000,
                title: 'Read science article',
                description: 'Research on renewable energy',
                date: new Date(Date.now() + 172800000).toISOString().slice(0, 16),
                priority: 'medium',
                completed: false,
                createdAt: new Date().toISOString()
            }
        ];
        saveTodos();
    }
    
    renderTodos();
    scheduleReminders();
}

// Save todos to localStorage
function saveTodos() {
    localStorage.setItem('flowgenix_todos', JSON.stringify(todos));
}

// Render todos based on current filter
function renderTodos() {
    const todoList = document.getElementById('todo-list');
    const filteredTodos = filterTodosByType(currentFilter);
    
    if (filteredTodos.length === 0) {
        todoList.innerHTML = `
            <div class="empty-todos">
                <i class="fas fa-tasks"></i>
                <h3>No tasks found</h3>
                <p>${getEmptyMessage(currentFilter)}</p>
            </div>
        `;
        return;
    }
    
    todoList.innerHTML = filteredTodos.map(todo => `
        <div class="todo-item ${todo.completed ? 'completed' : ''}" data-id="${todo.id}">
            <div class="todo-item-header">
                <div class="todo-checkbox">
                    <input type="checkbox" ${todo.completed ? 'checked' : ''} onchange="toggleTodoComplete(${todo.id})">
                </div>
                <h4 class="todo-title">${todo.title}</h4>
                <div class="todo-actions">
                    <button onclick="editTodo(${todo.id})" class="edit-btn" title="Edit">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button onclick="deleteTodo(${todo.id})" class="delete-btn" title="Delete">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
            ${todo.description ? `<p class="todo-description">${todo.description}</p>` : ''}
            <div class="todo-item-meta">
                <span class="todo-date">
                    <i class="fas fa-calendar"></i>
                    ${formatTodoDate(todo.date)}
                </span>
                <span class="priority-badge priority-${todo.priority}">${todo.priority}</span>
            </div>
            ${isOverdue(todo.date) && !todo.completed ? '<div class="overdue-badge">Overdue!</div>' : ''}
        </div>
    `).join('');
}

// Filter todos by type
function filterTodosByType(filter) {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today.getTime() + 86400000);
    
    switch (filter) {
        case 'today':
            return todos.filter(todo => {
                const todoDate = new Date(todo.date);
                return todoDate >= today && todoDate < tomorrow && !todo.completed;
            });
        case 'upcoming':
            return todos.filter(todo => {
                const todoDate = new Date(todo.date);
                return todoDate >= tomorrow && !todo.completed;
            });
        case 'completed':
            return todos.filter(todo => todo.completed);
        default:
            return todos.sort((a, b) => {
                if (a.completed !== b.completed) {
                    return a.completed - b.completed;
                }
                return new Date(a.date) - new Date(b.date);
            });
    }
}

// Get empty message based on filter
function getEmptyMessage(filter) {
    switch (filter) {
        case 'today':
            return 'No tasks scheduled for today. Great job!';
        case 'upcoming':
            return 'No upcoming tasks. Add some to plan ahead!';
        case 'completed':
            return 'No completed tasks yet. Complete some to see them here!';
        default:
            return 'No tasks yet. Click the + button to add your first task!';
    }
}

// Filter tasks
function filterTasks(filter) {
    currentFilter = filter;
    
    // Update filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.classList.add('active');
    
    renderTodos();
}

// Show add task modal
function showAddTask() {
    document.getElementById('add-task-modal').classList.add('show');
    
    // Clear form
    document.getElementById('add-task-form').reset();
    
    // Set default date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(9, 0, 0, 0);
    document.getElementById('task-date').value = tomorrow.toISOString().slice(0, 16);
}

// Handle add task form submission
document.getElementById('add-task-form').addEventListener('submit', function(e) {
    e.preventDefault();
    
    const title = document.getElementById('task-title').value.trim();
    const description = document.getElementById('task-description').value.trim();
    const date = document.getElementById('task-date').value;
    const priority = document.getElementById('task-priority').value;
    
    if (!title) {
        showNotification('Task title is required', 'error');
        return;
    }
    
    if (!date) {
        showNotification('Task date is required', 'error');
        return;
    }
    
    const newTodo = {
        id: Date.now(),
        title,
        description,
        date,
        priority,
        completed: false,
        createdAt: new Date().toISOString()
    };
    
    todos.unshift(newTodo);
    saveTodos();
    renderTodos();
    closeModal('add-task-modal');
    
    showNotification('Task added successfully!', 'success');
    
    // Add to history
    addToHistory('task_created', `Created task: ${title}`);
    
    // Schedule reminder for this task
    scheduleTaskReminder(newTodo);
});

// Toggle todo completion
function toggleTodoComplete(id) {
    const todo = todos.find(t => t.id === id);
    if (todo) {
        todo.completed = !todo.completed;
        todo.completedAt = todo.completed ? new Date().toISOString() : null;
        
        saveTodos();
        renderTodos();
        
        if (todo.completed) {
            // Award coins for completing task
            const coins = getPriorityCoins(todo.priority);
            updateUserCoins(coins, 'add');
            showNotification(`Task completed! You earned ${coins} coins!`, 'success');
            
            // Add to history
            addToHistory('task_completed', `Completed task: ${todo.title}. Earned ${coins} coins!`);
        } else {
            showNotification('Task marked as incomplete', 'info');
            addToHistory('task_uncompleted', `Marked task as incomplete: ${todo.title}`);
        }
    }
}

// Get coins based on priority
function getPriorityCoins(priority) {
    const coinMap = {
        'low': 5,
        'medium': 10,
        'high': 15
    };
    return coinMap[priority] || 5;
}

// Edit todo
function editTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    // Populate form with existing data
    document.getElementById('task-title').value = todo.title;
    document.getElementById('task-description').value = todo.description || '';
    document.getElementById('task-date').value = todo.date;
    document.getElementById('task-priority').value = todo.priority;
    
    // Change form submission behavior for editing
    const form = document.getElementById('add-task-form');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.textContent = 'Update Task';
    
    // Store the ID being edited
    form.dataset.editingId = id;
    
    // Show modal
    document.getElementById('add-task-modal').classList.add('show');
    
    // Update form handler
    form.onsubmit = function(e) {
        e.preventDefault();
        
        const title = document.getElementById('task-title').value.trim();
        const description = document.getElementById('task-description').value.trim();
        const date = document.getElementById('task-date').value;
        const priority = document.getElementById('task-priority').value;
        
        if (!title || !date) {
            showNotification('Title and date are required', 'error');
            return;
        }
        
        // Update todo
        todo.title = title;
        todo.description = description;
        todo.date = date;
        todo.priority = priority;
        todo.updatedAt = new Date().toISOString();
        
        saveTodos();
        renderTodos();
        closeModal('add-task-modal');
        
        // Reset form
        submitBtn.textContent = 'Save Task';
        delete form.dataset.editingId;
        form.onsubmit = null;
        
        showNotification('Task updated successfully!', 'success');
        addToHistory('task_updated', `Updated task: ${title}`);
        
        // Reschedule reminder
        scheduleTaskReminder(todo);
    };
}

// Delete todo
function deleteTodo(id) {
    const todo = todos.find(t => t.id === id);
    if (!todo) return;
    
    if (confirm(`Are you sure you want to delete "${todo.title}"?`)) {
        todos = todos.filter(t => t.id !== id);
        saveTodos();
        renderTodos();
        
        showNotification('Task deleted', 'info');
        addToHistory('task_deleted', `Deleted task: ${todo.title}`);
    }
}

// Format todo date for display
function formatTodoDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) {
        return `${Math.abs(diffDays)} days ago`;
    } else if (diffDays === 0) {
        return 'Today';
    } else if (diffDays === 1) {
        return 'Tomorrow';
    } else if (diffDays <= 7) {
        return `In ${diffDays} days`;
    } else {
        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    }
}

// Check if todo is overdue
function isOverdue(dateString) {
    const todoDate = new Date(dateString);
    const now = new Date();
    return todoDate < now;
}

// Schedule reminders for all todos
function scheduleReminders() {
    todos.forEach(todo => {
        if (!todo.completed) {
            scheduleTaskReminder(todo);
        }
    });
}

// Schedule reminder for a specific task
function scheduleTaskReminder(todo) {
    const taskDate = new Date(todo.date);
    const now = new Date();
    
    // Calculate reminder times
    const reminderTimes = [];
    
    // If task is in the afternoon (after 12 PM), remind in the morning
    if (taskDate.getHours() >= 12) {
        const morningReminder = new Date(taskDate);
        morningReminder.setHours(9, 0, 0, 0);
        if (morningReminder > now) {
            reminderTimes.push(morningReminder);
        }
    }
    
    // If task is in the morning, remind the night before
    if (taskDate.getHours() < 12) {
        const nightBeforeReminder = new Date(taskDate);
        nightBeforeReminder.setDate(nightBeforeReminder.getDate() - 1);
        nightBeforeReminder.setHours(20, 0, 0, 0);
        if (nightBeforeReminder > now) {
            reminderTimes.push(nightBeforeReminder);
        }
    }
    
    // Schedule 1 hour before task
    const hourBeforeReminder = new Date(taskDate.getTime() - 60 * 60 * 1000);
    if (hourBeforeReminder > now) {
        reminderTimes.push(hourBeforeReminder);
    }
    
    // Schedule reminders
    reminderTimes.forEach(reminderTime => {
        const delay = reminderTime.getTime() - now.getTime();
        if (delay > 0) {
            setTimeout(() => {
                showTaskReminder(todo);
            }, delay);
        }
    });
}

// Show task reminder notification
function showTaskReminder(todo) {
    if (todo.completed) return;
    
    // Show browser notification if permission granted
    if ('Notification' in window && Notification.permission === 'granted') {
        const notification = new Notification('FlowGenix Reminder', {
            body: `Don't forget: ${todo.title}`,
            icon: '/favicon.ico',
            tag: `todo-${todo.id}`
        });
        
        notification.onclick = () => {
            window.focus();
            showTab('todo');
            notification.close();
        };
        
        // Auto close after 10 seconds
        setTimeout(() => notification.close(), 10000);
    }
    
    // Show in-app notification
    showNotification(`📋 Reminder: ${todo.title}`, 'info');
    
    // Speak reminder if speech synthesis is available
    if ('speechSynthesis' in window) {
        speakReminder(todo.title);
    }
    
    // Add to history
    addToHistory('reminder_sent', `Reminder sent for: ${todo.title}`);
}

// Speak reminder using text-to-speech
function speakReminder(taskTitle) {
    const utterance = new SpeechSynthesisUtterance(`Reminder: ${taskTitle}`);
    utterance.volume = 0.7;
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    // Get voice based on settings
    const voiceLanguage = document.getElementById('voice-language')?.value || 'en';
    const voices = speechSynthesis.getVoices();
    const voice = voices.find(v => v.lang.startsWith(voiceLanguage)) || voices[0];
    
    if (voice) {
        utterance.voice = voice;
    }
    
    speechSynthesis.speak(utterance);
}

// Request notification permission
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission().then(permission => {
            if (permission === 'granted') {
                showNotification('Notifications enabled! You\'ll receive task reminders.', 'success');
            }
        });
    }
}

// Initialize notifications when app loads
setTimeout(requestNotificationPermission, 3000);

// Smart task suggestions
function suggestTasks() {
    const suggestions = [
        'Review yesterday\'s notes',
        'Prepare for upcoming exam',
        'Complete pending assignments',
        'Read chapter for next class',
        'Practice problem sets',
        'Write project outline',
        'Research for essay',
        'Review flashcards',
        'Organize study materials',
        'Plan next week\'s schedule'
    ];
    
    const randomSuggestion = suggestions[Math.floor(Math.random() * suggestions.length)];
    
    document.getElementById('task-title').placeholder = randomSuggestion;
}

// Auto-complete for common tasks
const commonTasks = [
    'Complete homework',
    'Study for test',
    'Write essay',
    'Read textbook chapter',
    'Practice problems',
    'Review notes',
    'Prepare presentation',
    'Research topic',
    'Submit assignment',
    'Attend meeting'
];

// Add auto-complete to task title input
document.getElementById('task-title')?.addEventListener('input', function(e) {
    const input = e.target.value.toLowerCase();
    if (input.length > 2) {
        const matches = commonTasks.filter(task => 
            task.toLowerCase().includes(input)
        );
        
        // Show suggestions (you could implement a dropdown here)
        if (matches.length > 0 && matches[0].toLowerCase() !== input) {
            // Subtle suggestion in placeholder
            e.target.style.backgroundImage = `url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='%23666' viewBox='0 0 16 16'><path d='M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z'/><path d='M8 4a.5.5 0 0 1 .5.5v3h3a.5.5 0 0 1 0 1h-3v3a.5.5 0 0 1-1 0v-3h-3a.5.5 0 0 1 0-1h3v-3A.5.5 0 0 1 8 4z'/></svg>")`;
        }
    }
});

// Bulk actions
function selectAllTodos() {
    const checkboxes = document.querySelectorAll('.todo-item input[type="checkbox"]');
    checkboxes.forEach(cb => cb.checked = true);
}

function deleteCompletedTodos() {
    const completedCount = todos.filter(t => t.completed).length;
    
    if (completedCount === 0) {
        showNotification('No completed tasks to delete', 'info');
        return;
    }
    
    if (confirm(`Delete ${completedCount} completed tasks?`)) {
        todos = todos.filter(t => !t.completed);
        saveTodos();
        renderTodos();
        
        showNotification(`Deleted ${completedCount} completed tasks`, 'success');
        addToHistory('bulk_delete', `Deleted ${completedCount} completed tasks`);
    }
}

// Task statistics
function getTaskStats() {
    const total = todos.length;
    const completed = todos.filter(t => t.completed).length;
    const pending = total - completed;
    const overdue = todos.filter(t => !t.completed && isOverdue(t.date)).length;
    
    return { total, completed, pending, overdue };
}

// Export/Import tasks
function exportTasks() {
    const dataStr = JSON.stringify(todos, null, 2);
    const dataBlob = new Blob([dataStr], {type: 'application/json'});
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(dataBlob);
    link.download = `flowgenix-tasks-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    
    showNotification('Tasks exported successfully!', 'success');
}

function importTasks(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const importedTodos = JSON.parse(e.target.result);
            
            if (Array.isArray(importedTodos)) {
                todos = [...todos, ...importedTodos];
                saveTodos();
                renderTodos();
                
                showNotification(`Imported ${importedTodos.length} tasks!`, 'success');
                addToHistory('tasks_imported', `Imported ${importedTodos.length} tasks`);
            } else {
                throw new Error('Invalid file format');
            }
        } catch (error) {
            showNotification('Failed to import tasks. Invalid file format.', 'error');
        }
    };
    reader.readAsText(file);
}

// Add styles for todo functionality
const todoStyles = document.createElement('style');
todoStyles.textContent = `
    .todo-checkbox {
        margin-right: 15px;
    }
    
    .todo-checkbox input[type="checkbox"] {
        width: 18px;
        height: 18px;
        accent-color: var(--accent-green);
        cursor: pointer;
    }
    
    .todo-title {
        flex: 1;
        margin: 0;
        transition: all 0.3s ease;
    }
    
    .todo-item.completed .todo-title {
        text-decoration: line-through;
        opacity: 0.6;
    }
    
    .todo-actions {
        display: flex;
        gap: 5px;
        opacity: 0;
        transition: opacity 0.3s ease;
    }
    
    .todo-item:hover .todo-actions {
        opacity: 1;
    }
    
    .edit-btn, .delete-btn {
        background: none;
        border: none;
        color: var(--text-secondary);
        cursor: pointer;
        padding: 5px;
        border-radius: 4px;
        transition: all 0.3s ease;
        font-size: 0.9rem;
    }
    
    .edit-btn:hover {
        color: var(--accent-blue);
        background: rgba(79, 172, 254, 0.1);
    }
    
    .delete-btn:hover {
        color: var(--accent-pink);
        background: rgba(240, 147, 251, 0.1);
    }
    
    .overdue-badge {
        background: var(--danger-gradient);
        color: white;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 0.7rem;
        font-weight: 600;
        margin-top: 10px;
        display: inline-block;
        animation: pulse 2s infinite;
    }
    
    .empty-todos {
        text-align: center;
        padding: 60px 20px;
        color: var(--text-secondary);
    }
    
    .empty-todos i {
        font-size: 3rem;
        margin-bottom: 20px;
        opacity: 0.5;
    }
    
    .empty-todos h3 {
        margin-bottom: 10px;
        color: var(--text-primary);
    }
    
    @keyframes pulse {
        0%, 100% { transform: scale(1); }
        50% { transform: scale(1.05); }
    }
`;
document.head.appendChild(todoStyles);

// Export functions
window.TodoManager = {
    loadTodos,
    filterTasks,
    showAddTask,
    toggleTodoComplete,
    editTodo,
    deleteTodo,
    exportTasks,
    importTasks,
    getTaskStats
};
