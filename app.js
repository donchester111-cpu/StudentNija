import {
  currentUser, users, coursesData, plannerTasks, timetableEvents,
  exams, notifications, userStats, settings, flashcards, savedNotes,
  semesterList, semesterNames, gradeMap,
  saveAll, loadAll, addNotification, applyTheme, applyAccentColor,
  computeOverallCGPA, getClassification, updateStreak, checkAchievements,
  buildUserContext, scheduleExamReminders, scheduleClassReminders,
  originalAddExam, originalAddClass, rescheduleAllFromStorage,
  escapeHtml, initCoursesData, initScholarships, initAchievements,
  showLoadingOverlay, hideLoadingOverlay,
  registerUser, loginUser, updateUserProfile, changePassword, logout, deleteAccount,
  updateConnectionIndicator
} from './state.js';

import { initErrorHandler } from './tools/errors.js';

import { openToolModal, closeToolModal } from './tools/modal.js';
window.openToolModal = openToolModal;
window.closeToolModal = closeToolModal;

// ======================== API HELPER ========================
import { apiPost, apiGet } from './api.js';

// ======================== CLOUD AUTO‑SYNC ========================
let syncTimer = null;
function scheduleCloudSync() {
  if (!currentUser || !currentUser.id) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncUserDataToCloud();
  }, 1000);
}
window.scheduleCloudSync = scheduleCloudSync;

// ======================== CLOUD SYNC FUNCTIONS ========================
async function syncUserDataToCloud() {
  if (!currentUser || !currentUser.id) return;
  const userId = currentUser.id;
  const data = {
    courses: coursesData,
    tasks: plannerTasks,
    exams: exams,
    flashcards: flashcards,
    notes: savedNotes,
    timetable: timetableEvents,
    settings: {
      theme: settings.theme,
      accentColor: settings.accentColor,
      notificationsEnabled: settings.notificationsEnabled,
      classNotifications: settings.classNotifications,
      examNotifications: settings.examNotifications,
    },
    profile: {
      id: currentUser.id,
      fullName: currentUser.fullName,
      email: currentUser.email,
      school: currentUser.school || '',
      department: currentUser.department || '',
      level: currentUser.level || '',
      studentId: currentUser.studentId || '',
      bio: currentUser.bio || '',
      profilePic: currentUser.profilePic || '',
      googleAuth: currentUser.googleAuth || false,
    },
    stats: {
      studyStreak: userStats.studyStreak || 0,
      totalQuestions: userStats.totalQuestions || 0,
      totalQuizzes: userStats.totalQuizzes || 0,
      correctAnswers: userStats.correctAnswers || 0,
      bestScore: userStats.bestScore || 0,
      level: userStats.level || 1,
      xp: userStats.xp || 0,
    },
    backedUpAt: new Date().toISOString(),
  };
  try {
    await apiPost('/api/sync/save', { userId, data });
    console.log('✅ Cloud sync saved');
  } catch (e) {
    console.error('Sync upload failed', e);
  }
}

async function loadCloudData(userId) {
  try {
    const resp = await apiGet(`/api/sync/load/${userId}`);
    if (resp.data && Object.keys(resp.data).length > 0) {
      if (resp.data.courses) Object.assign(coursesData, resp.data.courses);
      if (resp.data.tasks) {
        const existingIds = new Set(plannerTasks.map(t => t.id));
        resp.data.tasks.forEach(t => { if (!existingIds.has(t.id)) plannerTasks.push(t); });
      }
      if (resp.data.exams) {
        const existingIds = new Set(exams.map(e => e.id));
        resp.data.exams.forEach(e => { if (!existingIds.has(e.id)) exams.push(e); });
      }
      if (resp.data.flashcards) {
        const existing = new Set(flashcards.map(f => f.question));
        resp.data.flashcards.forEach(f => { if (!existing.has(f.question)) flashcards.push(f); });
      }
      if (resp.data.notes) {
        const existingTitles = new Set(savedNotes.map(n => n.title));
        resp.data.notes.forEach(n => { if (!existingTitles.has(n.title)) savedNotes.push(n); });
      }
      if (resp.data.timetable) {
        const existingIds = new Set(timetableEvents.map(e => e.id));
        resp.data.timetable.forEach(e => { if (!existingIds.has(e.id)) timetableEvents.push(e); });
      }
      if (resp.data.settings && typeof resp.data.settings === 'object') {
        Object.assign(settings, resp.data.settings);
      }
      if (resp.data.profile && typeof resp.data.profile === 'object') {
        const safe = resp.data.profile;
        if (safe.school) currentUser.school = safe.school;
        if (safe.department) currentUser.department = safe.department;
        if (safe.level) currentUser.level = safe.level;
        if (safe.studentId) currentUser.studentId = safe.studentId;
        if (safe.bio) currentUser.bio = safe.bio;
        if (safe.profilePic) currentUser.profilePic = safe.profilePic;
      }
      if (resp.data.stats && typeof resp.data.stats === 'object') {
        Object.assign(userStats, resp.data.stats);
      }
      saveAll();
      console.log('✅ Cloud data loaded and merged');
    }
  } catch (e) {
    console.error('Cloud load failed', e);
  }
}

