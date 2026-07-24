// ============================================================
// home.js – StudentNija Dashboard
// Fully responsive, JWT‑ready, with announcements, feature flags,
// skeleton loader, caching, and all tools.
// ============================================================

import {
  currentUser, userStats, achievements, computeOverallCGPA,
  exams, plannerTasks, escapeHtml, coursesData, saveAll
} from '../state.js';

// Use the shared API helpers (with JWT token support)
import { apiGet } from '../api.js';

// ============================================================
// TOOLS CONFIGURATION – central list (filtered later)
// ============================================================
const allTools = [
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
];

// ============================================================
// CACHE
// ============================================================
let cachedAnalytics = null;
let cacheTime = 0;
const CACHE_TTL = 60000; // 1 minute

// ============================================================
// RENDER HOME
// ============================================================
export function renderHome() {
  const container = document.getElementById('homeContent');
  if (!container) return;

  // Show skeleton while loading (smooth, modern look)
  container.innerHTML = `
    <div class="skeleton-card" style="height:140px; margin-bottom:20px;"></div>
    <div class="skeleton-card" style="height:100px; margin-bottom:20px;"></div>
    <div class="skeleton-card" style="height:120px; margin-bottom:20px;"></div>
    <div class="skeleton-card" style="height:160px; margin-bottom:20px;"></div>
    <div class="skeleton-card" style="height:200px;"></div>
  `;

  loadHomeData()
    .then(html => {
      container.innerHTML = html;
      attachHomeEvents();
    })
    .catch(err => {
      console.error('Home load error:', err);
      container.innerHTML = `
        <div class="glass-card" style="padding:24px; text-align:center; color:var(--text-muted);">
          <span style="font-size:48px; display:block; margin-bottom:12px;">😅</span>
          <p>Couldn't load your dashboard. Please refresh.</p>
        </div>
      `;
    });
}

