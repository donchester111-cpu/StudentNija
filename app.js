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

// ======================== ONBOARDING (WELCOME + GUIDED TOUR) ========================
function showOnboarding() {
  if (localStorage.getItem('studentnija_onboarded')) return;

  const old = document.getElementById('onboardingOverlay');
  if (old) old.remove();

  const overlay = document.createElement('div');
  overlay.id = 'onboardingOverlay';

  overlay.innerHTML = `
    <style>
      @keyframes onboardingFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
      }

      @keyframes onboardingScaleIn {
        from { opacity: 0; transform: scale(0.92) translateY(30px); }
        to { opacity: 1; transform: scale(1) translateY(0); }
      }

      @keyframes onboardingFloat {
        0%, 100% { transform: translateY(0) rotate(0deg); }
        50% { transform: translateY(-10px) rotate(3deg); }
      }

      @keyframes onboardingPulse {
        0%, 100% { box-shadow: 0 8px 25px rgba(0, 135, 81, 0.28); }
        50% { box-shadow: 0 12px 35px rgba(0, 135, 81, 0.5); }
      }

      @keyframes onboardingShine {
        0% { transform: translateX(-150%) rotate(25deg); }
        100% { transform: translateX(150%) rotate(25deg); }
      }

      #onboardingOverlay {
        position: fixed;
        inset: 0;
        z-index: 99999;
      }

      .onboarding-backdrop {
        position: fixed;
        inset: 0;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 18px;
        background:
          radial-gradient(
            circle at 50% 0%,
            rgba(0, 135, 81, 0.14),
            transparent 42%
          ),
          rgba(0, 0, 0, 0.82);
        backdrop-filter: blur(18px);
        -webkit-backdrop-filter: blur(18px);
        animation: onboardingFadeIn 0.35s ease;
      }

      .onboarding-card {
        position: relative;
        width: min(100%, 420px);
        max-height: calc(100vh - 36px);
        overflow-y: auto;
        overflow-x: hidden;
        background:
          linear-gradient(
            145deg,
            rgba(255,255,255,0.08),
            rgba(255,255,255,0.025)
          ),
          var(--bg-secondary);
        border: 1px solid rgba(255,255,255,0.1);
        border-radius: 30px;
        box-shadow:
          0 30px 100px rgba(0,0,0,0.65),
          0 0 0 1px rgba(0,135,81,0.06);
        animation: onboardingScaleIn 0.55s cubic-bezier(0.2, 0.9, 0.3, 1);
        scrollbar-width: none;
      }

      .onboarding-card::-webkit-scrollbar { display: none; }

      .onboarding-hero {
        position: relative;
        height: 190px;
        overflow: hidden;
        display: flex;
        align-items: center;
        justify-content: center;
        background:
          radial-gradient(
            circle at 50% 45%,
            rgba(0, 135, 81, 0.38),
            transparent 50%
          ),
          linear-gradient(
            135deg,
            rgba(0, 135, 81, 0.18),
            transparent 65%
          );
      }

      .onboarding-hero::before {
        content: "";
        position: absolute;
        width: 260px;
        height: 260px;
        border-radius: 50%;
        border: 1px solid rgba(0, 135, 81, 0.18);
        box-shadow:
          0 0 0 25px rgba(0, 135, 81, 0.035),
          0 0 0 50px rgba(0, 135, 81, 0.025);
      }

      .onboarding-hero::after {
        content: "";
        position: absolute;
        width: 80px;
        height: 240px;
        background: rgba(255,255,255,0.08);
        filter: blur(25px);
        transform: translateX(-180%) rotate(25deg);
        animation: onboardingShine 5s infinite ease-in-out;
      }

      .onboarding-orb {
        position: relative;
        z-index: 2;
        width: 92px;
        height: 92px;
        display: flex;
        align-items: center;
        justify-content: center;
        border-radius: 28px;
        font-size: 48px;
        background:
          linear-gradient(
            145deg,
            var(--accent),
            var(--accent-light)
          );
        box-shadow:
          0 18px 40px rgba(0, 135, 81, 0.35),
          inset 0 1px 1px rgba(255,255,255,0.25);
        animation: onboardingFloat 4s ease-in-out infinite;
      }

      .onboarding-orb::after {
        content: "";
        position: absolute;
        inset: -10px;
        border-radius: 34px;
        border: 1px solid rgba(0, 135, 81, 0.35);
        animation: onboardingPulse 2.5s infinite ease-in-out;
      }

      .onboarding-status {
        position: absolute;
        top: 18px;
        right: 18px;
        z-index: 3;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 7px 11px;
        border-radius: 20px;
        font-size: 11px;
        font-weight: 700;
        color: var(--text-muted);
        background: rgba(0,0,0,0.22);
        border: 1px solid rgba(255,255,255,0.08);
      }

      .onboarding-status-dot {
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--accent);
        box-shadow: 0 0 10px var(--accent);
      }

      .onboarding-content {
        padding: 26px 24px 24px;
        text-align: center;
      }

      .onboarding-eyebrow {
        margin-bottom: 9px;
        font-size: 11px;
        font-weight: 800;
        letter-spacing: 1.6px;
        text-transform: uppercase;
        color: var(--accent-light);
      }

      .onboarding-card h2 {
        margin: 0;
        font-size: clamp(27px, 7vw, 34px);
        line-height: 1.1;
        letter-spacing: -1px;
        font-weight: 850;
        color: var(--text-primary);
      }

      .onboarding-card h2 span {
        background:
          linear-gradient(
            135deg,
            var(--accent),
            var(--accent-light)
          );
        -webkit-background-clip: text;
        -webkit-text-fill-color: transparent;
        background-clip: text;
      }

      .onboarding-description {
        max-width: 340px;
        margin: 14px auto 24px;
        color: var(--text-muted);
        font-size: 15px;
        line-height: 1.55;
      }

      .onboarding-features {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 10px;
        margin-bottom: 22px;
        text-align: left;
      }

      .onboarding-feature {
        position: relative;
        min-height: 92px;
        padding: 14px;
        overflow: hidden;
        border-radius: 18px;
        background: rgba(255,255,255,0.035);
        border: 1px solid rgba(255,255,255,0.065);
        transition: transform 0.2s ease, background 0.2s ease;
      }

      .onboarding-feature:hover {
        transform: translateY(-2px);
        background: rgba(255,255,255,0.06);
      }

      .onboarding-feature-icon {
        width: 34px;
        height: 34px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-bottom: 9px;
        border-radius: 11px;
        font-size: 18px;
        background: rgba(0,135,81,0.14);
      }

      .onboarding-feature strong {
        display: block;
        margin-bottom: 3px;
        font-size: 13px;
        font-weight: 750;
        color: var(--text-primary);
      }

      .onboarding-feature small {
        display: block;
        color: var(--text-muted);
        font-size: 11px;
        line-height: 1.35;
      }

      .onboarding-feature-wide {
        grid-column: span 2;
        min-height: auto;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .onboarding-feature-wide .onboarding-feature-icon {
        flex-shrink: 0;
        margin: 0;
      }

      .onboarding-feature-wide strong {
        margin-bottom: 2px;
      }

      .onboarding-cta {
        position: relative;
        width: 100%;
        overflow: hidden;
        padding: 15px 20px;
        border: none;
        border-radius: 16px;
        color: white;
        background:
          linear-gradient(
            135deg,
            var(--accent),
            var(--accent-light)
          );
        box-shadow: 0 8px 25px rgba(0,135,81,0.3);
        font-family: inherit;
        font-size: 16px;
        font-weight: 800;
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease;
      }

      .onboarding-cta::after {
        content: "";
        position: absolute;
        top: -50%;
        left: -100%;
        width: 60%;
        height: 200%;
        background: rgba(255,255,255,0.18);
        transform: rotate(25deg);
        transition: left 0.6s ease;
      }

      .onboarding-cta:hover::after { left: 150%; }
      .onboarding-cta:active { transform: scale(0.97); }

      .onboarding-footer {
        margin-top: 13px;
        color: var(--text-muted);
        font-size: 11px;
        opacity: 0.75;
      }

      /* ========== GUIDED TOUR CSS ========== */
      #studentnijaTour {
        position: fixed; inset: 0; z-index: 100000; pointer-events: none;
      }

      .studentnija-tour-highlight {
        position: fixed; z-index: 100001;
        border: 2px solid var(--accent);
        border-radius: 16px;
        box-shadow: 0 0 0 9999px rgba(0,0,0,0.72), 0 0 0 6px rgba(0,135,81,0.15), 0 0 35px rgba(0,135,81,0.65);
        pointer-events: none;
        transition: top 0.35s ease, left 0.35s ease, width 0.35s ease, height 0.35s ease;
      }

      .studentnija-tour-tooltip {
        position: fixed; z-index: 100003;
        width: min(310px, calc(100vw - 32px));
        padding: 18px;
        border-radius: 20px;
        background: linear-gradient(145deg, rgba(255,255,255,0.1), rgba(255,255,255,0.04)), var(--bg-secondary);
        border: 1px solid rgba(255,255,255,0.12);
        box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        pointer-events: auto;
        animation: tourTooltipIn 0.35s ease;
      }

      @keyframes tourTooltipIn {
        from { opacity: 0; transform: translateY(10px) scale(0.96); }
        to { opacity: 1; transform: translateY(0) scale(1); }
      }

      .studentnija-tour-tooltip::before {
        content: ""; position: absolute;
        width: 14px; height: 14px;
        background: var(--bg-secondary);
        border-left: 1px solid rgba(255,255,255,0.12);
        border-top: 1px solid rgba(255,255,255,0.12);
        transform: rotate(45deg);
      }

      .studentnija-tour-tooltip.top::before    { bottom: -8px; left: 50%; transform: translateX(-50%) rotate(225deg); }
      .studentnija-tour-tooltip.bottom::before { top: -8px; left: 50%; transform: translateX(-50%) rotate(45deg); }
      .studentnija-tour-tooltip.left::before   { right: -8px; top: 50%; transform: translateY(-50%) rotate(135deg); }
      .studentnija-tour-tooltip.right::before  { left: -8px; top: 50%; transform: translateY(-50%) rotate(-45deg); }

      .studentnija-tour-title { margin-bottom: 6px; color: var(--text-primary); font-size: 17px; font-weight: 800; }
      .studentnija-tour-description { margin-bottom: 15px; color: var(--text-muted); font-size: 13px; line-height: 1.5; }
      .studentnija-tour-footer { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
      .studentnija-tour-progress { color: var(--text-muted); font-size: 11px; font-weight: 700; }
      .studentnija-tour-buttons { display: flex; gap: 8px; }
      .studentnija-tour-btn { padding: 9px 13px; border: none; border-radius: 10px; font-family: inherit; font-size: 12px; font-weight: 700; cursor: pointer; }
      .studentnija-tour-skip { color: var(--text-muted); background: rgba(255,255,255,0.06); }
      .studentnija-tour-next { color: white; background: linear-gradient(135deg, var(--accent), var(--accent-light)); }

      @media (max-width: 380px) {
        .onboarding-card { border-radius: 25px; }
        .onboarding-hero { height: 160px; }
        .onboarding-content { padding: 22px 18px 20px; }
        .onboarding-features { gap: 8px; }
        .onboarding-feature { padding: 12px; }
      }

      @media (prefers-reduced-motion: reduce) {
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      }
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
      // Start guided tour if not already done
      setTimeout(() => {
        if (!localStorage.getItem('studentnija_tour_completed')) {
          startStudentNijaTour();
        }
      }, 500);
    }, 250);
  }

  if (closeBtn) closeBtn.addEventListener('click', dismiss);
  if (backdrop) backdrop.addEventListener('click', (e) => { if (e.target === backdrop) dismiss(); });
}

// ======================== GUIDED TOUR FUNCTION ========================
function startStudentNijaTour() {
  const tourSteps = [
    { target: '#bottomNav', title: 'Navigate the app', description: 'Use the bottom bar to jump between Home, Academics, Planner, and more.', position: 'top' },
    { target: '#homeContent', title: 'Your Dashboard', description: 'See your study stats, upcoming exams, and quick tools here.', position: 'bottom' },
    { target: '#academicsContent', title: 'Track Your Courses', description: 'Add courses, calculate CGPA, and manage your academic record.', position: 'right' },
    { target: '#plannerContent', title: 'Plan Your Time', description: 'Manage tasks, classes, and exams with the smart planner.', position: 'left' },
    { target: '#aiContent', title: 'AI Study Assistant', description: 'Ask any question and get instant help from your personal AI tutor.', position: 'top' }
  ];

  let currentStep = 0;

  const tour = document.createElement('div');
  tour.id = 'studentnijaTour';
  tour.innerHTML = `
    <div class="studentnija-tour-highlight" id="studentnijaTourHighlight"></div>
    <div class="studentnija-tour-tooltip" id="studentnijaTourTooltip">
      <div class="studentnija-tour-title" id="studentnijaTourTitle"></div>
      <div class="studentnija-tour-description" id="studentnijaTourDescription"></div>
      <div class="studentnija-tour-footer">
        <div class="studentnija-tour-progress" id="studentnijaTourProgress"></div>
        <div class="studentnija-tour-buttons">
          <button class="studentnija-tour-btn studentnija-tour-skip" id="studentnijaTourSkip">Skip</button>
          <button class="studentnija-tour-btn studentnija-tour-next" id="studentnijaTourNext">Next</button>
        </div>
      </div>
    </div>
  `;
  document.body.appendChild(tour);

  const highlight = document.getElementById('studentnijaTourHighlight');
  const tooltip = document.getElementById('studentnijaTourTooltip');
  const title = document.getElementById('studentnijaTourTitle');
  const description = document.getElementById('studentnijaTourDescription');
  const progress = document.getElementById('studentnijaTourProgress');
  const nextButton = document.getElementById('studentnijaTourNext');
  const skipButton = document.getElementById('studentnijaTourSkip');

  function showStep() {
    const step = tourSteps[currentStep];
    const target = document.querySelector(step.target);
    if (!target) {
      currentStep++;
      if (currentStep < tourSteps.length) showStep();
      else finishTour();
      return;
    }
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setTimeout(() => {
      const rect = target.getBoundingClientRect();
      const padding = 8;
      highlight.style.top = `${rect.top - padding}px`;
      highlight.style.left = `${rect.left - padding}px`;
      highlight.style.width = `${rect.width + padding * 2}px`;
      highlight.style.height = `${rect.height + padding * 2}px`;
      title.textContent = step.title;
      description.textContent = step.description;
      progress.textContent = `${currentStep + 1} of ${tourSteps.length}`;
      nextButton.textContent = currentStep === tourSteps.length - 1 ? 'Finish' : 'Next';
      positionTooltip(rect, step.position);
    }, 350);
  }

  function positionTooltip(rect, position) {
    const tooltipWidth = Math.min(310, window.innerWidth - 32);
    const tooltipHeight = 190;
    let top, left;
    if (position === 'top') {
      top = rect.top - tooltipHeight - 20;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      tooltip.className = 'studentnija-tour-tooltip top';
    } else if (position === 'left') {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.left - tooltipWidth - 20;
      tooltip.className = 'studentnija-tour-tooltip left';
    } else if (position === 'right') {
      top = rect.top + rect.height / 2 - tooltipHeight / 2;
      left = rect.right + 20;
      tooltip.className = 'studentnija-tour-tooltip right';
    } else {
      top = rect.bottom + 20;
      left = rect.left + rect.width / 2 - tooltipWidth / 2;
      tooltip.className = 'studentnija-tour-tooltip bottom';
    }
    const margin = 16;
    left = Math.max(margin, Math.min(left, window.innerWidth - tooltipWidth - margin));
    top = Math.max(margin, Math.min(top, window.innerHeight - tooltipHeight - margin));
    tooltip.style.width = `${tooltipWidth}px`;
    tooltip.style.top = `${top}px`;
    tooltip.style.left = `${left}px`;
  }

  function nextStep() { currentStep++; if (currentStep >= tourSteps.length) finishTour(); else showStep(); }
  function finishTour() {
    tour.style.opacity = '0';
    tour.style.transition = 'opacity 0.25s ease';
    setTimeout(() => tour.remove(), 250);
    localStorage.setItem('studentnija_tour_completed', 'true');
  }

  nextButton.addEventListener('click', nextStep);
  skipButton.addEventListener('click', finishTour);
  window.addEventListener('resize', showStep);
  showStep();
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
        if (rem) {
          localStorage.setItem('remember_me', 'true');
          localStorage.setItem('studentnija_currentUser', JSON.stringify(currentUser));
        } else {
          localStorage.removeItem('remember_me');
        }
        syncLocalUserToServer(currentUser);
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

  // Check for "Remember Me" stored user (auto-login)
  if (!currentUser || !currentUser.email) {
    const rememberMe = localStorage.getItem('remember_me');
    const storedUser = localStorage.getItem('studentnija_currentUser');
    if (rememberMe === 'true' && storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user.email) {
          const existing = users.find(u => u.email === user.email);
          if (existing) Object.assign(currentUser, existing);
          else Object.assign(currentUser, user);
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

// ======================== BOOTSTRAP ========================
window.addEventListener('load', async () => {
  console.log('🚀 App bootstrapping...');
  loadAll();

  // Check for "Remember Me" auto-login first
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
