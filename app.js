// ======================== API KEYS (REPLACE WITH YOUR OWN) ========================
const PROXY_URL = "https://studentnija-proxy.donchester111.workers.dev";



// ======================== DATA MODELS ========================
let currentUser = null;
let users = [];
let coursesData = {};
let plannerTasks = [];
let timetableEvents = [];
let exams = [];
let scholarships = [];
let pastQuestions = [];
let notes = [];
let achievements = [];
let studyHoursLog = [];
let notifications = [];
let userStats = { studyStreak: 0, totalCourses: 0, totalHours: 0, lastActive: null };
let settings = {
  theme: 'light',
  notificationsEnabled: true,
  examNotifications: true,
  classNotifications: true,
  accentColor: '#008751'
};
let flashcards = [];
let studyPlans = [];
let savedNotes = JSON.parse(localStorage.getItem('studentnija_notes_list') || '[]');

const semesterList = ["100L-First","100L-Second","200L-First","200L-Second","300L-First","300L-Second","400L-First","400L-Second","500L-First","500L-Second"];
const semesterNames = { "100L-First":"100L First Sem","100L-Second":"100L Second Sem","200L-First":"200L First Sem","200L-Second":"200L Second Sem","300L-First":"300L First Sem","300L-Second":"300L Second Sem","400L-First":"400L First Sem","400L-Second":"400L Second Sem","500L-First":"500L First Sem","500L-Second":"500L Second Sem" };
const gradeMap = { A:5, B:4, C:3, D:2, E:1, F:0 };

function saveAll() {
  localStorage.setItem('studentnija_users', JSON.stringify(users));
  localStorage.setItem('studentnija_currentUser', JSON.stringify(currentUser));
  localStorage.setItem('studentnija_courses', JSON.stringify(coursesData));
  localStorage.setItem('studentnija_planner', JSON.stringify(plannerTasks));
  localStorage.setItem('studentnija_timetable', JSON.stringify(timetableEvents));
  localStorage.setItem('studentnija_exams', JSON.stringify(exams));
  localStorage.setItem('studentnija_scholarships', JSON.stringify(scholarships));
  localStorage.setItem('studentnija_pastquestions', JSON.stringify(pastQuestions));
  localStorage.setItem('studentnija_notes', JSON.stringify(notes));
  localStorage.setItem('studentnija_achievements', JSON.stringify(achievements));
  localStorage.setItem('studentnija_studyLog', JSON.stringify(studyHoursLog));
  localStorage.setItem('studentnija_notifications', JSON.stringify(notifications));
  localStorage.setItem('studentnija_stats', JSON.stringify(userStats));
  localStorage.setItem('studentnija_settings', JSON.stringify(settings));
  localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
  localStorage.setItem('studentnija_notes_list', JSON.stringify(savedNotes));
  window.settings = settings;
}

function loadAll() {
  const u = localStorage.getItem('studentnija_users'); if(u) users = JSON.parse(u);
  const cu = localStorage.getItem('studentnija_currentUser'); if(cu) currentUser = JSON.parse(cu);
  const c = localStorage.getItem('studentnija_courses'); if(c) coursesData = JSON.parse(c); else initCoursesData();
  const p = localStorage.getItem('studentnija_planner'); if(p) plannerTasks = JSON.parse(p);
  const tt = localStorage.getItem('studentnija_timetable'); if(tt) timetableEvents = JSON.parse(tt);
  const ex = localStorage.getItem('studentnija_exams'); if(ex) exams = JSON.parse(ex);
  const sch = localStorage.getItem('studentnija_scholarships'); if(sch) scholarships = JSON.parse(sch); else initScholarships();
  const pq = localStorage.getItem('studentnija_pastquestions'); if(pq) pastQuestions = JSON.parse(pq); else pastQuestions = [];
  const nt = localStorage.getItem('studentnija_notes'); if(nt) notes = JSON.parse(nt);
  const ach = localStorage.getItem('studentnija_achievements'); if(ach) achievements = JSON.parse(ach); else initAchievements();
  const sl = localStorage.getItem('studentnija_studyLog'); if(sl) studyHoursLog = JSON.parse(sl);
  const noti = localStorage.getItem('studentnija_notifications'); if(noti) notifications = JSON.parse(noti);
  const st = localStorage.getItem('studentnija_stats'); if(st) userStats = JSON.parse(st);
  const set = localStorage.getItem('studentnija_settings'); if(set) settings = JSON.parse(set);
  const fc = localStorage.getItem('studentnija_flashcards'); if(fc) flashcards = JSON.parse(fc); else flashcards = [];
  const sn = localStorage.getItem('studentnija_notes_list'); if(sn) savedNotes = JSON.parse(sn);
  savedNotes = savedNotes.map(n => { if (!n.category) n.category = 'Misc'; return n; });
  localStorage.setItem('studentnija_notes_list', JSON.stringify(savedNotes));
  window.settings = settings;
  applyTheme(settings.theme);
  if (settings.accentColor) applyAccentColor(settings.accentColor);
  else applyAccentColor('#008751');
}

function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent-green', color);
  document.documentElement.style.setProperty('--accent-green-light', color);
  settings.accentColor = color;
  saveAll();
}

function initCoursesData() { semesterList.forEach(s => { if(!coursesData[s]) coursesData[s]=[]; }); }
function initScholarships() { scholarships = [{id:1, name:"MTN Foundation Scholarship", category:"Private", deadline:"2025-08-30", description:"For STEM students", eligibility:"CGPA 3.5+", bookmarked:false},{id:2, name:"Federal Government Bursary", category:"Federal", deadline:"2025-07-15", description:"Needs based", eligibility:"All Nigerian students", bookmarked:false},{id:3, name:"NNPC/Total Scholarship", category:"Private", deadline:"2025-09-10", description:"Engineering", eligibility:"2nd year+", bookmarked:false}]; }
function initAchievements() { achievements = [{id:"first_course", title:"First Course Added", achieved:false, icon:"🏆"},{id:"semester_done", title:"First Semester Completed", achieved:false, icon:"📘"},{id:"cgpa_excellent", title:"CGPA Above 4.00", achieved:false, icon:"🎯"},{id:"streak_7", title:"7 Day Study Streak", achieved:false, icon:"🔥"},{id:"streak_30", title:"30 Day Study Streak", achieved:false, icon:"⭐"}]; }

function addNotification(title, message) {
  notifications.unshift({id:Date.now(), title, message, date:new Date().toISOString()});
  if(notifications.length>25) notifications.pop();
  saveAll();
}

// ======================== AUTH & HELPERS ========================
function registerUser(fullName, email, password, school, department, level, profilePicBase64 = "") { if(users.find(u=>u.email===email)) return false; const newUser = { id: Date.now(), fullName, email, password, school, department, level, profilePic: profilePicBase64, bio: "", goals: "", createdAt: new Date().toISOString() }; users.push(newUser); saveAll(); return true; }
function loginUser(email, password, remember = true) { const user = users.find(u=>u.email===email && u.password===password); if(user) { currentUser = user; if(remember) localStorage.setItem('studentnija_remember', 'true'); else localStorage.removeItem('studentnija_remember'); saveAll(); updateStreak(); return true; } return false; }


// ======================== LOADING OVERLAY ========================
function showLoadingOverlay(message = 'Please wait...') {
    const overlay = document.getElementById('loadingScreen');
    if (overlay) {
        const textEl = overlay.querySelector('p:last-child');
        if (textEl) textEl.textContent = message;
        overlay.classList.remove('hide');
        overlay.style.display = 'flex';
        overlay.style.opacity = '1';
    } else {
        // Fallback – create a temporary overlay
        const div = document.createElement('div');
        div.id = 'tempLoading';
        div.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg-primary);display:flex;align-items:center;justify-content:center;flex-direction:column;z-index:9999;';
        div.innerHTML = `
            <div class="spinner"></div>
            <p style="margin-top:20px;color:var(--text-muted);font-weight:500;">${message}</p>
        `;
        document.body.appendChild(div);
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loadingScreen');
    if (overlay) {
        overlay.classList.add('hide');
        setTimeout(() => { overlay.style.display = 'none'; }, 500);
    } else {
        const temp = document.getElementById('tempLoading');
        if (temp) temp.remove();
    }
}
document.getElementById('deleteAccountBtn')?.addEventListener('click', function() {
    deleteAccount();
});

function logout() {
    // Show loading overlay
    showLoadingOverlay('Logging out...');

    // Perform logout after a brief delay to show the loading state
    setTimeout(() => {
        currentUser = null;
        localStorage.removeItem('studentnija_user');
        isWaitingForLogin = false;
        if (loginPoller) {
            clearInterval(loginPoller);
            loginPoller = null;
        }
        saveAll();
        hideLoadingOverlay();
        renderApp();
        addNotification('Logout', 'You have been logged out.');
    }, 600); // 600ms delay for visual feedback
}

function updateUserProfile(updatedData) { if(currentUser) { Object.assign(currentUser, updatedData); saveAll(); renderMainApp(); addNotification("Profile", "Profile updated"); } }
function changePassword(oldPwd, newPwd) { if(currentUser && currentUser.password === oldPwd) { currentUser.password = newPwd; saveAll(); return true; } return false; }
function computeOverallCGPA() { let totalU=0, totalP=0; for(let sem of semesterList) { for(let c of coursesData[sem]||[]) { totalU+=c.unit; totalP+=c.points; } } return totalU===0?0:parseFloat((totalP/totalU).toFixed(2)); }
function getClassification(cgpa) { if(cgpa>=4.5) return "First Class"; if(cgpa>=3.5) return "Second Class Upper"; if(cgpa>=2.4) return "Second Class Lower"; if(cgpa>=1.5) return "Third Class"; return "Pass"; }
function checkAchievements() { let totalCourses = 0; for(let s in coursesData) totalCourses += coursesData[s].length; if(totalCourses>=1 && !achievements.find(a=>a.id==="first_course")?.achieved) achievements.find(a=>a.id==="first_course").achieved=true; let allSemestersWithCourses = semesterList.filter(s=>coursesData[s]?.length>0).length; if(allSemestersWithCourses>=1 && !achievements.find(a=>a.id==="semester_done")?.achieved) achievements.find(a=>a.id==="semester_done").achieved=true; let cgpa = computeOverallCGPA(); if(cgpa>=4.0 && !achievements.find(a=>a.id==="cgpa_excellent")?.achieved) achievements.find(a=>a.id==="cgpa_excellent").achieved=true; if(userStats.studyStreak>=7 && !achievements.find(a=>a.id==="streak_7")?.achieved) achievements.find(a=>a.id==="streak_7").achieved=true; if(userStats.studyStreak>=30 && !achievements.find(a=>a.id==="streak_30")?.achieved) achievements.find(a=>a.id==="streak_30").achieved=true; saveAll(); }
function updateStreak() { let today = new Date().toDateString(); if(userStats.lastActive !== today) { userStats.lastActive = today; userStats.studyStreak = (userStats.studyStreak || 0) + 1; saveAll(); } }
function applyTheme(themeMode) { if (themeMode === 'dark') { document.body.classList.add('dark-theme'); document.body.classList.remove('light-theme'); settings.theme = 'dark'; } else if (themeMode === 'light') { document.body.classList.add('light-theme'); document.body.classList.remove('dark-theme'); settings.theme = 'light'; } else if (themeMode === 'system') { const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches; if (prefersDark) { document.body.classList.add('dark-theme'); document.body.classList.remove('light-theme'); } else { document.body.classList.add('light-theme'); document.body.classList.remove('dark-theme'); } settings.theme = 'system'; } saveAll(); }
function updateConnectionIndicator() { const ind = document.getElementById('connectionIndicator'); if (navigator.onLine) { ind.innerHTML = '🌐 Online'; ind.className = 'connection-indicator online'; } else { ind.innerHTML = '📡 Offline'; ind.className = 'connection-indicator offline'; } }

// ======================== BUILD USER CONTEXT ========================
function buildUserContext() {
  if (!currentUser) return '';
  const cgpa = computeOverallCGPA();
  const classification = getClassification(cgpa);
  const upcomingExams = exams.slice(0,5).map(ex => `${ex.courseName} on ${ex.examDate}`).join('; ');
  const todayDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const todayClasses = timetableEvents.filter(ev => ev.day === todayDay).map(ev => `${ev.subject} at ${ev.time}`).join('; ');
  const pendingTasks = plannerTasks.filter(t => !t.completed).slice(0,5).map(t => t.title).join('; ');
  const courseCount = Object.values(coursesData).reduce((acc, arr) => acc + arr.length, 0);
  const totalCredits = Object.values(coursesData).reduce((acc, arr) => acc + arr.reduce((sum, c) => sum + c.unit, 0), 0);
  const allSemesters = semesterList.filter(s => coursesData[s]?.length > 0).join(', ');
  const flashcardCount = flashcards.length;
  const studyPlanCount = studyPlans.length;

  return `
===== STUDENTNIJA APP CONTEXT =====
User: ${currentUser.fullName}
School: ${currentUser.school}
Department: ${currentUser.department}
Level: ${currentUser.level}
Bio: ${currentUser.bio || 'Not set'}

Academic Summary:
- Overall CGPA: ${cgpa} (${classification})
- Total courses added: ${courseCount}
- Total credit units: ${totalCredits}
- Semesters with courses: ${allSemesters || 'None'}

Upcoming Exams (next 5): ${upcomingExams || 'None'}

Today's Classes (${todayDay}): ${todayClasses || 'None'}

Pending Tasks: ${pendingTasks || 'None'}

Flashcards created: ${flashcardCount}
Study Plans: ${studyPlanCount}

Today's Date: ${new Date().toLocaleDateString()}
===================================
`;
}

// ======================== NOTIFICATION SCHEDULING ========================
function scheduleExamReminders(examId, courseName, examDateStr) { 
  if (!settings.examNotifications) return; 
  const examDate = new Date(examDateStr); 
  if (isNaN(examDate.getTime())) return; 
  const offsets = [-7*24*3600*1000, -3*24*3600*1000, -24*3600*1000, -3600*1000]; 
  offsets.forEach(offset => { 
    const reminderTime = examDate.getTime() + offset; 
    if (reminderTime > Date.now()) 
      window.NotifBridge.scheduleUniversalNotification(`📚 Exam: ${courseName}`, `${courseName} exam reminder`, reminderTime); 
  }); 
}
function scheduleClassReminders(classId, subject, day, timeStr) { 
  if (!settings.classNotifications) return; 
  const daysMap = { "Monday":1, "Tuesday":2, "Wednesday":3, "Thursday":4, "Friday":5, "Saturday":6, "Sunday":0 }; 
  const targetDayIndex = daysMap[day]; 
  if (targetDayIndex === undefined) return; 
  const [hour, minute] = timeStr.split(':').map(Number); 
  let nextDate = new Date(); 
  nextDate.setHours(hour, minute, 0, 0); 
  while (nextDate.getDay() !== targetDayIndex) nextDate.setDate(nextDate.getDate() + 1); 
  if (nextDate < new Date()) nextDate.setDate(nextDate.getDate() + 7); 
  const offsets = [-30*60*1000, -15*60*1000]; 
  offsets.forEach(offset => { 
    const reminderTime = nextDate.getTime() + offset; 
    if (reminderTime > Date.now()) 
      window.NotifBridge.scheduleUniversalNotification(`📖 Class: ${subject}`, `Your ${subject} class starts soon`, reminderTime); 
  }); 
}
const originalAddExam = function(name, date) { 
  const newExam = { id: Date.now(), courseName: name, examDate: date, notifySent: false }; 
  exams.push(newExam); 
  saveAll(); 
  if(settings.examNotifications) scheduleExamReminders(newExam.id, name, date); 
  addNotification("Exam", `${name} added with reminders`); 
};
const originalAddClass = function(day, time, subject, location) { 
  const newClass = { id: Date.now(), day, time, subject, location: location||'', notified: false }; 
  timetableEvents.push(newClass); 
  saveAll(); 
  if(settings.classNotifications) scheduleClassReminders(newClass.id, subject, day, time); 
  addNotification("Timetable", `Class ${subject} added`); 
};
function rescheduleAllFromStorage() { 
  exams.forEach(ex => scheduleExamReminders(ex.id, ex.courseName, ex.examDate)); 
  timetableEvents.forEach(ev => scheduleClassReminders(ev.id, ev.subject, ev.day, ev.time)); 
}

// ======================== TOOL MODAL MANAGER ========================
let activeModal = null;
function openToolModal(title, contentHtml) {
  if (activeModal) closeToolModal();
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal-full modern-modal';
  modalDiv.id = 'toolModal';
  modalDiv.innerHTML = `
    <div class="tool-header">
      <h2>${escapeHtml(title)}</h2>
      <span class="tool-close">&times;</span>
    </div>
    <div class="tool-body">${contentHtml}</div>
  `;
  document.body.appendChild(modalDiv);
  activeModal = modalDiv;
  setTimeout(() => modalDiv.classList.add('active'), 10);
  modalDiv.querySelector('.tool-close').onclick = closeToolModal;
}
function closeToolModal() {
  if (activeModal) {
    activeModal.classList.remove('active');
    setTimeout(() => { if (activeModal) activeModal.remove(); activeModal = null; }, 300);
  }
}

