// ======================== GLOBAL STATE ========================
export let currentUser = null;
export let users = [];
export let logout = [];
export let setCurrentUser = [];
export let deleteAccount = [];
export let coursesData = {};
export let plannerTasks = [];
export let timetableEvents = [];
export let exams = [];
export let scholarships = [];
export let pastQuestions = [];
export let notes = [];
export let achievements = [];
export let studyHoursLog = [];
export let notifications = [];
export let userStats = { studyStreak: 0, totalCourses: 0, totalHours: 0, lastActive: null };
export let settings = {
  theme: 'light',
  notificationsEnabled: true,
  examNotifications: true,
  classNotifications: true,
  accentColor: '#008751'
};
export let flashcards = [];
export let studyPlans = [];
export let savedNotes = JSON.parse(localStorage.getItem('studentnija_notes_list') || '[]');

export const semesterList = ["100L-First","100L-Second","200L-First","200L-Second","300L-First","300L-Second","400L-First","400L-Second","500L-First","500L-Second"];
export const semesterNames = {
  "100L-First":"100L First Sem",
  "100L-Second":"100L Second Sem",
  "200L-First":"200L First Sem",
  "200L-Second":"200L Second Sem",
  "300L-First":"300L First Sem",
  "300L-Second":"300L Second Sem",
  "400L-First":"400L First Sem",
  "400L-Second":"400L Second Sem",
  "500L-First":"500L First Sem",
  "500L-Second":"500L Second Sem"
};
export const gradeMap = { A:5, B:4, C:3, D:2, E:1, F:0 };