// ======================== ANALYTICS ========================
export async function trackEvent(eventType, payload = {}) {
  if (!currentUser || !currentUser.id) return;
  try {
    await apiPost('/api/analytics/event', { userId: currentUser.id, eventType, payload });
  } catch (e) { /* ignore */ }
}

// ======================== SYNC LOCAL USER TO SERVER ========================
async function syncLocalUserToServer(user) {
  try {
    await apiPost('/api/local-user/sync', {
      email: user.email,
      fullName: user.fullName,
      school: user.school || '',
      department: user.department || '',
      level: user.level || ''
    });
    console.log('✅ Local user synced with server');
  } catch (e) {
    console.error('Local user sync failed', e);
  }
}

// ======================== CLEAN PREVIOUS SESSION DATA ========================
function clearPreviousUserData() {
  const keysToRemove = [
    'studentnija_courses',
    'studentnija_tasks',
    'studentnija_timetable',
    'studentnija_exams',
    'studentnija_flashcards',
    'studentnija_notes',
    'studentnija_notifications',
    'studentnija_user_stats',
    'studentnija_achievements',
    'studentnija_planner_tasks',
    'studentnija_coursesData',
  ];
  keysToRemove.forEach(key => localStorage.removeItem(key));
  
  Object.keys(coursesData).forEach(k => delete coursesData[k]);
  plannerTasks.length = 0;
  timetableEvents.length = 0;
  exams.length = 0;
  flashcards.length = 0;
  savedNotes.length = 0;
  notifications.length = 0;
  if (userStats) {
    userStats.studyStreak = 0;
    userStats.totalQuestions = 0;
    userStats.totalQuizzes = 0;
    userStats.correctAnswers = 0;
    userStats.bestScore = 0;
    userStats.level = 1;
    userStats.xp = 0;
  }
}

// ======================== ERROR HANDLERS (now in tools/errors.js, but we keep the global ones) ========================
// (initErrorHandler is called in bootstrap)

// ======================== GLOBALS ========================
export let currentPage = "home";
window.currentPage = currentPage;

// ======================== HIDE LOADING SCREEN ========================
function hideLoadingScreen() {
  const loadingScreen = document.getElementById('loadingScreen');
  if (loadingScreen) {
    loadingScreen.classList.add('hide');
    setTimeout(() => { loadingScreen.style.display = 'none'; }, 300);
  }
  const appRoot = document.getElementById('appRoot');
  if (appRoot) appRoot.style.display = 'flex';
}