// ======================== CALCULATOR ========================
function openCalculator() {
  let expression = '';
  let result = '';
  let history = [];
  let memory = 0;
  let isScientific = false;
  let displayExpr, displayResult, historyPanel, modeToggle;

  function updateDisplay() {
    if (displayExpr) displayExpr.textContent = expression || '0';
    if (displayResult) displayResult.textContent = result || '';
  }

  function evaluate(expr) {
    try {
      let sanitized = expr
        .replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(').replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(').replace(/ln\(/g, 'Math.log(').replace(/√\(/g, 'Math.sqrt(')
        .replace(/exp\(/g, 'Math.exp(').replace(/x²/g, '**2').replace(/x³/g, '**3')
        .replace(/factorial\(/g, 'factorial(');
      const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);
      const result = Function('"use strict"; return (' + sanitized + ')')();
      return result;
    } catch (e) {
      return 'Error';
    }
  }

  const html = `
    <div class="calc-container">
      <div class="calc-header">
        <div class="calc-mode-toggle">
          <button class="calc-mode-btn" data-mode="standard">Standard</button>
          <button class="calc-mode-btn" data-mode="scientific">Scientific</button>
        </div>
        <button class="calc-history-toggle" id="calcHistoryToggle">📜</button>
      </div>
      <div class="calc-display-area">
        <div class="calc-expression" id="calcExpression">0</div>
        <div class="calc-result" id="calcResult"></div>
      </div>
      <div class="calc-grid" id="calcGrid">
        <button class="calc-btn" data-val="C">C</button>
        <button class="calc-btn" data-val="±">±</button>
        <button class="calc-btn" data-val="%">%</button>
        <button class="calc-btn" data-val="÷">÷</button>
        <button class="calc-btn" data-val="7">7</button>
        <button class="calc-btn" data-val="8">8</button>
        <button class="calc-btn" data-val="9">9</button>
        <button class="calc-btn" data-val="×">×</button>
        <button class="calc-btn" data-val="4">4</button>
        <button class="calc-btn" data-val="5">5</button>
        <button class="calc-btn" data-val="6">6</button>
        <button class="calc-btn" data-val="−">−</button>
        <button class="calc-btn" data-val="1">1</button>
        <button class="calc-btn" data-val="2">2</button>
        <button class="calc-btn" data-val="3">3</button>
        <button class="calc-btn" data-val="+">+</button>
        <button class="calc-btn" data-val="0">0</button>
        <button class="calc-btn" data-val=".">.</button>
        <button class="calc-btn" data-val="⌫">⌫</button>
        <button class="calc-btn calc-equals" data-val="=">=</button>
      </div>
      <div class="calc-scientific" id="calcScientific" style="display:none;">
        <button class="calc-fn" data-fn="sin">sin</button>
        <button class="calc-fn" data-fn="cos">cos</button>
        <button class="calc-fn" data-fn="tan">tan</button>
        <button class="calc-fn" data-fn="log">log</button>
        <button class="calc-fn" data-fn="ln">ln</button>
        <button class="calc-fn" data-fn="√">√</button>
        <button class="calc-fn" data-fn="x²">x²</button>
        <button class="calc-fn" data-fn="x³">x³</button>
        <button class="calc-fn" data-fn="x!">x!</button>
        <button class="calc-fn" data-fn="π">π</button>
        <button class="calc-fn" data-fn="e">e</button>
        <button class="calc-fn" data-fn="exp">exp</button>
        <button class="calc-fn" data-fn="(">(</button>
        <button class="calc-fn" data-fn=")">)</button>
      </div>
      <div class="calc-memory">
        <button class="calc-mem-btn" data-mem="MC">MC</button>
        <button class="calc-mem-btn" data-mem="MR">MR</button>
        <button class="calc-mem-btn" data-mem="M+">M+</button>
        <button class="calc-mem-btn" data-mem="M−">M−</button>
      </div>
      <div class="calc-history-panel" id="calcHistoryPanel" style="display:none;">
        <div class="calc-history-header">
          <span>History</span>
          <button class="calc-history-clear" id="calcHistoryClear">Clear</button>
        </div>
        <div class="calc-history-list" id="calcHistoryList"></div>
      </div>
    </div>
  `;
  openToolModal('Calculator', html);

  displayExpr = document.getElementById('calcExpression');
  displayResult = document.getElementById('calcResult');
  const grid = document.getElementById('calcGrid');
  const scientificDiv = document.getElementById('calcScientific');
  historyPanel = document.getElementById('calcHistoryPanel');
  const historyList = document.getElementById('calcHistoryList');
  const historyToggle = document.getElementById('calcHistoryToggle');
  const historyClear = document.getElementById('calcHistoryClear');
  const modeButtons = document.querySelectorAll('.calc-mode-btn');

  function renderHistory() {
    if (!historyList) return;
    if (history.length === 0) {
      historyList.innerHTML = '<div class="text-muted">No calculations yet.</div>';
      return;
    }
    historyList.innerHTML = history.slice(-10).reverse().map(entry => `
      <div class="history-item">
        <div class="history-expr">${escapeHtml(entry.expr)}</div>
        <div class="history-result">= ${escapeHtml(entry.result)}</div>
      </div>
    `).join('');
  }

  document.querySelectorAll('.calc-mem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const memAction = btn.dataset.mem;
      const currentVal = parseFloat(result) || parseFloat(expression) || 0;
      switch (memAction) {
        case 'MC': memory = 0; break;
        case 'MR': if (memory !== 0) { expression += memory.toString(); updateDisplay(); } break;
        case 'M+': memory += currentVal; break;
        case 'M−': memory -= currentVal; break;
      }
      addNotification('Calculator', `Memory: ${memAction} done`);
    });
  });

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      isScientific = btn.dataset.mode === 'scientific';
      scientificDiv.style.display = isScientific ? 'grid' : 'none';
    });
  });
  document.querySelector('.calc-mode-btn[data-mode="standard"]').classList.add('active');

  historyToggle.addEventListener('click', () => {
    const isVisible = historyPanel.style.display !== 'none';
    historyPanel.style.display = isVisible ? 'none' : 'block';
    renderHistory();
  });

  historyClear.addEventListener('click', () => {
    history = [];
    renderHistory();
  });

  function handleButtonClick(val) {
    if (val === 'C') { expression = ''; result = ''; updateDisplay(); return; }
    if (val === '⌫') { expression = expression.slice(0, -1); updateDisplay(); return; }
    if (val === '=') {
      if (!expression) return;
      const res = evaluate(expression);
      result = res.toString();
      history.push({ expr: expression, result: result });
      displayResult.textContent = '= ' + result;
      expression = result;
      updateDisplay();
      renderHistory();
      return;
    }
    if (val === '±') { if (expression.startsWith('-')) expression = expression.slice(1); else expression = '-' + expression; updateDisplay(); return; }
    if (val === '%') { const current = parseFloat(expression) || 0; expression = (current / 100).toString(); updateDisplay(); return; }
    expression += val;
    updateDisplay();
  }

  grid.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => { handleButtonClick(btn.dataset.val); });
  });

  document.querySelectorAll('.calc-fn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fn = btn.dataset.fn;
      if (fn === 'π') { expression += 'π'; updateDisplay(); return; }
      if (fn === 'e') { expression += 'e'; updateDisplay(); return; }
      if (fn === 'x²') { expression += 'x²'; updateDisplay(); return; }
      if (fn === 'x³') { expression += 'x³'; updateDisplay(); return; }
      if (fn === 'x!') { expression += 'factorial('; updateDisplay(); return; }
      expression += fn + '(';
      updateDisplay();
    });
  });

  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('toolModal');
    if (!modal || !modal.classList.contains('active')) return;
    const key = e.key;
    if (key >= '0' && key <= '9') { handleButtonClick(key); e.preventDefault(); }
    else if (key === '.') { handleButtonClick('.'); e.preventDefault(); }
    else if (key === '+') { handleButtonClick('+'); e.preventDefault(); }
    else if (key === '-') { handleButtonClick('−'); e.preventDefault(); }
    else if (key === '*') { handleButtonClick('×'); e.preventDefault(); }
    else if (key === '/') { handleButtonClick('÷'); e.preventDefault(); }
    else if (key === 'Enter') { handleButtonClick('='); e.preventDefault(); }
    else if (key === 'Backspace') { handleButtonClick('⌫'); e.preventDefault(); }
    else if (key === 'Escape') { handleButtonClick('C'); e.preventDefault(); }
    else if (key === '%') { handleButtonClick('%'); e.preventDefault(); }
  });

  updateDisplay();
}

// ======================== MATH SOLVER ========================
function openMathSolver() {
  if (typeof math === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js';
    script.async = true;
    document.head.appendChild(script);
  }

  const modalHtml = `
    <div class="math-solver-container">
      <div style="display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;">
        <select id="mathServiceSelect" class="modern-select" style="flex:1; min-width:150px;">
          <option value="mathjs">Math.js (local evaluate)</option>
          <option value="aimath">AI Math Solver</option>
        </select>
        <button id="importFileBtn" class="btn-outline" style="width:auto;">📎 Import</button>
        <input type="file" id="fileInput" accept=".txt,.png,.jpg,.jpeg" style="display:none">
      </div>
      <textarea id="mathInput" class="math-input-area" rows="4" placeholder="Enter your math problem..."></textarea>
      <button id="solveMathBtn" class="btn-primary">Solve</button>
      <div id="mathSolution" class="math-solution"></div>
      <div id="mathSteps" class="math-step"></div>
    </div>
  `;
  openToolModal('Math Solver', modalHtml);

  const serviceSelect = document.getElementById('mathServiceSelect');
  const inputEl = document.getElementById('mathInput');
  const solveBtn = document.getElementById('solveMathBtn');
  const solutionDiv = document.getElementById('mathSolution');
  const stepsDiv = document.getElementById('mathSteps');
  const importBtn = document.getElementById('importFileBtn');
  const fileInput = document.getElementById('fileInput');

  importBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => { inputEl.value = ev.target.result; addNotification('File', `Imported ${file.name}`); };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      const previewDiv = document.createElement('div');
      previewDiv.style.cssText = 'margin:8px 0;';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.cssText = 'max-width:100%; max-height:200px; border-radius:12px;';
      previewDiv.appendChild(img);
      const statusMsg = document.createElement('p');
      statusMsg.className = 'text-muted';
      statusMsg.textContent = '🔄 Extracting text... (not shown)';
      previewDiv.appendChild(statusMsg);
      inputEl.parentNode.insertBefore(previewDiv, inputEl.nextSibling);

      if (typeof Tesseract === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.async = true;
        document.head.appendChild(script);
        statusMsg.textContent = '⚠️ Tesseract loading, please try again.';
        return;
      }
      try {
        const result = await Tesseract.recognize(file, 'eng', {
          logger: (m) => { if (m.status === 'recognizing text') statusMsg.textContent = `🔄 OCR ${Math.round(m.progress * 100)}%`; }
        });
        const text = result.data.text.trim();
        if (text) {
          inputEl.value = text;
          statusMsg.textContent = '✅ Text extracted successfully. You can now solve.';
          addNotification('OCR', 'Image text extracted');
        } else {
          statusMsg.textContent = '❌ No text found.';
        }
      } catch (err) {
        statusMsg.textContent = '❌ OCR error: could not read image.';
      }
    } else {
      alert('Unsupported file type.');
    }
    fileInput.value = '';
  });

  async function performSolve() {
    const query = inputEl.value.trim();
    if (!query) { solutionDiv.innerHTML = 'Please enter a problem.'; return; }
    const service = serviceSelect.value;
    solutionDiv.innerHTML = '';
    stepsDiv.innerHTML = '';

    if (service === 'mathjs') {
      if (typeof math === 'undefined') { solutionDiv.innerHTML = 'Math.js loading...'; return; }
      try {
        const result = math.evaluate(query);
        solutionDiv.innerHTML = `<strong>🧠 Result:</strong><br>${result}`;
      } catch (err) {
        solutionDiv.innerHTML = 'Invalid expression – please check your input.';
      }
    } else if (service === 'aimath') {
      try {
        const aiResult = await callMathAI(query);
        solutionDiv.innerHTML = `<div style="position:relative;"><strong>✦AI Solution:</strong><br><div style="white-space:pre-wrap;">${escapeHtml(aiResult)}</div><button class="copy-btn" data-text="${escapeHtml(aiResult)}">⧉</button></div>`;
      } catch (err) {
        solutionDiv.innerHTML = 'Oops! The AI service is temporarily unavailable. Please try again later.';
      }
    }
  }

  solveBtn.addEventListener('click', performSolve);
  inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); performSolve(); } });
}

// ======================== QUIZ ========================
function openQuiz() {
  let currentQuiz = [], currentQuizIndex = 0, quizScore = 0;

  async function generateQuizQuestions(topic, count = 5) {
    const prompt = `Generate ${count} multiple-choice questions about "${topic}". Format as JSON array: [{"question":"...", "options":["A)","B)","C)","D)"], "answer":0}] where answer is the index (0-3). Only JSON.`;
    const result = await callAIHelper(prompt, 'quiz');
    const jsonMatch = result.match(/\[.*\]/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return [];
  }

  function renderQuizQuestion(container) {
    if (currentQuizIndex >= currentQuiz.length) {
      container.innerHTML = `
        <div class="glass-card" style="padding:24px; text-align:center;">
          <h3>🎉 Done!</h3>
          <p>Score: ${quizScore}/${currentQuiz.length}</p>
          <button id="restartQuizBtn" class="btn-primary" style="width:auto;">Retry</button>
        </div>
      `;
      document.getElementById('restartQuizBtn')?.addEventListener('click', () => {
        currentQuizIndex = 0;
        quizScore = 0;
        renderQuizQuestion(container);
      });
      return;
    }

    const q = currentQuiz[currentQuizIndex];
    let html = `<div class="glass-card" style="padding:20px;">
      <div class="quiz-question">${escapeHtml(q.question)}</div>
      <div class="quiz-options">`;
    q.options.forEach((opt, idx) => {
      html += `<div class="quiz-option" data-opt="${idx}">${escapeHtml(opt)}</div>`;
    });
    html += `</div></div>`;
    container.innerHTML = html;

    document.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        const selected = parseInt(e.currentTarget.dataset.opt);
        if (selected === q.answer) quizScore++;
        currentQuizIndex++;
        renderQuizQuestion(container);
      });
    });
  }

  // Open the modal with the quiz UI
  const html = `
    <div class="quiz-modern">
      <div style="display:flex; gap:12px; margin-bottom:20px;">
        <input type="text" id="quizTopic" placeholder="Enter topic (e.g., Algebra, Physics...)" style="flex:1;">
        <button id="generateQuizBtn" class="btn-primary" style="width:auto;">Generate</button>
      </div>
      <div id="quizContainer" class="quiz-container"></div>
    </div>
  `;
  openToolModal('AI Quiz', html);

  const topicInput = document.getElementById('quizTopic');
  const generateBtn = document.getElementById('generateQuizBtn');
  const container = document.getElementById('quizContainer');

  generateBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    if (!topic) {
      container.innerHTML = '<div class="text-muted">Please enter a topic.</div>';
      return;
    }
    container.innerHTML = '<div class="text-muted">Generating questions…</div>';
    try {
      const questions = await generateQuizQuestions(topic, 5);
      if (!questions || questions.length === 0) {
        container.innerHTML = '<div class="text-muted">Could not generate questions. Please try another topic.</div>';
        return;
      }
      currentQuiz = questions;
      currentQuizIndex = 0;
      quizScore = 0;
      renderQuizQuestion(container);
    } catch (err) {
      container.innerHTML = '<div class="text-muted">Sorry, something went wrong. Please try again.</div>';
    }
  });
}
// ======================== DICTIONARY ========================
async function explainWordWithAI(word, definition) {
  const prompt = `The word "${word}" has definitions: ${definition}. Provide a comprehensive explanation, synonyms, example sentences, and usage.`;
  return await callAIHelper(prompt, 'dictionary');
}

function openDictionary() {
  const html = `
    <div class="dict-modern">
      <div class="search-group">
        <input type="text" id="dictWord" placeholder="Enter a word...">
        <button id="searchDictBtn" class="btn-primary" style="width:auto;">Define</button>
      </div>
      <div id="dictResult" class="dict-result"></div>
    </div>
  `;
  openToolModal('AI Dictionary', html);

  const searchBtn = document.getElementById('searchDictBtn');
  const wordInput = document.getElementById('dictWord');
  const resultDiv = document.getElementById('dictResult');

  async function fetchWord() {
    const word = wordInput.value.trim();
    if (!word) return;
    resultDiv.innerHTML = '<div class="text-muted">Loading...</div>';
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!response.ok) throw new Error('Word not found');
      const data = await response.json();
      const entry = data[0];
      const definitions = entry.meanings.map(m => m.definitions.map(d => d.definition).join('; ')).join('; ');
      const aiExplanation = await explainWordWithAI(word, definitions);
      let html = `<div class="definition-card">
        <div class="word-title">${escapeHtml(entry.word)}</div>
        <div class="phonetic">${entry.phonetic || ''}</div>
        <div class="ai-explanation">${escapeHtml(aiExplanation)}</div>
        <div class="dict-extra"><strong>Dictionary:</strong> ${escapeHtml(definitions)}</div>
        ${entry.phonetics && entry.phonetics[0] && entry.phonetics[0].audio ? `<button class="audio-btn" data-audio="${entry.phonetics[0].audio}">🔊 Listen</button>` : ''}
        <button class="copy-btn" data-text="${escapeHtml(aiExplanation)}" style="margin-top:8px;">⧉</button>
      </div>`;
      resultDiv.innerHTML = html;
      const audioBtn = resultDiv.querySelector('.audio-btn');
      if (audioBtn) audioBtn.onclick = () => { const url = audioBtn.dataset.audio; if (url) new Audio(url).play(); };
    } catch (err) {
      resultDiv.innerHTML = `<div class="text-muted">Word not found. Please check the spelling.</div>`;
    }
  }

  searchBtn.onclick = fetchWord;
  wordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchWord(); });
}