// ======================== SAVE / LOAD ========================
export function saveAll() {
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

export function loadAll() {
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

// ======================== HELPER FUNCTIONS ========================
export function applyAccentColor(color) {
  document.documentElement.style.setProperty('--accent-green', color);
  document.documentElement.style.setProperty('--accent-green-light', color);
  settings.accentColor = color;
  saveAll();
}

export function initCoursesData() {
  semesterList.forEach(s => { if(!coursesData[s]) coursesData[s]=[]; });
}

export function initScholarships() {
  scholarships = [
    {id:1, name:"MTN Foundation Scholarship", category:"Private", deadline:"2025-08-30", description:"For STEM students", eligibility:"CGPA 3.5+", bookmarked:false},
    {id:2, name:"Federal Government Bursary", category:"Federal", deadline:"2025-07-15", description:"Needs based", eligibility:"All Nigerian students", bookmarked:false},
    {id:3, name:"NNPC/Total Scholarship", category:"Private", deadline:"2025-09-10", description:"Engineering", eligibility:"2nd year+", bookmarked:false}
  ];
}

export function initAchievements() {
  // Fixed: use 'name' instead of 'title' to match home.js expectations
  achievements = [
    {id:"first_course", name:"First Course Added", achieved:false, icon:"🏆"},
    {id:"semester_done", name:"First Semester Completed", achieved:false, icon:"📘"},
    {id:"cgpa_excellent", name:"CGPA Above 4.00", achieved:false, icon:"🎯"},
    {id:"streak_7", name:"7 Day Study Streak", achieved:false, icon:"🔥"},
    {id:"streak_30", name:"30 Day Study Streak", achieved:false, icon:"⭐"}
  ];
}

export function addNotification(title, message) {
  notifications.unshift({id:Date.now(), title, message, date:new Date().toISOString()});
  if(notifications.length>25) notifications.pop();
  saveAll();
}

export function computeOverallCGPA() {
  let totalU=0, totalP=0;
  for(let sem of semesterList) {
    for(let c of coursesData[sem]||[]) {
      totalU += c.unit;
      totalP += c.points;
    }
  }
  return totalU===0 ? 0 : parseFloat((totalP/totalU).toFixed(2));
}

export function getClassification(cgpa) {
  if(cgpa>=4.5) return "First Class";
  if(cgpa>=3.5) return "Second Class Upper";
  if(cgpa>=2.4) return "Second Class Lower";
  if(cgpa>=1.5) return "Third Class";
  return "Pass";
}

export function checkAchievements() {
  // Ensure achievements is not empty
  if (!achievements || achievements.length === 0) initAchievements();
  let totalCourses = 0;
  for(let s in coursesData) totalCourses += coursesData[s].length;
  const firstCourse = achievements.find(a=>a.id==="first_course");
  if(totalCourses>=1 && firstCourse && !firstCourse.achieved) firstCourse.achieved = true;
  let allSemestersWithCourses = semesterList.filter(s=>coursesData[s]?.length>0).length;
  const semesterDone = achievements.find(a=>a.id==="semester_done");
  if(allSemestersWithCourses>=1 && semesterDone && !semesterDone.achieved) semesterDone.achieved = true;
  let cgpa = computeOverallCGPA();
  const cgpaExcellent = achievements.find(a=>a.id==="cgpa_excellent");
  if(cgpa>=4.0 && cgpaExcellent && !cgpaExcellent.achieved) cgpaExcellent.achieved = true;
  const streak7 = achievements.find(a=>a.id==="streak_7");
  if(userStats.studyStreak>=7 && streak7 && !streak7.achieved) streak7.achieved = true;
  const streak30 = achievements.find(a=>a.id==="streak_30");
  if(userStats.studyStreak>=30 && streak30 && !streak30.achieved) streak30.achieved = true;
  saveAll();
}

export function updateStreak() {
  let today = new Date().toDateString();
  if(userStats.lastActive !== today) {
    userStats.lastActive = today;
    userStats.studyStreak = (userStats.studyStreak || 0) + 1;
    saveAll();
  }
}

export function applyTheme(themeMode) {
  if (themeMode === 'dark') {
    document.body.classList.add('dark-theme');
    document.body.classList.remove('light-theme');
    settings.theme = 'dark';
  } else if (themeMode === 'light') {
    document.body.classList.add('light-theme');
    document.body.classList.remove('dark-theme');
    settings.theme = 'light';
  } else if (themeMode === 'system') {
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      document.body.classList.add('dark-theme');
      document.body.classList.remove('light-theme');
    } else {
      document.body.classList.add('light-theme');
      document.body.classList.remove('dark-theme');
    }
    settings.theme = 'system';
  }
  saveAll();
}

export function updateConnectionIndicator() {
  const ind = document.getElementById('connectionIndicator');
  if (navigator.onLine) {
    ind.innerHTML = '🌐 Online';
    ind.className = 'connection-indicator online';
  } else {
    ind.innerHTML = '📡 Offline';
    ind.className = 'connection-indicator offline';
  }
}

export function buildUserContext() {
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
export function scheduleExamReminders(examId, courseName, examDateStr) {
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

export function scheduleClassReminders(classId, subject, day, timeStr) {
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

export const originalAddExam = function(name, date) {
  const newExam = { id: Date.now(), courseName: name, examDate: date, notifySent: false };
  exams.push(newExam);
  saveAll();
  if(settings.examNotifications) scheduleExamReminders(newExam.id, name, date);
  addNotification("Exam", `${name} added with reminders`);
};

export const originalAddClass = function(day, time, subject, location) {
  const newClass = { id: Date.now(), day, time, subject, location: location||'', notified: false };
  timetableEvents.push(newClass);
  saveAll();
  if(settings.classNotifications) scheduleClassReminders(newClass.id, subject, day, time);
  addNotification("Timetable", `Class ${subject} added`);
};

export function rescheduleAllFromStorage() {
  exams.forEach(ex => scheduleExamReminders(ex.id, ex.courseName, ex.examDate));
  timetableEvents.forEach(ev => scheduleClassReminders(ev.id, ev.subject, ev.day, ev.time));
}

// ======================== ESCAPE HTML ========================
export function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>]/g, function(m) {
    if (m === '&') return '&amp;';
    if (m === '<') return '&lt;';
    if (m === '>') return '&gt;';
    return m;
  });
}

// ======================== LOADING OVERLAY ========================
export function showLoadingOverlay(message = 'Please wait...') {
  const overlay = document.getElementById('loadingScreen');
  if (overlay) {
    const textEl = overlay.querySelector('p:last-child');
    if (textEl) textEl.textContent = message;
    overlay.classList.remove('hide');
    overlay.style.display = 'flex';
    overlay.style.opacity = '1';
  } else {
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

export function hideLoadingOverlay() {
  const overlay = document.getElementById('loadingScreen');
  if (overlay) {
    overlay.classList.add('hide');
    setTimeout(() => { overlay.style.display = 'none'; }, 500);
  } else {
    const temp = document.getElementById('tempLoading');
    if (temp) temp.remove();
  }
}

// ======================== AUTH HELPERS ========================
export function registerUser(fullName, email, password, school, department, level, profilePicBase64 = "") {
  if(users.find(u=>u.email===email)) return false;
  const newUser = { id: Date.now(), fullName, email, password, school, department, level, profilePic: profilePicBase64, bio: "", goals: "", createdAt: new Date().toISOString() };
  users.push(newUser);
  saveAll();
  return true;
}

export function loginUser(email, password, remember = true) {
  const user = users.find(u=>u.email===email && u.password===password);
  if(user) {
    currentUser = user;
    if(remember) localStorage.setItem('studentnija_remember', 'true');
    else localStorage.removeItem('studentnija_remember');
    saveAll();
    updateStreak();
    return true;
  }
  return false;
}

export function updateUserProfile(updatedData) {
  if(currentUser) {
    Object.assign(currentUser, updatedData);
    saveAll();
    addNotification("Profile", "Profile updated");
  }
}

export function changePassword(oldPwd, newPwd) {
  if(currentUser && currentUser.password === oldPwd) {
    currentUser.password = newPwd;
    saveAll();
    return true;
  }
  return false;
}

// These local auth functions are kept for backward compatibility, but the main app uses cloud auth.

// ======================== CLEAR PREVIOUS USER DATA ========================
export function clearPreviousUserData() {
  // Clear all data arrays and localStorage keys
  const keysToRemove = [
    'studentnija_courses',
    'studentnija_planner',
    'studentnija_timetable',
    'studentnija_exams',
    'studentnija_flashcards',
    'studentnija_notes_list',
    'studentnija_notes',
    'studentnija_notifications',
    'studentnija_achievements',
    'studentnija_stats',
    'studentnija_scholarships',
    'studentnija_pastquestions',
    'studentnija_studyLog',
    'studentnija_users',
    'studentnija_currentUser',
    'studentnija_groups',
    'studentnija_unread',
    'studentnija_private_unread',
    'studentnija_chat_user_name',
    'studentnija_chat_user_id',
    'studentnija_chat_user_avatar',
    'studentnija_chat_theme',
    'studentnija_chat_fontsize',
    'studentnija_chat_sound',
    'studentnija_chat_sound_enabled',
    'studentnija_remember'
  ];
  keysToRemove.forEach(key => localStorage.removeItem(key));

  // Reset all exported arrays/objects
  coursesData = {};
  semesterList.forEach(s => coursesData[s] = []);
  plannerTasks = [];
  timetableEvents = [];
  exams = [];
  flashcards = [];
  savedNotes = [];
  notes = [];
  notifications = [];
  achievements = [];
  userStats = { studyStreak: 0, totalCourses: 0, totalHours: 0, lastActive: null };
  scholarships = [];
  pastQuestions = [];
  studyHoursLog = [];
  // Reset currentUser
  currentUser = null;
  // Reset settings to defaults but keep theme from main app? We'll keep current settings object.
  settings = {
    theme: 'light',
    notificationsEnabled: true,
    examNotifications: true,
    classNotifications: true,
    accentColor: '#008751'
  };
  saveAll();
}
window.clearPreviousUserData = clearPreviousUserData;

// ======================== EXPOSE GLOBALLY ========================
window.currentUser = currentUser;
window.users = users;
window.coursesData = coursesData;
window.plannerTasks = plannerTasks;
window.timetableEvents = timetableEvents;
window.exams = exams;
window.flashcards = flashcards;
window.savedNotes = savedNotes;
window.achievements = achievements;
window.userStats = userStats;
window.settings = settings;
window.notifications = notifications;
window.scholarships = scholarships;
window.pastQuestions = pastQuestions;
window.studyHoursLog = studyHoursLog;
window.saveAll = saveAll;
window.loadAll = loadAll;
window.addNotification = addNotification;
window.applyTheme = applyTheme;
window.applyAccentColor = applyAccentColor;
window.computeOverallCGPA = computeOverallCGPA;
window.getClassification = getClassification;
window.updateStreak = updateStreak;
window.checkAchievements = checkAchievements;
window.buildUserContext = buildUserContext;
window.scheduleExamReminders = scheduleExamReminders;
window.scheduleClassReminders = scheduleClassReminders;
window.originalAddExam = originalAddExam;
window.originalAddClass = originalAddClass;
window.rescheduleAllFromStorage = rescheduleAllFromStorage;
window.escapeHtml = escapeHtml;
window.showLoadingOverlay = showLoadingOverlay;
window.hideLoadingOverlay = hideLoadingOverlay;
window.registerUser = registerUser;
window.loginUser = loginUser;
window.updateUserProfile = updateUserProfile;
window.changePassword = changePassword;
window.clearPreviousUserData = clearPreviousUserData;