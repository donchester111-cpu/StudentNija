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

import { renderHome } from './pages/home.js';
import { renderAcademics } from './pages/academics.js';
import { renderPlannerPage } from './pages/planner.js';
import { renderProfilePage } from './pages/profile.js';

import { openCalculator } from './tools/calculator.js';
import { openMathSolver } from './tools/mathSolver.js';
import { openDictionary } from './tools/dictionary.js';
import { openLibrary } from './tools/library.js';
import { openFlashcards } from './tools/flashcards.js';
import { openGradePredictor } from './tools/gradePredictor.js';
import { openAITutor } from './tools/aiTutor.js';
import { openEssayAssistant } from './tools/essayAssistant.js';
import { openSmartSearch } from './tools/smartSearch.js';
import { openDataManager } from './tools/dataManager.js';
import { openNotepad } from './tools/notepad.js';
import { openPastQuestions } from './tools/pastQuestions.js';
import { openBrowser } from './tools/browser.js';
import { openQuiz } from './tools/quiz.js';
import { openGuessNumber } from './tools/guessNumber.js';

import { openToolModal, closeToolModal } from './tools/modal.js';
window.openToolModal = openToolModal;
window.closeToolModal = closeToolModal;

// ======================== GLOBALS ========================
export let currentPage = "home";
window.currentPage = currentPage;

export let isWaitingForLogin = false;
export let loginPoller = null;

// ======================== AUTH ========================
export function renderAuth() {
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

// ======================== GOOGLE SIGN-IN ========================
export function startGoogleSignIn() {
  const loginUrl = "studentnija_sync.html";

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

export function startLoginPoller() {
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

export function processUserData(userData) {
  try {
    const user = typeof userData === 'string' ? JSON.parse(userData) : userData;
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

export function checkForStoredUser() {
  const userData = localStorage.getItem('studentnija_user');
  if (userData) {
    processUserData(userData);
    return true;
  }
  return false;
}

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

// ======================== RENDER APP ========================
export function renderApp() {
  if (!currentUser) renderAuth();
  else renderMainApp();
}

// Flag to build the page structure only once
let pagesBuilt = false;

export function renderMainApp() {
  if (!currentPage || currentPage === 'null' || currentPage === 'undefined') {
    currentPage = 'home';
    window.currentPage = 'home';
  }
  console.log('🔄 renderMainApp() called, currentPage =', currentPage);

  window.openCalculator = openCalculator;
  window.openMathSolver = openMathSolver;
  window.openDictionary = openDictionary;
  window.openLibrary = openLibrary;
  window.openFlashcards = openFlashcards;
  window.openGradePredictor = openGradePredictor;
  window.openAITutor = openAITutor;
  window.openEssayAssistant = openEssayAssistant;
  window.openSmartSearch = openSmartSearch;
  window.openDataManager = openDataManager;
  window.openNotepad = openNotepad;
  window.openPastQuestions = openPastQuestions;
  window.openBrowser = openBrowser;
  window.openQuiz = openQuiz;
  window.openGuessNumber = openGuessNumber;

  window.renderMainApp = renderMainApp;
  window.currentPage = currentPage;

  const overlay = document.getElementById('settingsOverlayAI');
  if (overlay) overlay.classList.remove('show');
  const panel = document.getElementById('settingsPanelAI');
  if (panel) panel.classList.remove('open');

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
    console.log(`⚠️ Special page ${currentPage} detected, opening in new tab.`);
    const pageMap = {
      ai: 'AI.html',
      studygroups: 'Chat.html',
      exams: 'Exam.html'
    };
    window.open(pageMap[currentPage], '_blank');
    currentPage = 'home';
    window.currentPage = 'home';
    renderMainApp();
    return;
  }

  activePage.style.display = 'block';
  console.log(`📄 Active page: ${currentPage}`);

  if (currentPage === 'home') {
    renderHome();
  } else if (currentPage === 'academics') {
    renderAcademics();
  } else if (currentPage === 'planner') {
    renderPlannerPage();
  } else if (currentPage === 'profile') {
    renderProfilePage();
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
            window.open('ai.html', '_blank');
            return;
          }
          if (page === 'studygroups') {
            window.open('studygroups.html', '_blank');
            return;
          }
          if (page === 'exams') {
            window.open('exams.html', '_blank');
            return;
          }
          const overlay = document.getElementById('settingsOverlayAI');
          if (overlay) overlay.classList.remove('show');
          const panel = document.getElementById('settingsPanelAI');
          if (panel) panel.classList.remove('open');
          currentPage = page;
          window.currentPage = page;
          renderMainApp();
        }
      });
    });
  }
}