// ======================== 1. FLASHCARDS ========================
function openFlashcards() {
  flashcards = JSON.parse(localStorage.getItem('studentnija_flashcards') || '[]');

  const html = `
    <div class="flashcard-container">
      <div class="flex-between" style="margin-bottom:16px;">
        <h3>📚 Flashcards</h3>
        <button id="addFlashcardBtn" class="btn-primary" style="width:auto;">+ New</button>
      </div>
      <div id="flashcardList" style="display:flex; flex-direction:column; gap:12px; max-height:60vh; overflow-y:auto;"></div>
    </div>
  `;
  openToolModal('Flashcards', html);

  function renderFlashcards() {
    const container = document.getElementById('flashcardList');
    if (!container) return;
    if (flashcards.length === 0) {
      container.innerHTML = '<div class="text-muted">No flashcards yet. Create one!</div>';
      return;
    }
    container.innerHTML = flashcards.map((card, idx) => `
      <div class="glass-card" style="padding:16px;">
        <div><strong>Q:</strong> ${escapeHtml(card.question)}</div>
        <div style="margin-top:6px;"><strong>A:</strong> ${escapeHtml(card.answer)}</div>
        <div style="margin-top:8px; display:flex; gap:8px;">
          <button class="btn-outline edit-flashcard" data-idx="${idx}" style="width:auto; padding:4px 12px;">✏️</button>
          <button class="btn-outline delete-flashcard" data-idx="${idx}" style="width:auto; padding:4px 12px;">🗑️</button>
          <button class="btn-outline review-flashcard" data-idx="${idx}" style="width:auto; padding:4px 12px;">📖 Review</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.edit-flashcard').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const card = flashcards[idx];
        const newQ = prompt('Question:', card.question);
        if (newQ) {
          const newA = prompt('Answer:', card.answer);
          if (newA) {
            flashcards[idx] = { question: newQ.trim(), answer: newA.trim() };
            localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
            renderFlashcards();
            addNotification('Flashcard', 'Updated');
          }
        }
      };
    });
    container.querySelectorAll('.delete-flashcard').forEach(btn => {
      btn.onclick = () => {
        if (confirm('Delete this flashcard?')) {
          const idx = parseInt(btn.dataset.idx);
          flashcards.splice(idx, 1);
          localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
          renderFlashcards();
          addNotification('Flashcard', 'Deleted');
        }
      };
    });
    container.querySelectorAll('.review-flashcard').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const card = flashcards[idx];
        alert(`Question: ${card.question}\n\nAnswer: ${card.answer}`);
      };
    });
  }

  document.getElementById('addFlashcardBtn').onclick = () => {
    const q = prompt('Enter question:');
    if (q) {
      const a = prompt('Enter answer:');
      if (a) {
        flashcards.push({ question: q.trim(), answer: a.trim() });
        localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
        renderFlashcards();
        addNotification('Flashcard', 'Added');
      }
    }
  };

  renderFlashcards();
}

// ======================== 2. GRADE PREDICTOR ========================
function openGradePredictor() {
  const html = `
    <div class="grade-predictor">
      <h3>📊 What-If Grade Simulator</h3>
      <p class="text-muted">Add your desired grades for a semester and see the impact on your overall CGPA.</p>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin:12px 0;">
        <select id="predSemSelect" style="flex:1; min-width:150px;">
          ${semesterList.map(s => `<option value="${s}">${semesterNames[s]}</option>`).join('')}
        </select>
        <input type="number" id="predUnit" placeholder="Credit Units" style="flex:1; min-width:100px;">
        <input type="text" id="predGrade" placeholder="Grade (A-F)" style="flex:1; min-width:80px;">
        <button id="addPredCourseBtn" class="btn-primary" style="width:auto;">Add Course</button>
      </div>
      <div id="predCourseList"></div>
      <button id="simulateGpaBtn" class="btn-primary">Simulate CGPA</button>
      <div id="simulationResult" class="math-solution" style="margin-top:16px;"></div>
    </div>
  `;
  openToolModal('Grade Predictor', html);

  const predictedCourses = [];

  function renderPredCourses() {
    const container = document.getElementById('predCourseList');
    if (!container) return;
    if (predictedCourses.length === 0) {
      container.innerHTML = '<div class="text-muted">No courses added yet.</div>';
      return;
    }
    container.innerHTML = predictedCourses.map((c, idx) => `
      <div class="course-item flex-between">
        <div><strong>${c.code || 'Course'}</strong> (${c.unit} units, Grade ${c.grade})</div>
        <button class="del-pred" data-idx="${idx}" style="background:none;border:none;">🗑️</button>
      </div>
    `).join('');
    container.querySelectorAll('.del-pred').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        predictedCourses.splice(idx, 1);
        renderPredCourses();
      };
    });
  }

  document.getElementById('addPredCourseBtn').onclick = () => {
    const sem = document.getElementById('predSemSelect').value;
    const unit = parseFloat(document.getElementById('predUnit').value);
    const grade = document.getElementById('predGrade').value.toUpperCase();
    if (!unit || !grade || !gradeMap[grade]) {
      alert('Enter valid unit and grade (A-F).');
      return;
    }
    predictedCourses.push({ code: `${sem} (pred)`, unit, grade, points: unit * gradeMap[grade] });
    renderPredCourses();
    document.getElementById('predUnit').value = '';
    document.getElementById('predGrade').value = '';
    addNotification('Grade Predictor', 'Course added');
  };

  document.getElementById('simulateGpaBtn').onclick = () => {
    if (predictedCourses.length === 0) {
      document.getElementById('simulationResult').innerHTML = 'Please add at least one course.';
      return;
    }
    const totalUnits = predictedCourses.reduce((sum, c) => sum + c.unit, 0);
    const totalPoints = predictedCourses.reduce((sum, c) => sum + c.points, 0);
    const predGpa = totalUnits === 0 ? 0 : (totalPoints / totalUnits).toFixed(2);

    const allCourses = [];
    for (const s of semesterList) {
      allCourses.push(...coursesData[s]);
    }
    const allUnits = allCourses.reduce((sum, c) => sum + c.unit, 0);
    const allPoints = allCourses.reduce((sum, c) => sum + c.points, 0);
    const combinedUnits = allUnits + totalUnits;
    const combinedPoints = allPoints + totalPoints;
    const newCgpa = combinedUnits === 0 ? 0 : (combinedPoints / combinedUnits).toFixed(2);

    document.getElementById('simulationResult').innerHTML = `
      <strong>Predicted semester GPA:</strong> ${predGpa}<br>
      <strong>New overall CGPA:</strong> ${newCgpa} (was ${computeOverallCGPA()})<br>
      <span class="text-muted">Based on ${predictedCourses.length} predicted course(s).</span>
    `;
  };
  renderPredCourses();
}

// ======================== 3. EXPORT/IMPORT ========================
function openDataManager() {
  const html = `
    <div class="data-manager">
      <h3>💾 Backup & Restore</h3>
      <p class="text-muted">Export all your data as a JSON file, or import a previously saved backup.</p>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
        <button id="exportDataBtn" class="btn-primary" style="width:auto;">📤 Export All</button>
        <button id="importDataBtn" class="btn-outline" style="width:auto;">📥 Import Backup</button>
        <input type="file" id="importFileInput" accept=".json" style="display:none;">
      </div>
      <div id="dataStatus" class="text-muted" style="margin-top:12px;"></div>
    </div>
  `;
  openToolModal('Data Manager', html);

  document.getElementById('exportDataBtn').onclick = () => {
    const data = {
      user: currentUser,
      courses: coursesData,
      planner: plannerTasks,
      timetable: timetableEvents,
      exams: exams,
      notes: savedNotes,
      flashcards: flashcards,
      achievements: achievements,
      studyLog: studyHoursLog,
      notifications: notifications,
      stats: userStats,
      settings: settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudentNija_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('dataStatus').textContent = '✅ Backup downloaded.';
    addNotification('Backup', 'Data exported');
  };

  document.getElementById('importDataBtn').onclick = () => {
    document.getElementById('importFileInput').click();
  };

  document.getElementById('importFileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.courses) coursesData = data.courses;
        if (data.planner) plannerTasks = data.planner;
        if (data.timetable) timetableEvents = data.timetable;
        if (data.exams) exams = data.exams;
        if (data.notes) savedNotes = data.notes;
        if (data.flashcards) flashcards = data.flashcards;
        if (data.achievements) achievements = data.achievements;
        if (data.studyLog) studyHoursLog = data.studyLog;
        if (data.notifications) notifications = data.notifications;
        if (data.stats) userStats = data.stats;
        if (data.settings) settings = data.settings;
        saveAll();
        localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
        localStorage.setItem('studentnija_notes_list', JSON.stringify(savedNotes));
        document.getElementById('dataStatus').textContent = '✅ Data imported successfully! Refresh to see changes.';
        addNotification('Backup', 'Data imported');
      } catch (err) {
        document.getElementById('dataStatus').textContent = '❌ Invalid backup file.';
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
}

// ======================== 4. PERSONAL AI TUTOR ========================
async function openAITutor() {
  const context = buildUserContext();
  const prompt = `Based on the user's app data below, create a personalized study plan for the next week. Include daily focus areas, topics to review, and actionable tips. Keep it concise and motivating.\n\n${context}`;
  try {
    const result = await callAIHelper(prompt, 'tutor', '');
    const html = `
      <div class="ai-tutor-container">
        <h3>🧑‍🏫 Personal AI Tutor</h3>
        <div class="glass-card" style="padding:20px; white-space:pre-wrap; max-height:60vh; overflow-y:auto; position:relative;">
          ${escapeHtml(result)}
          <button class="copy-btn" data-text="${escapeHtml(result)}" style="position:absolute; top:10px; right:10px;">⧉</button>
        </div>
        <button id="refreshTutorPlan" class="btn-outline" style="margin-top:16px; width:auto;">🔄 Generate New Plan</button>
      </div>
    `;
    openToolModal('AI Tutor', html);
    document.getElementById('refreshTutorPlan').onclick = () => { openAITutor(); };
  } catch (err) {
    openToolModal('AI Tutor', `<div class="text-muted">Oops! The tutor service is temporarily unavailable. Please try again later.</div>`);
  }
}

// ======================== 5. ESSAY ASSISTANT ========================
function openEssayAssistant() {
  const html = `
    <div class="essay-assistant">
      <h3>✍️ Essay Assistant</h3>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin:12px 0;">
        <input type="text" id="essayTopic" placeholder="Essay topic / prompt" style="flex:3;">
        <input type="number" id="essayWords" placeholder="Word count (optional)" style="flex:1; min-width:100px;">
        <button id="generateEssayBtn" class="btn-primary" style="width:auto;">Generate Outline</button>
      </div>
      <div id="essayActions" style="display:flex; gap:8px; flex-wrap:wrap; margin:8px 0;">
        <button class="btn-outline essay-action" data-action="draft">Write Draft</button>
        <button class="btn-outline essay-action" data-action="improve">Improve Text</button>
        <button class="btn-outline essay-action" data-action="summarize">Summarize</button>
        <button class="btn-outline essay-action" data-action="expand">Expand</button>
      </div>
      <div style="position:relative;">
        <textarea id="essayOutput" class="notepad-area" rows="10" placeholder="Essay content will appear here..."></textarea>
        <button class="copy-btn" id="copyEssayOutput" style="position:absolute; top:8px; right:8px;">⧉</button>
      </div>
    </div>
  `;
  openToolModal('Essay Assistant', html);

  const topicInput = document.getElementById('essayTopic');
  const wordsInput = document.getElementById('essayWords');
  const outputArea = document.getElementById('essayOutput');
  const generateBtn = document.getElementById('generateEssayBtn');

  document.getElementById('copyEssayOutput').addEventListener('click', () => {
    const text = outputArea.value;
    if (text) {
      navigator.clipboard.writeText(text).then(() => addNotification('Copied', 'Essay copied to clipboard'));
    }
  });

  async function performEssayAction(action) {
    const text = outputArea.value;
    if (!text.trim() && action !== 'draft') {
      alert('Please enter some text first.');
      return;
    }
    let prompt = '';
    if (action === 'draft') {
      const topic = topicInput.value.trim();
      const words = wordsInput.value.trim() || '500';
      if (!topic) { alert('Enter a topic first.'); return; }
      prompt = `Write a ${words}-word essay on "${topic}". Include an introduction, body paragraphs, and a conclusion. Use academic tone.`;
    } else if (action === 'improve') {
      prompt = `Improve the following text for clarity, grammar, and flow:\n\n${text}`;
    } else if (action === 'summarize') {
      prompt = `Summarize the following text concisely:\n\n${text}`;
    } else if (action === 'expand') {
      prompt = `Expand the following text by adding more detail and examples:\n\n${text}`;
    }
    outputArea.value = '⏳ Processing...';
    try {
      const result = await callAIHelper(prompt, 'essay');
      outputArea.value = result;
      addNotification('Essay', `Action: ${action} completed`);
    } catch (err) {
      outputArea.value = 'Oops! Something went wrong. Please try again.';
    }
  }

  generateBtn.onclick = () => performEssayAction('draft');
  document.querySelectorAll('.essay-action').forEach(btn => {
    btn.onclick = () => performEssayAction(btn.dataset.action);
  });
}

// ======================== 6. SMART SEARCH ========================
function openSmartSearch() {
  const html = `
    <div class="smart-search">
      <h3>🔍 Smart Search (Notes, Flashcards, Courses)</h3>
      <div style="display:flex; gap:12px; margin:12px 0;">
        <input type="text" id="searchQuery" placeholder="Ask a question or search for keywords..." style="flex:1;">
        <button id="searchBtn" class="btn-primary" style="width:auto;">Search</button>
      </div>
      <div id="searchResults" class="search-results" style="max-height:60vh; overflow-y:auto;"></div>
    </div>
  `;
  openToolModal('Smart Search', html);

  const queryInput = document.getElementById('searchQuery');
  const resultsDiv = document.getElementById('searchResults');
  const searchBtn = document.getElementById('searchBtn');

  async function performSearch() {
    const query = queryInput.value.trim();
    if (!query) return;
    resultsDiv.innerHTML = '<div class="text-muted">🔎 Searching...</div>';

    const allNotes = savedNotes.map(n => `Note: ${n.title} - ${n.content}`).join('\n');
    const allFlashcards = flashcards.map(c => `Flashcard: Q: ${c.question} A: ${c.answer}`).join('\n');
    const allCourses = Object.entries(coursesData).map(([sem, courses]) => 
      `Semester ${sem}: ${courses.map(c => `${c.code} (${c.unit} units, grade ${c.grade})`).join('; ')}`
    ).join('\n');
    const allTasks = plannerTasks.map(t => `Task: ${t.title} (${t.completed ? 'done' : 'pending'})`).join('\n');
    const combinedText = `Notes:\n${allNotes}\n\nFlashcards:\n${allFlashcards}\n\nCourses:\n${allCourses}\n\nTasks:\n${allTasks}`;

    const prompt = `Given the following search query: "${query}", search through the user's data below and return the most relevant passages. List each result with a brief context and the source (Note/Flashcard/Course/Task). If nothing is found, say so.\n\n${combinedText}`;
    try {
      const result = await callAIHelper(prompt, 'chat');
      resultsDiv.innerHTML = `<div style="position:relative;"><div class="glass-card" style="padding:16px; white-space:pre-wrap;">${escapeHtml(result)}</div><button class="copy-btn" data-text="${escapeHtml(result)}" style="position:absolute; top:10px; right:10px;">📋 Copy</button></div>`;
    } catch (err) {
      resultsDiv.innerHTML = '<div class="text-muted">Search service unavailable. Please try again later.</div>';
    }
  }

  searchBtn.onclick = performSearch;
  queryInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
}

// ======================== LIBRARY ========================
function openLibrary() {
  openToolModal('Library - Search Books', `
    <div class="search-group">
      <input type="text" id="bookSearch" placeholder="Search by title or author...">
      <button id="searchBookBtn" class="btn-primary" style="width:auto;">Search</button>
    </div>
    <div class="search-group">
      <input type="text" id="yearFilter" placeholder="Filter by year (optional)" style="width:150px;">
    </div>
    <div id="bookResults" class="library-results"></div>
  `);
  const searchBtn = document.getElementById('searchBookBtn');
  const searchInput = document.getElementById('bookSearch');
  const yearFilter = document.getElementById('yearFilter');
  
  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    const year = yearFilter.value.trim();
    const resultsDiv = document.getElementById('bookResults');
    resultsDiv.innerHTML = '<div class="text-muted">Searching...</div>';
    try {
      let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=24`;
      const response = await fetch(url);
      const data = await response.json();
      let docs = data.docs;
      if (year) docs = docs.filter(book => book.first_publish_year && book.first_publish_year.toString().includes(year));
      if (docs.length === 0) { resultsDiv.innerHTML = '<div class="text-muted">No books found.</div>'; return; }
      resultsDiv.innerHTML = docs.map(book => `
        <div class="book-card" data-key="${book.key}">
          <img class="book-cover" src="https://covers.openlibrary.org/b/id/${book.cover_i || ''}-M.jpg" onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'">
          <div class="book-title">${escapeHtml(book.title)}</div>
          <div class="book-author">${book.author_name ? book.author_name.join(', ') : 'Unknown'}</div>
          <div class="book-year">${book.first_publish_year || 'Year unknown'}</div>
        </div>
      `).join('');
      document.querySelectorAll('.book-card').forEach(card => {
        card.onclick = () => {
          const key = card.getAttribute('data-key');
          window.open(`https://openlibrary.org${key}`, '_blank');
        };
      });
    } catch(e) { resultsDiv.innerHTML = '<div class="text-muted">Error fetching data. Check your internet connection.</div>'; }
  }
  if (searchBtn) searchBtn.onclick = performSearch;
  if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
}

