// ============================================================
// app.js – StudentNija Main Entry Point
// Full implementation with feature flags, maintenance, announcements,
// onboarding, tour, logout, delete account, and Turnstile auto-reset.
// ============================================================

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
  updateConnectionIndicator, setCurrentUser
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

// ======================== API HELPER ========================
import { apiPost, apiGet, setAuthToken, getAuthToken, API_BASE } from './api.js';

// ======================== TURNSTILE CONFIG ========================
const TURNSTILE_SITE_KEY = '0x4AAAAAAD46hrOUi9OGHQUP';

// ======================== GLOBAL TURNSTILE FIX CSS ========================
(function injectTurnstileStyles() {
  const style = document.createElement('style');
  style.textContent = `
    .turnstile-wrapper {
      width: 100%;
      min-height: 70px;
      margin: 14px 0;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: visible;
    }
    .turnstile-wrapper .cf-turnstile {
      display: block;
      width: auto;
      max-width: 100%;
      min-width: 0;
    }
    .turnstile-wrapper iframe {
      display: block;
      max-width: 100%;
    }
    @media (max-width: 400px) {
      .turnstile-wrapper {
        transform: scale(0.92);
        transform-origin: center;
        width: 108.7%;
        margin-left: -11.35%;
      }
    }
    @media (max-width: 340px) {
      .turnstile-wrapper {
        transform: scale(0.82);
        width: 121.95%;
        margin-left: -10.975%;
      }
    }
  `;
  document.head.appendChild(style);
})();

// ======================== TURNSTILE VERIFICATION ========================
async function verifyTurnstile(token) {
  try {
    const res = await fetch(`${API_BASE}/api/verify-turnstile`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token })
    });
    const data = await res.json();
    return data.success;
  } catch (e) {
    return false;
  }
}

// ======================== TURNSTILE RENDER WITH RESET ========================
function resetTurnstile() {
  if (typeof turnstile === 'undefined') return;
  const existingWidget = document.querySelector('.cf-turnstile');
  if (existingWidget) {
    const widgetId = existingWidget.getAttribute('data-widget-id');
    if (widgetId) {
      try { turnstile.remove(widgetId); } catch (e) {}
      existingWidget.removeAttribute('data-widget-id');
    }
    // Clear inner HTML to remove any stale iframe
    existingWidget.innerHTML = '';
  }
  // Re-render after a small delay to ensure DOM is ready
  setTimeout(() => {
    const widget = document.querySelector('.cf-turnstile');
    if (!widget) return;
    try {
      const widgetId = turnstile.render(widget, {
        sitekey: TURNSTILE_SITE_KEY,
        appearance: 'always',
        // Optionally, you can add callback to clear error state
      });
      widget.setAttribute('data-widget-id', widgetId);
    } catch (e) {
      console.warn('Turnstile render error:', e);
    }
  }, 100);
}

// Helper to get Turnstile token with a safety check
function getTurnstileToken() {
  if (typeof turnstile === 'undefined') return null;
  try {
    return turnstile.getResponse();
  } catch (e) {
    return null;
  }
}

// Helper to reset Turnstile after failed verification
function resetTurnstileWidget() {
  if (typeof turnstile === 'undefined') return;
  try {
    turnstile.reset();
  } catch (e) {
    // If reset fails, re-render the whole widget
    resetTurnstile();
  }
}

// ======================== CLOUD SYNC ========================
let syncTimer = null;
function scheduleCloudSync() {
  if (!currentUser || !currentUser.id) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    syncUserDataToCloud();
  }, 1000);
}
window.scheduleCloudSync = scheduleCloudSync;

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
  if (!user || !user.id) return;
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
  
  Object.keys(coursesData).forEach(k => delete coursesData[k]);
  semesterList.forEach(s => coursesData[s] = []);
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
  // Reset currentUser
  if (currentUser) {
    Object.keys(currentUser).forEach(key => delete currentUser[key]);
  }
  // Reset achievements and other arrays
  initAchievements();
}
window.clearPreviousUserData = clearPreviousUserData;

// ======================== ERROR HANDLERS ========================
window.addEventListener('unhandledrejection', function(event) {
  console.error('Unhandled promise rejection:', event.reason);
  if (window.showToast) {
    showToast('⚠️ An error occurred. Please try again.');
  }
  event.preventDefault();
});

window.onerror = function(message, source, lineno, colno, error) {
  console.error('Global error:', message, 'at', source, ':', lineno);
  if (window.showToast) {
    showToast('⚠️ Something went wrong. Please reload.');
  }
  return true;
};

// ======================== GLOBALS ========================
export let currentPage = "home";
window.currentPage = currentPage;

// ======================== FEATURE FLAGS ========================
let featureFlags = { ai: true, flashcards: true, gradePredictor: true, communityQ: true, registration: true, maintenance: false };
window.featureFlags = featureFlags;
let isMaintenanceMode = false;
window.isMaintenanceMode = () => isMaintenanceMode;

async function loadFeatureFlags() {
  try {
    const res = await apiGet('/api/admin/flags');
    if (res && typeof res === 'object') {
      featureFlags = res;
      window.featureFlags = res;
      isMaintenanceMode = res.maintenance || false;
    }
  } catch (e) {
    console.warn('Feature flags not available, using defaults.');
  }
}

