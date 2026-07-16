import {
  plannerTasks, timetableEvents, exams, notifications,
  settings, saveAll, addNotification,
  originalAddExam, originalAddClass, currentUser,
  escapeHtml, coursesData
} from '../state.js';

function scheduleCloudSync() {
  if (window.scheduleCloudSync) window.scheduleCloudSync();
}
function trackEvent(eventType, payload = {}) {
  if (window.trackEvent) window.trackEvent(eventType, payload);
}

const API_BASE = 'https://studentnija-public-chat.onrender.com';
async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

export function renderPlannerPage() {
  const container = document.getElementById('plannerContent');
  const weekDays = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const today = new Date().getDay();

  // Build weekly grid – each cell shows day name + events
  const weeklyGridHTML = weekDays.map((day, idx) => {
    const dayEvents = timetableEvents.filter(e => e.day === day);
    const isToday = idx === today;
    return `
      <div class="week-cell ${isToday ? 'today' : ''}">
        <div class="day-label ${isToday ? 'today-label' : ''}">${day.substring(0,3)}</div>
        <div class="day-events">
          ${dayEvents.map(ev => `
            <div class="event-chip">
              <span class="event-time">${ev.time}</span>
              <span class="event-subject">${escapeHtml(ev.subject)}</span>
            </div>
          `).join('') || '<div class="no-events">—</div>'}
        </div>
      </div>
    `;
  }).join('');

  const html = `
    <style>
      /* ---- Weekly Calendar Styles ---- */
      .week-grid {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: 6px;
        overflow-x: auto;
        padding-bottom: 4px;
      }
      .week-cell {
        background: var(--bg-card);
        border-radius: 12px;
        padding: 8px 6px;
        min-height: 90px;
        border: 1px solid rgba(255,255,255,0.04);
        transition: background 0.2s;
      }
      .week-cell.today {
        background: rgba(0,135,81,0.1);
        border-color: var(--accent);
      }
      .day-label {
        font-weight: 700;
        font-size: 13px;
        margin-bottom: 6px;
        text-align: center;
      }
      .day-label.today-label {
        color: var(--accent);
      }
      .day-events {
        display: flex;
        flex-direction: column;
        gap: 3px;
      }
      .event-chip {
        font-size: 11px;
        padding: 2px 0;
        display: flex;
        flex-direction: column;
        border-bottom: 0.5px solid var(--border-light);
      }
      .event-time {
        font-weight: 600;
      }
      .event-subject {
        color: var(--text-muted);
      }
      .no-events {
        font-size: 11px;
        color: var(--text-muted);
        text-align: center;
        padding: 4px 0;
      }
      /* On small screens, allow horizontal scroll */
      @media (max-width: 500px) {
        .week-grid {
          grid-template-columns: repeat(7, minmax(70px, 1fr));
        }
        .week-cell {
          min-width: 70px;
        }
      }
    </style>

    <!-- ========== Smart Notifications Card ========== -->
    <div class="glass-card" style="padding:18px; margin-bottom:16px;">
      <div class="flex-between">
        <span class="section-title">🔔 Smart Notifications</span>
        <button id="testNotifBtn" class="btn-outline" style="width:auto; padding:8px 16px;">Test Alert</button>
      </div>
      <p class="text-muted" style="margin-bottom:12px;">
        ${window.NotifBridge?.isDroidScript ? "✓ Native Android alarms" : "ℹ️ Web notifications work while app is open"}
      </p>
      <div class="flex-between" style="margin-top:10px;">
        <label><input type="checkbox" id="classNotifTogglePlan" ${settings.classNotifications ? 'checked' : ''}> Class Reminders</label>
        <label><input type="checkbox" id="examNotifTogglePlan" ${settings.examNotifications ? 'checked' : ''}> Exam Reminders</label>
      </div>
    </div>

    <!-- ========== Weekly Overview ========== -->
    <div class="glass-card" style="padding:16px; margin-bottom:16px;">
      <div style="font-weight:700; font-size:16px; margin-bottom:12px;">📅 This Week</div>
      <div class="week-grid" id="weekGrid">
        ${weeklyGridHTML}
      </div>
    </div>

    <!-- ========== Quick Add Task ========== -->
    <div class="glass-card" style="padding:16px; margin-bottom:16px;">
      <div style="font-weight:700; margin-bottom:10px;">🔁 Quick Add Task</div>
      <div style="display:flex; gap:8px; flex-wrap:wrap;">
        <input type="text" id="quickRecurTask" placeholder="Task name" style="flex:2; min-width:150px;">
        <select id="recurType" style="flex:1; min-width:100px;">
          <option value="none">Once</option>
          <option value="daily">Daily</option>
          <option value="weekly">Weekly</option>
        </select>
        <button id="addRecurTaskBtn" class="btn-primary" style="flex:0 0 auto;">+ Add</button>
      </div>
    </div>

    <!-- ========== Tasks ========== -->
    <div class="glass-card" style="padding:16px; margin-bottom:16px;">
      <div class="flex-between" style="margin-bottom:12px;">
        <span style="font-weight:700; font-size:16px;">✅ Study Tasks</span>
        <button id="addTaskBtn" class="btn-outline" style="width:auto; padding:6px 14px;">+ Task</button>
      </div>
      <div id="taskList"></div>
    </div>

    <!-- ========== Timetable ========== -->
    <div class="glass-card" style="padding:16px; margin-bottom:16px;">
      <div class="flex-between" style="margin-bottom:12px;">
        <span style="font-weight:700; font-size:16px;">📅 Weekly Timetable</span>
        <button id="addClassBtn" class="btn-outline" style="width:auto; padding:6px 14px;">+ Class</button>
      </div>
      <div id="timetableView"></div>
    </div>

    <!-- ========== Exams ========== -->
    <div class="glass-card" style="padding:16px; margin-bottom:16px;">
      <div class="flex-between" style="margin-bottom:12px;">
        <span style="font-weight:700; font-size:16px;">📝 Exam Countdown</span>
        <button id="addExamBtn2" class="btn-outline" style="width:auto; padding:6px 14px;">+ Exam</button>
      </div>
      <div id="examListView"></div>
    </div>

    <!-- ========== AI Study Plan ========== -->
    <div class="glass-card" style="padding:16px; margin-bottom:16px;">
      <div style="font-weight:700; margin-bottom:10px;">⌬ Generate Study Plan</div>
      <button id="generatePlanBtn" class="btn-primary" style="width:100%;">Generate Study Plan</button>
      <div id="studyPlanDisplay" style="margin-top:12px; white-space:pre-wrap; background:var(--bg-card); border-radius:12px; padding:12px; display:none;"></div>
    </div>

    <!-- ========== Recent Alerts ========== -->
    <div class="glass-card" style="padding:16px;">
      <div style="font-weight:700; font-size:16px; margin-bottom:8px;">📢 Recent Alerts</div>
      <div id="recentNotifList" style="max-height:200px; overflow-y:auto;"></div>
    </div>
  `;

  container.innerHTML = html;

  // ---- Render functions ----
  function renderTasks() {
    const cont = document.getElementById('taskList');
    if (!cont) return;
    cont.innerHTML = plannerTasks.length === 0
      ? '<div class="text-muted" style="padding:8px;">No tasks yet. Add one above!</div>'
      : plannerTasks.map(t => `
        <div class="task-item flex-between">
          <div style="display:flex; align-items:center; flex:1;">
            <input type="checkbox" class="task-checkbox" ${t.completed ? 'checked' : ''} data-id="${t.id}">
            <span style="${t.completed ? 'text-decoration:line-through;opacity:0.6;' : ''} margin-left:8px;">
              ${escapeHtml(t.title)}
              ${t.recurrence && t.recurrence !== 'none' ? `<span class="badge" style="margin-left:8px;">↻ ${t.recurrence}</span>` : ''}
            </span>
            <span class="priority-badge priority-${t.priority.toLowerCase()}">${t.priority}</span>
          </div>
          <div style="display:flex; gap:6px;">
            <button class="delete-btn edit-task-btn" data-id="${t.id}" title="Edit">✏️</button>
            <button class="delete-btn delTask" data-id="${t.id}" title="Delete">🗑️</button>
          </div>
        </div>
      `).join('');
    attachTaskEvents();
  }

  function attachTaskEvents() {
    document.querySelectorAll('.delTask').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Delete this task?')) {
          plannerTasks = plannerTasks.filter(t => t.id !== id);
          saveAll();
          scheduleCloudSync();
          trackEvent('task_deleted');
          renderTasks();
          addNotification('Planner', 'Task deleted');
        }
      });
    });
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
            scheduleCloudSync();
            renderTasks();
            addNotification('Planner', 'Task updated');
          }
        }
      });
    });
    document.querySelectorAll('#taskList input[type="checkbox"]').forEach(cb => {
      cb.addEventListener('change', (e) => {
        const id = parseInt(cb.getAttribute('data-id'));
        const task = plannerTasks.find(t => t.id === id);
        if (task) {
          task.completed = cb.checked;
          saveAll();
          scheduleCloudSync();
          addNotification('Planner', `Task ${task.completed ? 'completed' : 'reopened'}`);
        }
      });
    });
  }

  function renderTimetable() {
    const cont = document.getElementById('timetableView');
    if (!cont) return;
    cont.innerHTML = timetableEvents.length === 0
      ? '<div class="text-muted" style="padding:8px;">No classes scheduled.</div>'
      : timetableEvents.map(ev => `
        <div class="timetable-item flex-between">
          <div style="flex:1;">
            <strong>${ev.day} ${ev.time}</strong> - ${escapeHtml(ev.subject)}
            ${ev.location ? ` <span class="text-muted">(${escapeHtml(ev.location)})</span>` : ''}
          </div>
          <button class="delete-btn delTt" data-id="${ev.id}">❌</button>
        </div>
      `).join('');
    document.querySelectorAll('.delTt').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Remove this class?')) {
          timetableEvents = timetableEvents.filter(e => e.id !== id);
          saveAll();
          scheduleCloudSync();
          renderTimetable();
          addNotification('Planner', 'Class removed');
        }
      });
    });
  }

  function renderExamsList() {
    const cont = document.getElementById('examListView');
    if (!cont) return;
    cont.innerHTML = exams.length === 0
      ? '<div class="text-muted" style="padding:8px;">No exams added.</div>'
      : exams.map(ex => {
          const daysLeft = Math.ceil((new Date(ex.examDate) - new Date()) / 86400000);
          const urgency = daysLeft <= 7 ? ' (🔥)' : daysLeft <= 30 ? ' (⏳)' : '';
          return `
            <div class="exam-item flex-between">
              <div style="flex:1;">
                <strong>${escapeHtml(ex.courseName)}</strong>
                <div class="text-muted">${ex.examDate} · <span class="countdown-days">${daysLeft} days left</span>${urgency}</div>
              </div>
              <button class="delete-btn delExam" data-id="${ex.id}">🗑️</button>
            </div>`;
        }).join('');
    document.querySelectorAll('.delExam').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.getAttribute('data-id'));
        if (confirm('Remove this exam?')) {
          exams = exams.filter(e => e.id !== id);
          saveAll();
          scheduleCloudSync();
          renderExamsList();
          addNotification('Planner', 'Exam removed');
        }
      });
    });
  }

  function renderRecentNotifications() {
    const cont = document.getElementById('recentNotifList');
    if (!cont) return;
    cont.innerHTML = notifications.length === 0
      ? '<div class="text-muted" style="padding:8px;">No recent alerts</div>'
      : notifications.slice(0, 6).map(n => `
          <div class="notif-item flex-between" style="padding:4px 0; border-bottom:0.5px solid var(--border-light);">
            <span>🔔 ${escapeHtml(n.title)}: ${escapeHtml(n.message)}</span>
          </div>
        `).join('');
  }

  // ---- Recurring Task ----
  document.getElementById('addRecurTaskBtn')?.addEventListener('click', () => {
    const title = document.getElementById('quickRecurTask').value.trim();
    const recurType = document.getElementById('recurType').value;
    if (!title) return;
    plannerTasks.push({
      id: Date.now(),
      title,
      priority: 'Medium',
      date: new Date().toISOString().slice(0, 10),
      completed: false,
      recurrence: recurType
    });
    saveAll();
    scheduleCloudSync();
    trackEvent('task_added', { recurrence: recurType });
    renderTasks();
    document.getElementById('quickRecurTask').value = '';
    addNotification('Planner', 'Task added');
  });

  // ---- Add Task ----
  document.getElementById('addTaskBtn')?.addEventListener('click', () => {
    const title = prompt('Task title:');
    if (title) {
      plannerTasks.push({
        id: Date.now(),
        title,
        priority: 'Medium',
        date: new Date().toISOString().slice(0, 10),
        completed: false,
        recurrence: 'none'
      });
      saveAll();
      scheduleCloudSync();
      trackEvent('task_added');
      renderTasks();
      addNotification('Planner', 'Task added');
    }
  });

  // ---- Add Class ----
  document.getElementById('addClassBtn')?.addEventListener('click', () => {
    const day = prompt('Day (e.g., Monday):');
    if (!day) return;
    const time = prompt('Time (HH:MM, 24h):');
    if (!time) return;
    const subject = prompt('Subject:');
    if (!subject) return;
    const location = prompt('Location (optional):');
    originalAddClass(day, time, subject, location);
    saveAll();
    scheduleCloudSync();
    trackEvent('class_added');
    renderTimetable();
    addNotification('Planner', 'Class added');
  });

  // ---- Add Exam ----
  document.getElementById('addExamBtn2')?.addEventListener('click', () => {
    const name = prompt('Course name:');
    if (!name) return;
    const date = prompt('Exam date (YYYY-MM-DD):');
    if (!date) return;
    originalAddExam(name, date);
    const examDate = new Date(date);
    const reminderDate = new Date(examDate.getTime() - 24 * 60 * 60 * 1000);
    if (reminderDate > new Date() && window.NotifBridge?.syncAlarmToServer) {
      window.NotifBridge.syncAlarmToServer(
        `📝 ${name} Exam Tomorrow`,
        `You have your ${name} exam tomorrow. Time to review!`,
        reminderDate.toISOString()
      );
    }
    saveAll();
    scheduleCloudSync();
    trackEvent('exam_added');
    renderExamsList();
    addNotification('Planner', 'Exam added');
  });

  // ---- Test Notification ----
  document.getElementById('testNotifBtn')?.addEventListener('click', () => {
    if (window.NotifBridge) window.NotifBridge.testNotification();
    renderRecentNotifications();
  });

  // ---- Notification Toggles ----
  document.getElementById('classNotifTogglePlan')?.addEventListener('change', (e) => {
    settings.classNotifications = e.target.checked;
    saveAll();
  });
  document.getElementById('examNotifTogglePlan')?.addEventListener('change', (e) => {
    settings.examNotifications = e.target.checked;
    saveAll();
  });

  // ---- AI Study Plan ----
  document.getElementById('generatePlanBtn')?.addEventListener('click', async () => {
    const userId = currentUser?.id;
    if (!userId) return alert('Please log in first');
    const subjects = Object.values(coursesData).flat().map(c => c.code).join(', ');
    const upcomingExams = exams.map(e => `${e.courseName} on ${e.examDate}`).join(', ');
    const planDiv = document.getElementById('studyPlanDisplay');
    planDiv.style.display = 'block';
    planDiv.textContent = '⏳ Generating your personalised study plan...';
    try {
      const resp = await apiPost('/api/study-plan/generate', {
        userId,
        subjects,
        examDates: upcomingExams
      });
      planDiv.textContent = resp.plan || 'No plan generated.';
    } catch (e) {
      planDiv.textContent = '❌ Failed to generate plan. Please try again.';
    }
  });

  // Initial renders
  renderTasks();
  renderTimetable();
  renderExamsList();
  renderRecentNotifications();
}