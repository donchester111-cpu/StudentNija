import {
  currentUser, userStats, achievements, computeOverallCGPA,
  exams, plannerTasks, escapeHtml, coursesData, saveAll
} from '../state.js';

const API_BASE = 'https://studentnija-public-chat.onrender.com';
async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  return res.json();
}

// All available tools (used when expanded)
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

export function renderHome() {
  const container = document.getElementById('homeContent');
  container.innerHTML = `
    <div class="skeleton-card" style="height:140px; margin-bottom:20px;"></div>
    <div class="skeleton-card" style="height:100px; margin-bottom:20px;"></div>
    <div class="skeleton-card" style="height:120px; margin-bottom:20px;"></div>
    <div class="skeleton-card" style="height:160px; margin-bottom:20px;"></div>
    <div class="skeleton-card" style="height:200px;"></div>
  `;
  loadHomeData().then(html => {
    container.innerHTML = html;
    attachHomeEvents();
  });
}

async function loadHomeData() {
  const userId = currentUser?.id;
  let analyticsData = [];
  let dailyQuote = '';

  try {
    if (userId) {
      const [aRes, qRes] = await Promise.all([
        apiGet(`/api/analytics/${userId}`),
        apiGet('/api/daily-quote')
      ]);
      analyticsData = aRes.analytics || [];
      dailyQuote = qRes.quote || '';
    }
  } catch (e) {
    console.warn('Failed to fetch home data', e);
  }

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const name = currentUser?.fullName?.split(' ')[0] || 'Student';
  const streak = userStats?.studyStreak || 0;
  const cgpa = computeOverallCGPA().toFixed(2);
  const upcomingExams = exams.slice(0, 3);
  const tasksToday = plannerTasks.filter(t => !t.completed).slice(0, 3);
  const earned = achievements.filter(a => a.achieved).length;

  // Determine top 4 tools based on analytics, fallback to first 4
  const toolUsage = {};
  analyticsData.forEach(e => { toolUsage[e.event_type] = (toolUsage[e.event_type] || 0) + e.count; });
  const topTools = allTools
    .slice()
    .sort((a, b) => (toolUsage[b.action] || 0) - (toolUsage[a.action] || 0))
    .slice(0, 4);

  // Full tools grid HTML (hidden by default)
  const fullToolsHtml = allTools.map(tool => `
    <div class="quick-card" onclick="${tool.action}">
      <div style="font-size:32px;">${tool.icon}</div>
      <span>${tool.name}</span>
    </div>
  `).join('');

  // Weekly progress
  const weeklyQuestions = analyticsData.filter(e => e.event_type === 'quiz_completed').reduce((acc, e) => acc + e.count, 0);
  const weeklyProgressPercent = Math.min(weeklyQuestions * 10, 100);

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

  return `
    ${streakCelebration}

    <div class="glass-card" style="padding:20px; margin-bottom:20px; background:linear-gradient(135deg, var(--accent), var(--accent-light)); color:white; border:none;">
      <div class="flex-between">
        <div>
          <h2 style="margin:0; font-weight:800;">${greeting}, ${escapeHtml(name)} 👋</h2>
          <p style="margin:4px 0 0; opacity:0.9; font-size:15px;">${dailyQuote || 'Every study session counts!'}</p>
        </div>
        <div style="text-align:center; background:rgba(255,255,255,0.2); border-radius:20px; padding:8px 16px;">
          <div style="font-size:32px; font-weight:800;">${streak}</div>
          <div style="font-size:12px;">🔥 Day Streak</div>
        </div>
      </div>
    </div>

    <div class="stats-row" style="margin-bottom:20px;">
      <div class="stat-box"><div class="num">${Object.values(coursesData).reduce((acc, arr) => acc + arr.length, 0)}</div><div class="lbl">Courses</div></div>
      <div class="stat-box"><div class="num">${plannerTasks.length}</div><div class="lbl">Tasks</div></div>
      <div class="stat-box"><div class="num">${upcomingExams.length}</div><div class="lbl">Exams</div></div>
      <div class="stat-box"><div class="num">${earned}</div><div class="lbl">Badges</div></div>
    </div>

    <div class="grid-2" style="margin-bottom:20px;">
      <div class="glass-card" style="padding:16px;">
        <div style="font-weight:700; margin-bottom:8px;">📚 Upcoming Exams</div>
        ${upcomingExams.length === 0 ? '<div class="text-muted">No exams</div>' :
          upcomingExams.map(ex => {
            const daysLeft = Math.ceil((new Date(ex.examDate) - new Date()) / 86400000);
            return `<div style="margin-bottom:8px; padding:8px; background:var(--bg-card); border-radius:12px;">
              <strong>${escapeHtml(ex.courseName)}</strong><br>
              <span class="text-muted">${ex.examDate} · ${daysLeft} days left</span>
            </div>`;
          }).join('')
        }
      </div>
      <div class="glass-card" style="padding:16px;">
        <div style="font-weight:700; margin-bottom:8px;">✅ Today's Tasks</div>
        ${tasksToday.length === 0 ? '<div class="text-muted">All done 🎉</div>' :
          tasksToday.map(t => `
            <div style="margin-bottom:6px; display:flex; align-items:center; gap:8px;">
              <input type="checkbox" ${t.completed ? 'checked' : ''} onchange="toggleTaskComplete(${t.id})" style="accent-color:var(--accent);">
              <span style="${t.completed ? 'text-decoration:line-through;opacity:0.7;' : ''}">${escapeHtml(t.title)}</span>
            </div>
          `).join('')
        }
      </div>
    </div>

    <!-- Favourite Tools (dynamic top 4) -->
    <div class="glass-card" style="padding:16px; margin-bottom:20px;">
      <div style="font-weight:700; margin-bottom:12px;">⚡ Quick Tools</div>
      <div class="grid-2" id="quickToolsGrid">
        ${topTools.map(tool => `
          <div class="quick-card" onclick="${tool.action}">
            <div style="font-size:32px;">${tool.icon}</div>
            <span>${tool.name}</span>
          </div>
        `).join('')}
      </div>
      <div id="allToolsContainer" style="display:none; margin-top:12px;">
        <div class="grid-2">
          ${fullToolsHtml}
        </div>
      </div>
      <div style="margin-top:12px; text-align:center;">
        <button id="toggleAllToolsBtn" class="btn-outline" style="width:auto;">View All Tools</button>
      </div>
    </div>

    <div class="glass-card" style="padding:16px; margin-bottom:20px;">
      <div style="font-weight:700; margin-bottom:8px;">📊 Weekly Progress</div>
      <div style="height:8px; background:var(--bg-card); border-radius:10px; overflow:hidden;">
        <div style="width:${weeklyProgressPercent}%; height:100%; background:var(--accent); border-radius:10px; transition: width 0.8s ease;"></div>
      </div>
      <div class="text-muted" style="margin-top:6px;">${weeklyQuestions} questions answered this week</div>
    </div>

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
            <div style="font-size:11px; margin-top:4px;">${a.name}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

function attachHomeEvents() {
  // Toggle all tools
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

  // Toggle task completion
  window.toggleTaskComplete = (id) => {
    const task = plannerTasks.find(t => t.id === id);
    if (task) {
      task.completed = !task.completed;
      saveAll();
      window.scheduleCloudSync?.(); // call cloud sync if available
      renderHome(); // refresh home to reflect changes
    }
  };
}