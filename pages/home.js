import {
  currentUser, userStats, achievements, computeOverallCGPA,
  exams, plannerTasks, escapeHtml
} from '../state.js';

// API helper (adjust path if api.js is elsewhere)
const API_BASE = 'https://studentnija-public-chat.onrender.com';
async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  return res.json();
}

export function renderHome() {
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
    { name: "more", icon: "🗄️", action: "currentPage='more'; renderMainApp();" },
  ];
  
  const toolsHtml = `<div class="grid-2" style="margin-top: 20px;">${tools.map(tool => `
    <div class="quick-card" onclick="${tool.action}">
      <div style="font-size: 32px;">${tool.icon}</div>
      <span>${tool.name}</span>
    </div>
  `).join('')}</div>`;

  const html = `
    <!-- Welcome Card -->
    <div class="glass-card" style="padding:20px; margin-bottom:20px;">
      <div class="flex-between">
        <div>
          <h3>Hello, ${escapeHtml(currentUser.fullName.split(' ')[0])}</h3>
          <p class="text-muted">${escapeHtml(currentUser.school)} · ${escapeHtml(currentUser.level)}</p>
        </div>
        <div class="badge">CGPA ${cgpa}</div>
      </div>
      <div class="stats-row">
        <div>
          <div class="stat-value" style="font-size:28px;font-weight:800;">${userStats.studyStreak||0}</div>
          <div>🔥 Streak</div>
        </div>
        <div>
          <div style="font-size:28px;font-weight:800;">${earned}</div>
          <div>🏆 Badges</div>
        </div>
      </div>
    </div>

    <!-- Upcoming & Tasks -->
    <div class="grid-2">
      <div class="glass-card" style="padding:16px">
        <div style="font-weight:600;">📚 Upcoming Exams</div>
        ${upcomingExams.map(ex=>`<div class="text-muted" style="margin-top:8px;">${escapeHtml(ex.courseName)} · ${Math.ceil((new Date(ex.examDate)-new Date())/86400000)} days</div>`).join('')||'<div class="text-muted">No exams</div>'}
      </div>
      <div class="glass-card" style="padding:16px">
        <div style="font-weight:600;">✅ Today's Tasks</div>
        ${tasksToday.map(t=>`<div class="text-muted" style="margin-top:8px;">${escapeHtml(t.title)}</div>`).join('')||'<div class="text-muted">All done</div>'}
      </div>
    </div>

    <!-- Achievements -->
    <div class="glass-card" style="margin-top:20px;padding:16px">
      <div class="flex-between">
        <span>🏅 Achievements</span>
        <span class="text-muted">${earned}/${achievements.length}</span>
      </div>
      <div class="achievements-grid">
        ${achievements.map(a => `
          <div class="ach-item">
            <span class="ach-icon">${a.icon}</span>
            <span class="ach-status ${a.achieved ? 'unlocked' : 'locked'}">${a.achieved ? '✓' : '🔒'}</span>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- Personal Analytics (Server) -->
    <div class="glass-card" style="margin-top:20px;padding:16px">
      <div style="font-weight:600; margin-bottom:12px;">📊 Your Study Analytics</div>
      <div id="analyticsStats" class="text-muted">Loading...</div>
    </div>

    <!-- Tools -->
    <div class="glass-card" style="padding:16px; margin-top:20px;">
      <div style="font-weight:600; margin-bottom:12px;">🛠️ Productivity Tools</div>
      ${toolsHtml}
    </div>`;

  document.getElementById('homeContent').innerHTML = html;

  // Load analytics from server
  loadAnalytics();
}

async function loadAnalytics() {
  const container = document.getElementById('analyticsStats');
  if (!container) return;

  try {
    const userId = currentUser?.id;
    if (!userId) {
      container.textContent = 'Login to see analytics.';
      return;
    }
    const resp = await apiGet(`/api/analytics/${userId}`);
    const events = resp.analytics || [];
    if (events.length === 0) {
      container.textContent = 'No activity recorded yet. Start studying!';
      return;
    }
    let html = '';
    events.forEach(e => {
      html += `<div style="margin-bottom:6px;"><strong>${escapeHtml(e.event_type)}</strong>: ${e.count} times</div>`;
    });
    container.innerHTML = html;
  } catch (err) {
    container.textContent = 'Could not load analytics.';
  }
}