// ======================== MAINTENANCE OVERLAY ========================
function showMaintenanceOverlay() {
  const container = document.getElementById('pagesContainer');
  if (container) {
    container.innerHTML = `
      <div class="page active-page" style="display:flex; align-items:center; justify-content:center; height:100vh; text-align:center; padding:20px; background:var(--bg-primary);">
        <div class="glass-card" style="padding:40px; max-width:500px; border-radius:30px; background:var(--bg-secondary); border:1px solid rgba(255,255,255,0.08);">
          <span style="font-size:64px; display:block; margin-bottom:16px;">🔧</span>
          <h2 style="font-size:28px; font-weight:800; margin-bottom:8px; color:var(--text-primary);">Under Maintenance</h2>
          <p style="font-size:16px; color:var(--text-muted); line-height:1.6;">
            StudentNija is currently undergoing scheduled maintenance.<br>
            We'll be back soon. Please check back later.
          </p>
          <div style="margin-top:20px;">
            <span class="badge" style="background:var(--accent-light);">⏳ Estimated downtime: 2 hours</span>
          </div>
        </div>
      </div>
    `;
    const bottomNav = document.getElementById('bottomNav');
    if (bottomNav) bottomNav.style.display = 'none';
    hideLoadingScreen();
  }
}

// ======================== ONBOARDING (FULL) ========================
function showOnboarding() {
  if (localStorage.getItem('studentnija_onboarded')) return;

  const old = document.getElementById('onboardingOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';

  overlay.innerHTML = `
    <style>
      @keyframes onboardingFadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes onboardingScaleIn { from { opacity:0; transform:scale(0.92) translateY(30px); } to { opacity:1; transform:scale(1) translateY(0); } }
      @keyframes onboardingFloat { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-10px) rotate(3deg); } }
      @keyframes onboardingPulse { 0%,100% { box-shadow:0 8px 25px rgba(0,135,81,0.28); } 50% { box-shadow:0 12px 35px rgba(0,135,81,0.5); } }
      @keyframes onboardingShine { 0% { transform:translateX(-150%) rotate(25deg); } 100% { transform:translateX(150%) rotate(25deg); } }
      #onboardingOverlay { position:fixed; inset:0; z-index:99999; }
      .onboarding-backdrop { position:fixed; inset:0; display:flex; align-items:center; justify-content:center; padding:18px; background:radial-gradient(circle at 50% 0%, rgba(0,135,81,0.14), transparent 42%), rgba(0,0,0,0.82); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); animation:onboardingFadeIn 0.35s ease; }
      .onboarding-card { position:relative; width:min(100%,420px); max-height:calc(100vh - 36px); overflow-y:auto; overflow-x:hidden; background:linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025)), var(--bg-secondary); border:1px solid rgba(255,255,255,0.1); border-radius:30px; box-shadow:0 30px 100px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,135,81,0.06); animation:onboardingScaleIn 0.55s cubic-bezier(0.2,0.9,0.3,1); scrollbar-width:none; }
      .onboarding-card::-webkit-scrollbar { display:none; }
      .onboarding-hero { position:relative; height:190px; overflow:hidden; display:flex; align-items:center; justify-content:center; background:radial-gradient(circle at 50% 45%, rgba(0,135,81,0.38), transparent 50%), linear-gradient(135deg, rgba(0,135,81,0.18), transparent 65%); }
      .onboarding-hero::before { content:""; position:absolute; width:260px; height:260px; border-radius:50%; border:1px solid rgba(0,135,81,0.18); box-shadow:0 0 0 25px rgba(0,135,81,0.035), 0 0 0 50px rgba(0,135,81,0.025); }
      .onboarding-hero::after { content:""; position:absolute; width:80px; height:240px; background:rgba(255,255,255,0.08); filter:blur(25px); transform:translateX(-180%) rotate(25deg); animation:onboardingShine 5s infinite ease-in-out; }
      .onboarding-orb { position:relative; z-index:2; width:92px; height:92px; display:flex; align-items:center; justify-content:center; border-radius:28px; font-size:48px; background:linear-gradient(145deg, var(--accent), var(--accent-light)); box-shadow:0 18px 40px rgba(0,135,81,0.35), inset 0 1px 1px rgba(255,255,255,0.25); animation:onboardingFloat 4s ease-in-out infinite; }
      .onboarding-orb::after { content:""; position:absolute; inset:-10px; border-radius:34px; border:1px solid rgba(0,135,81,0.35); animation:onboardingPulse 2.5s infinite ease-in-out; }
      .onboarding-status { position:absolute; top:18px; right:18px; z-index:3; display:flex; align-items:center; gap:6px; padding:7px 11px; border-radius:20px; font-size:11px; font-weight:700; color:var(--text-muted); background:rgba(0,0,0,0.22); border:1px solid rgba(255,255,255,0.08); }
      .onboarding-status-dot { width:7px; height:7px; border-radius:50%; background:var(--accent); box-shadow:0 0 10px var(--accent); }
      .onboarding-content { padding:26px 24px 24px; text-align:center; }
      .onboarding-eyebrow { margin-bottom:9px; font-size:11px; font-weight:800; letter-spacing:1.6px; text-transform:uppercase; color:var(--accent-light); }
      .onboarding-card h2 { margin:0; font-size:clamp(27px, 7vw, 34px); line-height:1.1; letter-spacing:-1px; font-weight:850; color:var(--text-primary); }
      .onboarding-card h2 span { background:linear-gradient(135deg, var(--accent), var(--accent-light)); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; }
      .onboarding-description { max-width:340px; margin:14px auto 24px; color:var(--text-muted); font-size:15px; line-height:1.55; }
      .onboarding-features { display:grid; grid-template-columns: repeat(2,1fr); gap:10px; margin-bottom:22px; text-align:left; }
      .onboarding-feature { position:relative; min-height:92px; padding:14px; overflow:hidden; border-radius:18px; background:rgba(255,255,255,0.035); border:1px solid rgba(255,255,255,0.065); transition:transform 0.2s ease, background 0.2s ease; }
      .onboarding-feature:hover { transform:translateY(-2px); background:rgba(255,255,255,0.06); }
      .onboarding-feature-icon { width:34px; height:34px; display:flex; align-items:center; justify-content:center; margin-bottom:9px; border-radius:11px; font-size:18px; background:rgba(0,135,81,0.14); }
      .onboarding-feature strong { display:block; margin-bottom:3px; font-size:13px; font-weight:750; color:var(--text-primary); }
      .onboarding-feature small { display:block; color:var(--text-muted); font-size:11px; line-height:1.35; }
      .onboarding-feature-wide { grid-column:span 2; min-height:auto; display:flex; align-items:center; gap:12px; }
      .onboarding-feature-wide .onboarding-feature-icon { flex-shrink:0; margin:0; }
      .onboarding-feature-wide strong { margin-bottom:2px; }
      .onboarding-cta { position:relative; width:100%; overflow:hidden; padding:15px 20px; border:none; border-radius:16px; color:white; background:linear-gradient(135deg, var(--accent), var(--accent-light)); box-shadow:0 8px 25px rgba(0,135,81,0.3); font-family:inherit; font-size:16px; font-weight:800; cursor:pointer; transition:transform 0.2s ease, box-shadow 0.2s ease; }
      .onboarding-cta::after { content:""; position:absolute; top:-50%; left:-100%; width:60%; height:200%; background:rgba(255,255,255,0.18); transform:rotate(25deg); transition:left 0.6s ease; }
      .onboarding-cta:hover::after { left:150%; }
      .onboarding-cta:active { transform:scale(0.97); }
      .onboarding-footer { margin-top:13px; color:var(--text-muted); font-size:11px; opacity:0.75; }
      @media (max-width:380px) { .onboarding-card { border-radius:25px; } .onboarding-hero { height:160px; } .onboarding-content { padding:22px 18px 20px; } .onboarding-features { gap:8px; } .onboarding-feature { padding:12px; } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:0.01ms !important; animation-iteration-count:1 !important; transition-duration:0.01ms !important; } }
    </style>

    <div class="onboarding-backdrop" id="onboardingBackdrop">
      <div class="onboarding-card">
        <div class="onboarding-hero">
          <div class="onboarding-status"><span class="onboarding-status-dot"></span>Built for students</div>
          <div class="onboarding-orb">🎓</div>
        </div>
        <div class="onboarding-content">
          <div class="onboarding-eyebrow">Welcome to your new advantage</div>
          <h2>Study smarter.<br><span>Go further.</span> 🚀</h2>
          <p class="onboarding-description">StudentNija brings your academic life into one powerful space. Plan your semester, stay organized, learn with AI, and keep moving toward your goals.</p>
          <div class="onboarding-features">
            <div class="onboarding-feature"><div class="onboarding-feature-icon">📚</div><strong>Academic Hub</strong><small>Manage courses, CGPA and academic progress.</small></div>
            <div class="onboarding-feature"><div class="onboarding-feature-icon">🧠</div><strong>AI Learning</strong><small>Get help, explanations and smarter study support.</small></div>
            <div class="onboarding-feature"><div class="onboarding-feature-icon">⏱️</div><strong>Stay Organized</strong><small>Tasks, timetable, reminders and exam planning.</small></div>
            <div class="onboarding-feature"><div class="onboarding-feature-icon">📝</div><strong>Practice More</strong><small>Prepare with questions and revision tools.</small></div>
            <div class="onboarding-feature onboarding-feature-wide"><div class="onboarding-feature-icon">🌍</div><div><strong>Your student life. One smarter platform.</strong><small>Everything you need to learn, plan and progress.</small></div></div>
          </div>
          <button class="onboarding-cta" id="onboardCloseBtn">Let's Get Started <span>→</span></button>
          <div class="onboarding-footer">Built to help you learn faster and achieve more.</div>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const closeBtn = document.getElementById('onboardCloseBtn');
  const backdrop = document.getElementById('onboardingBackdrop');

  function dismiss() {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.25s ease';
    setTimeout(() => {
      overlay.remove();
      localStorage.setItem('studentnija_onboarded', 'true');
      setTimeout(() => {
        if (!localStorage.getItem('studentnija_instructions_read')) {
          startStudentNijaTour();
        }
      }, 500);
    }, 250);
  }

  if (closeBtn) closeBtn.addEventListener('click', dismiss);
  if (backdrop) backdrop.addEventListener('click', (e) => { if (e.target === backdrop) dismiss(); });
}

// ======================== DETAILED ONBOARDING TOUR (FULL) ========================
function startStudentNijaTour() {
  if (localStorage.getItem('studentnija_instructions_read')) return;

  let currentStep = 0;

  const steps = [
    {
      category: 'YOUR STUDENT COMMAND CENTER',
      icon: '🏠',
      title: 'Welcome to Your Dashboard',
      description:
        'Your StudentNija dashboard gives you a complete overview of your academic life. Check your study streak, upcoming exams, pending tasks, academic progress, recent activity, and quick-access tools from one central place.',
      features: [
        'Daily study streak',
        'Academic overview',
        'Upcoming activities',
        'Quick tools'
      ]
    },
    {
      category: 'ACADEMIC PERFORMANCE',
      icon: '🎓',
      title: 'Manage Your Academics',
      description:
        'Keep your academic journey organized from your first semester to graduation. Add your courses, record your results, track your grades, calculate your GPA and CGPA, and monitor your progress over time.',
      features: [
        'Course management',
        'Semester results',
        'GPA & CGPA tracking',
        'Academic progress'
      ]
    },
    {
      category: 'SMART ACADEMIC PLANNING',
      icon: '📊',
      title: 'Understand Your Performance',
      description:
        'StudentNija helps you understand where you stand academically. Set academic goals, monitor your grade performance, and see the progress you need to make toward your target GPA or CGPA.',
      features: [
        'Target GPA planning',
        'Grade analysis',
        'Semester tracking',
        'Performance insights'
      ]
    },
    {
      category: 'PRODUCTIVITY',
      icon: '✅',
      title: 'Never Lose Track of Your Tasks',
      description:
        'Create and manage your academic tasks in one place. Add assignments, personal goals, deadlines, recurring activities, and priorities so you always know what needs your attention next.',
      features: [
        'Daily tasks',
        'Priority levels',
        'Deadlines',
        'Recurring tasks'
      ]
    },
    {
      category: 'TIME MANAGEMENT',
      icon: '🗓️',
      title: 'Plan Your Week',
      description:
        'Build your personal academic timetable and organize your weekly schedule. Add classes, study sessions, important events, and activities to create a clearer picture of your time.',
      features: [
        'Weekly timetable',
        'Class schedules',
        'Study sessions',
        'Time organization'
      ]
    },
    {
      category: 'EXAM PREPARATION',
      icon: '⏳',
      title: 'Stay Ahead of Exams',
      description:
        'Never be surprised by an important examination again. Create exam countdowns, track important dates, and plan your preparation around the time you have remaining.',
      features: [
        'Exam countdowns',
        'Important dates',
        'Revision planning',
        'Preparation tracking'
      ]
    },
    {
      category: 'AI-POWERED LEARNING',
      icon: '🧠',
      title: 'Meet Your AI Study Companion',
      description:
        'Ask questions, request explanations, simplify difficult concepts, brainstorm ideas, and get personalized academic assistance. Your AI Tutor is designed to help you understand, not simply give you answers.',
      features: [
        'Ask academic questions',
        'Understand difficult topics',
        'Get explanations',
        'Study with AI'
      ]
    },
    {
      category: 'EXAM PRACTICE',
      icon: '📝',
      title: 'Practice With Past Questions',
      description:
        'Prepare more effectively by practicing questions related to your examinations. Test your knowledge, identify weak areas, and use practice sessions to improve your confidence before the real exam.',
      features: [
        'Past questions',
        'Practice sessions',
        'Subject preparation',
        'Knowledge testing'
      ]
    },
    {
      category: 'STUDY RESOURCES',
      icon: '📚',
      title: 'Build Your Digital Study Space',
      description:
        'Keep your academic resources organized and accessible. Use your notes, saved materials, library resources, flashcards, and other study tools to build a personal learning environment.',
      features: [
        'Study notes',
        'Saved resources',
        'Digital library',
        'Flashcards'
      ]
    },
    {
      category: 'ACTIVE RECALL',
      icon: '🃏',
      title: 'Remember More With Flashcards',
      description:
        'Create digital flashcards to revise important concepts, definitions, formulas, and key information. Flashcards help you actively test your memory instead of simply reading the same material repeatedly.',
      features: [
        'Create flashcards',
        'Review concepts',
        'Active recall',
        'Faster revision'
      ]
    },
    {
      category: 'STUDENT COMMUNITY',
      icon: '💬',
      title: 'Learn Together With Study Groups',
      description:
        'Connect with other students through study groups. Collaborate, discuss difficult topics, share academic resources, ask questions, and learn with people who are working toward similar goals.',
      features: [
        'Join study groups',
        'Create communities',
        'Share resources',
        'Discuss topics'
      ]
    },
    {
      category: 'PERSONAL PRODUCTIVITY',
      icon: '🧮',
      title: 'Useful Tools When You Need Them',
      description:
        'StudentNija includes quick-access tools designed to help with everyday academic tasks. Use the calculator, math solver, dictionary, and other utilities without leaving your study environment.',
      features: [
        'Calculator',
        'Math Solver',
        'Dictionary',
        'Quick utilities'
      ]
    },
    {
      category: 'ACHIEVEMENT SYSTEM',
      icon: '🏆',
      title: 'Track Your Progress',
      description:
        'Your academic journey is built one step at a time. Track your study activity, maintain your streaks, unlock achievements, and see the progress you are making toward becoming a better student.',
      features: [
        'Study streaks',
        'Achievements',
        'Progress tracking',
        'Personal milestones'
      ]
    },
    {
      category: 'SMART REMINDERS',
      icon: '🔔',
      title: 'Stay Informed',
      description:
        'Important tasks and academic activities should not depend entirely on your memory. StudentNija helps you stay aware of reminders, deadlines, updates, and other important events.',
      features: [
        'Task reminders',
        'Deadline awareness',
        'Academic updates',
        'Notifications'
      ]
    },
    {
      category: 'PERSONALIZATION',
      icon: '⚙️',
      title: 'Make StudentNija Yours',
      description:
        'Customize your experience through your profile and settings. Manage your personal information, preferences, notifications, account security, and the way you interact with the platform.',
      features: [
        'Profile management',
        'App preferences',
        'Notification settings',
        'Account controls'
      ]
    },
    {
      category: 'YOUR DATA',
      icon: '☁️',
      title: 'Keep Your Progress Safe',
      description:
        'Your academic progress matters. Cloud synchronization helps keep your important StudentNija data backed up and available across supported devices. Use Sync Now whenever you want to update your cloud data.',
      features: [
        'Cloud synchronization',
        'Data backup',
        'Cross-device access',
        'Sync controls'
      ]
    },
    {
      category: 'SECURITY',
      icon: '🛡️',
      title: 'Protect Your Account',
      description:
        'Manage important security features from your account settings. Keep your profile secure and use available account protection tools to help safeguard your StudentNija experience.',
      features: [
        'Account security',
        'Security settings',
        'Two-factor authentication',
        'Account protection'
      ]
    },
    {
      category: 'YOUR ACADEMIC FUTURE',
      icon: '🚀',
      title: 'Everything Starts Here',
      description:
        'StudentNija is more than a place to store notes. It is your personal academic command center — helping you plan better, study smarter, stay organized, prepare for exams, and keep moving toward your goals.',
      features: [
        'Learn',
        'Plan',
        'Practice',
        'Progress'
      ]
    }
  ];

  const overlay = document.createElement('div');
  overlay.id = 'detailedOnboardingOverlay';
  overlay.innerHTML = `
    <style>
      #detailedOnboardingOverlay {
        position: fixed; inset: 0; z-index: 100000;
        display: flex; align-items: center; justify-content: center; padding: 16px;
        background: radial-gradient(circle at 50% 0%, rgba(0,135,81,0.16), transparent 42%), rgba(0,0,0,0.82);
        backdrop-filter: blur(18px); -webkit-backdrop-filter: blur(18px);
        font-family: system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
        animation: onboardingFadeIn 0.35s ease;
      }
      @keyframes onboardingFadeIn { from { opacity:0; } to { opacity:1; } }
      @keyframes onboardingCardIn { from { opacity:0; transform:translateY(25px) scale(0.96); } to { opacity:1; transform:translateY(0) scale(1); } }
      @keyframes iconFloat { 0%,100% { transform:translateY(0) rotate(0deg); } 50% { transform:translateY(-7px) rotate(3deg); } }
      .tour-card {
        position: relative; width: min(100%, 440px); max-height: calc(100vh - 32px);
        overflow-y: auto; overflow-x: hidden; padding: 26px 22px 20px;
        border-radius: 30px; color: var(--text-primary, #f5f5f5);
        background: linear-gradient(145deg, rgba(255,255,255,0.08), rgba(255,255,255,0.025)), var(--bg-secondary, #1e1e2f);
        border: 1px solid rgba(255,255,255,0.1); box-shadow: 0 30px 90px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,135,81,0.05);
        animation: onboardingCardIn 0.5s cubic-bezier(0.2,0.9,0.3,1); scrollbar-width: none;
      }
      .tour-card::-webkit-scrollbar { display:none; }
      .tour-top { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:22px; }
      .tour-brand { display:flex; align-items:center; gap:8px; font-size:13px; font-weight:800; letter-spacing:-0.2px; }
      .tour-brand-mark { width:28px; height:28px; display:flex; align-items:center; justify-content:center; border-radius:9px; font-size:15px; background:linear-gradient(135deg, var(--accent, #008751), var(--accent-light, #48b985)); }
      .tour-counter { color:var(--text-muted, #999); font-size:11px; font-weight:700; }
      .step-indicators { display:flex; align-items:center; gap:5px; margin-bottom:22px; }
      .dot { height:4px; flex:1; max-width:28px; border-radius:10px; background:rgba(255,255,255,0.12); transition:background 0.3s ease, max-width 0.3s ease; }
      .dot.active { max-width:48px; background:var(--accent, #008751); }
      .tour-category { margin-bottom:10px; color:var(--accent-light, #48b985); font-size:10px; font-weight:900; letter-spacing:1.5px; }
      .step-icon-wrapper { width:78px; height:78px; display:flex; align-items:center; justify-content:center; margin:0 auto 16px; border-radius:24px; background:radial-gradient(circle at 30% 20%, rgba(255,255,255,0.16), transparent 60%), rgba(0,135,81,0.14); border:1px solid rgba(0,135,81,0.25); box-shadow:0 12px 35px rgba(0,135,81,0.14); animation:iconFloat 4s ease-in-out infinite; }
      .step-icon { font-size:42px; display:block; }
      .step-title { margin:0 0 12px; font-size:clamp(22px, 6vw, 28px); line-height:1.15; font-weight:850; letter-spacing:-0.8px; }
      .step-description { margin:0 auto 20px; max-width:390px; color:var(--text-muted, #b0b0c0); font-size:14px; line-height:1.65; }
      .step-features { display:grid; grid-template-columns: repeat(2,1fr); gap:8px; margin-bottom:24px; text-align:left; }
      .step-feature { display:flex; align-items:center; gap:7px; padding:9px 10px; border-radius:12px; color:var(--text-muted, #b0b0c0); background:rgba(255,255,255,0.035); border:1px solid rgba(255,255,255,0.06); font-size:11px; font-weight:600; }
      .step-feature::before { content:"✓"; color:var(--accent-light, #48b985); font-size:13px; font-weight:900; }
      .tour-actions { display:flex; align-items:center; gap:8px; margin-top:4px; }
      .skip-link { padding:9px 4px; border:none; color:var(--text-muted, #888); background:transparent; font-size:12px; cursor:pointer; }
      .skip-link:hover { color:var(--text-primary, #fff); }
      .flex-spacer { flex:1; }
      .btn-outline, .btn-primary { border-radius:13px; padding:11px 16px; font-family:inherit; font-size:13px; font-weight:750; cursor:pointer; transition:transform 0.2s ease, opacity 0.2s ease, background 0.2s ease; }
      .btn-outline { color:var(--text-primary, #fff); background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.12); }
      .btn-primary { color:white; background:linear-gradient(135deg, var(--accent, #008751), var(--accent-light, #48b985)); border:none; box-shadow:0 8px 22px rgba(0,135,81,0.25); }
      .btn-outline:hover, .btn-primary:hover { transform:translateY(-1px); }
      .btn-primary:active, .btn-outline:active { transform:scale(0.96); }
      @media (max-width:380px) { .tour-card { padding:22px 17px 17px; border-radius:25px; } .step-icon-wrapper { width:68px; height:68px; } .step-icon { font-size:36px; } .step-description { font-size:13px; } .step-feature { font-size:10px; } }
      @media (prefers-reduced-motion: reduce) { *, *::before, *::after { animation-duration:0.01ms !important; animation-iteration-count:1 !important; transition-duration:0.01ms !important; } }
    </style>

    <div class="tour-card">
      <div class="tour-top">
        <div class="tour-brand">
          <div class="tour-brand-mark">🎓</div>
          StudentNija
        </div>
        <div class="tour-counter" id="tourCounter">1 / ${steps.length}</div>
      </div>
      <div class="step-indicators" id="stepDots">${steps.map((_, i) => `<span class="dot ${i === 0 ? 'active' : ''}"></span>`).join('')}</div>
      <div class="tour-category" id="tourCategory">${steps[0].category}</div>
      <div class="step-icon-wrapper"><span class="step-icon" id="stepIcon">${steps[0].icon}</span></div>
      <div class="step-title" id="stepTitle">${steps[0].title}</div>
      <div class="step-description" id="stepDescription">${steps[0].description}</div>
      <div class="step-features" id="stepFeatures">${steps[0].features.map(f => `<div class="step-feature">${f}</div>`).join('')}</div>
      <div class="tour-actions">
        <button class="skip-link" id="skipTourBtn">Skip tour</button>
        <div class="flex-spacer"></div>
        <button class="btn-outline" id="prevStepBtn" style="display:none;">← Back</button>
        <button class="btn-primary" id="nextStepBtn">Next →</button>
        <button class="btn-primary" id="finishTourBtn" style="display:none;">Get Started 🚀</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  const dots = overlay.querySelectorAll('.dot');
  const iconEl = overlay.querySelector('#stepIcon');
  const titleEl = overlay.querySelector('#stepTitle');
  const descEl = overlay.querySelector('#stepDescription');
  const categoryEl = overlay.querySelector('#tourCategory');
  const featuresEl = overlay.querySelector('#stepFeatures');
  const counterEl = overlay.querySelector('#tourCounter');
  const prevBtn = overlay.querySelector('#prevStepBtn');
  const nextBtn = overlay.querySelector('#nextStepBtn');
  const finishBtn = overlay.querySelector('#finishTourBtn');
  const skipBtn = overlay.querySelector('#skipTourBtn');

  function renderStep(index) {
    const step = steps[index];
    iconEl.textContent = step.icon;
    titleEl.textContent = step.title;
    descEl.textContent = step.description;
    categoryEl.textContent = step.category;
    counterEl.textContent = `${index + 1} / ${steps.length}`;
    featuresEl.innerHTML = step.features.map(f => `<div class="step-feature">${f}</div>`).join('');
    dots.forEach((dot, i) => { dot.classList.toggle('active', i === index); });
    prevBtn.style.display = index === 0 ? 'none' : 'inline-block';
    nextBtn.style.display = index === steps.length - 1 ? 'none' : 'inline-block';
    finishBtn.style.display = index === steps.length - 1 ? 'inline-block' : 'none';
  }

  function goToStep(index) { if (index < 0 || index >= steps.length) return; currentStep = index; renderStep(currentStep); }
  function nextStep() { if (currentStep < steps.length - 1) goToStep(currentStep + 1); }
  function prevStep() { if (currentStep > 0) goToStep(currentStep - 1); }
  function finishTour() {
    overlay.style.opacity = '0';
    overlay.style.transition = 'opacity 0.25s ease';
    setTimeout(() => overlay.remove(), 250);
    localStorage.setItem('studentnija_instructions_read', 'true');
  }

  nextBtn.addEventListener('click', nextStep);
  prevBtn.addEventListener('click', prevStep);
  finishBtn.addEventListener('click', finishTour);
  skipBtn.addEventListener('click', finishTour);

  function keyboardHandler(event) {
    if (!document.body.contains(overlay)) { document.removeEventListener('keydown', keyboardHandler); return; }
    if (event.key === 'ArrowRight' || event.key === 'ArrowDown') { event.preventDefault(); if (currentStep < steps.length - 1) nextStep(); }
    else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') { event.preventDefault(); if (currentStep > 0) prevStep(); }
    else if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); if (currentStep === steps.length - 1) finishTour(); else nextStep(); }
    else if (event.key === 'Escape') { finishTour(); }
  }
  document.addEventListener('keydown', keyboardHandler);

  renderStep(0);
}

// ======================== AUTO FULLSCREEN ON FIRST TAP ========================
(function() {
  let fullscreenRequested = false;
  function requestFullscreen() {
    if (fullscreenRequested) return;
    fullscreenRequested = true;
    const el = document.documentElement;
    if (el.requestFullscreen) el.requestFullscreen().catch(() => {});
    else if (el.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else if (el.msRequestFullscreen) el.msRequestFullscreen();
  }
  document.addEventListener('click', requestFullscreen, { once: true });
  document.addEventListener('touchstart', requestFullscreen, { once: true });
})();

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
    <h1 style="color:#008751; font-size:32px; display:flex; align-items:center; justify-content:center; gap:10px;">
      <img src="icons/icon.png" alt="StudentNija" style="height:40px; width:auto;"> StudentNija
    </h1>
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

  // === Registration disabled check ===
  if (formType === 'register' && !window.featureFlags?.registration) {
    container.innerHTML = `
      <p class="text-muted" style="font-size:16px; margin:20px 0;">🔒 Registration is currently disabled by the administrator.</p>
      <button class="btn-outline" id="backLoginFromReg" style="margin-top:8px;">Back to Login</button>
    `;
    document.getElementById('backLoginFromReg')?.addEventListener('click', () => showAuthForm('login'));
    return;
  }

  if (formType === 'login') {
    container.innerHTML = `
      <input id="loginEmail" placeholder="Email" type="email">
      <input id="loginPass" type="password" placeholder="Password">
      <div class="flex-between" style="margin:8px 0">
        <label><input type="checkbox" id="rememberMe" checked> Remember Me</label>
        <span id="forgotBtn" style="color:#F4B400; cursor:pointer;">Forgot?</span>
      </div>
      <div class="turnstile-wrapper">
        <div class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}" data-appearance="always"></div>
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
    resetTurnstile();

    document.getElementById('doLogin')?.addEventListener('click', async function() {
      const email = document.getElementById('loginEmail').value;
      const pwd = document.getElementById('loginPass').value;
      const rem = document.getElementById('rememberMe')?.checked;

      // Get Turnstile token
      const token = getTurnstileToken();
      if (!token) {
        alert('Please complete the security check.');
        resetTurnstileWidget();
        return;
      }

      try {
        const human = await verifyTurnstile(token);
        if (!human) {
          alert('Verification failed. Please try again.');
          resetTurnstileWidget();
          return;
        }

        const data = await apiPost('/api/auth/login', { email, password: pwd });
        if (data.success) {
          setAuthToken(data.token);
          setCurrentUser(data.user);
          if (rem) {
            localStorage.setItem('remember_me', 'true');
          } else {
            localStorage.removeItem('remember_me');
            sessionStorage.setItem('studentnija_jwt', data.token);
          }
          syncLocalUserToServer(currentUser);
          await loadCloudData(currentUser.id);
          addNotification('Login', `Welcome back, ${currentUser.fullName}`);
          renderMainApp();
          if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
          trackEvent('login');
        } else {
          alert(data.error || 'Login failed');
          resetTurnstileWidget();
        }
      } catch (e) {
        alert('Login error: ' + e.message);
        resetTurnstileWidget();
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
      <input id="regPass" type="password" placeholder="Password (min 6 chars)">
      <input id="regConfirm" type="password" placeholder="Confirm Password">
      <input id="regSchool" placeholder="School / University">
      <input id="regDept" placeholder="Department">
      <input id="regLevel" placeholder="Level (e.g., 300L)">
      <div class="turnstile-wrapper">
        <div class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}" data-appearance="always"></div>
      </div>
      <button class="btn-primary" id="doRegister">Register</button>
      <button class="btn-outline" id="backLogin" style="margin-top:8px;">Back to Login</button>
    `;
    resetTurnstile();

    document.getElementById('doRegister')?.addEventListener('click', async function() {
      const name = document.getElementById('regName').value;
      const email = document.getElementById('regEmail').value;
      const pass = document.getElementById('regPass').value;
      const conf = document.getElementById('regConfirm').value;
      const school = document.getElementById('regSchool').value;
      const dept = document.getElementById('regDept').value;
      const level = document.getElementById('regLevel').value;

      if (!name || !email || !pass || !school || !dept || !level) {
        alert('All fields required');
        return;
      }
      if (pass !== conf) {
        alert('Passwords do not match');
        return;
      }
      if (pass.length < 6) {
        alert('Password must be at least 6 characters');
        return;
      }
      if (!email.includes('@')) {
        alert('Invalid email');
        return;
      }

      const token = getTurnstileToken();
      if (!token) {
        alert('Please complete the security check.');
        resetTurnstileWidget();
        return;
      }

      try {
        const human = await verifyTurnstile(token);
        if (!human) {
          alert('Verification failed. Please try again.');
          resetTurnstileWidget();
          return;
        }

        const data = await apiPost('/api/auth/register', {
          fullName: name,
          email,
          password: pass,
          school,
          department: dept,
          level
        });
        if (data.success) {
          setAuthToken(data.token);
          setCurrentUser(data.user);
          localStorage.removeItem('remember_me');
          sessionStorage.setItem('studentnija_jwt', data.token);
          syncLocalUserToServer(currentUser);
          await loadCloudData(currentUser.id);
          addNotification('Welcome', `Welcome, ${currentUser.fullName}`);
          alert('Registration successful!');
          renderMainApp();
          if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
          trackEvent('register');
        } else {
          alert(data.error || 'Registration failed');
          resetTurnstileWidget();
        }
      } catch (e) {
        alert('Registration error: ' + e.message);
        resetTurnstileWidget();
      }
    });

    document.getElementById('backLogin')?.addEventListener('click', function() {
      showAuthForm('login');
    });

  } else if (formType === 'forgot') {
    container.innerHTML = `
      <p>Enter your email to receive a password reset link.</p>
      <input id="resetEmail" placeholder="Email">
      <div class="turnstile-wrapper">
        <div class="cf-turnstile" data-sitekey="${TURNSTILE_SITE_KEY}" data-appearance="always"></div>
      </div>
      <button class="btn-primary" id="sendResetBtn">Send Reset Link</button>
      <button class="btn-outline" id="backToLoginBtn" style="margin-top:8px;">Back to Login</button>
    `;
    resetTurnstile();

    document.getElementById('sendResetBtn')?.addEventListener('click', async function() {
      const email = document.getElementById('resetEmail').value.trim();
      if (!email || !email.includes('@')) { alert('Please enter a valid email.'); return; }

      const token = getTurnstileToken();
      if (!token) {
        alert('Please complete the security check.');
        resetTurnstileWidget();
        return;
      }

      try {
        const human = await verifyTurnstile(token);
        if (!human) {
          alert('Verification failed. Please try again.');
          resetTurnstileWidget();
          return;
        }

        await apiPost('/api/auth/forgot-password', { email });
        alert('If an account with that email exists, a reset link has been sent.');
        showAuthForm('login');
      } catch (e) {
        alert('Could not send reset email. Please try again later.');
        resetTurnstileWidget();
      }
    });

    document.getElementById('backToLoginBtn')?.addEventListener('click', function() {
      showAuthForm('login');
    });
  }
}

// ======================== GOOGLE SIGN-IN ========================
export function startGoogleSignIn() {
  window.location.href = API_BASE + '/api/auth/google';
}

// ======================== PROCESS GOOGLE USER (callback) ========================
export function processGoogleAuthCallback() {
  const params = new URLSearchParams(window.location.search);
  const token = params.get('token');
  const userData = params.get('user');
  if (token && userData) {
    try {
      const user = JSON.parse(decodeURIComponent(userData));
      setAuthToken(token);
      setCurrentUser(user);
      if (localStorage.getItem('remember_me') === 'true') {
        localStorage.setItem('studentnija_jwt', token);
      } else {
        sessionStorage.setItem('studentnija_jwt', token);
      }
      syncLocalUserToServer(currentUser);
      loadCloudData(currentUser.id).then(() => {
        renderMainApp();
        if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
      });
      trackEvent('login_google');
      window.history.replaceState({}, document.title, window.location.pathname);
    } catch (e) {
      console.error('Google auth callback error', e);
      renderAuth();
    }
  }
}

// ======================== LOGOUT ========================
window.logout = function() {
  clearPreviousUserData();
  setAuthToken(null);
  localStorage.removeItem('remember_me');
  sessionStorage.removeItem('studentnija_jwt');
  // Reset currentUser
  if (currentUser) {
    Object.keys(currentUser).forEach(key => delete currentUser[key]);
  }
  // Redirect to login
  window.location.href = window.location.origin;
};

// ======================== DELETE ACCOUNT (cloud) ========================
window.deleteAccount = async function() {
  if (!confirm('⚠️ Are you sure you want to permanently delete your account?\n\nThis action cannot be undone. All your data will be lost.')) return;
  if (!currentUser || !currentUser.id) return alert('You are not logged in.');

  const token = getAuthToken();
  if (!token) return alert('No authentication token found.');

  try {
    const res = await fetch(`${API_BASE}/api/users/${currentUser.id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
    const data = await res.json();
    if (data.success) {
      alert('Account deleted successfully.');
      // Logout after deletion
      clearPreviousUserData();
      setAuthToken(null);
      localStorage.removeItem('remember_me');
      sessionStorage.removeItem('studentnija_jwt');
      if (currentUser) {
        Object.keys(currentUser).forEach(key => delete currentUser[key]);
      }
      window.location.href = window.location.origin;
    } else {
      alert('Deletion failed: ' + (data.error || 'Unknown error'));
    }
  } catch (e) {
    alert('Network error: ' + e.message);
  }
};

// ======================== RENDER APP ========================
export async function renderApp() {
  console.log('🔄 renderApp() called');

  // Load feature flags first
  await loadFeatureFlags();

  // Check maintenance mode
  if (window.featureFlags.maintenance) {
    showMaintenanceOverlay();
    return;
  }

  // Check if we are on the callback page
  if (window.location.pathname.includes('studentnija_sync.html') || window.location.search.includes('token')) {
    processGoogleAuthCallback();
    return;
  }

  const token = getAuthToken();
  if (token) {
    try {
      const data = await apiGet('/api/auth/me');
      if (data.user) {
        setCurrentUser(data.user);
        clearPreviousUserData(); // Clear local data first, then load cloud
        await loadCloudData(currentUser.id);
        renderMainApp();
        if (!localStorage.getItem('studentnija_onboarded')) showOnboarding();
        return;
      } else {
        setAuthToken(null);
        renderAuth();
      }
    } catch (e) {
      setAuthToken(null);
      renderAuth();
    }
  } else {
    const sessionToken = sessionStorage.getItem('studentnija_jwt');
    if (sessionToken) {
      setAuthToken(sessionToken);
      renderApp(); // retry
      return;
    }
    const urlToken = new URLSearchParams(window.location.search).get('token');
    if (urlToken) {
      setAuthToken(urlToken);
      window.history.replaceState({}, document.title, window.location.pathname);
      renderApp();
      return;
    }
    renderAuth();
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

// ======================== BOOTSTRAP ========================
window.addEventListener('load', async () => {
  console.log('🚀 App bootstrapping...');
  loadAll();

  // Check for Google OAuth callback (if redirected from backend)
  if (window.location.search.includes('token') && window.location.search.includes('user')) {
    processGoogleAuthCallback();
    return;
  }

  // Render app (will check maintenance and flags)
  await renderApp();

  // Listen for logout events
  window.addEventListener('app:logout', () => {
    clearPreviousUserData();
    setAuthToken(null);
    localStorage.removeItem('remember_me');
    sessionStorage.removeItem('studentnija_jwt');
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