// ======================== PAST QUESTIONS ========================
function openPastQuestions() {
  let importHtml = `
    <div class="search-group">
      <input type="file" id="pastqFile" accept=".txt,.pdf,.jpg,.png" style="flex:1;">
      <button id="importPastqBtn" class="btn-primary">Import</button>
    </div>
    <div id="pastqPreview" style="margin:12px 0; display:none;">
      <img id="pastqImagePreview" style="max-width:100%; max-height:200px; border-radius:12px;">
      <p class="text-muted" style="margin-top:4px;">Image imported – text extracted (not shown).</p>
    </div>
    <div id="pastqList" class="pastq-list"></div>
  `;
  openToolModal('Past Questions Library', importHtml);

  function refreshList() {
    const container = document.getElementById('pastqList');
    if (!container) return;
    if (pastQuestions.length === 0) {
      container.innerHTML = '<div class="text-muted">No past questions imported yet.</div>';
      return;
    }
    container.innerHTML = pastQuestions.map((pq, idx) => `
      <div class="pastq-item">
        <div>
          ${pq.imageData ? `<img src="${pq.imageData}" style="max-width:80px; max-height:80px; border-radius:8px; margin-right:10px; float:left;">` : ''}
          <strong>${escapeHtml(pq.name)}</strong><br>
          <span class="text-muted">${pq.date}</span>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          ${pq.imageData ? `<button class="btn-primary generate-answer-btn" data-idx="${idx}" style="width:auto; padding:4px 12px;">🤖 Generate Answers</button>` : ''}
          <button class="btn-outline view-pastq" data-idx="${idx}" style="margin-right:8px;">View</button>
          <button class="btn-outline delete-pastq" data-idx="${idx}">Delete</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.view-pastq').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const pq = pastQuestions[idx];
        if (pq.type === 'text') alert(pq.content);
        else if (pq.imageData) window.open(pq.imageData, '_blank');
        else if (pq.dataUrl) window.open(pq.dataUrl, '_blank');
      };
    });
    document.querySelectorAll('.delete-pastq').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        pastQuestions.splice(idx, 1);
        saveAll();
        refreshList();
        addNotification('Past Questions', 'Deleted one entry');
      };
    });
    document.querySelectorAll('.generate-answer-btn').forEach(btn => {
      btn.onclick = async () => {
        const idx = parseInt(btn.dataset.idx);
        const pq = pastQuestions[idx];
        if (!pq.extractedText) {
          alert('No text extracted from this image.');
          return;
        }
        const prompt = `You are a study assistant. Based on the following text extracted from a past question image, provide detailed answers and explanations for each question. If the text contains multiple questions, answer all of them.\n\nExtracted text:\n${pq.extractedText}`;
        try {
          const result = await callAIHelper(prompt, 'chat');
          const answerHtml = `
            <div style="position:relative; padding:16px;">
              <h4>✦AI Generated Answers</h4>
              <div style="white-space:pre-wrap;">${escapeHtml(result)}</div>
              <button class="copy-btn" data-text="${escapeHtml(result)}" style="position:absolute; top:0; right:0;">⧉</button>
            </div>
          `;
          openToolModal('AI Answers', answerHtml);
          addNotification('Past Questions', 'AI answers generated');
        } catch (err) {
          alert('Oops! Could not generate answers. Please try again later.');
        }
      };
    });
  }

  const importBtn = document.getElementById('importPastqBtn');
  const fileInput = document.getElementById('pastqFile');
  const previewDiv = document.getElementById('pastqPreview');
  const previewImg = document.getElementById('pastqImagePreview');

  if (importBtn) {
    importBtn.onclick = () => {
      if (!fileInput.files.length) { alert('Select a file'); return; }
      const file = fileInput.files[0];
      const reader = new FileReader();

      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        previewImg.src = objectUrl;
        previewDiv.style.display = 'block';

        if (typeof Tesseract === 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.async = true;
          document.head.appendChild(script);
          alert('Tesseract is loading, please try again in a moment.');
          return;
        }
        Tesseract.recognize(file, 'eng', {
          logger: (m) => { if (m.status === 'recognizing text') console.log(`OCR progress: ${m.progress * 100}%`); }
        }).then((result) => {
          const text = result.data.text.trim();
          const dataUrl = URL.createObjectURL(file);
          pastQuestions.push({
            id: Date.now(),
            name: file.name,
            date: new Date().toLocaleDateString(),
            type: 'image',
            imageData: dataUrl,
            extractedText: text
          });
          saveAll();
          refreshList();
          addNotification('Past Questions', `Imported ${file.name} with OCR`);
          previewDiv.style.display = 'none';
          fileInput.value = '';
        }).catch(err => {
          alert('OCR failed: Could not read image text.');
          previewDiv.style.display = 'none';
        });
      } else if (file.type === 'text/plain' || file.type === 'application/pdf') {
        reader.onload = function(e) {
          let content = e.target.result;
          pastQuestions.push({
            id: Date.now(),
            name: file.name,
            date: new Date().toLocaleDateString(),
            type: 'text',
            content: content,
            dataUrl: file.type === 'application/pdf' ? URL.createObjectURL(file) : null,
            extractedText: content
          });
          saveAll();
          refreshList();
          addNotification('Past Questions', `Imported ${file.name}`);
        };
        reader.readAsText(file, 'UTF-8');
      } else {
        alert('Unsupported file type.');
      }
    };
  }
  refreshList();
}

// ======================== NOTEPAD ========================
function openNotepad() {
  let currentNoteIndex = -1;
  let noteCategories = ['School', 'Work', 'Personal', 'Misc'];
  let autoSaveEnabled = JSON.parse(localStorage.getItem('notepad_autoSave')) !== false;
  let fontSize = parseInt(localStorage.getItem('notepad_fontSize')) || 16;

  async function aiAction(action) {
    const editor = document.getElementById('notepadText');
    const text = editor.value;
    if (!text.trim()) { alert('Nothing to process.'); return; }
    const selected = text.substring(editor.selectionStart, editor.selectionEnd);
    const target = selected || text;
    let prompt = '';
    switch (action) {
      case 'summarize': prompt = 'Summarize the following text concisely:'; break;
      case 'rewrite': prompt = 'Rewrite this text with better clarity and fluency:'; break;
      case 'translate': prompt = 'Translate the following text to English (if not already) or to the user\'s preferred language:'; break;
      case 'grammar': prompt = 'Fix grammar and spelling mistakes in this text:'; break;
      case 'expand': prompt = 'Expand this text to provide more detail and explanation:'; break;
      default: return;
    }
    const result = await callAIHelper(`${prompt}\n\n${target}`, 'chat');
    if (selected) {
      const before = text.substring(0, editor.selectionStart);
      const after = text.substring(editor.selectionEnd);
      editor.value = before + result + after;
    } else {
      editor.value = result;
    }
    addNotification('Notepad', `AI ${action} applied`);
  }

  function setupAutoComplete(input) {
    const datalistId = 'wordSuggestions';
    let datalist = document.getElementById(datalistId);
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = datalistId;
      document.body.appendChild(datalist);
    }
    const commonWords = ['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us'];
    datalist.innerHTML = commonWords.map(w => `<option value="${w}">`).join('');
    input.setAttribute('list', datalistId);
  }

  function renderNoteList() {
    const container = document.getElementById('noteList');
    if (!container) return;
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'All';
    let filtered = savedNotes;
    if (categoryFilter !== 'All') {
      filtered = savedNotes.filter(note => note.category === categoryFilter);
    }
    if (filtered.length === 0) {
      container.innerHTML = `<div class="text-muted">No notes in this category.</div>`;
      return;
    }
    container.innerHTML = filtered.map((note, idx) => {
      const realIdx = savedNotes.indexOf(note);
      return `<div class="note-item">
        <div>
          <strong>${escapeHtml(note.title || 'Untitled')}</strong>
          <span class="text-muted" style="font-size:12px;">[${note.category || 'Misc'}]</span>
          <br><span class="text-muted">${new Date(note.updated).toLocaleString()}</span>
        </div>
        <div>
          <button class="btn-outline load-note" data-idx="${realIdx}" style="margin-right:8px;">Load</button>
          <button class="btn-outline delete-note" data-idx="${realIdx}">Delete</button>
        </div>
      </div>`;
    }).join('');

    document.querySelectorAll('.load-note').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const note = savedNotes[idx];
        document.getElementById('notepadText').value = note.content;
        document.getElementById('noteTitle').value = note.title || '';
        document.getElementById('categorySelect').value = note.category || 'Misc';
        currentNoteIndex = idx;
        addNotification('Notepad', `Loaded: ${note.title || 'Untitled'}`);
      };
    });
    document.querySelectorAll('.delete-note').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (confirm('Delete this note?')) {
          savedNotes.splice(idx, 1);
          saveNotesList();
          renderNoteList();
          addNotification('Notepad', 'Note deleted');
          if (currentNoteIndex === idx) {
            document.getElementById('notepadText').value = '';
            document.getElementById('noteTitle').value = '';
            document.getElementById('categorySelect').value = 'Misc';
            currentNoteIndex = -1;
          }
        }
      };
    });
  }

  function saveCurrentNote() {
    const editor = document.getElementById('notepadText');
    const title = document.getElementById('noteTitle').value.trim() || 'Untitled';
    const category = document.getElementById('categorySelect').value || 'Misc';
    if (currentNoteIndex === -1) {
      alert('Load a note first or use "Save as New".');
      return;
    }
    savedNotes[currentNoteIndex].content = editor.value;
    savedNotes[currentNoteIndex].title = title;
    savedNotes[currentNoteIndex].category = category;
    savedNotes[currentNoteIndex].updated = new Date().toISOString();
    saveNotesList();
    renderNoteList();
    addNotification('Notepad', 'Note updated');
  }

  function saveNotesList() {
    localStorage.setItem('studentnija_notes_list', JSON.stringify(savedNotes));
  }

  let autoSaveTimer = null;
  function startAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    if (!autoSaveEnabled) return;
    autoSaveTimer = setInterval(() => {
      if (currentNoteIndex !== -1) {
        const editor = document.getElementById('notepadText');
        const title = document.getElementById('noteTitle').value.trim() || 'Untitled';
        const category = document.getElementById('categorySelect').value || 'Misc';
        savedNotes[currentNoteIndex].content = editor.value;
        savedNotes[currentNoteIndex].title = title;
        savedNotes[currentNoteIndex].category = category;
        savedNotes[currentNoteIndex].updated = new Date().toISOString();
        saveNotesList();
        const status = document.getElementById('autoSaveStatus');
        if (status) status.textContent = '✓ Auto-saved';
      }
    }, 5000);
  }

  const html = `
    <div class="notepad-modern">
      <div class="notepad-toolbar">
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <select id="categorySelect" class="modern-select" style="padding:6px 12px; border-radius:20px;">
            <option value="Misc">📂 Misc</option>
            ${noteCategories.map(c => `<option value="${c}">📂 ${c}</option>`).join('')}
            <option value="new">+ New Category</option>
          </select>
          <input type="text" id="noteTitle" placeholder="Note title" style="flex:1; min-width:120px;">
        </div>
        <div style="display:flex; gap:4px; flex-wrap:wrap;">
          <button class="notepad-btn" data-ai="summarize">📝 Summarize</button>
          <button class="notepad-btn" data-ai="rewrite">✍️ Rewrite</button>
          <button class="notepad-btn" data-ai="translate">🌐 Translate</button>
          <button class="notepad-btn" data-ai="grammar">✅ Grammar</button>
          <button class="notepad-btn" data-ai="expand">📈 Expand</button>
          <button class="notepad-btn" id="notepadSettingsBtn">⚙️</button>
        </div>
      </div>
      <textarea id="notepadText" class="notepad-area" placeholder="Write your notes here..." style="font-size:${fontSize}px;"></textarea>
      <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin:4px 0;">
        <span id="autoSaveStatus">Auto-save ${autoSaveEnabled ? 'ON' : 'OFF'}</span>
        <span id="wordCount">0 words</span>
      </div>
      <div class="flex-between" style="margin-top:12px; gap:12px; flex-wrap:wrap;">
        <button id="saveNewNoteBtn" class="btn-outline" style="width:auto;">💾 Save as New</button>
        <button id="saveCurrentNoteBtn" class="btn-primary" style="width:auto;">📌 Update Current</button>
        <button id="duplicateNoteBtn" class="btn-outline" style="width:auto;">⧉Duplicate</button>
      </div>
      <div style="margin-top:20px; display:flex; align-items:center; gap:12px;">
        <span style="font-weight:600;">📚 My Notes</span>
        <select id="categoryFilter" style="padding:4px 12px; border-radius:16px; background:var(--bg-card-solid); border:1px solid var(--border-light);">
          <option value="All">All Categories</option>
          ${noteCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div id="noteList" class="note-list" style="margin-top:8px;"></div>
    </div>
  `;

  openToolModal('📒 Smart Notepad', html);

  const editor = document.getElementById('notepadText');
  const titleInput = document.getElementById('noteTitle');
  const categorySelect = document.getElementById('categorySelect');
  const categoryFilter = document.getElementById('categoryFilter');
  const saveNewBtn = document.getElementById('saveNewNoteBtn');
  const saveCurrentBtn = document.getElementById('saveCurrentNoteBtn');
  const duplicateBtn = document.getElementById('duplicateNoteBtn');
  const settingsBtn = document.getElementById('notepadSettingsBtn');
  const wordCount = document.getElementById('wordCount');

  categorySelect.addEventListener('change', () => {
    if (categorySelect.value === 'new') {
      const newCat = prompt('Enter new category name:');
      if (newCat && newCat.trim()) {
        noteCategories.push(newCat.trim());
        categorySelect.innerHTML = `
          <option value="Misc">📂 Misc</option>
          ${noteCategories.map(c => `<option value="${c}">📂 ${c}</option>`).join('')}
          <option value="new">+ New Category</option>
        `;
        categorySelect.value = newCat.trim();
        categoryFilter.innerHTML = `
          <option value="All">All Categories</option>
          ${noteCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
        `;
        categoryFilter.value = 'All';
      } else {
        categorySelect.value = 'Misc';
      }
    }
  });

  editor.addEventListener('input', () => {
    const words = editor.value.trim().split(/\s+/).filter(w => w.length > 0).length;
    wordCount.textContent = `${words} words`;
  });

  setupAutoComplete(editor);

  document.querySelectorAll('.notepad-btn[data-ai]').forEach(btn => {
    btn.onclick = () => { aiAction(btn.getAttribute('data-ai')); };
  });

  settingsBtn.onclick = () => {
    const newSize = prompt('Font size (px):', fontSize);
    if (newSize && !isNaN(newSize) && newSize > 0) {
      fontSize = parseInt(newSize);
      editor.style.fontSize = fontSize + 'px';
      localStorage.setItem('notepad_fontSize', fontSize);
    }
    const toggleAutoSave = confirm('Toggle auto-save? (Currently ' + (autoSaveEnabled ? 'ON' : 'OFF') + ')');
    if (toggleAutoSave) {
      autoSaveEnabled = !autoSaveEnabled;
      localStorage.setItem('notepad_autoSave', JSON.stringify(autoSaveEnabled));
      document.getElementById('autoSaveStatus').textContent = `Auto-save ${autoSaveEnabled ? 'ON' : 'OFF'}`;
      if (autoSaveEnabled) startAutoSave(); else clearInterval(autoSaveTimer);
    }
  };

  saveNewBtn.onclick = () => {
    const content = editor.value;
    const title = titleInput.value.trim() || 'Note ' + (savedNotes.length + 1);
    const category = categorySelect.value || 'Misc';
    savedNotes.push({ id: Date.now(), title, content, category, updated: new Date().toISOString() });
    saveNotesList();
    renderNoteList();
    editor.value = '';
    titleInput.value = '';
    categorySelect.value = 'Misc';
    currentNoteIndex = -1;
    addNotification('Notepad', 'New note saved');
  };

  saveCurrentBtn.onclick = saveCurrentNote;

  duplicateBtn.onclick = () => {
    if (currentNoteIndex === -1) { alert('Load a note first.'); return; }
    const note = savedNotes[currentNoteIndex];
    const dup = { id: Date.now(), title: note.title + ' (copy)', content: note.content, category: note.category, updated: new Date().toISOString() };
    savedNotes.push(dup);
    saveNotesList();
    renderNoteList();
    addNotification('Notepad', 'Note duplicated');
  };

  categoryFilter.addEventListener('change', renderNoteList);
  startAutoSave();
  renderNoteList();
}


// ======================== FULL-SCREEN BROWSER (Mobile & Tablet Optimized) ========================
let browserTabs = [];
let browserCurrentTabId = null;
let browserBookmarks = JSON.parse(localStorage.getItem('browser_bookmarks') || '[]');
let browserHistory = JSON.parse(localStorage.getItem('browser_history') || '[]');
let browserTabCounter = 0;
let browserIsOpen = false;
let browserCurrentSearchEngine = 'google';

// Search engines
const browserSearchEngines = {
    google: 'https://www.google.com/search?q=',
    duckduckgo: 'https://duckduckgo.com/?q=',
    wikipedia: 'https://en.wikipedia.org/wiki/',
    youtube: 'https://www.youtube.com/results?search_query=',
    bing: 'https://www.bing.com/search?q='
};

// Blocked domains (iframe-blocking sites)
const BLOCKED_DOMAINS = [
     'google.com', 'youtube.com', 'facebook.com', 'twitter.com',
    'instagram.com', 'tiktok.com', 'whatsapp.com', 'linkedin.com',
    'netflix.com', 'spotify.com'
];

// Home page HTML
const BROWSER_HOME_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Home</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0F0F0F;color:#fff;font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:20px;text-align:center}
h1{font-size:2.5rem;font-weight:700;background:linear-gradient(135deg,#00C3FF,#008751);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:20px}
.search-box{width:90%;max-width:500px;display:flex;gap:10px}
.search-box input{flex:1;padding:14px 20px;border-radius:30px;border:none;background:#1C1C1C;color:#fff;font-size:16px;outline:2px solid transparent;transition:0.2s}
.search-box input:focus{outline-color:#00C3FF}
.search-box button{padding:14px 24px;border-radius:30px;border:none;background:#00C3FF;color:#0F0F0F;font-weight:600;cursor:pointer;font-size:16px}
.quick-links{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px;justify-content:center}
.quick-links a{color:#00C3FF;text-decoration:none;font-size:16px;padding:8px 16px;border-radius:20px;background:#1C1C1C;transition:0.2s;cursor:pointer}
.quick-links a:active{background:#00C3FF;color:#0F0F0F}
</style>
</head>
<body>
<h1>StudentNija Browser</h1>
<div class="search-box">
<input id="homeSearch" placeholder="Search or enter URL" onkeydown="if(event.key==='Enter'){window.parent.browserSearchFromHome(this.value)}">
<button onclick="window.parent.browserSearchFromHome(document.getElementById('homeSearch').value)">Go</button>
</div>
<div class="quick-links">
<a onclick="window.parent.browserNavigateTo('https://www.google.com')">Google</a>
<a onclick="window.parent.browserNavigateTo('https://www.youtube.com')">YouTube</a>
<a onclick="window.parent.browserNavigateTo('https://github.com')">GitHub</a>
<a onclick="window.parent.browserNavigateTo('https://wikipedia.org')">Wikipedia</a>
<a onclick="window.parent.browserNavigateTo('https://openlibrary.org')">OpenLibrary</a>
</div>
</body>
</html>`;

function openBrowser(initialUrl) {
    // If already open, just navigate to the URL
    if (browserIsOpen) {
        if (initialUrl) {
            browserNavigateTo(initialUrl);
        }
        return;
    }
    browserIsOpen = true;

    // Remove any existing overlay
    const existing = document.getElementById('fullscreenBrowser');
    if (existing) existing.remove();

    // Create the overlay
    const overlay = document.createElement('div');
    overlay.id = 'fullscreenBrowser';
    overlay.className = 'fullscreen-browser-overlay';
    overlay.innerHTML = `
        <div class="browser-container">
            <!-- Toolbar -->
            <div class="browser-toolbar">
                <div class="browser-nav">
                    <button id="browserBack" title="Back">◀</button>
                    <button id="browserForward" title="Forward">▶</button>
                    <button id="browserRefresh" title="Refresh">⟳</button>
                    <button id="browserHome" title="Home">⌂</button>
                </div>
                <div class="browser-url">
                    <input type="text" id="browserUrl" placeholder="Search or enter URL">
                    <button id="browserGo">➜</button>
                </div>
                <div class="browser-actions">
                    <button id="browserBookmark" title="Bookmark">☆</button>
                    <button id="browserTabs" title="Tabs">⊞</button>
                    <button id="browserSettings" title="Settings">⚙</button>
                    <button id="browserClose" title="Close">✕</button>
                </div>
            </div>
            <!-- Tab Bar -->
            <div class="browser-tab-bar" id="browserTabBar"></div>
            <!-- Web Area -->
            <div class="browser-frame" id="browserFrame">
                <div id="browserLoading" class="browser-loading" style="display:none;">
                    <div class="spinner"></div>
                    <span>Loading...</span>
                </div>
                <div id="browserError" style="display:none; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:20px; text-align:center; background:var(--bg-primary);">
                    <div style="font-size:48px; margin-bottom:16px;">🌐</div>
                    <h3 style="margin-bottom:8px; color:var(--text-primary);">Cannot display this page</h3>
                    <p class="text-muted" style="max-width:400px; margin-bottom:16px;">This site prevents being loaded inside an app. Tap the button below to open it in your browser.</p>
                    <button id="browserOpenExternal" class="btn-primary" style="width:auto; padding:12px 32px;">Open in Browser</button>
                    <button id="browserGoBackBtn" class="btn-outline" style="width:auto; padding:12px 32px; margin-top:8px;">Go Back</button>
                </div>
                <div id="browserWebContainer" style="width:100%; height:100%; position:relative;"></div>
            </div>
            <!-- Status Bar -->
            <div class="browser-status" id="browserStatus">Ready</div>
        </div>
    `;

    document.body.appendChild(overlay);

    // ---- DOM refs ----
    const webContainer = document.getElementById('browserWebContainer');
    const urlInput = document.getElementById('browserUrl');
    const goBtn = document.getElementById('browserGo');
    const backBtn = document.getElementById('browserBack');
    const forwardBtn = document.getElementById('browserForward');
    const refreshBtn = document.getElementById('browserRefresh');
    const homeBtn = document.getElementById('browserHome');
    const bookmarkBtn = document.getElementById('browserBookmark');
    const tabsBtn = document.getElementById('browserTabs');
    const settingsBtn = document.getElementById('browserSettings');
    const closeBtn = document.getElementById('browserClose');
    const statusDiv = document.getElementById('browserStatus');
    const loadingDiv = document.getElementById('browserLoading');
    const errorDiv = document.getElementById('browserError');
    const openExternalBtn = document.getElementById('browserOpenExternal');
    const goBackBtn = document.getElementById('browserGoBackBtn');
    const tabBar = document.getElementById('browserTabBar');

    // ---- State ----
    let currentTabId = null;
    let isError = false;

    // ---- Helper functions ----
    function getTab(id) {
        return browserTabs.find(t => t.id === id);
    }

    function getCurrentTab() {
        return getTab(currentTabId);
    }

    function getCurrentWeb() {
        const tab = getCurrentTab();
        return tab ? tab.web : null;
    }

    function updateUrlBar(url) {
        urlInput.value = url || '';
        if (url) {
            const isBookmarked = browserBookmarks.some(b => b.url === url);
            bookmarkBtn.textContent = isBookmarked ? '★' : '☆';
        } else {
            bookmarkBtn.textContent = '☆';
        }
    }

    function updateStatus(text) {
        statusDiv.textContent = text;
    }

    function updateNavButtons() {
        const tab = getCurrentTab();
        if (tab && tab.web) {
            // We can't reliably know iframe history, so we enable/disable based on history stack
            const canGoBack = tab.historyIndex > 0;
            const canGoForward = tab.historyIndex < tab.history.length - 1;
            backBtn.disabled = !canGoBack;
            forwardBtn.disabled = !canGoForward;
        } else {
            backBtn.disabled = true;
            forwardBtn.disabled = true;
        }
    }

    function showLoading() {
        loadingDiv.style.display = 'flex';
        errorDiv.style.display = 'none';
    }

    function hideLoading() {
        loadingDiv.style.display = 'none';
    }

    function showError(url) {
        isError = true;
        errorDiv.style.display = 'flex';
        loadingDiv.style.display = 'none';
        updateStatus(`Cannot load: ${url}`);
        updateUrlBar(url);
    }

    function hideError() {
        isError = false;
        errorDiv.style.display = 'none';
    }

    function isUrlBlocked(url) {
        try {
            const urlObj = new URL(url);
            const hostname = urlObj.hostname.replace('www.', '');
            return BLOCKED_DOMAINS.some(d => hostname.includes(d));
        } catch {
            return false;
        }
    }

    // ---- Navigation ----
    function browserNavigateTo(url) {
        if (!url) return;
        if (currentTabId === null) return;
        const tab = getCurrentTab();
        if (!tab) return;

        hideError();
        // Check if it's a search
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            const engine = browserSearchEngines[browserCurrentSearchEngine] || browserSearchEngines.google;
            url = engine + encodeURIComponent(url);
        }

        // Check if blocked
        if (isUrlBlocked(url)) {
            tab.url = url;
            tab.title = url;
            updateUrlBar(url);
            updateStatus('Blocked by site policy');
            showError(url);
            renderTabs();
            updateNavButtons();
            return;
        }

        // Save to history
        if (tab.historyIndex < tab.history.length - 1) {
            tab.history = tab.history.slice(0, tab.historyIndex + 1);
        }
        tab.history.push(url);
        tab.historyIndex = tab.history.length - 1;

        tab.url = url;
        tab.title = url;
        tab.web.src = url;
        showLoading();
        updateUrlBar(url);
        updateStatus('Loading...');
        renderTabs();
        updateNavButtons();

        // Save to global history
        browserHistory.unshift({ url, title: url, date: new Date().toISOString() });
        if (browserHistory.length > 100) browserHistory.pop();
        localStorage.setItem('browser_history', JSON.stringify(browserHistory));
    }

    // Expose for home page
    window.browserNavigateTo = browserNavigateTo;
    window.browserSearchFromHome = function(query) {
        if (query) browserNavigateTo(query);
    };

    function goBack() {
        const tab = getCurrentTab();
        if (!tab) return;
        if (tab.historyIndex > 0) {
            tab.historyIndex--;
            const url = tab.history[tab.historyIndex];
            tab.url = url;
            tab.web.src = url;
            updateUrlBar(url);
            updateStatus('Loading...');
            showLoading();
            renderTabs();
            updateNavButtons();
        }
    }

    function goForward() {
        const tab = getCurrentTab();
        if (!tab) return;
        if (tab.historyIndex < tab.history.length - 1) {
            tab.historyIndex++;
            const url = tab.history[tab.historyIndex];
            tab.url = url;
            tab.web.src = url;
            updateUrlBar(url);
            updateStatus('Loading...');
            showLoading();
            renderTabs();
            updateNavButtons();
        }
    }

    function refreshTab() {
        const tab = getCurrentTab();
        if (!tab) return;
        if (tab.url === 'home' || !tab.url) {
            loadHome();
            return;
        }
        tab.web.src = tab.url;
        showLoading();
        updateStatus('Refreshing...');
    }

    function loadHome() {
        const tab = getCurrentTab();
        if (!tab) return;
        tab.url = 'home';
        tab.title = 'Home';
        tab.web.src = 'about:blank';
        tab.web.contentDocument.write(BROWSER_HOME_HTML);
        tab.web.contentDocument.close();
        updateUrlBar('');
        updateStatus('Home');
        hideLoading();
        hideError();
        renderTabs();
        updateNavButtons();
    }

    function goHome() {
        loadHome();
    }

    // ---- Tabs ----
    function createTab(url) {
        const id = ++browserTabCounter;
        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'width:100%; height:100%; border:none; display:none;';
        iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';
        iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');

        const tab = {
            id: id,
            web: iframe,
            url: url || 'home',
            title: 'New Tab',
            history: [],
            historyIndex: -1
        };

        webContainer.appendChild(iframe);

        // Iframe events
        iframe.addEventListener('load', function() {
            hideLoading();
            try {
                if (iframe.contentDocument) {
                    const title = iframe.contentDocument.title || iframe.src;
                    tab.title = title;
                    try {
                        const currentSrc = iframe.contentWindow.location.href;
                        if (currentSrc && currentSrc !== tab.url && currentSrc !== 'about:blank') {
                            tab.url = currentSrc;
                            updateUrlBar(currentSrc);
                            // Add to history if not already there
                            if (tab.history[tab.historyIndex] !== currentSrc) {
                                tab.history.push(currentSrc);
                                tab.historyIndex = tab.history.length - 1;
                            }
                        }
                    } catch (e) {}
                    updateStatus(tab.title);
                    const isBookmarked = browserBookmarks.some(b => b.url === tab.url);
                    bookmarkBtn.textContent = isBookmarked ? '★' : '☆';
                }
            } catch (e) {
                updateStatus('Loaded');
            }
            renderTabs();
            updateNavButtons();
            // Check if error page loaded
            try {
                if (iframe.contentDocument && iframe.contentDocument.title && 
                    iframe.contentDocument.title.includes('error')) {
                    showError(tab.url);
                }
            } catch(e) {}
        });

        iframe.addEventListener('error', function() {
            showError(tab.url);
        });

        browserTabs.push(tab);
        switchTab(id);

        // Load the URL
        if (url === 'home' || !url) {
            tab.url = 'home';
            tab.title = 'Home';
            iframe.src = 'about:blank';
            setTimeout(() => {
                try {
                    iframe.contentDocument.write(BROWSER_HOME_HTML);
                    iframe.contentDocument.close();
                    updateUrlBar('');
                    updateStatus('Home');
                    hideLoading();
                    renderTabs();
                } catch(e) {}
            }, 50);
        } else {
            tab.url = url;
            tab.title = url;
            iframe.src = url;
            showLoading();
            updateUrlBar(url);
            updateStatus('Loading...');
            // Add to history
            tab.history.push(url);
            tab.historyIndex = 0;
        }

        renderTabs();
        updateNavButtons();
        return id;
    }

    function switchTab(id) {
        if (currentTabId !== null) {
            const old = getTab(currentTabId);
            if (old && old.web) old.web.style.display = 'none';
        }
        currentTabId = id;
        const tab = getTab(id);
        if (tab) {
            tab.web.style.display = 'block';
            updateUrlBar(tab.url);
            if (tab.url === 'home') {
                updateStatus('Home');
                hideLoading();
                hideError();
            } else {
                hideLoading();
            }
            renderTabs();
            updateNavButtons();
        }
    }

    function closeTab(id) {
        if (browserTabs.length <= 1) {
            // Show message via notification
            addNotification('Browser', 'Cannot close the last tab');
            return;
        }
        const index = browserTabs.findIndex(t => t.id === id);
        if (index === -1) return;
        const tab = browserTabs[index];
        tab.web.remove();
        browserTabs.splice(index, 1);
        if (currentTabId === id) {
            const newIndex = Math.min(index, browserTabs.length - 1);
            switchTab(browserTabs[newIndex].id);
        } else {
            renderTabs();
        }
    }

    function renderTabs() {
        tabBar.innerHTML = '';
        browserTabs.forEach(tab => {
            const div = document.createElement('div');
            div.className = 'browser-tab' + (tab.id === currentTabId ? ' active' : '');
            const title = tab.title || 'New Tab';
            div.textContent = title.length > 15 ? title.substring(0, 14) + '…' : title;
            div.title = tab.url || '';
            div.dataset.id = tab.id;
            div.addEventListener('click', function(e) {
                if (e.target === this || e.target === div) {
                    switchTab(parseInt(this.dataset.id));
                }
            });
            const close = document.createElement('span');
            close.textContent = '✕';
            close.className = 'browser-tab-close';
            close.addEventListener('click', function(e) {
                e.stopPropagation();
                closeTab(parseInt(this.parentNode.dataset.id));
            });
            div.appendChild(close);
            tabBar.appendChild(div);
        });
        // Scroll to active tab
        const activeTab = tabBar.querySelector('.browser-tab.active');
        if (activeTab) {
            activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
        }
    }

    // ---- Bookmark ----
    function toggleBookmark() {
        const tab = getCurrentTab();
        if (!tab || !tab.url || tab.url === 'home') return;
        const url = tab.url;
        const title = tab.title || url;
        const existing = browserBookmarks.findIndex(b => b.url === url);
        if (existing !== -1) {
            browserBookmarks.splice(existing, 1);
            addNotification('Browser', 'Bookmark removed');
        } else {
            browserBookmarks.push({ url, title, date: new Date().toISOString() });
            addNotification('Browser', 'Bookmarked');
        }
        localStorage.setItem('browser_bookmarks', JSON.stringify(browserBookmarks));
        const isBookmarked = browserBookmarks.some(b => b.url === url);
        bookmarkBtn.textContent = isBookmarked ? '★' : '☆';
    }

    function showBookmarks() {
        if (browserBookmarks.length === 0) {
            addNotification('Browser', 'No bookmarks');
            return;
        }
        const list = browserBookmarks.map((b, i) => (i + 1) + '. ' + (b.title || b.url));
        // Use a custom modal since we can't use app.Choose
        const html = `
            <div style="padding:16px; max-height:400px; overflow-y:auto;">
                <h3>📚 Bookmarks</h3>
                ${browserBookmarks.map((b, i) => `
                    <div class="bookmark-item" style="padding:10px; border-bottom:1px solid var(--border-light); cursor:pointer;" data-url="${b.url}">
                        <div style="font-weight:500;">${escapeHtml(b.title || b.url)}</div>
                        <div class="text-muted" style="font-size:12px;">${escapeHtml(b.url)}</div>
                    </div>
                `).join('')}
                <button class="btn-primary" style="width:auto; margin-top:12px;" onclick="closeToolModal()">Close</button>
            </div>
        `;
        openToolModal('Bookmarks', html);
        document.querySelectorAll('.bookmark-item').forEach(el => {
            el.addEventListener('click', function() {
                const url = this.dataset.url;
                closeToolModal();
                browserNavigateTo(url);
            });
        });
    }

    function showHistory() {
        if (browserHistory.length === 0) {
            addNotification('Browser', 'No history');
            return;
        }
        const recent = browserHistory.slice(0, 20);
        const html = `
            <div style="padding:16px; max-height:400px; overflow-y:auto;">
                <h3>📜 History (last 20)</h3>
                ${recent.map((h, i) => `
                    <div class="history-item" style="padding:10px; border-bottom:1px solid var(--border-light); cursor:pointer;" data-url="${h.url}">
                        <div style="font-weight:500;">${escapeHtml(h.title || h.url)}</div>
                        <div class="text-muted" style="font-size:12px;">${escapeHtml(h.url)}</div>
                    </div>
                `).join('')}
                <button class="btn-primary" style="width:auto; margin-top:12px;" onclick="closeToolModal()">Close</button>
            </div>
        `;
        openToolModal('History', html);
        document.querySelectorAll('.history-item').forEach(el => {
            el.addEventListener('click', function() {
                const url = this.dataset.url;
                closeToolModal();
                browserNavigateTo(url);
            });
        });
    }

    function showTabs() {
        if (browserTabs.length === 0) return;
        const html = `
            <div style="padding:16px; max-height:400px; overflow-y:auto;">
                <h3>⊞ Open Tabs (${browserTabs.length})</h3>
                ${browserTabs.map((t, i) => `
                    <div class="tab-item" style="padding:10px; border-bottom:1px solid var(--border-light); cursor:pointer;" data-id="${t.id}">
                        <div style="font-weight:500;">${escapeHtml(t.title || 'New Tab')}</div>
                        <div class="text-muted" style="font-size:12px;">${escapeHtml(t.url || 'Home')}</div>
                    </div>
                `).join('')}
                <button class="btn-primary" style="width:auto; margin-top:12px;" onclick="closeToolModal()">Close</button>
            </div>
        `;
        openToolModal('Tabs', html);
        document.querySelectorAll('.tab-item').forEach(el => {
            el.addEventListener('click', function() {
                const id = parseInt(this.dataset.id);
                closeToolModal();
                switchTab(id);
            });
        });
    }

    function showSettings() {
        const html = `
            <div style="padding:16px;">
                <h3>⚙ Settings</h3>
                <div style="margin:12px 0;">
                    <label style="display:block; margin-bottom:8px; font-weight:500;">Search Engine</label>
                    <select id="browserEngineSelect" style="width:100%; padding:10px; border-radius:12px; border:1px solid var(--border-light); background:var(--bg-primary); color:var(--text-primary);">
                        <option value="google" ${browserCurrentSearchEngine === 'google' ? 'selected' : ''}>Google</option>
                        <option value="duckduckgo" ${browserCurrentSearchEngine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
                        <option value="wikipedia" ${browserCurrentSearchEngine === 'wikipedia' ? 'selected' : ''}>Wikipedia</option>
                        <option value="youtube" ${browserCurrentSearchEngine === 'youtube' ? 'selected' : ''}>YouTube</option>
                        <option value="bing" ${browserCurrentSearchEngine === 'bing' ? 'selected' : ''}>Bing</option>
                    </select>
                </div>
                <div style="display:flex; gap:12px; flex-wrap:wrap;">
                    <button class="btn-primary" style="width:auto; padding:10px 24px;" onclick="document.getElementById('browserEngineSelect') && (browserCurrentSearchEngine = document.getElementById('browserEngineSelect').value); localStorage.setItem('browser_search_engine', browserCurrentSearchEngine); closeToolModal(); addNotification('Browser', 'Search engine updated');">Save</button>
                    <button class="btn-outline" style="width:auto; padding:10px 24px;" onclick="closeToolModal()">Cancel</button>
                </div>
            </div>
        `;
        openToolModal('Settings', html);
        // Load saved engine
        const saved = localStorage.getItem('browser_search_engine');
        if (saved) browserCurrentSearchEngine = saved;
    }

    // ---- Event listeners ----
    goBtn.addEventListener('click', function() {
        const val = urlInput.value.trim();
        if (val) browserNavigateTo(val);
    });

    urlInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            const val = urlInput.value.trim();
            if (val) browserNavigateTo(val);
        }
    });

    backBtn.addEventListener('click', goBack);
    forwardBtn.addEventListener('click', goForward);
    refreshBtn.addEventListener('click', refreshTab);
    homeBtn.addEventListener('click', goHome);
    bookmarkBtn.addEventListener('click', toggleBookmark);
    tabsBtn.addEventListener('click', showTabs);
    settingsBtn.addEventListener('click', showSettings);
    closeBtn.addEventListener('click', function() {
        overlay.remove();
        browserIsOpen = false;
        browserTabs = [];
        browserCurrentTabId = null;
    });

    openExternalBtn.addEventListener('click', function() {
        const tab = getCurrentTab();
        if (tab && tab.url && tab.url !== 'home') {
            window.open(tab.url, '_blank');
        }
    });

    goBackBtn.addEventListener('click', goBack);

    // ---- Iframe load timeout ----
    let loadTimeout;
    function setupTimeout() {
        clearTimeout(loadTimeout);
        loadTimeout = setTimeout(function() {
            if (loadingDiv.style.display !== 'none') {
                const tab = getCurrentTab();
                if (tab && tab.url && tab.url !== 'home') {
                    showError(tab.url);
                }
            }
        }, 15000);
    }

    // Override showLoading to set timeout
    const originalShowLoading = showLoading;
    showLoading = function() {
        originalShowLoading();
        setupTimeout();
    };

    // ---- Initial tab ----
    if (initialUrl) {
        createTab(initialUrl);
    } else {
        createTab('home');
    }

    // ---- Load saved search engine ----
    const savedEngine = localStorage.getItem('browser_search_engine');
    if (savedEngine) browserCurrentSearchEngine = savedEngine;
}



// ======================== GUESS NUMBER ========================
let secretNumber = Math.floor(Math.random() * 100) + 1;
let guessAttempts = 0;
function openGuessNumber() {
  secretNumber = Math.floor(Math.random() * 100) + 1;
  guessAttempts = 0;
  openToolModal('Guess the Number', `
    <div class="guess-game">
      <p>I'm thinking of a number between 1 and 100.</p>
      <input type="number" id="guessInput" class="guess-input" min="1" max="100">
      <button id="guessBtn" class="btn-primary">Guess</button>
      <div id="guessMessage" class="guess-message"></div>
    </div>
  `);
  const guessBtn = document.getElementById('guessBtn');
  if (guessBtn) {
    guessBtn.onclick = () => {
      const guess = parseInt(document.getElementById('guessInput').value);
      const msgDiv = document.getElementById('guessMessage');
      if (isNaN(guess)) { if (msgDiv) msgDiv.innerHTML = 'Enter a number!'; return; }
      guessAttempts++;
      if (guess === secretNumber) {
        if (msgDiv) msgDiv.innerHTML = `🎉 Correct! It took you ${guessAttempts} attempts. New number generated!`;
        secretNumber = Math.floor(Math.random() * 100) + 1;
        guessAttempts = 0;
      } else if (guess < secretNumber) { if (msgDiv) msgDiv.innerHTML = 'Too low! Try again.'; }
      else { if (msgDiv) msgDiv.innerHTML = 'Too high! Try again.'; }
      document.getElementById('guessInput').value = '';
    };
  }
}

// ======================== AI HELPER ========================
let conversationHistory = [];
let currentAIModel = "llama-3.1-8b-instant";
let aiTemperature = 0.7;
let aiMaxTokens = 800;
let isAiProcessing = false;
let aiMemoryEnabled = true;
let aiNeonEffect = true;
let aiAccentColor = "#008751";
let aiPersonality = "Friendly Tutor";
let customHFUrl = "";

const GROQ_MODELS = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];

