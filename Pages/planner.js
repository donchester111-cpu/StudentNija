import {
  plannerTasks, timetableEvents, exams, notifications,
  settings, saveAll, addNotification,
  originalAddExam, originalAddClass,
  escapeHtml
} from '../state.js';

export function renderPlannerPage() {
  const html = `<div class="planner-grid"><div class="glass-card" style="padding:18px;"><div class="flex-between"><span class="section-title">🔔 Smart Notifications</span><button id="testNotifBtn" class="btn-outline" style="width:auto; padding:8px 16px;">Test Alert</button></div><p class="text-muted">${window.NotifBridge?.isDroidScript ? "✓ Native Android alarms: notifications work even when app is closed." : "ℹ️ Web notifications work while app is open."}</p><div class="flex-between" style="margin-top:12px;"><label><input type="checkbox" id="classNotifTogglePlan" ${settings.classNotifications?'checked':''}> Class Reminders</label><label><input type="checkbox" id="examNotifTogglePlan" ${settings.examNotifications?'checked':''}> Exam Reminders</label></div></div><div class="upcoming-card"><div class="section-title">⏰ Today's Schedule</div><div id="upcomingSummary" class="text-muted">Loading...</div></div><div class="glass-card" style="padding:16px;"><div class="flex-between"><span class="section-title">✅ Study Tasks</span><button id="addTaskBtn" class="btn-outline" style="width:auto; padding:6px 14px;">+ Task</button></div><div id="taskList"></div></div><div class="glass-card" style="padding:16px;"><div class="flex-between"><span class="section-title">📅 Weekly Timetable</span><button id="addClassBtn" class="btn-outline" style="width:auto; padding:6px 14px;">+ Class</button></div><div id="timetableView"></div></div><div class="glass-card" style="padding:16px;"><div class="flex-between"><span class="section-title">📝 Exam Countdown</span><button id="addExamBtn2" class="btn-outline" style="width:auto; padding:6px 14px;">+ Exam</button></div><div id="examListView"></div></div><div class="glass-card" style="padding:16px;"><div class="section-title">📢 Recent Alerts</div><div id="recentNotifList" style="max-height:200px; overflow-y:auto;"></div></div></div>`;
  document.getElementById('plannerContent').innerHTML = html;

  function renderTasks() {
    const container = document.getElementById('taskList');
    if (!container) return;
    container.innerHTML = plannerTasks.map(t=>`
      <div class="task-item flex-between"><div><input type="checkbox" ${t.completed?'checked':''} data-id="${t.id}"><span style="${t.completed?'text-decoration:line-through;opacity:0.7':''} margin-left:8px;">${escapeHtml(t.title)}</span><div class="text-muted">${t.date||''} · ${t.priority}</div></div><button class="delTask" data-id="${t.id}" style="background:none;border:none;">🗑️</button></div>
    `).join('') || '<div class="text-muted">No tasks. Add one!</div>';
    attachTaskEvents();
  }

  function attachTaskEvents() {
    document.querySelectorAll('.delTask').forEach(btn=>btn.addEventListener('click',()=>{
      let id=parseInt(btn.getAttribute('data-id'));
      plannerTasks=plannerTasks.filter(t=>t.id!==id);
      saveAll();
      renderTasks();
      addNotification("Planner","Task deleted");
    }));
    document.querySelectorAll('#taskList input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',(e)=>{
      let id=parseInt(cb.getAttribute('data-id'));
      let task=plannerTasks.find(t=>t.id===id);
      if(task){task.completed=cb.checked; saveAll(); addNotification("Planner",`Task ${task.completed?"completed":"unchecked"}`);}
    }));
  }

  function renderTimetable() {
    const container = document.getElementById('timetableView');
    if (!container) return;
    container.innerHTML = timetableEvents.map(ev=>`
      <div class="timetable-item flex-between"><div><strong>${ev.day} ${ev.time}</strong> - ${escapeHtml(ev.subject)}${ev.location?` (${escapeHtml(ev.location)})`:''}</div><button class="delTt" data-id="${ev.id}" style="background:none;border:none;">❌</button></div>
    `).join('') || '<div class="text-muted">No classes scheduled.</div>';
    document.querySelectorAll('.delTt').forEach(btn=>btn.addEventListener('click',()=>{
      let id=parseInt(btn.getAttribute('data-id'));
      timetableEvents=timetableEvents.filter(e=>e.id!==id);
      saveAll();
      renderTimetable();
      updateUpcomingSummary();
    }));
  }

  function renderExamsList() {
    const container = document.getElementById('examListView');
    if (!container) return;
    container.innerHTML = exams.map(ex=>`
      <div class="exam-item flex-between"><div><strong>${escapeHtml(ex.courseName)}</strong><div class="text-muted">${ex.examDate} · ${Math.ceil((new Date(ex.examDate)-new Date())/86400000)} days left</div></div><button class="delExam" data-id="${ex.id}" style="background:none;border:none;">🗑️</button></div>
    `).join('') || '<div class="text-muted">No exams added.</div>';
    document.querySelectorAll('.delExam').forEach(btn=>btn.addEventListener('click',()=>{
      let id=parseInt(btn.getAttribute('data-id'));
      exams=exams.filter(e=>e.id!==id);
      saveAll();
      renderExamsList();
      updateUpcomingSummary();
    }));
  }

  function updateUpcomingSummary() {
    const now=new Date();
    const todayDay=now.toLocaleDateString('en-US',{weekday:'long'});
    const upcomingClasses=timetableEvents.filter(ev=>ev.day===todayDay).sort((a,b)=>a.time.localeCompare(b.time));
    const upcomingExamsToday=exams.filter(ex=>new Date(ex.examDate).toDateString()===now.toDateString());
    let html='';
    if(upcomingClasses.length) html+=`<div>📖 Classes: ${upcomingClasses.map(c=>`${c.subject} at ${c.time}`).join(', ')}</div>`;
    if(upcomingExamsToday.length) html+=`<div>⚠️ Exams Today: ${upcomingExamsToday.map(e=>e.courseName).join(', ')}</div>`;
    if(!html) html='<div>No upcoming events today. Stay ahead!</div>';
    const summaryDiv = document.getElementById('upcomingSummary');
    if (summaryDiv) summaryDiv.innerHTML=html;
  }

  function renderRecentNotifications() {
    const container=document.getElementById('recentNotifList');
    if(container) container.innerHTML=notifications.slice(0,6).map(n=>`
      <div class="text-muted" style="padding:6px 0; border-bottom:0.5px solid var(--border-light);">🔔 ${escapeHtml(n.title)}: ${escapeHtml(n.message)}</div>
    `).join('')||'<div class="text-muted">No recent alerts</div>';
  }

  document.getElementById('addTaskBtn')?.addEventListener('click',()=>{
    let title=prompt("Task title");
    if(title){
      plannerTasks.push({id:Date.now(),title,priority:"Medium",date:new Date().toISOString().slice(0,10),completed:false});
      saveAll();
      renderTasks();
      addNotification("Planner","Task added");
    }
  });
  document.getElementById('addClassBtn')?.addEventListener('click',()=>{
    let day=prompt("Day (Monday-Sunday)");
    let time=prompt("Time (HH:MM, 24h)");
    let sub=prompt("Subject");
    let loc=prompt("Location (optional)");
    if(day&&time&&sub){
      originalAddClass(day,time,sub,loc);
      renderTimetable();
      updateUpcomingSummary();
    }
  });
  document.getElementById('addExamBtn2')?.addEventListener('click',()=>{
    let name=prompt("Course name");
    let date=prompt("Exam date (YYYY-MM-DD)");
    if(name&&date){
      originalAddExam(name,date);
      renderExamsList();
      updateUpcomingSummary();
    }
  });
  document.getElementById('testNotifBtn')?.addEventListener('click',()=>{
    if (window.NotifBridge) window.NotifBridge.testNotification();
    renderRecentNotifications();
  });
  document.getElementById('classNotifTogglePlan')?.addEventListener('change',(e)=>{
    settings.classNotifications=e.target.checked;
    saveAll();
  });
  document.getElementById('examNotifTogglePlan')?.addEventListener('change',(e)=>{
    settings.examNotifications=e.target.checked;
    saveAll();
  });

  renderTasks();
  renderTimetable();
  renderExamsList();
  updateUpcomingSummary();
  renderRecentNotifications();
  setInterval(()=>{
    if(document.getElementById('planner-page')?.classList.contains('active-page')){
      updateUpcomingSummary();
      renderRecentNotifications();
    }
  }, 30000);
}