// ======================== AUTH ========================
export function renderAuth() {
  console.log('🔐 renderAuth() called – showing login page');
  hideLoadingScreen();

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

export function attachAuthEvents() {
  showAuthForm('login');
}

export function showAuthForm(formType) {
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

    document.getElementById('doLogin')?.addEventListener('click', async function() {
      const email = document.getElementById('loginEmail').value;
      const pwd = document.getElementById('loginPass').value;
      const rem = document.getElementById('rememberMe')?.checked;

      if (!loginUser(email, pwd, rem)) {
        alert('Invalid credentials');
        return;
      }

      // Check if user has 2FA enabled
      if (currentUser.twoFactorEnabled) {
        try {
          const res = await apiPost('/api/2fa/email/send', { userId: currentUser.id });
          if (!res.success) throw new Error('Failed to send code');
          open2FAModal(async (code) => {
            const verifyRes = await apiPost('/api/auth/login-2fa', { userId: currentUser.id, code });
            if (verifyRes.success) {
              if (rem) {
                localStorage.setItem('remember_me', 'true');
                localStorage.setItem('studentnija_currentUser', JSON.stringify(verifyRes.user));
              }
              syncLocalUserToServer(verifyRes.user);
              renderApp();
            } else {
              alert(verifyRes.error || 'Invalid code');
            }
          });
        } catch (e) {
          alert('Could not send 2FA code');
        }
        return;
      }

      // No 2FA – login normally
      if (rem) {
        localStorage.setItem('remember_me', 'true');
        localStorage.setItem('studentnija_currentUser', JSON.stringify(currentUser));
      } else {
        localStorage.removeItem('remember_me');
      }
      syncLocalUserToServer(currentUser);
      renderApp();
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
        syncLocalUserToServer(currentUser);
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
      <p>Enter your email to receive a password reset link.</p>
      <input id="resetEmail" placeholder="Email">
      <button class="btn-primary" id="sendResetBtn">Send Reset Link</button>
      <button class="btn-outline" id="backToLoginBtn" style="margin-top:8px;">Back to Login</button>
    `;

    document.getElementById('sendResetBtn')?.addEventListener('click', async function() {
      const email = document.getElementById('resetEmail').value.trim();
      if (!email || !email.includes('@')) {
        alert('Please enter a valid email.');
        return;
      }
      try {
        await apiPost('/api/auth/forgot-password', { email });
        alert('If an account with that email exists, a reset link has been sent.');
        showAuthForm('login');
      } catch (e) {
        alert('Could not send reset email. Please try again later.');
      }
    });

    document.getElementById('backToLoginBtn')?.addEventListener('click', function() {
      showAuthForm('login');
    });
  }
}

// ======================== 2FA MODAL ========================
function open2FAModal(callback) {
  const modal = document.createElement('div');
  modal.style.cssText = 'position:fixed; inset:0; background:rgba(0,0,0,0.6); backdrop-filter:blur(8px); display:flex; align-items:center; justify-content:center; z-index:10000;';
  modal.innerHTML = `
    <div style="background:var(--bg-secondary); border-radius:24px; padding:24px; max-width:360px; width:90%; box-shadow:var(--shadow); text-align:center;">
      <h3>🔐 Two‑Factor Authentication</h3>
      <p class="text-muted" style="margin:12px 0;">A verification code has been sent to your email.</p>
      <input type="text" id="login2faCode" placeholder="6‑digit code" maxlength="6" style="width:100%; padding:12px 16px; border-radius:14px; border:1px solid rgba(255,255,255,0.08); background:var(--bg-primary); color:var(--text-primary);">
      <div style="display:flex; gap:10px; justify-content:center; margin-top:16px;">
        <button class="btn-outline" id="cancel2faBtn">Cancel</button>
        <button class="btn" id="verify2faBtn">Verify</button>
      </div>
    </div>
  `;
  document.body.appendChild(modal);
  document.getElementById('cancel2faBtn').addEventListener('click', () => modal.remove());
  document.getElementById('verify2faBtn').addEventListener('click', () => {
    const code = document.getElementById('login2faCode').value.trim();
    modal.remove();
    callback(code);
  });
}

// ======================== GOOGLE SIGN-IN ========================
export function startGoogleSignIn() {
  window.location.href = 'studentnija_sync.html';
}

// ======================== PROCESS GOOGLE USER ========================
function processGoogleUser(userData) {
  if (!userData || !userData.email) {
    console.warn('Invalid Google user data:', userData);
    return;
  }

  clearPreviousUserData();

  let existingUser = users.find(u => u.email === userData.email);
  if (!existingUser) {
    const newUser = {
      id: Date.now(),
      fullName: userData.name || 'Google User',
      email: userData.email,
      password: 'oauth_' + Date.now(),
      school: '',
      department: '',
      level: '',
      profilePic: userData.picture || '',
      bio: '',
      googleAuth: true
    };
    users.push(newUser);
    saveAll();
    currentUser = newUser;
    console.log('✅ New Google user created:', currentUser.fullName);
  } else {
    existingUser.fullName = userData.name || existingUser.fullName;
    existingUser.profilePic = userData.picture || existingUser.profilePic;
    existingUser.googleAuth = true;
    saveAll();
    currentUser = existingUser;
    console.log('✅ Existing user updated:', currentUser.fullName);
  }

  localStorage.setItem('studentnija_currentUser', JSON.stringify(currentUser));
  addNotification('Sign In', 'Welcome ' + currentUser.fullName + '!');

  syncLocalUserToServer(currentUser);

  loadCloudData(currentUser.id).then(() => {
    if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
  });

  if (window.NotifBridge && window.NotifBridge.subscribeToPush) {
    window.NotifBridge.subscribeToPush();
  }
  trackEvent('login');
}

// ======================== RENDER APP ========================
export function renderApp() {
  console.log('🔄 renderApp() called');

  const tempUser = localStorage.getItem('studentnija_user');
  if (tempUser) {
    try {
      const userData = JSON.parse(tempUser);
      console.log('📦 Found temporary Google user data:', userData);
      processGoogleUser(userData);
      localStorage.removeItem('studentnija_user');
    } catch (_) {
      localStorage.removeItem('studentnija_user');
    }
  }

  // Check for "Remember Me" stored user
  if (!currentUser || !currentUser.email) {
    const rememberMe = localStorage.getItem('remember_me');
    const storedUser = localStorage.getItem('studentnija_currentUser');
    if (rememberMe === 'true' && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.email) {
          const existing = users.find(u => u.email === user.email);
          if (existing) {
            Object.assign(currentUser, existing);
          } else {
            Object.assign(currentUser, user);
          }
          clearPreviousUserData();
          loadCloudData(currentUser.id).then(() => renderMainApp()).catch(() => renderMainApp());
          return;
        }
      } catch (_) {}
    }
  }

  if (currentUser && currentUser.email) {
    clearPreviousUserData();
    renderMainApp();
    if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
  } else {
    const stored = localStorage.getItem('studentnija_currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        Object.assign(currentUser, user);
        clearPreviousUserData();
        loadCloudData(currentUser.id).then(() => {
          renderMainApp();
          if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
        }).catch(() => renderMainApp());
      } catch (_) {
        localStorage.removeItem('studentnija_currentUser');
        renderAuth();
      }
    } else {
      renderAuth();
    }
  }
}

// ======================== MAIN APP RENDER ========================
let pagesBuilt = false;

export function renderMainApp() {
  console.log('🏠 renderMainApp() called');
  hideLoadingScreen();

  if (!currentPage || currentPage === 'null' || currentPage === 'undefined') {
    currentPage = 'home';
    window.currentPage = 'home';
  }

  // Tool openers – attached to window
  window.openCalculator = () => import('./tools/calculator.js').then(m => m.openCalculator());
  window.openMathSolver = () => import('./tools/mathSolver.js').then(m => m.openMathSolver());
  window.openDictionary = () => import('./tools/dictionary.js').then(m => m.openDictionary());
  window.openLibrary = () => import('./tools/library.js').then(m => m.openLibrary());
  window.openFlashcards = () => import('./tools/flashcards.js').then(m => m.openFlashcards());
  window.openGradePredictor = () => import('./tools/gradePredictor.js').then(m => m.openGradePredictor());
  window.openAITutor = () => import('./tools/aiTutor.js').then(m => m.openAITutor());
  window.openEssayAssistant = () => import('./tools/essayAssistant.js').then(m => m.openEssayAssistant());
  window.openSmartSearch = () => import('./tools/smartSearch.js').then(m => m.openSmartSearch());
  window.openDataManager = () => import('./tools/dataManager.js').then(m => m.openDataManager());
  window.openNotepad = () => import('./tools/notepad.js').then(m => m.openNotepad());
  window.openPastQuestions = () => import('./tools/pastQuestions.js').then(m => m.openPastQuestions());
  window.openBrowser = () => import('./tools/browser.js').then(m => m.openBrowser());
  window.openQuiz = () => import('./tools/quiz.js').then(m => m.openQuiz());
  window.openGuessNumber = () => import('./tools/guessNumber.js').then(m => m.openGuessNumber());

  const pagesContainer = document.getElementById('pagesContainer');
  if (!pagesContainer) {
    console.error('❌ pagesContainer not found!');
    return;
  }

  if (!pagesBuilt) {
    console.log('🏗️ Building page structure...');
    pagesContainer.innerHTML = `
      <div id="home-page" class="page"><div id="homeContent"></div></div>
      <div id="academics-page" class="page"><div id="academicsContent"></div></div>
      <div id="ai-page" class="page"><div id="aiContent"></div></div>
      <div id="planner-page" class="page"><div id="plannerContent"></div></div>
      <div id="studygroups-page" class="page"><div id="studyGroupsContent"></div></div>
      <div id="exams-page" class="page"><div id="examsContent"></div></div>
      <div id="profile-page" class="page"><div id="profileContent"></div></div>
    `;
    pagesBuilt = true;
    console.log('✅ Page structure built.');
  }

  document.querySelectorAll('.page').forEach(p => {
    p.style.display = 'none';
    p.style.flex = '';
    p.style.overflow = '';
    p.style.height = '';
    p.style.minHeight = '';
    p.style.flexDirection = '';
  });

  const activePage = document.getElementById(`${currentPage}-page`);
  if (!activePage) {
    console.error(`❌ Page "${currentPage}-page" not found!`);
    return;
  }

  const isSpecial = ['ai', 'studygroups', 'exams'].includes(currentPage);
  if (isSpecial) {
    const pageMap = {
      ai: 'ai.html',
      studygroups: 'studygroups.html',
      exams: 'exams.html'
    };
    window.location.href = pageMap[currentPage];
    return;
  }

  activePage.style.display = 'block';
  console.log(`📄 Active page: ${currentPage}`);

  // Dynamic page import and render
  const pageLoaders = {
    home: () => import('./pages/home.js').then(m => m.renderHome()),
    academics: () => import('./pages/academics.js').then(m => m.renderAcademics()),
    planner: () => import('./pages/planner.js').then(m => m.renderPlannerPage()),
    profile: () => import('./pages/profile.js').then(m => m.renderProfilePage()),
  };

  if (pageLoaders[currentPage]) {
    pageLoaders[currentPage]().catch(err => {
      console.error(`Failed to load ${currentPage} page:`, err);
      activePage.innerHTML = `<div class="text-muted" style="padding:20px; text-align:center;">⚠️ Could not load this page. Please try again.</div>`;
    });
  }

  ['aiBackBtn', 'studyGroupsBackBtn', 'examsBackBtn'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.remove();
  });

  attachBottomNav();
  checkAchievements();
  updateConnectionIndicator();
  rescheduleAllFromStorage();

  const bottomNav = document.getElementById('bottomNav');
  if (bottomNav) {
    bottomNav.style.display = 'flex';
  }

  pagesContainer.style.overflowY = 'auto';
  pagesContainer.style.padding = '20px 18px 80px';
  pagesContainer.style.height = 'auto';
  pagesContainer.style.display = 'block';
  pagesContainer.style.position = 'static';

  console.log('✅ renderMainApp() complete.');
}

// ======================== BOTTOM NAV ========================
export function attachBottomNav() {
  const navItems = ['home','academics','ai','planner','studygroups','exams','profile'];
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
  if (bottomNav) {
    bottomNav.innerHTML = navHTML;
    document.querySelectorAll('.nav-item').forEach(el => {
      el.addEventListener('click', () => {
        const page = el.getAttribute('data-page');
        if (navItems.includes(page)) {
          if (page === currentPage) return;

          if (page === 'ai') {
            window.location.href = 'ai.html';
            return;
          }
          if (page === 'studygroups') {
            window.location.href = 'studygroups.html';
            return;
          }
          if (page === 'exams') {
            window.location.href = 'exams.html';
            return;
          }

          currentPage = page;
          window.currentPage = page;
          renderMainApp();
        }
      });
    });
  }
}

// ======================== AI BRIDGE (unchanged) ========================
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

function searchNotes(query) {
  if (!query) return [];
  const q = query.toLowerCase();
  const results = [];
  savedNotes.forEach(note => {
    if ((note.title && note.title.toLowerCase().includes(q)) ||
        (note.content && note.content.toLowerCase().includes(q))) {
      results.push({ type: 'Note', title: note.title, content: note.content, category: note.category });
    }
  });
  plannerTasks.forEach(task => {
    if (task.title && task.title.toLowerCase().includes(q)) {
      results.push({ type: 'Task', title: task.title, priority: task.priority, completed: task.completed });
    }
  });
  for (const sem in coursesData) {
    coursesData[sem].forEach(course => {
      if (course.code && course.code.toLowerCase().includes(q)) {
        results.push({ type: 'Course', code: course.code, grade: course.grade, unit: course.unit, semester: sem });
      }
    });
  }
  flashcards.forEach(card => {
    if (card.question && card.question.toLowerCase().includes(q)) {
      results.push({ type: 'Flashcard', question: card.question, answer: card.answer });
    }
  });
  return results;
}

function handleAICommand(action, data, requestId) {
  let result = null;
  let success = true;
  let error = null;
  try {
    switch (action) {
      case 'getUser': result = currentUser; break;
      case 'getState': result = getAppState(); break;
      case 'updateProfile':
        if (data) {
          updateUserProfile(data);
          result = { success: true, message: 'Profile updated' };
        }
        break;
      case 'searchNotes':
        result = searchNotes(data.query);
        break;
      case 'addCourse':
        if (data && data.semester && data.code && data.unit && data.grade) {
          const unit = parseFloat(data.unit);
          const grade = data.grade.toUpperCase();
          if (gradeMap[grade] !== undefined) {
            const newCourse = { id: Date.now(), code: data.code, unit: unit, grade: grade, points: unit * gradeMap[grade] };
            if (!coursesData[data.semester]) coursesData[data.semester] = [];
            coursesData[data.semester].push(newCourse);
            saveAll();
            scheduleCloudSync();
            result = { success: true, message: `Course ${data.code} added to ${data.semester}` };
          } else throw new Error('Invalid grade');
        } else throw new Error('Missing course data');
        break;
      case 'addTask':
        if (data && data.title) {
          const newTask = { id: Date.now(), title: data.title, priority: data.priority || 'Medium', date: new Date().toISOString().slice(0,10), completed: false };
          plannerTasks.push(newTask);
          saveAll();
          scheduleCloudSync();
          result = { success: true, message: `Task "${data.title}" added` };
        }
        break;
      case 'addFlashcard':
        if (data && data.question && data.answer) {
          flashcards.push({ question: data.question, answer: data.answer });
          localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
          scheduleCloudSync();
          result = { success: true, message: 'Flashcard added' };
        }
        break;
      case 'addClass':
        if (data && data.day && data.time && data.subject) {
          originalAddClass(data.day, data.time, data.subject, data.location || '');
          scheduleCloudSync();
          result = { success: true, message: `Class ${data.subject} added to ${data.day} at ${data.time}` };
        }
        break;
      case 'getCGPA':
        result = { cgpa: computeOverallCGPA(), classification: getClassification(computeOverallCGPA()) };
        break;
      case 'addExam':
        if (data && data.courseName && data.examDate) {
          originalAddExam(data.courseName, data.examDate);
          scheduleCloudSync();
          result = { success: true, message: `Exam for ${data.courseName} added` };
        }
        break;
      case 'completeTask':
        if (data && data.taskId) {
          const task = plannerTasks.find(t => t.id === data.taskId);
          if (task) {
            task.completed = true;
            saveAll();
            scheduleCloudSync();
            result = { success: true, message: `Task "${task.title}" completed` };
          } else throw new Error('Task not found');
        }
        break;
      case 'setTheme':
        if (data && data.theme) {
          applyTheme(data.theme);
          scheduleCloudSync();
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

  if (window._aiCallbacks && window._aiCallbacks[requestId]) {
    window._aiCallbacks[requestId]({ success, result, error });
    delete window._aiCallbacks[requestId];
  }
}

window._aiCallbacks = {};
window.sendAICommand = function(action, data) {
  return new Promise((resolve, reject) => {
    const requestId = Date.now() + '_' + Math.random().toString(36).substr(2, 4);
    window._aiCallbacks[requestId] = (response) => {
      if (response.success) resolve(response.result);
      else reject(new Error(response.error || 'Command failed'));
    };
    handleAICommand(action, data, requestId);
    setTimeout(() => {
      if (window._aiCallbacks[requestId]) {
        delete window._aiCallbacks[requestId];
        reject(new Error('Timeout'));
      }
    }, 10000);
  });
};

// ======================== CLOSE FUNCTIONS ========================
window.closeStudyGroups = function() {
  window.location.href = 'index.html';
};

window.closeExamsPage = function() {
  window.location.href = 'index.html';
};

window.closeAIPage = function() {
  window.location.href = 'index.html';
};

// ======================== MESSAGE LISTENER ========================
if (!window._aiMessageListener) {
  window.addEventListener('message', function(event) {
    const msg = event.data;

    if (msg && msg.action) {
      handleAICommand(msg.action, msg.data, msg.requestId);
    }

    if (msg && msg.type === 'navigateTo' && msg.page === 'home') {
      window.location.href = 'index.html';
    }

    if (msg && msg.type === 'closeStudyGroups') {
      window.closeStudyGroups();
    }

    if (msg && msg.type === 'closeExamsPage') {
      window.closeExamsPage();
    }

    if (msg && msg.type === 'closeAIPage') {
      window.closeAIPage();
    }
  });
  window._aiMessageListener = true;
}

// ======================== ONBOARDING ========================
function showOnboarding() {
  if (localStorage.getItem('studentnija_onboarded')) return;
  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';
  overlay.innerHTML = `
    <div style="position:fixed; inset:0; background:rgba(0,0,0,0.7); z-index:9999; display:flex; align-items:center; justify-content:center; padding:20px;">
      <div class="card" style="max-width:340px; text-align:center;">
        <h2 style="margin-bottom:12px;">🚀 Welcome to StudentNija!</h2>
        <p class="text-muted" style="margin-bottom:16px;">Your AI‑powered study companion.</p>
        <div style="margin:16px 0; display:flex; flex-direction:column; gap:8px; text-align:left; padding:0 20px;">
          <div>📚 Track your courses & CGPA</div>
          <div>✅ Manage tasks & timetable</div>
          <div>🧠 Get AI tutoring</div>
          <div>📝 Practice past questions</div>
        </div>
        <button class="btn" id="onboardCloseBtn" style="margin-top:16px;">Let's Go!</button>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);
  document.getElementById('onboardCloseBtn').addEventListener('click', () => {
    overlay.remove();
    localStorage.setItem('studentnija_onboarded', 'true');
  });
}

// ======================== BOOTSTRAP ========================
window.addEventListener('load', async () => {
  initErrorHandler();
  console.log('🚀 App bootstrapping...');
  loadAll();

  // Auto-login with Remember Me
  const rememberMe = localStorage.getItem('remember_me');
  const storedUser = localStorage.getItem('studentnija_currentUser');
  if (rememberMe === 'true' && storedUser && !currentUser?.email) {
    try {
      const user = JSON.parse(storedUser);
      if (user.email) {
        const existing = users.find(u => u.email === user.email);
        if (existing) {
          Object.assign(currentUser, existing);
        } else {
          currentUser = user;
          if (!users.find(u => u.email === user.email)) users.push(user);
        }
        clearPreviousUserData();
        await loadCloudData(currentUser.id);
        renderMainApp();
        if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
        return;
      }
    } catch (_) {}
  }

  const tempUser = localStorage.getItem('studentnija_user');
  if (tempUser) {
    try {
      const userData = JSON.parse(tempUser);
      processGoogleUser(userData);
      localStorage.removeItem('studentnija_user');
    } catch (e) {
      localStorage.removeItem('studentnija_user');
    }
  }

  if (!currentUser || !currentUser.email) {
    const stored = localStorage.getItem('studentnija_currentUser');
    if (stored) {
      try {
        const user = JSON.parse(stored);
        Object.assign(currentUser, user);
        clearPreviousUserData();
        await loadCloudData(currentUser.id);
        renderMainApp();
        if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
      } catch (_) {
        localStorage.removeItem('studentnija_currentUser');
        renderAuth();
      }
    } else {
      renderAuth();
    }
  } else {
    clearPreviousUserData();
    await loadCloudData(currentUser.id);
    renderMainApp();
    if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
  }

  window.addEventListener('app:logout', () => {
    clearPreviousUserData();
    localStorage.removeItem('studentnija_currentUser');
    localStorage.removeItem('remember_me');
    renderApp();
  });

  if (typeof app !== 'undefined') {
    app.OnBack = function() {
      if (currentPage === 'home') return false;
      currentPage = 'home';
      window.currentPage = 'home';
      renderMainApp();
      return true;
    };
  }

  if (!window.NotifBridge?.isDroidScript && typeof Notification !== 'undefined' && Notification.permission !== 'denied') {
    await Notification.requestPermission();
  }

  rescheduleAllFromStorage();
  window.addEventListener('online', updateConnectionIndicator);
  window.addEventListener('offline', updateConnectionIndicator);

  setTimeout(() => {
    hideLoadingScreen();
  }, 3000);
});