function loadConversationHistory() {
  if (!currentUser) { conversationHistory = []; return; }
  const saved = localStorage.getItem(`studentnija_ai_history_${currentUser.id}`);
  if (saved) {
    try { conversationHistory = JSON.parse(saved); } catch(e) { conversationHistory = []; }
  } else { conversationHistory = []; }
}

function saveConversationHistory() {
  if (currentUser) {
    localStorage.setItem(`studentnija_ai_history_${currentUser.id}`, JSON.stringify(conversationHistory));
  }
}

function loadAISettings() {
  const saved = localStorage.getItem('studentnija_ai_settings');
  if (saved) {
    try {
      const s = JSON.parse(saved);
      aiMemoryEnabled = s.memory !== undefined ? s.memory : true;
      aiNeonEffect = s.neon !== undefined ? s.neon : true;
      aiAccentColor = s.accent || "#008751";
      aiPersonality = s.personality || "Friendly Tutor";
      customHFUrl = s.hfUrl || "";
      currentAIModel = s.model || "llama-3.1-8b-instant";
      aiTemperature = s.temp !== undefined ? s.temp : 0.7;
    } catch(e) {}
  }
  applyAISettings();
}

function saveAISettings() {
  localStorage.setItem('studentnija_ai_settings', JSON.stringify({
    memory: aiMemoryEnabled,
    neon: aiNeonEffect,
    accent: aiAccentColor,
    personality: aiPersonality,
    hfUrl: customHFUrl,
    model: currentAIModel,
    temp: aiTemperature
  }));
}

function applyAISettings() {
  document.documentElement.style.setProperty('--ai-accent', aiAccentColor);
  if (aiNeonEffect) {
    document.body.classList.add('ai-neon');
  } else {
    document.body.classList.remove('ai-neon');
  }
}