// ======================== AI BRIDGE ========================
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
            result = { success: true, message: `Course ${data.code} added to ${data.semester}` };
          } else throw new Error('Invalid grade');
        } else throw new Error('Missing course data');
        break;
      case 'addTask':
        if (data && data.title) {
          const newTask = { id: Date.now(), title: data.title, priority: data.priority || 'Medium', date: new Date().toISOString().slice(0,10), completed: false };
          plannerTasks.push(newTask);
          saveAll();
          result = { success: true, message: `Task "${data.title}" added` };
        }
        break;
      case 'addFlashcard':
        if (data && data.question && data.answer) {
          flashcards.push({ question: data.question, answer: data.answer });
          localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
          result = { success: true, message: 'Flashcard added' };
        }
        break;
      case 'addClass':
        if (data && data.day && data.time && data.subject) {
          originalAddClass(data.day, data.time, data.subject, data.location || '');
          result = { success: true, message: `Class ${data.subject} added to ${data.day} at ${data.time}` };
        }
        break;
      case 'getCGPA':
        result = { cgpa: computeOverallCGPA(), classification: getClassification(computeOverallCGPA()) };
        break;
      case 'addExam':
        if (data && data.courseName && data.examDate) {
          originalAddExam(data.courseName, data.examDate);
          result = { success: true, message: `Exam for ${data.courseName} added` };
        }
        break;
      case 'completeTask':
        if (data && data.taskId) {
          const task = plannerTasks.find(t => t.id === data.taskId);
          if (task) {
            task.completed = true;
            saveAll();
            result = { success: true, message: `Task "${task.title}" completed` };
          } else throw new Error('Task not found');
        }
        break;
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
  console.log('🔄 closeStudyGroups called');
  window.location.href = 'index.html';
};

window.closeExamsPage = function() {
  console.log('🔄 closeExamsPage called');
  window.location.href = 'index.html';
};

window.closeAIPage = function() {
  console.log('🔄 closeAIPage called');
  window.location.href = 'index.html';
};

// ======================== MESSAGE LISTENER ========================
if (!window._aiMessageListener) {
  window.addEventListener('message', function(event) {
    const msg = event.data;

    if (msg && msg.action) {
      handleAICommand(msg.action, msg.data, msg.requestId);
    }

    // ---- Handle Google Sign-In success (postMessage from sync page) ----
    if (msg && msg.type === 'google_login_success' && msg.user) {
      console.log('✅ Google login success via postMessage!', msg.user);
      // Process the user data directly
      processUserData(msg.user);
      // Stop the poller if it's running (since we already have the data)
      if (loginPoller) {
        clearInterval(loginPoller);
        loginPoller = null;
        isWaitingForLogin = false;
      }
      // Render the app (already handled by processUserData)
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

// ======================== BOOTSTRAP ========================
window.addEventListener('load', async () => {
  console.log('🚀 App bootstrapping...');
  loadAll();

  window.addEventListener('app:logout', () => {
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

  const remember = localStorage.getItem('studentnija_remember');
  setTimeout(() => {
    const loadingScreen = document.getElementById('loadingScreen');
    if (loadingScreen) loadingScreen.classList.add('hide');
    setTimeout(() => {
      if (loadingScreen) loadingScreen.style.display = 'none';
      const appRoot = document.getElementById('appRoot');
      if (appRoot) appRoot.style.display = 'flex';
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