// ============================================================
// LOAD HOME DATA (with caching)
// ============================================================
async function loadHomeData() {
  const userId = currentUser?.id;
  let analyticsData = [];
  let dailyQuote = '';
  let announcements = [];

  // 1) Analytics
  if (userId) {
    try {
      const now = Date.now();
      if (cachedAnalytics && (now - cacheTime) < CACHE_TTL) {
        analyticsData = cachedAnalytics;
      } else {
        const aRes = await apiGet(`/api/analytics/${userId}`);
        analyticsData = aRes.analytics || [];
        cachedAnalytics = analyticsData;
        cacheTime = now;
      }
    } catch (e) {
      console.warn('Analytics fetch failed (maybe user not fully logged in?)', e);
    }
  }

  // 2) Daily quote
  try {
    const qRes = await apiGet('/api/daily-quote');
    dailyQuote = qRes.quote || 'Every study session counts!';
  } catch (e) {
    dailyQuote = 'Every study session counts!';
  }

  // 3) Announcements (only if user is logged in)
  if (userId) {
    try {
      const annRes = await apiGet('/api/admin/announcements');
      announcements = annRes.announcements || [];
    } catch (e) {
      // Silent fail – announcements are optional
      console.warn('Announcements not available');
    }
  }

  // ===== BUILD DASHBOARD =====
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = currentUser?.fullName?.split(' ')[0] || 'Student';
  const streak = userStats?.studyStreak || 0;
  const cgpa = computeOverallCGPA().toFixed(2);
  const upcomingExams = exams.slice(0, 3);
  const tasksToday = plannerTasks.filter(t => !t.completed).slice(0, 3);
  const earned = achievements.filter(a => a.achieved).length;

  // 4) Feature flags (from window)
  const flags = window.featureFlags || { ai: true, flashcards: true, gradePredictor: true, communityQ: true };

  // 5) Filter tools based on flags
  const hiddenTools = [];
  if (!flags.flashcards) hiddenTools.push('Flashcards');
  if (!flags.gradePredictor) hiddenTools.push('Grade Predictor');
  if (!flags.ai) {
    // Also hide AI-related tools (AI Tutor, Essay Assistant – we'll hide them)
    hiddenTools.push('AI Tutor');
    hiddenTools.push('Essay Assistant');
  }
  // Community Q is not a tool, but we can hide it elsewhere if needed
  const visibleTools = allTools.filter(t => !hiddenTools.includes(t.name));

  // 6) Top tools based on usage (analytics)
  const toolUsage = {};
  analyticsData.forEach(e => {
    const toolName = e.event_type?.replace('open_', '').replace(/_/g, ' ');
    if (toolName) toolUsage[toolName] = (toolUsage[toolName] || 0) + e.count;
  });
  const topTools = visibleTools
    .slice()
    .sort((a, b) => {
      const aCount = toolUsage[a.name.toLowerCase()] || 0;
      const bCount = toolUsage[b.name.toLowerCase()] || 0;
      return bCount - aCount;
    })
    .slice(0, 4);

  // 7) Full tools grid (hidden initially) – using visibleTools
  const fullToolsHtml = visibleTools.map(tool => `
    <div class="quick-card" onclick="${tool.action}">
      <div style="font-size:32px;">${tool.icon}</div>
      <span>${tool.name}</span>
    </div>
  `).join('');

  // 8) Weekly progress
  const weeklyQuestions = analyticsData
    .filter(e => e.event_type === 'quiz_completed')
    .reduce((acc, e) => acc + e.count, 0);
  const weeklyProgressPercent = Math.min(weeklyQuestions * 10, 100);

  // 9) Streak banner
  const streakCelebration = streak > 0 ? `
    <div class="streak-banner" style="
      background: linear-gradient(135deg, #FF4500, #FFD700);
      border-radius: 20px;
      padding: 8px 16px;
      color: white;
      display: flex;
      align-items: center;
      gap: 8px;
      font-weight: 700;
      margin-bottom: 20px;
      box-shadow: 0 4px 12px rgba(255,69,0,0.4);
    ">
      <span style="font-size:24px;">🔥</span>
      <span>${streak} day streak! Keep it up!</span>
    </div>` : '';

  // 10) Announcements section (if any)
  const announcementsHtml = announcements.length > 0 ? `
    <div class="glass-card" style="padding:16px; margin-bottom:20px; border-left:4px solid var(--accent-light);">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-size:20px;">📢</span>
        <h3 style="margin:0; font-size:clamp(1rem, 2.5vw, 1.2rem); font-weight:700;">Announcements</h3>
      </div>
      ${announcements.slice(0, 3).map(a => `
        <div style="margin-bottom:12px; padding:12px; background:var(--bg-card); border-radius:12px;">
          <strong style="font-size:0.95rem;">${escapeHtml(a.title)}</strong>
          <p style="margin:4px 0 0; color:var(--text-muted); font-size:0.9rem;">${escapeHtml(a.body)}</p>
          <span class="text-muted" style="font-size:0.7rem;">${new Date(a.created_at).toLocaleDateString()}</span>
        </div>
      `).join('')}
    </div>
  ` : '';

  // ===== RETURN HTML (fully responsive, mobile-first) =====
  return `
    ${streakCelebration}

    <!-- Welcome Card -->
    <div class="glass-card welcome-card" style="padding:20px; margin-bottom:20px; background:linear-gradient(135deg, var(--accent), var(--accent-light)); color:white; border:none; border-radius:24px;">
      <div style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; gap:12px;">
        <div>
          <h2 style="margin:0; font-size:clamp(1.4rem, 5vw, 2rem); font-weight:800;">${greeting}, ${escapeHtml(name)} 👋</h2>
          <p style="margin:4px 0 0; opacity:0.9; font-size:clamp(0.9rem, 2.5vw, 1.1rem);">${escapeHtml(dailyQuote)}</p>
        </div>
        <div style="text-align:center; background:rgba(255,255,255,0.2); border-radius:20px; padding:8px 16px; min-width:60px;">
          <div style="font-size:clamp(1.8rem, 6vw, 2.8rem); font-weight:800; line-height:1;">${streak}</div>
          <div style="font-size:clamp(0.6rem, 1.5vw, 0.8rem); opacity:0.9;">🔥 Day Streak</div>
        </div>
      </div>
    </div>

    <!-- Announcements -->
    ${announcementsHtml}

    <!-- Stats Row (4 stats in a responsive grid) -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(65px, 1fr)); gap:12px; margin-bottom:20px;">
      <div class="stat-box"><div class="num">${Object.values(coursesData).reduce((acc, arr) => acc + arr.length, 0)}</div><div class="lbl">Courses</div></div>
      <div class="stat-box"><div class="num">${plannerTasks.length}</div><div class="lbl">Tasks</div></div>
      <div class="stat-box"><div class="num">${upcomingExams.length}</div><div class="lbl">Exams</div></div>
      <div class="stat-box"><div class="num">${earned}</div><div class="lbl">Badges</div></div>
    </div>

    <!-- Two‑column: Exams & Tasks (stack on small screens) -->
    <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap:16px; margin-bottom:20px;">
      <div class="glass-card" style="padding:16px; border-radius:20px;">
        <div style="font-weight:700; margin-bottom:10px; font-size:clamp(1rem, 2.5vw, 1.2rem);">📚 Upcoming Exams</div>
        ${upcomingExams.length === 0 ? '<div class="text-muted" style="font-size:0.95rem;">No exams scheduled</div>' :
          upcomingExams.map(ex => {
            const daysLeft = Math.ceil((new Date(ex.examDate) - new Date()) / 86400000);
            return `<div style="margin-bottom:10px; padding:10px; background:var(--bg-card); border-radius:14px;">
              <strong style="font-size:1rem;">${escapeHtml(ex.courseName)}</strong><br>
              <span class="text-muted" style="font-size:0.85rem;">${ex.examDate} · ${daysLeft} days left</span>
            </div>`;
          }).join('')
        }
      </div>
      <div class="glass-card" style="padding:16px; border-radius:20px;">
        <div style="font-weight:700; margin-bottom:10px; font-size:clamp(1rem, 2.5vw, 1.2rem);">✅ Today's Tasks</div>
        ${tasksToday.length === 0 ? '<div class="text-muted" style="font-size:0.95rem;">All done 🎉</div>' :
          tasksToday.map(t => `
            <div style="margin-bottom:8px; display:flex; align-items:center; gap:10px; padding:6px 4px; border-radius:10px; background:var(--bg-card);">
              <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskComplete(${t.id})" style="accent-color:var(--accent); width:18px; height:18px; flex-shrink:0;">
              <span style="${t.completed ? 'text-decoration:line-through;opacity:0.7;' : ''} font-size:0.95rem;">${escapeHtml(t.title)}</span>
            </div>
          `).join('')
        }
      </div>
    </div>

    <!-- Quick Tools (responsive grid) -->
    <div class="glass-card" style="padding:16px; border-radius:20px; margin-bottom:20px;">
      <div style="font-weight:700; margin-bottom:12px; font-size:clamp(1rem, 2.5vw, 1.2rem);">⚡ Quick Tools</div>
      <div id="quickToolsGrid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap:12px;">
        ${topTools.map(tool => `
          <div class="quick-card" onclick="${tool.action}" style="
            display:flex; flex-direction:column; align-items:center; padding:12px 6px;
            background:var(--bg-card); border-radius:16px; cursor:pointer; transition:transform 0.15s ease;
            text-align:center; border:1px solid var(--border-light);
          ">
            <div style="font-size:clamp(2rem, 6vw, 2.8rem);">${tool.icon}</div>
            <span style="font-size:clamp(0.7rem, 1.8vw, 0.9rem); margin-top:4px; font-weight:600;">${tool.name}</span>
          </div>
        `).join('')}
      </div>
      <div id="allToolsContainer" style="display:none; margin-top:14px;">
        <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap:12px;">
          ${fullToolsHtml}
        </div>
      </div>
      <div style="margin-top:14px; text-align:center;">
        <button id="toggleAllToolsBtn" class="btn-outline" style="width:auto; padding:10px 24px; border-radius:60px; font-size:0.9rem; background:transparent; border:1.5px solid var(--accent); color:var(--accent); cursor:pointer; transition:0.2s;">View All Tools</button>
      </div>
    </div>

    <!-- Weekly Progress -->
    <div class="glass-card" style="padding:16px; border-radius:20px; margin-bottom:20px;">
      <div style="font-weight:700; margin-bottom:10px; font-size:clamp(1rem, 2.5vw, 1.2rem);">📊 Weekly Progress</div>
      <div style="height:8px; background:var(--bg-card); border-radius:10px; overflow:hidden;">
        <div style="width:${weeklyProgressPercent}%; height:100%; background:var(--accent); border-radius:10px; transition: width 0.8s ease;"></div>
      </div>
      <div class="text-muted" style="margin-top:6px; font-size:0.9rem;">${weeklyQuestions} questions answered this week</div>
    </div>

    <!-- Achievements -->
    <div class="glass-card" style="padding:16px; border-radius:20px; margin-bottom:8px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px; flex-wrap:wrap; gap:6px;">
        <span style="font-weight:700; font-size:clamp(1rem, 2.5vw, 1.2rem);">🏅 Achievements</span>
        <span class="text-muted" style="font-size:0.9rem;">${earned}/${achievements.length}</span>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap:10px;">
        ${achievements.map(a => `
          <div style="display:flex; flex-direction:column; align-items:center; text-align:center; padding:6px 0;">
            <span style="font-size:clamp(1.6rem, 4vw, 2.2rem);">${a.icon}</span>
            <span style="font-size:0.7rem; margin-top:2px; opacity:${a.achieved ? 1 : 0.5};">
              ${a.achieved ? '✓' : '🔒'}
            </span>
            <div style="font-size:clamp(0.55rem, 1.2vw, 0.75rem); margin-top:2px; line-height:1.2; max-width:70px; word-break:break-word;">${a.name}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Extra padding at bottom for navigation -->
    <div style="height:10px;"></div>
  `;
}

// ============================================================
// ATTACH EVENTS
// ============================================================
function attachHomeEvents() {
  // Toggle "View All Tools"
  const toggleBtn = document.getElementById('toggleAllToolsBtn');
  const allToolsContainer = document.getElementById('allToolsContainer');
  const quickGrid = document.getElementById('quickToolsGrid');

  if (toggleBtn && allToolsContainer && quickGrid) {
    let showingAll = false;
    toggleBtn.addEventListener('click', () => {
      showingAll = !showingAll;
      if (showingAll) {
        allToolsContainer.style.display = 'block';
        quickGrid.style.display = 'none';
        toggleBtn.textContent = 'Show Less';
      } else {
        allToolsContainer.style.display = 'none';
        quickGrid.style.display = '';
        toggleBtn.textContent = 'View All Tools';
      }
    });
  }

  // Expose toggleTaskComplete globally (used in inline onchange)
  window.toggleTaskComplete = (id) => {
    const task = plannerTasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveAll();
      // Sync to cloud if available
      if (typeof window.scheduleCloudSync === 'function') {
        window.scheduleCloudSync();
      }
      // Re‑render home to update UI
      renderHome();
    }
  };
}