async function callAIHelper(userPrompt, purpose = "chat", context = "") {
  const systemPrompts = {
    chat: `You are StudentNija, an advanced AI study assistant for Nigerian students. Personality: ${aiPersonality}. You are helpful, thorough, and encouraging. Use markdown for formatting. If you don't know, say so honestly. Current date: ${new Date().toLocaleDateString()}.

${context ? `\n---\nYou have access to the user's current app data (provided below). Use this information to answer questions about their academics, schedule, and tasks.\n\n${context}` : ''}`,
    math: `You are a world-class math tutor. Solve step-by-step. Provide final answer clearly. Show reasoning.`,
    dictionary: `You are a helpful dictionary assistant. Provide clear, detailed explanations.`,
    quiz: `You are a quiz generator. Return only valid JSON.`,
    essay: `You are an expert essay writer and editor. Help the user with their writing by providing outlines, drafts, improvements, or suggestions.`,
    tutor: `You are a personal AI tutor. Based on the user's app data, provide a personalized study plan, recommend focus areas, and give actionable advice.`
  };

  const systemPrompt = systemPrompts[purpose] || systemPrompts.chat;
  let messages = [];

  if (purpose === "chat") {
    const sanitizedHistory = conversationHistory.map(msg => ({
      role: msg.role,
      content: msg.content || ''
    }));
    messages = [
      { role: "system", content: systemPrompt },
      ...sanitizedHistory
    ];
  } else {
    messages = [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ];
  }

  // Determine which endpoint to use
  let endpoint = '';
  if (currentAIModel.startsWith("google/")) {
    endpoint = 'gemini';
  } else if (GROQ_MODELS.includes(currentAIModel)) {
    endpoint = 'groq';
  } else if (currentAIModel === 'gpt-4o-mini') {
    endpoint = 'github';
  } else {
    return '⚠️ Unknown model.';
  }

  let requestBody;

  if (endpoint === 'gemini') {
    // Gemini format: { contents: [...] }
    const contents = messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }]
    }));
    const systemMsg = { role: 'user', parts: [{ text: systemPrompt }] };
    contents.unshift(systemMsg);
    requestBody = { contents };
  } else {
    // Groq and GitHub need: { model: "...", messages: [...] }
    let modelName;
    if (endpoint === 'groq') {
      modelName = currentAIModel; // e.g., "llama-3.1-8b-instant"
    } else { // github
      modelName = "gpt-4o-mini";
    }
    requestBody = {
      model: modelName,
      messages: messages
    };
  }

  try {
    const response = await fetch(`${PROXY_URL}/${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Proxy error: ${response.status} - ${errorText}`);
    }
    const data = await response.json();
    if (endpoint === 'gemini') {
      return data.candidates[0].content.parts[0].text;
    } else {
      return data.choices[0].message.content;
    }
  } catch (err) {
    return 'Oops! The AI service is currently unavailable. Please try again later.';
  }
}

async function callChatAI(userMessage) {
  const context = buildUserContext();
  return await callAIHelper(userMessage, "chat", context);
}

async function callMathAI(mathQuery) {
  return await callAIHelper(mathQuery, "math");
}

// ======================== WEB SEARCH ========================
async function searchWeb(query) {
  try {
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`)}`;
    const response = await fetch(proxyUrl);
    if (!response.ok) throw new Error("Proxy failed");
    const data = await response.json();
    const html = data.contents;
    const snippetMatch = html.match(/<a class="result__a" href="[^"]*">([^<]+)<\/a>.*?<a class="result__snippet">([^<]+)<\/a>/s);
    if (snippetMatch) {
      return `🔍 Web results for "${query}":\n- ${snippetMatch[1]}: ${snippetMatch[2]}\n(More results available via browser)`;
    } else {
      return `No clear web results. Try using the Browser tool.`;
    }
  } catch(e) {
    return `⚠️ Web search unavailable. Please use the Browser tool for online searches.`;
  }
}

// ======================== RENDER AI PAGE ========================

function renderAIPage() {
    // Load the standalone AI page in an iframe
    const aiContent = document.getElementById('aiContent');
    if (aiContent) {
        aiContent.innerHTML = `
            <iframe src="StudentNija_Ai.html" 
                    style="width:100%; height:100%; border:none; display:block;"
                    allow="microphone; camera; autoplay">
            </iframe>
        `;
    }}

// ---- Close AI page and go back to Home ----
window.closeAIPage = function() {
    currentPage = 'home';
    renderMainApp();
};


// ======== Render group chat==========================
function renderStudyGroupsPage() {
    const content = document.getElementById('studyGroupsContent');
    if (content) {
        content.innerHTML = `
            <iframe src="Public_Chat.html" 
                    style="width:100%; height:100%; border:none; display:block;"
                    allow="microphone; camera; autoplay">
            </iframe>
        `;
    }
}

// ---- Close Study Groups page and go back to Home ----
window.closeStudyGroups = function() {
    // Remove the floating back button if it exists
    const backBtn = document.getElementById('studyGroupsBackBtn');
    if (backBtn) backBtn.remove();
    currentPage = 'home';
    renderMainApp();
};

// ======================== HOME PAGE ========================
function renderHome() {
  const cgpa = computeOverallCGPA();
  const upcomingExams = exams.slice(0,3);
  const tasksToday = plannerTasks.filter(t=>!t.completed).slice(0,3);
  const earned = achievements.filter(a=>a.achieved).length;
  const tools = [
    { name: "Calculator", icon: "🧮", action: "openCalculator()" },
    { name: "Math Solver", icon: "📐", action: "openMathSolver()" },
    { name: "Dictionary", icon: "📖", action: "openDictionary()" },
    { name: "Library", icon: "📚", action: "openLibrary()" },
    { name: "Flashcards", icon: "🃏", action: "openFlashcards()" },
    { name: "Grade Predictor", icon: "📊", action: "openGradePredictor()" },
    { name: "AI Tutor", icon: "🧑‍🏫", action: "openAITutor()" },
    { name: "Essay Assistant", icon: "✍️", action: "openEssayAssistant()" },
    { name: "Smart Search", icon: "🔍", action: "openSmartSearch()" },
    { name: "Data Manager", icon: "💾", action: "openDataManager()" },
    { name: "Notepad", icon: "📝", action: "openNotepad()" },
    { name: "Past Questions", icon: "📄", action: "openPastQuestions()" },
    { name: "Browser", icon: "🌐", action: "openBrowser()" },
    { name: "Quiz", icon: "❓", action: "openQuiz()" },
    { name: "Guess Number", icon: "🎲", action: "openGuessNumber()" },
    { name: "Study Groups", icon: "💬", action: "currentPage='studygroups'; renderMainApp();" },
  ];
  const toolsHtml = `<div class="grid-2" style="margin-top: 20px;">${tools.map(tool => `
    <div class="quick-card" onclick="${tool.action}">
      <div style="font-size: 32px;">${tool.icon}</div>
      <span>${tool.name}</span>
    </div>
  `).join('')}</div>`;

  const html = `<div class="glass-card" style="padding:20px; margin-bottom:20px;">
      <div class="flex-between"><div><h3>Hello, ${escapeHtml(currentUser.fullName.split(' ')[0])}</h3><p class="text-muted">${escapeHtml(currentUser.school)} · ${escapeHtml(currentUser.level)}</p></div><div class="badge">CGPA ${cgpa}</div></div>
      <div class="stats-row"><div><div class="stat-value" style="font-size:28px;font-weight:800;">${userStats.studyStreak||0}</div><div>🔥 Streak</div></div><div><div style="font-size:28px;font-weight:800;">${earned}</div><div>🏆 Badges</div></div></div>
    </div>
    <div class="grid-2"><div class="glass-card" style="padding:16px"><div style="font-weight:600;">📚 Upcoming Exams</div>${upcomingExams.map(ex=>`<div class="text-muted" style="margin-top:8px;">${escapeHtml(ex.courseName)} · ${Math.ceil((new Date(ex.examDate)-new Date())/86400000)} days</div>`).join('')||'<div class="text-muted">No exams</div>'}</div><div class="glass-card" style="padding:16px"><div style="font-weight:600;">✅ Today's Tasks</div>${tasksToday.map(t=>`<div class="text-muted" style="margin-top:8px;">${escapeHtml(t.title)}</div>`).join('')||'<div class="text-muted">All done</div>'}</div></div>
    <div class="glass-card" style="margin-top:20px;padding:16px"><div class="flex-between"><span>🏅 Achievements</span><span class="text-muted">${earned}/${achievements.length}</span></div><div class="achievements-grid">${achievements.map(a => `
  <div class="ach-item">
    <span class="ach-icon">${a.icon}</span>
    <span class="ach-status ${a.achieved ? 'unlocked' : 'locked'}">${a.achieved ? '✓' : '🔒'}</span>
  </div>
`).join('')}</div></div>
    <div class="glass-card" style="padding:16px; margin-top:20px;"><div style="font-weight:600; margin-bottom:12px;">🛠️ Productivity Tools</div>${toolsHtml}</div>`;
  document.getElementById('homeContent').innerHTML = html;
}

// ======================== ACADEMICS PAGE ========================
function renderAcademics() {
  let semSelect = `<select id="cgpaSemSelect" style="margin-bottom:16px;">${semesterList.map(s=>`<option value="${s}">${semesterNames[s]}</option>`).join('')}</select>`;
  let coursesHtml = `<div id="semesterCoursesList"></div><button id="addCourseSemBtn" class="btn-primary">+ Add Course</button><div id="semesterStatsBlock"></div><div class="stats-row"><div>Overall CGPA: ${computeOverallCGPA()}</div><div>Class: ${getClassification(computeOverallCGPA())}</div></div><button id="exportResultBtn" class="btn-outline">📄 Export Result</button>`;
  document.getElementById('academicsContent').innerHTML = `<div class="glass-card" style="padding:20px;">${semSelect}${coursesHtml}</div>`;
  function loadSemesterCourses(semId){ let courses=coursesData[semId]||[]; let units=0,points=0; courses.forEach(c=>{units+=c.unit; points+=c.points;}); let gpa=units===0?0:(points/units).toFixed(2); document.getElementById('semesterStatsBlock').innerHTML=`<div class="stats-row"><div>📊 Units: ${units}</div><div>⭐ Points: ${points}</div><div>📈 GPA: ${gpa}</div></div>`; document.getElementById('semesterCoursesList').innerHTML=courses.map(c=>`<div class="course-item flex-between"><div><strong>${escapeHtml(c.code)}</strong><div class="text-muted">${c.unit} units · Grade ${c.grade}</div></div><div><button class="editCourseBtn" data-id="${c.id}" data-sem="${semId}" style="background:transparent;border:none;margin-right:8px;">✏️</button><button class="delCourseBtn" data-id="${c.id}" data-sem="${semId}" style="background:transparent;border:none;">🗑️</button></div></div>`).join('')||'<div class="text-muted" style="padding:20px;text-align:center;">No courses, add one</div>'; attachCourseEvents(semId); }
  function attachCourseEvents(semId){ document.querySelectorAll('.delCourseBtn').forEach(btn=>btn.addEventListener('click',()=>{ let id=parseInt(btn.getAttribute('data-id')); coursesData[semId]=coursesData[semId].filter(c=>c.id!=id); saveAll(); loadSemesterCourses(semId); addNotification("Course","Deleted"); })); document.querySelectorAll('.editCourseBtn').forEach(btn=>btn.addEventListener('click',()=>{ let id=parseInt(btn.getAttribute('data-id')); let course=coursesData[semId].find(c=>c.id===id); let newCode=prompt("Code",course.code), newUnit=prompt("Units",course.unit), newGrade=prompt("Grade A-F",course.grade); if(newCode&&newUnit&&newGrade) { course.code=newCode.toUpperCase(); course.unit=parseFloat(newUnit); course.grade=newGrade.toUpperCase(); course.points=course.unit*gradeMap[course.grade]; saveAll(); loadSemesterCourses(semId); addNotification("Course","Updated"); } })); }
  document.getElementById('cgpaSemSelect').addEventListener('change',(e)=>loadSemesterCourses(e.target.value));
  document.getElementById('addCourseSemBtn').addEventListener('click',()=>{ let sem=document.getElementById('cgpaSemSelect').value; let code=prompt("Course code"); let unit=parseFloat(prompt("Units")); let grade=prompt("Grade A-F").toUpperCase(); if(code && unit && gradeMap[grade]!==undefined){ let newCourse={id:Date.now(),code,unit,grade,points:unit*gradeMap[grade]}; coursesData[sem].push(newCourse); saveAll(); loadSemesterCourses(sem); addNotification("CGPA","Course added"); checkAchievements(); } });
  document.getElementById('exportResultBtn').addEventListener('click',()=>{ let result=`Student: ${currentUser.fullName}\nCGPA:${computeOverallCGPA()}\nClassification:${getClassification(computeOverallCGPA())}\nCourses:\n`; for(let s of semesterList){ coursesData[s].forEach(c=>{ result+=`${c.code} - ${c.grade} (${c.unit} units)\n`; }); } navigator.clipboard.writeText(result); alert("Result copied to clipboard!"); addNotification("Export","Result copied"); });
  loadSemesterCourses(semesterList[0]);
}

// ======================== PLANNER PAGE ========================
function renderPlannerPage() {
  const html = `<div class="planner-grid"><div class="glass-card" style="padding:18px;"><div class="flex-between"><span class="section-title">🔔 Smart Notifications</span><button id="testNotifBtn" class="btn-outline" style="width:auto; padding:8px 16px;">Test Alert</button></div><p class="text-muted">${window.NotifBridge?.isDroidScript ? "✓ Native Android alarms: notifications work even when app is closed." : "ℹ️ Web notifications work while app is open."}</p><div class="flex-between" style="margin-top:12px;"><label><input type="checkbox" id="classNotifTogglePlan" ${settings.classNotifications?'checked':''}> Class Reminders</label><label><input type="checkbox" id="examNotifTogglePlan" ${settings.examNotifications?'checked':''}> Exam Reminders</label></div></div><div class="upcoming-card"><div class="section-title">⏰ Today's Schedule</div><div id="upcomingSummary" class="text-muted">Loading...</div></div><div class="glass-card" style="padding:16px;"><div class="flex-between"><span class="section-title">✅ Study Tasks</span><button id="addTaskBtn" class="btn-outline" style="width:auto; padding:6px 14px;">+ Task</button></div><div id="taskList"></div></div><div class="glass-card" style="padding:16px;"><div class="flex-between"><span class="section-title">📅 Weekly Timetable</span><button id="addClassBtn" class="btn-outline" style="width:auto; padding:6px 14px;">+ Class</button></div><div id="timetableView"></div></div><div class="glass-card" style="padding:16px;"><div class="flex-between"><span class="section-title">📝 Exam Countdown</span><button id="addExamBtn2" class="btn-outline" style="width:auto; padding:6px 14px;">+ Exam</button></div><div id="examListView"></div></div><div class="glass-card" style="padding:16px;"><div class="section-title">📢 Recent Alerts</div><div id="recentNotifList" style="max-height:200px; overflow-y:auto;"></div></div></div>`;
  document.getElementById('plannerContent').innerHTML = html;
  function renderTasks() { const container = document.getElementById('taskList'); if (!container) return; container.innerHTML = plannerTasks.map(t=>`<div class="task-item flex-between"><div><input type="checkbox" ${t.completed?'checked':''} data-id="${t.id}"><span style="${t.completed?'text-decoration:line-through;opacity:0.7':''} margin-left:8px;">${escapeHtml(t.title)}</span><div class="text-muted">${t.date||''} · ${t.priority}</div></div><button class="delTask" data-id="${t.id}" style="background:none;border:none;">🗑️</button></div>`).join('') || '<div class="text-muted">No tasks. Add one!</div>'; attachTaskEvents(); }
  function attachTaskEvents(){ document.querySelectorAll('.delTask').forEach(btn=>btn.addEventListener('click',()=>{ let id=parseInt(btn.getAttribute('data-id')); plannerTasks=plannerTasks.filter(t=>t.id!==id); saveAll(); renderTasks(); addNotification("Planner","Task deleted"); })); document.querySelectorAll('#taskList input[type="checkbox"]').forEach(cb=>cb.addEventListener('change',(e)=>{ let id=parseInt(cb.getAttribute('data-id')); let task=plannerTasks.find(t=>t.id===id); if(task){task.completed=cb.checked; saveAll(); addNotification("Planner",`Task ${task.completed?"completed":"unchecked"}`); } })); }
  function renderTimetable() { const container = document.getElementById('timetableView'); if (!container) return; container.innerHTML = timetableEvents.map(ev=>`<div class="timetable-item flex-between"><div><strong>${ev.day} ${ev.time}</strong> - ${escapeHtml(ev.subject)}${ev.location?` (${escapeHtml(ev.location)})`:''}</div><button class="delTt" data-id="${ev.id}" style="background:none;border:none;">❌</button></div>`).join('') || '<div class="text-muted">No classes scheduled.</div>'; document.querySelectorAll('.delTt').forEach(btn=>btn.addEventListener('click',()=>{ let id=parseInt(btn.getAttribute('data-id')); timetableEvents=timetableEvents.filter(e=>e.id!==id); saveAll(); renderTimetable(); updateUpcomingSummary(); })); }
  function renderExamsList() { const container = document.getElementById('examListView'); if (!container) return; container.innerHTML = exams.map(ex=>`<div class="exam-item flex-between"><div><strong>${escapeHtml(ex.courseName)}</strong><div class="text-muted">${ex.examDate} · ${Math.ceil((new Date(ex.examDate)-new Date())/86400000)} days left</div></div><button class="delExam" data-id="${ex.id}" style="background:none;border:none;">🗑️</button></div>`).join('') || '<div class="text-muted">No exams added.</div>'; document.querySelectorAll('.delExam').forEach(btn=>btn.addEventListener('click',()=>{ let id=parseInt(btn.getAttribute('data-id')); exams=exams.filter(e=>e.id!==id); saveAll(); renderExamsList(); updateUpcomingSummary(); })); }
  function updateUpcomingSummary() { const now=new Date(); const todayDay=now.toLocaleDateString('en-US',{weekday:'long'}); const upcomingClasses=timetableEvents.filter(ev=>ev.day===todayDay).sort((a,b)=>a.time.localeCompare(b.time)); const upcomingExamsToday=exams.filter(ex=>new Date(ex.examDate).toDateString()===now.toDateString()); let html=''; if(upcomingClasses.length) html+=`<div>📖 Classes: ${upcomingClasses.map(c=>`${c.subject} at ${c.time}`).join(', ')}</div>`; if(upcomingExamsToday.length) html+=`<div>⚠️ Exams Today: ${upcomingExamsToday.map(e=>e.courseName).join(', ')}</div>`; if(!html) html='<div>No upcoming events today. Stay ahead!</div>'; const summaryDiv = document.getElementById('upcomingSummary'); if (summaryDiv) summaryDiv.innerHTML=html; }
  function renderRecentNotifications() { const container=document.getElementById('recentNotifList'); if(container) container.innerHTML=notifications.slice(0,6).map(n=>`<div class="text-muted" style="padding:6px 0; border-bottom:0.5px solid var(--border-light);">🔔 ${escapeHtml(n.title)}: ${escapeHtml(n.message)}</div>`).join('')||'<div class="text-muted">No recent alerts</div>'; }
  document.getElementById('addTaskBtn')?.addEventListener('click',()=>{ let title=prompt("Task title"); if(title){ plannerTasks.push({id:Date.now(),title,priority:"Medium",date:new Date().toISOString().slice(0,10),completed:false}); saveAll(); renderTasks(); addNotification("Planner","Task added"); } });
  document.getElementById('addClassBtn')?.addEventListener('click',()=>{ let day=prompt("Day (Monday-Sunday)"); let time=prompt("Time (HH:MM, 24h)"); let sub=prompt("Subject"); let loc=prompt("Location (optional)"); if(day&&time&&sub){ originalAddClass(day,time,sub,loc); renderTimetable(); updateUpcomingSummary(); } });
  document.getElementById('addExamBtn2')?.addEventListener('click',()=>{ let name=prompt("Course name"); let date=prompt("Exam date (YYYY-MM-DD)"); if(name&&date){ originalAddExam(name,date); renderExamsList(); updateUpcomingSummary(); } });
  document.getElementById('testNotifBtn')?.addEventListener('click',()=>{ if (window.NotifBridge) window.NotifBridge.testNotification(); renderRecentNotifications(); });
  document.getElementById('classNotifTogglePlan')?.addEventListener('change',(e)=>{ settings.classNotifications=e.target.checked; saveAll(); });
  document.getElementById('examNotifTogglePlan')?.addEventListener('change',(e)=>{ settings.examNotifications=e.target.checked; saveAll(); });
  renderTasks(); renderTimetable(); renderExamsList(); updateUpcomingSummary(); renderRecentNotifications();
  setInterval(()=>{ if(document.getElementById('planner-page')?.classList.contains('active-page')){ updateUpcomingSummary(); renderRecentNotifications(); } }, 30000);
}

