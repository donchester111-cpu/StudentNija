// ============================================================
// PLANNER PAGE – Upgraded UI & Functionality
// ============================================================
import {
  plannerTasks, timetableEvents, exams, notifications,
  settings, saveAll, addNotification,
  originalAddExam, originalAddClass,
  escapeHtml
} from '../state.js';

export function renderPlannerPage() {
  // ─────────────────────────────────────────────────
  // Inject custom CSS (once)
  // ─────────────────────────────────────────────────
  if (!document.getElementById('planner-custom-css')) {
    const style = document.createElement('style');
    style.id = 'planner-custom-css';
    style.textContent = `
      .planner-grid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      .planner-card {
        background: var(--bg-card);
        backdrop-filter: blur(16px);
        -webkit-backdrop-filter: blur(16px);
        border-radius: 20px;
        padding: 18px;
        border: 1px solid var(--border-light);
        box-shadow: var(--shadow-sm);
        transition: transform 0.2s, box-shadow var(--transition);
      }
      .planner-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); }
      .planner-card .section-title {
        font-size: 16px;
        font-weight: 700;
        margin-bottom: 12px;
        display: flex;
        align-items: center;
        gap: 8px;
      }
      .planner-card .section-title .icon { font-size: 20px; }
      .task-item, .timetable-item, .exam-item, .notif-item {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 8px 0;
        border-bottom: 0.5px solid var(--border-light);
      }
      .task-item:last-child, .timetable-item:last-child, .exam-item:last-child, .notif-item:last-child {
        border-bottom: none;
      }
      .priority-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 12px;
        font-size: 11px;
        font-weight: 600;
        margin-left: 8px;
      }
      .priority-high { background: #ff4444; color: white; }
      .priority-medium { background: var(--accent-gold); color: #0A1927; }
      .priority-low { background: var(--accent); color: white; }
      .task-checkbox { margin-right: 8px; transform: scale(1.2); accent-color: var(--accent); }
      .quick-add-row {
        display: flex;
        gap: 8px;
        margin-bottom: 12px;
      }
      .quick-add-row input {
        flex: 1;
        padding: 8px 14px;
        border-radius: 30px;
        border: 1px solid var(--border-light);
        background: var(--bg-primary);
        color: var(--text-primary);
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      .quick-add-row input:focus { border-color: var(--accent); }
      .quick-add-row button {
        background: var(--accent);
        border: none;
        color: white;
        border-radius: 30px;
        padding: 8px 16px;
        font-weight: 600;
        cursor: pointer;
        white-space: nowrap;
        transition: transform 0.1s;
      }
      .quick-add-row button:active { transform: scale(0.95); }
      .upcoming-summary {
        background: rgba(0,135,81,0.06);
        border-radius: 16px;
        padding: 14px;
        margin-bottom: 12px;
        border: 1px solid var(--border-light);
      }
      .countdown-days {
        font-weight: 700;
        color: var(--accent);
      }
      .delete-btn {
        background: none;
        border: none;
        color: var(--text-muted);
        cursor: pointer;
        padding: 4px 6px;
        border-radius: 8px;
        transition: background 0.2s, color 0.2s;
      }
      .delete-btn:hover { color: var(--accent-red); background: rgba(255,68,68,0.08); }
      @media (max-width: 600px) {
        .planner-grid { grid-template-columns: 1fr; }
      }
    `;
    document.head.appendChild(style);
  }

  // ─────────────────────────────────────────────────
  // Main HTML
  // ─────────────────────────────────────────────────
  const html = `
    <div class="planner-grid">
      <!-- Smart Notifications (spans both columns) -->
      <div class="planner-card" style="grid-column: 1 / -1;">
        <div class="flex-between">
          <span class="section-title"><span class="icon">🔔</span> Smart Notifications</span>
          <button id="testNotifBtn" class="btn-outline" style="width:auto; padding:8px 16px;">Test Alert</button>
        </div>
        <p class="text-muted" style="margin-bottom:12px;">
          ${window.NotifBridge?.isDroidScript ? "✓ Native Android alarms: notifications work even when app is closed." : "ℹ️ Web notifications work while app is open."}
        </p>
        <div class="flex-between" style="margin-top:10px;">
          <label><input type="checkbox" id="classNotifTogglePlan" ${settings.classNotifications ? 'checked' : ''}> Class Reminders</label>
          <label><input type="checkbox" id="examNotifTogglePlan" ${settings.examNotifications ? 'checked' : ''}> Exam Reminders</label>
        </div>
      </div>

      <!-- Tasks (left) -->
      <div class="planner-card">
        <div class="section-title"><span class="icon">✅</span> Study Tasks</div>
        <div class="quick-add-row">
          <input type="text" id="quickTaskInput" placeholder="Add a task...">
          <button id="quickAddTaskBtn">+ Add</button>
        </div>
        <div id="taskList"></div>
        <button id="clearCompletedBtn" class="btn-outline" style="width:100%; margin-top:12px;">Clear Completed</button>
      </div>

      <!-- Schedule (right) -->
      <div class="planner-card">
        <div class="section-title"><span class="icon">⏰</span> Today's Schedule</div>
        <div id="upcomingSummary" class="upcoming-summary text-muted">Loading...</div>
        <div class="section-title" style="margin-top:12px;"><span class="icon">📅</span> Weekly Timetable</div>
        <button id="addClassBtn" class="btn-outline" style="width:100%; margin-bottom:10px;">+ Add Class</button>
        <div id="timetableView"></div>
      </div>

      <!-- Exams (left) -->
      <div class="planner-card">
        <div class="section-title"><span class="icon">📝</span> Exam Countdown</div>
        <button id="addExamBtn2" class="btn-outline" style="width:100%; margin-bottom:10px;">+ Add Exam</button>
        <div id="examListView"></div>
      </div>

      <!-- Recent Alerts (right) -->
      <div class="planner-card">
        <div class="section-title"><span class="icon">📢</span> Recent Alerts</div>
        <div id="recentNotifList" style="max-height:220px; overflow-y:auto;"></div>
      </div>
    </div>
  `;
  document.getElementById('plannerContent').innerHTML = html;

  // ─────────────────────────────────────────────────
  // Render functions
  // ─────────────────────────────────────────────────
  function renderTasks() {
    const container = document.getElementById('taskList');
    if (!container) return;
    container.innerHTML = plannerTasks.length === 0
      ? '<div class="text-muted" style="padding:8px;">No tasks yet. Add one above!</div>'
      : plannerTasks.map(t => `
        <div class="task-item">
          <div style="display:flex; align-items:center; flex:1;">
            <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} data-id="${t.id}">
            <span style="${t.completed ? 'text-decoration:line-through;opacity:0.6;' : ''} margin-left:8px;">
              ${escapeHtml(t.title)}
            </span>
            <span class="priority-badge priority-${t.priority.toLowerCase()}">${t.priority}</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="edit-task-btn delete-btn" data-id="${t.id}" title="Edit">✏️</button>
            <button class="delTask delete-btn" data-id="${t.id}" title="Delete">🗑️</button>
          </div>
        </div>
      `).join('');
    attachTaskEvents();
  }

  function attachTaskEvents() {
    // Delete
    document.querySelectorAll('.delTask').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Delete this task?')) {
          plannerTasks = plannerTasks.filter(t => t.id !== id);
          saveAll();
          renderTasks();
          addNotification('Planner', 'Task deleted');
        }
      });
    });
    // Edit
    document.querySelectorAll('.edit-task-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        const task = plannerTasks.find(t => t.id === id);
        if (task) {
          const newTitle = prompt('Edit task:', task.title);
          if (newTitle && newTitle.trim()) {
            task.title = newTitle.trim();
            const newPriority = prompt('Priority (High/Medium/Low):', task.priority);
            if (newPriority && ['High','Medium','Low'].includes(newPriority)) {
              task.priority = newPriority;
            }
            saveAll();
            renderTasks();
            addNotification('Planner', 'Task updated');
          }
        }
      });
    });
    // Checkbox
    document.querySelectorAll('#taskList input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = parseInt(cb.getAttribute('data-id'));
        const task = plannerTasks.find(t => t.id === id);
        if (task) {
          task.completed = cb.checked;
          saveAll();
          addNotification('Planner', `Task ${task.completed ? 'completed' : 'reopened'}`);
        }
      });
    });
  }

  function renderTimetable() {
    const container = document.getElementById('timetableView');
    if (!container) return;
    container.innerHTML = timetableEvents.length === 0
      ? '<div class="text-muted" style="padding:8px;">No classes scheduled.</div>'
      : timetableEvents.map(ev => `
        <div class="timetable-item">
          <div style="flex:1;">
            <strong>${ev.day} ${ev.time}</strong> - ${escapeHtml(ev.subject)}
            ${ev.location ? ` <span class="text-muted">(${escapeHtml(ev.location)})</span>` : ''}
          </div>
          <button class="delTt delete-btn" data-id="${ev.id}">❌</button>
        </div>
      `).join('');
    document.querySelectorAll('.delTt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Remove this class?')) {
          timetableEvents = timetableEvents.filter(e => e.id !== id);
          saveAll();
          renderTimetable();
          updateUpcomingSummary();
        }
      });
    });
  }

  function renderExamsList() {
    const container = document.getElementById('examListView');
    if (!container) return;
    container.innerHTML = exams.length === 0
      ? '<div class="text-muted" style="padding:8px;">No exams added.</div>'
      : exams.map(ex => {
          const daysLeft = Math.ceil((new Date(ex.examDate) - new Date()) / 86400000);
          const urgency = daysLeft <= 7 ? ' (🔥)' : daysLeft <= 30 ? ' (⏳)' : '';
          return `
            <div class="exam-item">
              <div style="flex:1;">
                <strong>${escapeHtml(ex.courseName)}</strong>
                <div class="text-muted">${ex.examDate} · <span class="countdown-days">${daysLeft} days left</span>${urgency}</div>
              </div>
              <button class="delExam delete-btn" data-id="${ex.id}">🗑️</button>
            </div>`;
        }).join('');
    document.querySelectorAll('.delExam').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Remove this exam?')) {
          exams = exams.filter(e => e.id !== id);
          saveAll();
          renderExamsList();
          updateUpcomingSummary();
        }
      });
    });
  }

  function updateUpcomingSummary() {
    const now = new Date();
    const todayDay = now.toLocaleDateString('en-US', { weekday: 'long' });
    const upcomingClasses = timetableEvents.filter(ev => ev.day === todayDay).sort((a, b) => a.time.localeCompare(b.time));
    const upcomingExamsToday = exams.filter(ex => new Date(ex.examDate).toDateString() === now.toDateString());
    let html = '';
    if (upcomingClasses.length) {
      html += `<div>📖 <strong>Classes:</strong> ${upcomingClasses.map(c => `${c.subject} at ${c.time}`).join(', ')}</div>`;
    }
    if (upcomingExamsToday.length) {
      html += `<div>⚠️ <strong>Exams Today:</strong> ${upcomingExamsToday.map(e => e.courseName).join(', ')}</div>`;
    }
    if (!html) html = '<div>✨ No events today. Keep up the good work!</div>';
    const summaryDiv = document.getElementById('upcomingSummary');
    if (summaryDiv) summaryDiv.innerHTML = html;
  }

  function renderRecentNotifications() {
    const container = document.getElementById('recentNotifList');
    if (container) {
      container.innerHTML = notifications.length === 0
        ? '<div class="text-muted" style="padding:8px;">No recent alerts</div>'
        : notifications.slice(0, 6).map(n => `
          <div class="notif-item">
          </div>
        `).join('');
    }
  }

  // ─────────────────────────────────────────────────
  // Event listeners
  // ─────────────────────────────────────────────────
  // Quick add task
  document.getElementById('quickAddTaskBtn')?.addEventListener('click', () => {
    const input = document.getElementById('quickTaskInput');
    const title = input.value.trim();
    if (title) {
      plannerTasks.push({
        id: Date.now(),
        title,
        priority: 'Medium',
        date: new Date().toISOString().slice(0, 10),
        completed: false
      });
      saveAll();
      renderTasks();
      addNotification('Planner', 'Task added');
      input.value = '';
    }
  });

  // Clear completed tasks
  document.getElementById('clearCompletedBtn')?.addEventListener('click', () => {
    if (confirm('Remove all completed tasks?')) {
      plannerTasks = plannerTasks.filter(t => !t.completed);
      saveAll();
      renderTasks();
      addNotification('Planner', 'Completed tasks cleared');
    }
  });

  // Add class
  document.getElementById('addClassBtn')?.addEventListener('click', () => {
    const day = prompt('Day (e.g., Monday):');
    if (!day) return;
    const time = prompt('Time (HH:MM, 24h):');
    if (!time) return;
    const subject = prompt('Subject:');
    if (!subject) return;
    const location = prompt('Location (optional):');
    originalAddClass(day, time, subject, location);
    renderTimetable();
    updateUpcomingSummary();
    addNotification('Planner', 'Class added');
  });

  // Add exam
  document.getElementById('addExamBtn2')?.addEventListener('click', () => {
    const name = prompt('Course name:');
    if (!name) return;
    const date = prompt('Exam date (YYYY-MM-DD):');
    if (!date) return;
    originalAddExam(name, date);
    renderExamsList();
    updateUpcomingSummary();
    addNotification('Planner', 'Exam added');
  });

  // Test notification
  document.getElementById('testNotifBtn')?.addEventListener('click', () => {
    if (window.NotifBridge) window.NotifBridge.testNotification();
    renderRecentNotifications();
  });

  // Notification toggles
  document.getElementById('classNotifTogglePlan')?.addEventListener('change', (e) => {
    settings.classNotifications = e.target.checked;
    saveAll();
  });
  document.getElementById('examNotifTogglePlan')?.addEventListener('change', (e) => {
    settings.examNotifications = e.target.checked;
    saveAll();
  });

  // Initial render
  renderTasks();
  renderTimetable();
  renderExamsList();
  updateUpcomingSummary();
  renderRecentNotifications();

  // Auto-refresh upcoming summary every 30s while page is active
  setInterval(() => {
    if (document.getElementById('planner-page')?.classList.contains('active-page')) {
      updateUpcomingSummary();
      renderRecentNotifications();
    }
  }, 30000);
}