// ======================== PROFILE PAGE (Beautiful Personal Info) ========================
function renderProfilePage() {
    // Ensure studentId exists
    if (currentUser && !currentUser.studentId) {
        currentUser.studentId = '';
        saveAll();
    }

    const html = `
        <!-- ====== PROFILE HEADER ====== -->
        <div class="profile-header glass-card" style="padding:24px; text-align:center; position:relative;">
            <div class="avatar-upload" id="avatarUpload">
                ${currentUser.profilePic ? `<img src="${currentUser.profilePic}">` : `<span>📷</span>`}
            </div>
            <input type="file" id="profilePicInput" accept="image/*" style="display:none">
            <h2 style="margin:4px 0 2px;">${escapeHtml(currentUser.fullName)}</h2>
            <p class="text-muted" style="margin:0;">${escapeHtml(currentUser.email)}</p>
            <div style="margin-top:8px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
                <span class="badge">🎓 ${escapeHtml(currentUser.level || 'Student')}</span>
                <span class="badge" style="background:var(--accent-green); color:white;">CGPA ${computeOverallCGPA().toFixed(2)}</span>
            </div>
            <button id="editProfileToggleBtn" class="btn-outline" style="width:auto; padding:6px 16px; margin-top:12px; font-size:13px; min-height:36px;">
                ✏️ Edit Profile
            </button>
        </div>

        <!-- ====== STATS ROW ====== -->
        <div class="stats-row" style="margin:16px 0;">
            <div>
                <div class="stat-value">${Object.values(coursesData).reduce((acc, arr) => acc + arr.length, 0)}</div>
                <div class="stat-label">📚 Courses</div>
            </div>
            <div>
                <div class="stat-value">${plannerTasks.length}</div>
                <div class="stat-label">✅ Tasks</div>
            </div>
            <div>
                <div class="stat-value">${flashcards ? flashcards.length : 0}</div>
                <div class="stat-label">🃏 Flashcards</div>
            </div>
            <div>
                <div class="stat-value">${userStats.studyStreak || 0}🔥</div>
                <div class="stat-label">Streak</div>
            </div>
        </div>

        <!-- ====== PERSONAL INFORMATION CARD (UPGRADED) ====== -->
        <div class="glass-card" style="padding:20px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
                <span style="font-size:20px;">👤</span>
                <h3 style="margin:0; font-size:18px; font-weight:600;">Personal Information</h3>
            </div>
            <div class="profile-grid">
                <!-- School -->
                <div class="profile-grid-item">
                    <div class="profile-grid-label">🏫 School</div>
                    <div class="profile-grid-value" id="profileSchool">${escapeHtml(currentUser.school || 'Not set')}</div>
                    <button class="edit-field-btn" data-field="school">✏️</button>
                </div>
                <!-- Department -->
                <div class="profile-grid-item">
                    <div class="profile-grid-label">📚 Department</div>
                    <div class="profile-grid-value" id="profileDept">${escapeHtml(currentUser.department || 'Not set')}</div>
                    <button class="edit-field-btn" data-field="department">✏️</button>
                </div>
                <!-- Level -->
                <div class="profile-grid-item">
                    <div class="profile-grid-label">📖 Level</div>
                    <div class="profile-grid-value" id="profileLevel">${escapeHtml(currentUser.level || 'Not set')}</div>
                    <button class="edit-field-btn" data-field="level">✏️</button>
                </div>
                <!-- Student ID -->
                <div class="profile-grid-item">
                    <div class="profile-grid-label">🆔 Student ID</div>
                    <div class="profile-grid-value" id="profileStudentId">${escapeHtml(currentUser.studentId || 'Not set')}</div>
                    <button class="edit-field-btn" data-field="studentId">✏️</button>
                </div>
                <!-- Bio (full width) -->
                <div class="profile-grid-item full-width">
                    <div class="profile-grid-label">📝 Bio</div>
                    <div class="profile-grid-value" id="profileBio">${escapeHtml(currentUser.bio || 'No bio yet')}</div>
                    <button class="edit-field-btn" data-field="bio">✏️</button>
                </div>
            </div>
        </div>

        <!-- ====== PREFERENCES ====== -->
        <div class="glass-card" style="padding:20px; margin-bottom:16px;">
            <h3 style="margin:0 0 12px;">⚙️ Preferences</h3>
            <div class="profile-pref-item">
                <span>🌙 Theme</span>
                <select id="themeSelect" style="width:auto; min-width:120px; margin:0; padding:8px 12px;">
                    <option value="light" ${settings.theme==='light'?'selected':''}>Light</option>
                    <option value="dark" ${settings.theme==='dark'?'selected':''}>Dark</option>
                    <option value="system" ${settings.theme==='system'?'selected':''}>System</option>
                </select>
            </div>
            <div class="profile-pref-item">
                <span>🔔 Notifications</span>
                <label style="display:flex; align-items:center; gap:6px;">
                    <input type="checkbox" id="notifToggle" ${settings.notificationsEnabled?'checked':''}> Enable
                </label>
            </div>
            <div style="margin-top:12px;">
                <label style="display:block; font-weight:500; margin-bottom:6px;">🎨 Accent Color</label>
                <div class="color-palette" id="profileColorPalette">
                    <div class="color-dot" style="background:#008751" data-color="#008751"></div>
                    <div class="color-dot" style="background:#a855f7" data-color="#a855f7"></div>
                    <div class="color-dot" style="background:#00f7ff" data-color="#00f7ff"></div>
                    <div class="color-dot" style="background:#F4B400" data-color="#F4B400"></div>
                    <div class="color-dot" style="background:#ff2d55" data-color="#ff2d55"></div>
                    <div class="color-dot" style="background:#ff6b6b" data-color="#ff6b6b"></div>
                    <div class="color-dot" style="background:#4ecdc4" data-color="#4ecdc4"></div>
                    <div class="color-dot" style="background:#ff9f1c" data-color="#ff9f1c"></div>
                </div>
            </div>
        </div>

        <!-- ====== ACCOUNT ACTIONS ====== -->
        <div class="glass-card" style="padding:20px; margin-bottom:16px;">
            <h3 style="margin:0 0 12px;">🔐 Account</h3>
            <div style="display:flex; flex-direction:column; gap:8px;">
                <button id="changePasswordBtn" class="btn-outline" style="min-height:44px; font-size:15px;">🔑 Change Password</button>
                <button id="logoutBtn" class="btn-outline" style="min-height:44px; font-size:15px; background:#a00; border-color:#a00; color:white;">🚪 Logout</button>
                <button id="deleteAccountBtn" class="btn-outline" style="min-height:44px; font-size:15px; background:#a00; border-color:#a00; color:white;">🗑️ Delete Account</button>
            </div>
        </div>

        <!-- ====== ABOUT SECTION ====== -->
        <div class="glass-card" style="padding:0; overflow:hidden; margin-top:16px;">
            <div class="about-header-gradient" style="padding:20px; text-align:center;">
                <div style="font-size:28px; font-weight:800; color:white; letter-spacing:-0.5px; text-shadow:0 2px 8px rgba(0,0,0,0.15);">
                    🇳🇬 StudentNija
                </div>
                <div style="font-size:14px; color:rgba(255,255,255,0.85); margin-top:4px; font-weight:300; letter-spacing:0.3px;">
                    Study Smarter · Score Higher
                </div>
                <div style="display:flex; justify-content:center; gap:8px; margin-top:10px; flex-wrap:wrap;">
                    <span style="background:rgba(255,255,255,0.2); padding:2px 12px; border-radius:40px; font-size:11px; color:white;">v1.1.0</span>
                    <span style="background:rgba(255,255,255,0.2); padding:2px 12px; border-radius:40px; font-size:11px; color:white;">⌘ Android</span>
                    <span style="background:rgba(255,255,255,0.2); padding:2px 12px; border-radius:40px; font-size:11px; color:white;">✦ AI-Powered</span>
                </div>
            </div>
            <div style="padding:16px;">
                <p style="font-size:14px; line-height:1.6; color:var(--text-primary); margin-bottom:12px;">
                    StudentNija is your AI-powered study companion for Nigerian students. Track CGPA, manage tasks, create flashcards, and get personalized tutoring – all in one app.
                </p>
                <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
                    <a href="#" onclick="openBrowser('https://github.com'); return false;" class="about-link">⌘ GitHub</a>
                    <a href="#" onclick="openBrowser('https://x.com'); return false;" class="about-link">✦ X</a>
                    <a href="#" onclick="openBrowser('https://youtube.com'); return false;" class="about-link">▶ YouTube</a>
                    <a href="#" onclick="openSystemBrowser('https://wa.me/2348148316917'); return false;" class="about-link">✆ WhatsApp</a>
                    <a href="#" onclick="window.open('credit_page.html', '_blank'); return false;" class="about-link">📄 Credits</a>
                </div>
                <div style="text-align:center; font-size:11px; color:var(--text-muted); margin-top:12px; opacity:0.7;">
                    © 2026 StudentNija · Made with ❤ for Nigerian students 🇳🇬
                </div>
            </div>
        </div>
    `;

    document.getElementById('profileContent').innerHTML = html;

    // ---- AVATAR UPLOAD ----
    document.getElementById('avatarUpload')?.addEventListener('click', () => {
        document.getElementById('profilePicInput')?.click();
    });
    document.getElementById('profilePicInput')?.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (ev) => {
                updateUserProfile({ profilePic: ev.target.result });
                renderProfilePage();
            };
            reader.readAsDataURL(file);
        }
    });

    // ---- EDIT PROFILE TOGGLE ----
    let editMode = false;
    document.getElementById('editProfileToggleBtn')?.addEventListener('click', function() {
        editMode = !editMode;
        this.textContent = editMode ? '💾 Save Profile' : '✏️ Edit Profile';
        document.querySelectorAll('.edit-field-btn').forEach(btn => {
            btn.style.display = editMode ? 'inline-flex' : 'none';
        });
        if (!editMode) {
            const school = document.getElementById('profileSchool')?.textContent || '';
            const department = document.getElementById('profileDept')?.textContent || '';
            const level = document.getElementById('profileLevel')?.textContent || '';
            const studentId = document.getElementById('profileStudentId')?.textContent || '';
            const bio = document.getElementById('profileBio')?.textContent || '';
            updateUserProfile({ school, department, level, studentId, bio });
        }
    });
    document.querySelectorAll('.edit-field-btn').forEach(btn => btn.style.display = 'none');

    // ---- EDIT FIELD BUTTONS ----
    document.querySelectorAll('.edit-field-btn').forEach(btn => {
        btn.addEventListener('click', function(e) {
            e.stopPropagation();
            const field = this.dataset.field;
            const span = document.getElementById(`profile${field.charAt(0).toUpperCase() + field.slice(1)}`);
            if (!span) return;
            const current = span.textContent;
            const newVal = prompt(`Edit ${field}:`, current);
            if (newVal !== null && newVal.trim() !== '') {
                span.textContent = newVal.trim();
                const school = document.getElementById('profileSchool')?.textContent || '';
                const department = document.getElementById('profileDept')?.textContent || '';
                const level = document.getElementById('profileLevel')?.textContent || '';
                const studentId = document.getElementById('profileStudentId')?.textContent || '';
                const bio = document.getElementById('profileBio')?.textContent || '';
                updateUserProfile({ school, department, level, studentId, bio });
                addNotification('Profile', `${field} updated`);
            }
        });
    });

    // ---- CHANGE PASSWORD ----
    document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
        const old = prompt('Current password:');
        const newp = prompt('New password:');
        if (old && newp && changePassword(old, newp)) {
            alert('Password changed successfully');
        } else {
            alert('Incorrect current password or empty fields');
        }
    });

    // ---- LOGOUT ----
    document.getElementById('logoutBtn')?.addEventListener('click', () => {
        logout();
    });

    // ---- DELETE ACCOUNT ----
    document.getElementById('deleteAccountBtn')?.addEventListener('click', () => {
        deleteAccount();
    });

    // ---- THEME SELECT ----
    document.getElementById('themeSelect')?.addEventListener('change', (e) => {
        applyTheme(e.target.value);
        renderProfilePage();
    });

    // ---- NOTIFICATIONS TOGGLE ----
    document.getElementById('notifToggle')?.addEventListener('change', (e) => {
        settings.notificationsEnabled = e.target.checked;
        if (e.target.checked && !window.NotifBridge?.isDroidScript && typeof Notification !== 'undefined') {
            Notification.requestPermission();
        }
        saveAll();
    });

    // ---- COLOR PICKER ----
    document.querySelectorAll('#profileColorPalette .color-dot').forEach(dot => {
        dot.addEventListener('click', () => {
            const color = dot.dataset.color;
            applyAccentColor(color);
            renderProfilePage();
        });
        if (dot.dataset.color === settings.accentColor) {
            dot.classList.add('active');
        }
    });
}

// ======================== OPEN IN SYSTEM BROWSER ========================
function openSystemBrowser(url) {
  // Uses DroidScript's native method to open URL in the default system browser
  if (typeof app !== 'undefined' && app.OpenUrl) {
    app.OpenUrl(url);
  } else {
    // Fallback for web environments
    window.open(url, '_system');
  }
}

function openWhatsApp(phone) {
    try {
        // Try to open via system browser first
        if (typeof app !== 'undefined' && app.OpenUrl) {
            app.OpenUrl('https://wa.me/' +2348148316917);
        } else {
            window.open('https://wa.me/' +2348148316917, '_system');
        }
    } catch (e) {
        alert('Could not open WhatsApp. Please open manually.');
    }
}

// ======================== MAIN APP CONTROLLER ========================
let currentPage = "home";

function renderApp() { if(!currentUser) renderAuth(); else renderMainApp(); }

function renderAuth() {
  const container = document.getElementById('pagesContainer');
  if (container) container.innerHTML = `<div class="page active-page" id="auth-page">${getAuthHTML()}</div>`;
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) bottomNav.style.display = 'none';
  attachAuthEvents();
}

function getAuthHTML() {
  return `<div class="glass-card" style="padding:32px;margin:40px 20px;text-align:center">
    <h1 style="color:#008751; font-size:32px;">🇳🇬 StudentNija</h1>
    <p style="margin:8px 0 20px;">Study Smarter. Score Higher.</p>
    <div id="authForms"></div>
  </div>`;
}

// ======================== GOOGLE SIGN-IN (Reliable) ========================
let isWaitingForLogin = false;
let loginPoller = null;

// ---- Start Google Sign-In ----
function startGoogleSignIn() {
    // Open the sync page on your main domain
    const loginUrl = "https://studentnija.pages.dev/StudentNija_sync.html";
    
    if (typeof app !== 'undefined' && app.CreateIntent && app.StartActivity) {
        var intent = app.CreateIntent();
        intent.SetAction("android.intent.action.VIEW");
        intent.SetData(loginUrl);
        intent.AddFlags(0x10000000);
        app.StartActivity(intent);
        addNotification('Sign In', 'Please complete login in your browser, then return to the app.');
    } else {
        window.open(loginUrl, '_blank');
        addNotification('Sign In', 'Please complete login in the new tab, then return here.');
    }
    
    isWaitingForLogin = true;
    startLoginPoller();
}

// ---- Start polling for login data ----
function startLoginPoller() {
    if (loginPoller) return;
    loginPoller = setInterval(function() {
        if (!isWaitingForLogin) {
            clearInterval(loginPoller);
            loginPoller = null;
            return;
        }
        const userData = localStorage.getItem('studentnija_user');
        if (userData) {
            clearInterval(loginPoller);
            loginPoller = null;
            isWaitingForLogin = false;
            processUserData(userData);
        }
    }, 2000);
}

// ---- Process user data from localStorage ----
function processUserData(userData) {
    try {
        const user = JSON.parse(userData);
        if (!user || !user.email) {
            localStorage.removeItem('studentnija_user');
            return;
        }
        let existingUser = users.find(u => u.email === user.email);
        if (!existingUser) {
            const newUser = {
                id: Date.now(),
                fullName: user.name || 'Google User',
                email: user.email,
                password: 'oauth_' + Date.now(),
                school: '',
                department: '',
                level: '',
                profilePic: user.picture || '',
                bio: '',
                googleAuth: true
            };
            users.push(newUser);
            saveAll();
            currentUser = newUser;
        } else {
            existingUser.fullName = user.name || existingUser.fullName;
            existingUser.profilePic = user.picture || existingUser.profilePic;
            existingUser.googleAuth = true;
            saveAll();
            currentUser = existingUser;
        }
        localStorage.removeItem('studentnija_user');
        renderApp();
        addNotification('Sign In', 'Welcome ' + currentUser.fullName + '!');
    } catch (e) {
        console.log('Error processing login:', e);
        localStorage.removeItem('studentnija_user');
    }
}

// ---- Check for stored user (called on startup and on resume) ----
function checkForStoredUser() {
    const userData = localStorage.getItem('studentnija_user');
    if (userData) {
        processUserData(userData);
        return true;
    }
    return false;
}

// ---- DroidScript: OnResume handler ----
if (typeof app !== 'undefined') {
    app.OnResume = function() {
        if (isWaitingForLogin) {
            const userData = localStorage.getItem('studentnija_user');
            if (userData) {
                clearInterval(loginPoller);
                loginPoller = null;
                isWaitingForLogin = false;
                processUserData(userData);
            }
        } else {
            checkForStoredUser();
        }
    };
}

function attachAuthEvents() { showAuthForm('login'); }

// ======================== AUTH FORMS ========================
function showAuthForm(formType) {
    const container = document.getElementById('authForms');
    if (!container) return;

    if (formType === 'login') {
        container.innerHTML = `
            <input id="loginEmail" placeholder="Email" type="email">
            <input id="loginPass" type="password" placeholder="Password">
            <div class="flex-between" style="margin:8px 0">
                <label><input type="checkbox" id="rememberMe" checked> Remember Me</label>
                <span id="forgotBtn" style="color:#F4B400; cursor:pointer;">Forgot?</span>
            </div>
            <button class="btn-primary" id="doLogin">Login</button>
            <div style="display:flex; align-items:center; margin:12px 0;">
                <hr style="flex:1; border:0; border-top:1px solid var(--border-light);">
                <span style="padding:0 12px; color:var(--text-muted); font-size:12px;">OR</span>
                <hr style="flex:1; border:0; border-top:1px solid var(--border-light);">
            </div>
            <button class="btn-outline" id="googleSignInBtn" style="width:100%; display:flex; align-items:center; justify-content:center; gap:8px; border-color:#4285F4; color:#4285F4; padding:12px; border-radius:60px; font-weight:500; font-size:16px; cursor:pointer; transition:0.2s; background:transparent;">
                <span style="font-size:18px; font-weight:bold;">G</span> Sign in with Google
            </button>
            <button class="btn-outline" id="gotoRegister" style="margin-top:8px;">Create Account</button>
        `;

        // ---- Event listeners ----
        document.getElementById('doLogin')?.addEventListener('click', function() {
            const email = document.getElementById('loginEmail').value;
            const pwd = document.getElementById('loginPass').value;
            const rem = document.getElementById('rememberMe')?.checked;
            if (loginUser(email, pwd, rem)) {
                renderApp();
            } else {
                alert('Invalid credentials');
            }
        });

        document.getElementById('googleSignInBtn')?.addEventListener('click', function() {
            startGoogleSignIn();
        });

        document.getElementById('gotoRegister')?.addEventListener('click', function() {
            showAuthForm('register');
        });

        document.getElementById('forgotBtn')?.addEventListener('click', function() {
            showAuthForm('forgot');
        });

    } else if (formType === 'register') {
        container.innerHTML = `
            <input id="regName" placeholder="Full Name">
            <input id="regEmail" placeholder="Email" type="email">
            <input id="regPass" type="password" placeholder="Password">
            <input id="regConfirm" type="password" placeholder="Confirm Password">
            <input id="regSchool" placeholder="School / University">
            <input id="regDept" placeholder="Department">
            <input id="regLevel" placeholder="Level (e.g., 300L)">
            <button class="btn-primary" id="doRegister">Register</button>
            <button class="btn-outline" id="backLogin" style="margin-top:8px;">Back to Login</button>
        `;

        document.getElementById('doRegister')?.addEventListener('click', function() {
            const name = document.getElementById('regName').value;
            const email = document.getElementById('regEmail').value;
            const pass = document.getElementById('regPass').value;
            const conf = document.getElementById('regConfirm').value;
            const school = document.getElementById('regSchool').value;
            const dept = document.getElementById('regDept').value;
            const level = document.getElementById('regLevel').value;

            if (!name || !email || !pass || !school || !dept || !level) {
                alert('All fields required');
            } else if (pass !== conf) {
                alert('Passwords do not match');
            } else if (!email.includes('@')) {
                alert('Invalid email');
            } else if (registerUser(name, email, pass, school, dept, level)) {
                alert('Registration successful! Please login.');
                showAuthForm('login');
            } else {
                alert('Email already exists');
            }
        });

        document.getElementById('backLogin')?.addEventListener('click', function() {
            showAuthForm('login');
        });

    } else if (formType === 'forgot') {
        container.innerHTML = `
            <p>Enter your email to receive a reset link (coming soon).</p>
            <input id="resetEmail" placeholder="Email">
            <button class="btn-primary" id="resetSend">Send Link</button>
            <button class="btn-outline" id="backLogin">Back</button>
        `;

        document.getElementById('resetSend')?.addEventListener('click', function() {
            alert('Reset: Password reset link (Coming soon).');
            showAuthForm('login');
        });

        document.getElementById('backLogin')?.addEventListener('click', function() {
            showAuthForm('login');
        });
    }
}

//====================≠=====≠==============
function renderMainApp() {
    // Close AI settings if open
    const overlay = document.getElementById('aiSettingsOverlay');
    if (overlay) overlay.classList.remove('show');
    const panel = document.getElementById('aiSettingsPanel');
    if (panel) panel.classList.remove('open');
    document.querySelectorAll('#aiSettingsOverlay, #aiSettingsPanel').forEach(el => el.remove());
    
    const bottomNav = document.getElementById('bottomNav');
    const pagesContainer = document.getElementById('pagesContainer');
    if (!pagesContainer) return;

    // Reset container styles
    pagesContainer.style.overflow = '';
    pagesContainer.style.padding = '';
    pagesContainer.style.height = '';
    pagesContainer.style.display = '';
    pagesContainer.style.maxHeight = '';

    pagesContainer.innerHTML = `
    <div id="home-page" class="page"><div id="homeContent"></div></div>
    <div id="academics-page" class="page"><div id="academicsContent"></div></div>
    <div id="ai-page" class="page"><div id="aiContent"></div></div>
    <div id="planner-page" class="page"><div id="plannerContent"></div></div>
    <div id="profile-page" class="page"><div id="profileContent"></div></div>
    <div id="studygroups-page" class="page"><div id="studyGroupsContent"></div></div>
`;

    // Remove active class from all pages
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active-page'));

    // Add active class to current page
    const activePage = document.getElementById(`${currentPage}-page`);
    if (activePage) activePage.classList.add('active-page');

    if (currentPage === 'ai') {
        bottomNav.style.display = 'none';
        pagesContainer.style.overflow = 'hidden';
        pagesContainer.style.padding = '0';
        pagesContainer.style.height = '100vh';
        pagesContainer.style.display = 'flex';
        pagesContainer.style.flexDirection = 'column';

        // Ensure AI page fills the container
        const aiPage = document.getElementById('ai-page');
        if (aiPage) {
            aiPage.style.height = '100%';
            aiPage.style.minHeight = '100%';
            aiPage.style.display = 'flex';
            aiPage.style.flexDirection = 'column';
            aiPage.style.overflow = 'hidden';
            aiPage.style.flex = '1';
        }
        const aiContent = document.getElementById('aiContent');
        if (aiContent) {
            aiContent.style.height = '100%';
            aiContent.style.minHeight = '100%';
            aiContent.style.display = 'flex';
            aiContent.style.flexDirection = 'column';
            aiContent.style.overflow = 'hidden';
            aiContent.style.flex = '1';
        }

    } else if (currentPage === 'studygroups') {
        bottomNav.style.display = 'none';
        pagesContainer.style.overflow = 'hidden';
        pagesContainer.style.padding = '0';
        pagesContainer.style.height = '100vh';
        pagesContainer.style.display = 'flex';
        pagesContainer.style.flexDirection = 'column';
        // Set studygroups-page to flex
        const page = document.getElementById('studygroups-page');
        if (page) {
            page.style.height = '100%';
            page.style.display = 'flex';
            page.style.flexDirection = 'column';
            page.style.overflow = 'hidden';
        }
        const content = document.getElementById('studyGroupsContent');
        if (content) {
            content.style.height = '100%';
            content.style.display = 'flex';
            content.style.flexDirection = 'column';
            content.style.overflow = 'hidden';
        }

        // Add a floating back button (like AI tab)
        const backBtn = document.createElement('button');
        backBtn.textContent = '← Back';
        backBtn.style.cssText = `
            position: fixed;
            top: 16px;
            left: 0px;
            z-index: 100;
            background: rgba(0,0,0,0.6);
            color: white;
            border: none;
            padding: 10px 18px;
            border-radius: 20px;
            font-size: 6px;
            font-weight: 100;
            cursor: pointer;
            backdrop-filter: blur(10px);
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            transition: 0.2s;
        `;
        backBtn.id = 'studyGroupsBackBtn';
        backBtn.onclick = function() {
            window.closeStudyGroups();
        };
        // Remove any existing back button to avoid duplicates
        const existing = document.getElementById('studyGroupsBackBtn');
        if (existing) existing.remove();
        document.body.appendChild(backBtn);

    } else {
        // Normal pages
        bottomNav.style.display = 'flex';
        pagesContainer.style.overflowY = 'auto';
        pagesContainer.style.padding = '20px 18px 80px';
        pagesContainer.style.height = 'auto';
        pagesContainer.style.maxHeight = 'none';
        pagesContainer.style.display = 'block';
        pagesContainer.style.position = 'static';

        // Reset AI page styles
        const aiPage = document.getElementById('ai-page');
        if (aiPage) {
            aiPage.style.display = ''; // Let CSS hide it
            aiPage.style.height = '';
            aiPage.style.minHeight = '';
            aiPage.style.flex = '';
            aiPage.style.overflow = '';
        }
        const aiContent = document.getElementById('aiContent');
        if (aiContent) {
            aiContent.style.height = '';
            aiContent.style.minHeight = '';
            aiContent.style.display = '';
            aiContent.style.flex = '';
            aiContent.style.overflow = '';
        }
        // Reset studygroups page styles
        const sgPage = document.getElementById('studygroups-page');
        if (sgPage) {
            sgPage.style.display = '';
            sgPage.style.height = '';
            sgPage.style.flex = '';
            sgPage.style.overflow = '';
        }
        const sgContent = document.getElementById('studyGroupsContent');
        if (sgContent) {
            sgContent.style.height = '';
            sgContent.style.display = '';
            sgContent.style.flex = '';
            sgContent.style.overflow = '';
        }
        // Remove back button if exists
        const backBtn = document.getElementById('studyGroupsBackBtn');
        if (backBtn) backBtn.remove();
    }

    renderHome();
    renderAcademics();
    renderAIPage();
    renderPlannerPage();
    renderProfilePage();
    renderStudyGroupsPage(); // always render, but hidden unless active
    attachBottomNav();
    checkAchievements();
    updateConnectionIndicator();
    rescheduleAllFromStorage();
}

function attachBottomNav() {
  const navItems = ['home','academics','ai','planner','studygroups','profile'];
  const iconMap = {
    home: '⌂',
    academics: '〠',
    ai: '✦',
    planner: '⏣',
    studygroups: '💬',
    profile: '☰'
  };
  const navHTML = navItems.map(p => `
    <div class="nav-item ${currentPage===p?'active':''}" data-page="${p}">
      <span>${iconMap[p] || p.charAt(0).toUpperCase()}</span>
      <span>${p.charAt(0).toUpperCase()+p.slice(1)}</span>
    </div>
  `).join('');
  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) bottomNav.innerHTML = navHTML;
  document.querySelectorAll('.nav-item').forEach(el => el.addEventListener('click', () => {
    const overlay = document.getElementById('aiSettingsOverlay');
    if (overlay) overlay.classList.remove('show');
    const panel = document.getElementById('aiSettingsPanel');
    if (panel) panel.classList.remove('open');
    currentPage = el.getAttribute('data-page');
    renderMainApp();
  }));
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}


// ======================== AI APP BRIDGE ========================
// ---- Handle commands from the AI page ----
function handleAICommand(action, data, requestId) {
    let result = null;
    let success = true;
    let error = null;
    try {
        switch (action) {
            // ---- Get current user ----
            case 'getUser':
                result = currentUser;
                break;

            // ---- Get full app state ----
            case 'getState':
                result = getAppState();
                break;

            // ---- Update user profile ----
            case 'updateProfile':
                if (data) {
                    updateUserProfile(data);
                    result = { success: true, message: 'Profile updated' };
                }
                break;

            // ---- Search notes ----
            case 'searchNotes':
                result = searchNotes(data.query);
                break;

            // ---- Add a course ----
            case 'addCourse':
                if (data && data.semester && data.code && data.unit && data.grade) {
                    const unit = parseFloat(data.unit);
                    const grade = data.grade.toUpperCase();
                    if (gradeMap[grade] !== undefined) {
                        const newCourse = {
                            id: Date.now(),
                            code: data.code,
                            unit: unit,
                            grade: grade,
                            points: unit * gradeMap[grade]
                        };
                        if (!coursesData[data.semester]) coursesData[data.semester] = [];
                        coursesData[data.semester].push(newCourse);
                        saveAll();
                        result = { success: true, message: `Course ${data.code} added to ${data.semester}` };
                    } else {
                        throw new Error('Invalid grade');
                    }
                } else {
                    throw new Error('Missing course data');
                }
                break;

            // ---- Add a task ----
            case 'addTask':
                if (data && data.title) {
                    const newTask = {
                        id: Date.now(),
                        title: data.title,
                        priority: data.priority || 'Medium',
                        date: new Date().toISOString().slice(0, 10),
                        completed: false
                    };
                    plannerTasks.push(newTask);
                    saveAll();
                    result = { success: true, message: `Task "${data.title}" added` };
                }
                break;

            // ---- Add a flashcard ----
            case 'addFlashcard':
                if (data && data.question && data.answer) {
                    flashcards.push({ question: data.question, answer: data.answer });
                    localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
                    result = { success: true, message: 'Flashcard added' };
                }
                break;

            // ---- Add a class to timetable ----
            case 'addClass':
                if (data && data.day && data.time && data.subject) {
                    originalAddClass(data.day, data.time, data.subject, data.location || '');
                    result = { success: true, message: `Class ${data.subject} added to ${data.day} at ${data.time}` };
                }
                break;

            // ---- Get CGPA ----
            case 'getCGPA':
                result = { cgpa: computeOverallCGPA(), classification: getClassification(computeOverallCGPA()) };
                break;

            // ---- Add an exam ----
            case 'addExam':
                if (data && data.courseName && data.examDate) {
                    originalAddExam(data.courseName, data.examDate);
                    result = { success: true, message: `Exam for ${data.courseName} added` };
                }
                break;

            // ---- Mark task as done ----
            case 'completeTask':
                if (data && data.taskId) {
                    const task = plannerTasks.find(t => t.id === data.taskId);
                    if (task) {
                        task.completed = true;
                        saveAll();
                        result = { success: true, message: `Task "${task.title}" completed` };
                    } else {
                        throw new Error('Task not found');
                    }
                }
                break;

            // ---- Change theme ----
            case 'setTheme':
                if (data && data.theme) {
                    applyTheme(data.theme);
                    result = { success: true, message: `Theme changed to ${data.theme}` };
                }
                break;

            default:
                error = 'Unknown action';
                success = false;
        }
    } catch (e) {
        error = e.message;
        success = false;
    }

    // Send response back to the iframe
    const iframe = document.querySelector('#aiContent iframe');
    if (iframe && iframe.contentWindow) {
        iframe.contentWindow.postMessage({
            type: 'aiResponse',
            requestId: requestId,
            result: result,
            success: success,
            error: error
        }, '*');
    }
}

// ---- Helper: get full app state ----
function getAppState() {
    return {
        user: currentUser,
        courses: coursesData,
        tasks: plannerTasks,
        timetable: timetableEvents,
        exams: exams,
        flashcards: flashcards,
        notes: savedNotes,
        stats: userStats,
        achievements: achievements,
        settings: settings
    };
}

// ---- Helper: search notes (also searches tasks & courses for context) ----
function searchNotes(query) {
    if (!query) return [];
    const q = query.toLowerCase();
    const results = [];

    // Search notes
    savedNotes.forEach(note => {
        if ((note.title && note.title.toLowerCase().includes(q)) ||
            (note.content && note.content.toLowerCase().includes(q))) {
            results.push({ type: 'Note', title: note.title, content: note.content, category: note.category });
        }
    });

    // Search tasks
    plannerTasks.forEach(task => {
        if (task.title && task.title.toLowerCase().includes(q)) {
            results.push({ type: 'Task', title: task.title, priority: task.priority, completed: task.completed });
        }
    });

    // Search courses
    for (const sem in coursesData) {
        coursesData[sem].forEach(course => {
            if (course.code && course.code.toLowerCase().includes(q)) {
                results.push({ type: 'Course', code: course.code, grade: course.grade, unit: course.unit, semester: sem });
            }
        });
    }

    // Search flashcards
    flashcards.forEach(card => {
        if (card.question && card.question.toLowerCase().includes(q)) {
            results.push({ type: 'Flashcard', question: card.question, answer: card.answer });
        }
    });

    return results;
}

// ---- Add message listener (once) ----
if (!window._aiMessageListener) {
    window.addEventListener('message', function(event) {
        const msg = event.data;
        if (msg && msg.action) {
            handleAICommand(msg.action, msg.data, msg.requestId);
        }
        // Listen for closeStudyGroups from iframe
        if (msg && msg.type === 'closeStudyGroups') {
            window.closeStudyGroups();
        }
    });
    window._aiMessageListener = true;
}


// ======================== DELETE ACCOUNT ========================
function deleteAccount() {
    if (!currentUser) return;

    // Confirm with the user
    if (confirm('⚠️ Are you sure you want to permanently delete your account?\n\nThis action cannot be undone. All your data will be lost.')) {
        // Show loading overlay
        showLoadingOverlay('Deleting account...');

        setTimeout(() => {
            // Remove the current user from the users array
            const index = users.findIndex(u => u.id === currentUser.id);
            if (index !== -1) {
                users.splice(index, 1);
            }
            // Clear current user
            currentUser = null;
            localStorage.removeItem('studentnija_user');
            isWaitingForLogin = false;
            if (loginPoller) {
                clearInterval(loginPoller);
                loginPoller = null;
            }
            saveAll();
            hideLoadingOverlay();
            renderApp();
            addNotification('Account', 'Your account has been permanently deleted.');
        }, 800); // 800ms delay for visual feedback
    }
}



// ======================== BOOTSTRAP ========================
window.addEventListener('load', async () => {
    // Load all data
    loadAll();
    loadAISettings();
    
    // ---- Android hardware back button ----
    if (typeof app !== 'undefined') {
        app.OnBack = function() {
            if (currentPage === 'ai') {
                window.closeAIPage();
                return true; // handled
            } else if (currentPage === 'studygroups') {
                window.closeStudyGroups();
                return true; // handled
            }
            // Default: exit app if on home page
            if (currentPage === 'home') {
                return false; // let system handle exit
            }
            // For other pages, go back to home
            currentPage = 'home';
            renderMainApp();
            return true;
        };
    }

    // ---- Listen for messages from iframes (e.g., chat) ----
    window.addEventListener('message', function(event) {
        // Optionally verify origin if you want to be secure
        // if (event.origin !== 'https://yourdomain.com') return;
        const msg = event.data;
        if (msg && msg.type === 'navigateTo' && msg.page === 'home') {
            currentPage = 'home';
            renderMainApp();
            // Also close any open modals
            if (activeModal) closeToolModal();
        }
        if (msg && msg.type === 'closeStudyGroups') {
            window.closeStudyGroups();
        }
    });

    // Request notification permission
    if (!window.NotifBridge?.isDroidScript && typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
        await Notification.requestPermission();
    }
    
    rescheduleAllFromStorage();
    window.addEventListener('online', updateConnectionIndicator);
    window.addEventListener('offline', updateConnectionIndicator);
    
    const remember = localStorage.getItem('studentnija_remember');
    
    // Show loading screen for a smooth transition
    setTimeout(() => {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) loadingScreen.classList.add('hide');
        
        setTimeout(() => {
            if (loadingScreen) loadingScreen.style.display = 'none';
            const appRoot = document.getElementById('appRoot');
            if (appRoot) appRoot.style.display = 'flex';
            
            // Render the app
            if (remember === 'true' && currentUser) {
                renderApp();
            } else if (currentUser) {
                renderApp();
            } else {
                renderApp();
            }
            
        }, 500);
    }, 1500);
});