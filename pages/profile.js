// ============================================================
// profile.js – StudentNija Profile Page
// Fully responsive, JWT‑ready, with all settings & actions.
// ============================================================

import {
  currentUser, users, coursesData, plannerTasks, flashcards,
  userStats, settings, saveAll, addNotification,
  computeOverallCGPA, applyTheme, applyAccentColor,
  escapeHtml, achievements, timetableEvents, exams
} from '../state.js';

// Use shared API helpers (with JWT token support)
import { apiPost, apiGet } from '../api.js';

// ============================================================
// RENDER PROFILE PAGE
// ============================================================
export function renderProfilePage() {
  // Ensure studentId exists
  if (currentUser && !currentUser.studentId) {
    currentUser.studentId = '';
    saveAll();
  }

  const cgpa = computeOverallCGPA().toFixed(2);
  const earned = achievements.filter(a => a.achieved).length;
  const totalAchievements = achievements.length;

  const html = `
    <!-- ====== PROFILE HEADER ====== -->
    <div class="glass-card" style="padding:24px; text-align:center; position:relative; border-radius:24px; margin-bottom:16px;">
      <div class="avatar-upload" id="avatarUpload" style="
        width:80px; height:80px; border-radius:50%; margin:0 auto 12px;
        background:var(--bg-card); display:flex; align-items:center; justify-content:center;
        cursor:pointer; overflow:hidden; border:3px solid var(--accent);
        transition:transform 0.2s ease; font-size:40px;
      ">
        ${currentUser.profilePic ? `<img src="${currentUser.profilePic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : `<span>📷</span>`}
      </div>
      <input type="file" id="profilePicInput" accept="image/*" style="display:none">
      <h2 style="margin:4px 0 2px; font-size:clamp(1.4rem, 5vw, 2rem);">${escapeHtml(currentUser.fullName)}</h2>
      <p class="text-muted" style="margin:0; font-size:clamp(0.9rem, 2.5vw, 1.1rem);">${escapeHtml(currentUser.email)}</p>
      <div style="margin-top:8px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
        <span class="badge" style="padding:4px 14px; border-radius:40px; font-size:0.85rem;">🎓 ${escapeHtml(currentUser.level || 'Student')}</span>
        <span class="badge" style="background:var(--accent); color:white; padding:4px 14px; border-radius:40px; font-size:0.85rem;">CGPA ${cgpa}</span>
      </div>
      <button id="editProfileToggleBtn" class="btn-outline" style="
        width:auto; padding:8px 20px; margin-top:14px; font-size:0.95rem;
        border-radius:60px; background:transparent; border:1.5px solid var(--accent);
        color:var(--accent); cursor:pointer; transition:0.2s;
      ">
        ✏️ Edit Profile
      </button>
    </div>

    <!-- ====== STATS ROW ====== -->
    <div class="stats-row" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap:12px; margin-bottom:16px;">
      <div class="stat-box" style="text-align:center; padding:12px 6px; background:var(--bg-card); border-radius:16px;">
        <div class="stat-value" style="font-size:clamp(1.6rem, 5vw, 2.2rem); font-weight:800;">${Object.values(coursesData).reduce((acc, arr) => acc + arr.length, 0)}</div>
        <div class="stat-label" style="font-size:clamp(0.7rem, 1.8vw, 0.9rem);">📚 Courses</div>
      </div>
      <div class="stat-box" style="text-align:center; padding:12px 6px; background:var(--bg-card); border-radius:16px;">
        <div class="stat-value" style="font-size:clamp(1.6rem, 5vw, 2.2rem); font-weight:800;">${plannerTasks.length}</div>
        <div class="stat-label" style="font-size:clamp(0.7rem, 1.8vw, 0.9rem);">✅ Tasks</div>
      </div>
      <div class="stat-box" style="text-align:center; padding:12px 6px; background:var(--bg-card); border-radius:16px;">
        <div class="stat-value" style="font-size:clamp(1.6rem, 5vw, 2.2rem); font-weight:800;">${flashcards ? flashcards.length : 0}</div>
        <div class="stat-label" style="font-size:clamp(0.7rem, 1.8vw, 0.9rem);">🃏 Cards</div>
      </div>
      <div class="stat-box" style="text-align:center; padding:12px 6px; background:var(--bg-card); border-radius:16px;">
        <div class="stat-value" style="font-size:clamp(1.6rem, 5vw, 2.2rem); font-weight:800;">${userStats.studyStreak || 0}🔥</div>
        <div class="stat-label" style="font-size:clamp(0.7rem, 1.8vw, 0.9rem);">Streak</div>
      </div>
    </div>

    <!-- ====== CLOUD SYNC STATUS ====== -->
    <div class="glass-card" style="padding:16px; border-radius:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-size:20px;">☁️</span>
        <h3 style="margin:0; font-size:clamp(1rem, 2.5vw, 1.2rem); font-weight:600;">Cloud Backup</h3>
      </div>
      <div id="cloudSyncStatus" class="text-muted" style="font-size:clamp(0.85rem, 2vw, 1rem);">Loading...</div>
      <button id="manualSyncBtn" class="btn-outline" style="
        width:100%; margin-top:8px; padding:10px; border-radius:60px;
        background:transparent; border:1.5px solid var(--accent); color:var(--accent);
        font-size:0.95rem; cursor:pointer; transition:0.2s;
      ">🔄 Sync Now</button>
    </div>

    <!-- ====== ACTIVITY LOG ====== -->
    <div class="glass-card" style="padding:16px; border-radius:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-size:20px;">📜</span>
        <h3 style="margin:0; font-size:clamp(1rem, 2.5vw, 1.2rem); font-weight:600;">Recent Activity</h3>
      </div>
      <div id="activityLog" class="text-muted" style="font-size:clamp(0.85rem, 2vw, 1rem);">Loading...</div>
    </div>

    <!-- ====== ACHIEVEMENTS ====== -->
    <div class="glass-card" style="padding:16px; border-radius:20px; margin-bottom:16px;">
      <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px; flex-wrap:wrap; gap:4px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:20px;">🏅</span>
          <h3 style="margin:0; font-size:clamp(1rem, 2.5vw, 1.2rem); font-weight:600;">Achievements</h3>
        </div>
        <span class="text-muted" style="font-size:clamp(0.8rem, 1.8vw, 0.95rem);">${earned}/${totalAchievements}</span>
      </div>
      <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(60px, 1fr)); gap:10px;" id="profileAchievements">
        ${achievements.map(a => `
          <div style="text-align:center; opacity:${a.achieved ? 1 : 0.4}; padding:6px 4px;">
            <span style="font-size:clamp(1.6rem, 4vw, 2.2rem);">${a.icon}</span>
            <span style="display:block; font-size:0.7rem; margin-top:2px; opacity:${a.achieved ? 1 : 0.6};">
              ${a.achieved ? '✓' : '🔒'}
            </span>
            <div style="font-size:clamp(0.55rem, 1.2vw, 0.75rem); margin-top:2px; line-height:1.2; max-width:70px; word-break:break-word;">${a.name}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- ====== PERSONAL INFORMATION CARD ====== -->
    <div class="glass-card" style="padding:20px; border-radius:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">👤</span>
        <h3 style="margin:0; font-size:clamp(1.1rem, 3vw, 1.4rem); font-weight:600;">Personal Information</h3>
      </div>
      <div style="display:grid; grid-template-columns: 1fr; gap:12px;">
        <div class="profile-grid-item" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-light);">
          <span style="font-weight:500; font-size:0.95rem;">🏫 School</span>
          <span id="profileSchool" style="font-size:0.95rem;">${escapeHtml(currentUser.school || 'Not set')}</span>
        </div>
        <div class="profile-grid-item" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-light);">
          <span style="font-weight:500; font-size:0.95rem;">📚 Department</span>
          <span id="profileDept" style="font-size:0.95rem;">${escapeHtml(currentUser.department || 'Not set')}</span>
        </div>
        <div class="profile-grid-item" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-light);">
          <span style="font-weight:500; font-size:0.95rem;">📖 Level</span>
          <span id="profileLevel" style="font-size:0.95rem;">${escapeHtml(currentUser.level || 'Not set')}</span>
        </div>
        <div class="profile-grid-item" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; padding:8px 0; border-bottom:1px solid var(--border-light);">
          <span style="font-weight:500; font-size:0.95rem;">🆔 Student ID</span>
          <span id="profileStudentId" style="font-size:0.95rem;">${escapeHtml(currentUser.studentId || 'Not set')}</span>
        </div>
        <div class="profile-grid-item" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; padding:8px 0;">
          <span style="font-weight:500; font-size:0.95rem;">📝 Bio</span>
          <span id="profileBio" style="font-size:0.95rem; max-width:60%; text-align:right;">${escapeHtml(currentUser.bio || 'No bio yet')}</span>
        </div>
      </div>
      <div style="display:flex; justify-content:center; margin-top:12px;">
        <button id="editProfileToggleBtn" class="btn-outline" style="
          width:auto; padding:8px 20px; border-radius:60px;
          background:transparent; border:1.5px solid var(--accent);
          color:var(--accent); font-size:0.9rem; cursor:pointer;
        ">✏️ Edit Profile</button>
      </div>
    </div>

    <!-- ====== 2‑FACTOR AUTH (EMAIL) ====== -->
    <div class="glass-card" style="padding:20px; border-radius:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">🔐</span>
        <h3 style="margin:0; font-size:clamp(1.1rem, 3vw, 1.4rem); font-weight:600;">Two‑Factor Authentication</h3>
      </div>
      <div id="2faStatus" style="font-size:0.95rem;">Not enabled</div>
      <button id="enableEmail2faBtn" class="btn-outline" style="margin-top:8px; padding:8px 16px; border-radius:60px;">Enable Email 2FA</button>
      <div id="2faVerificationArea" style="display:none; margin-top:8px;">
        <p class="text-muted" style="font-size:0.9rem;">A verification code has been sent to your email. Enter it below.</p>
        <input type="text" id="email2faCode" placeholder="6‑digit code" maxlength="6" style="
          width:100%; padding:10px; border-radius:12px;
          border:1px solid var(--border-light); background:var(--bg-primary);
          color:var(--text-primary); font-size:1rem;
        ">
        <button id="verifyEmail2faBtn" class="btn-primary" style="margin-top:6px; padding:10px 20px; border-radius:60px;">Verify & Enable</button>
      </div>
      <button id="disableEmail2faBtn" class="btn-outline" style="display:none; margin-top:8px; padding:8px 16px; border-radius:60px;">Disable 2FA</button>
    </div>

    <!-- ====== EMAIL REMINDERS ====== -->
    <div class="glass-card" style="padding:20px; border-radius:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">📧</span>
        <h3 style="margin:0; font-size:clamp(1.1rem, 3vw, 1.4rem); font-weight:600;">Email Reminders</h3>
      </div>
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.95rem;">
        <input type="checkbox" id="emailToggle" style="accent-color:var(--accent); width:18px; height:18px;">
        <span>Send study reminders to my email</span>
      </label>
      <p id="emailToggleStatus" class="text-muted" style="margin-top:6px; font-size:0.85rem;"></p>
    </div>

    <!-- ====== FULLSCREEN MODE ====== -->
    <div class="glass-card" style="padding:20px; border-radius:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">🖥️</span>
        <h3 style="margin:0; font-size:clamp(1.1rem, 3vw, 1.4rem); font-weight:600;">Full Screen Mode</h3>
      </div>
      <label style="display:flex; align-items:center; gap:8px; cursor:pointer; font-size:0.95rem;">
        <input type="checkbox" id="fullscreenToggle" style="accent-color:var(--accent); width:18px; height:18px;">
        <span>Hide browser bars (fullscreen)</span>
      </label>
    </div>

    <!-- ====== DATA EXPORT ====== -->
    <div class="glass-card" style="padding:20px; border-radius:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">📤</span>
        <h3 style="margin:0; font-size:clamp(1.1rem, 3vw, 1.4rem); font-weight:600;">Export My Data</h3>
      </div>
      <button id="exportDataBtn" class="btn-outline" style="padding:10px 20px; border-radius:60px; font-size:0.95rem;">Download Backup</button>
    </div>

    <!-- ====== FEEDBACK ====== -->
    <div class="glass-card" style="padding:20px; border-radius:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">📬</span>
        <h3 style="margin:0; font-size:clamp(1.1rem, 3vw, 1.4rem); font-weight:600;">Send Feedback</h3>
      </div>
      <textarea id="feedbackMsg" rows="3" placeholder="We'd love to hear from you..." style="
        width:100%; padding:10px; border-radius:12px;
        border:1px solid var(--border-light); background:var(--bg-primary);
        color:var(--text-primary); font-size:0.95rem;
      "></textarea>
      <button id="sendFeedbackBtn" class="btn-primary" style="margin-top:8px; padding:10px 20px; border-radius:60px;">Send</button>
    </div>

    <!-- ====== PREFERENCES ====== -->
    <div class="glass-card" style="padding:20px; border-radius:20px; margin-bottom:16px;">
      <h3 style="margin:0 0 12px; font-size:clamp(1.1rem, 3vw, 1.4rem);">⚙️ Preferences</h3>
      <div class="profile-pref-item" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-weight:500; font-size:0.95rem;">🌙 Theme</span>
        <select id="themeSelect" style="
          width:auto; min-width:120px; padding:8px 12px;
          border-radius:12px; border:1px solid var(--border-light);
          background:var(--bg-primary); color:var(--text-primary);
          font-size:0.95rem;
        ">
          <option value="light" ${settings.theme==='light'?'selected':''}>Light</option>
          <option value="dark" ${settings.theme==='dark'?'selected':''}>Dark</option>
          <option value="system" ${settings.theme==='system'?'selected':''}>System</option>
        </select>
      </div>
      <div class="profile-pref-item" style="display:flex; flex-wrap:wrap; justify-content:space-between; align-items:center; margin-bottom:12px;">
        <span style="font-weight:500; font-size:0.95rem;">🔔 Notifications</span>
        <label style="display:flex; align-items:center; gap:6px; cursor:pointer; font-size:0.95rem;">
          <input type="checkbox" id="notifToggle" ${settings.notificationsEnabled?'checked':''} style="accent-color:var(--accent); width:18px; height:18px;"> Enable
        </label>
      </div>
      <div style="margin-top:12px;">
        <label style="display:block; font-weight:500; font-size:0.95rem; margin-bottom:6px;">🎨 Accent Color</label>
        <div class="color-palette" id="profileColorPalette" style="display:flex; flex-wrap:wrap; gap:10px;">
          <div class="color-dot" style="background:#008751; width:32px; height:32px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:0.2s;" data-color="#008751"></div>
          <div class="color-dot" style="background:#a855f7; width:32px; height:32px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:0.2s;" data-color="#a855f7"></div>
          <div class="color-dot" style="background:#00f7ff; width:32px; height:32px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:0.2s;" data-color="#00f7ff"></div>
          <div class="color-dot" style="background:#F4B400; width:32px; height:32px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:0.2s;" data-color="#F4B400"></div>
          <div class="color-dot" style="background:#ff2d55; width:32px; height:32px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:0.2s;" data-color="#ff2d55"></div>
          <div class="color-dot" style="background:#ff6b6b; width:32px; height:32px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:0.2s;" data-color="#ff6b6b"></div>
          <div class="color-dot" style="background:#4ecdc4; width:32px; height:32px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:0.2s;" data-color="#4ecdc4"></div>
          <div class="color-dot" style="background:#ff9f1c; width:32px; height:32px; border-radius:50%; cursor:pointer; border:2px solid transparent; transition:0.2s;" data-color="#ff9f1c"></div>
        </div>
      </div>
    </div>

    <!-- ====== ACCOUNT ACTIONS ====== -->
    <div class="glass-card" style="padding:20px; border-radius:20px; margin-bottom:16px;">
      <h3 style="margin:0 0 12px; font-size:clamp(1.1rem, 3vw, 1.4rem);">🔐 Account</h3>
      <div style="display:flex; flex-direction:column; gap:10px;">
        <button id="changePasswordBtn" class="btn-outline" style="min-height:44px; font-size:1rem; border-radius:60px; background:transparent; border:1.5px solid var(--accent); color:var(--accent); cursor:pointer;">🔑 Change Password</button>
        <button id="logoutBtn" class="btn-outline" style="min-height:44px; font-size:1rem; border-radius:60px; background:#a00; border-color:#a00; color:white; cursor:pointer;">🚪 Logout</button>
        <button id="deleteAccountBtn" class="btn-outline" style="min-height:44px; font-size:1rem; border-radius:60px; background:#a00; border-color:#a00; color:white; cursor:pointer;">🗑️ Delete Account</button>
      </div>
    </div>

    <!-- ====== ABOUT SECTION ====== -->
    <div class="glass-card" style="padding:0; overflow:hidden; border-radius:20px; margin-top:16px;">
      <div style="
        padding:20px; text-align:center;
        background: linear-gradient(135deg, var(--accent), var(--accent-light));
      ">
        <div style="font-size:clamp(1.8rem, 6vw, 2.8rem); font-weight:800; color:white; letter-spacing:-0.5px; text-shadow:0 2px 8px rgba(0,0,0,0.15);">
          🇳🇬 StudentNija
        </div>
        <div style="font-size:clamp(0.9rem, 2.5vw, 1.1rem); color:rgba(255,255,255,0.85); margin-top:4px; font-weight:300; letter-spacing:0.3px;">
          Study Smarter · Score Higher
        </div>
        <div style="display:flex; justify-content:center; gap:8px; margin-top:10px; flex-wrap:wrap;">
          <span style="background:rgba(255,255,255,0.2); padding:2px 12px; border-radius:40px; font-size:0.75rem; color:white;">v1.4.0</span>
          <span style="background:rgba(255,255,255,0.2); padding:2px 12px; border-radius:40px; font-size:0.75rem; color:white;">⌘ Android</span>
          <span style="background:rgba(255,255,255,0.2); padding:2px 12px; border-radius:40px; font-size:0.75rem; color:white;">✦ AI-Powered</span>
        </div>
      </div>
      <div style="padding:16px;">
        <p style="font-size:0.95rem; line-height:1.6; color:var(--text-primary); margin-bottom:12px;">
          StudentNija is your AI-powered study companion for Nigerian students. Track CGPA, manage tasks, create flashcards, and get personalized tutoring – all in one app.
        </p>
        <div style="display:flex; gap:8px; flex-wrap:wrap; justify-content:center;">
          <a href="#" onclick="openBrowser('https://github.com'); return false;" style="color:var(--accent); font-size:0.9rem; text-decoration:none; padding:6px 12px; border:1px solid var(--border-light); border-radius:40px;">⌘ GitHub</a>
          <a href="#" onclick="openBrowser('https://x.com'); return false;" style="color:var(--accent); font-size:0.9rem; text-decoration:none; padding:6px 12px; border:1px solid var(--border-light); border-radius:40px;">✦ X</a>
          <a href="#" onclick="openBrowser('https://youtube.com'); return false;" style="color:var(--accent); font-size:0.9rem; text-decoration:none; padding:6px 12px; border:1px solid var(--border-light); border-radius:40px;">▶ YouTube</a>
          <a href="#" onclick="openSystemBrowser('https://wa.me/2348148316917'); return false;" style="color:var(--accent); font-size:0.9rem; text-decoration:none; padding:6px 12px; border:1px solid var(--border-light); border-radius:40px;">✆ WhatsApp</a>
          <a href="#" onclick="window.open('credit_page.html', '_blank'); return false;" style="color:var(--accent); font-size:0.9rem; text-decoration:none; padding:6px 12px; border:1px solid var(--border-light); border-radius:40px;">📄 Credits</a>
        </div>
        <div style="text-align:center; font-size:0.75rem; color:var(--text-muted); margin-top:12px; opacity:0.7;">
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

  // ---- EDIT PROFILE MODE ----
  let editMode = false;
  const toggleBtn = document.getElementById('editProfileToggleBtn');
  if (toggleBtn) {
    toggleBtn.addEventListener('click', function() {
      editMode = !editMode;
      this.textContent = editMode ? '💾 Save Profile' : '✏️ Edit Profile';
      // Enable inline editing: make fields editable
      const fields = ['School', 'Dept', 'Level', 'StudentId', 'Bio'];
      fields.forEach(field => {
        const span = document.getElementById(`profile${field}`);
        if (span) {
          if (editMode) {
            const current = span.textContent;
            span.innerHTML = `<input type="text" value="${current}" id="edit_${field}" style="
              width:100%; padding:6px 10px; border-radius:8px;
              border:1px solid var(--border-light); background:var(--bg-primary);
              color:var(--text-primary); font-size:0.95rem;
            ">`;
          } else {
            const input = document.getElementById(`edit_${field}`);
            if (input) {
              const newVal = input.value;
              span.textContent = newVal || 'Not set';
            }
          }
        }
      });
      if (!editMode) {
        // Save all fields
        const school = document.getElementById('profileSchool')?.textContent || '';
        const department = document.getElementById('profileDept')?.textContent || '';
        const level = document.getElementById('profileLevel')?.textContent || '';
        const studentId = document.getElementById('profileStudentId')?.textContent || '';
        const bio = document.getElementById('profileBio')?.textContent || '';
        updateUserProfile({ school, department, level, studentId, bio });
        addNotification('Profile', 'Profile updated');
        renderProfilePage(); // re-render to clear edit mode
      }
    });
  }

  // ---- CLOUD SYNC STATUS ----
  async function updateCloudStatus() {
    const statusDiv = document.getElementById('cloudSyncStatus');
    if (!statusDiv) return;
    try {
      const resp = await apiGet(`/api/sync/load/${currentUser.id}`);
      const lastSync = resp.data?.backedUpAt ? new Date(resp.data.backedUpAt).toLocaleString() : 'Never';
      statusDiv.innerHTML = `Last synced: <strong>${lastSync}</strong>`;
    } catch (e) {
      statusDiv.textContent = 'Could not fetch sync status';
    }
  }
  updateCloudStatus();

  document.getElementById('manualSyncBtn')?.addEventListener('click', async () => {
    const btn = document.getElementById('manualSyncBtn');
    btn.textContent = '⏳ Syncing...';
    btn.disabled = true;
    try {
      if (window.syncUserDataToCloud) await window.syncUserDataToCloud();
      updateCloudStatus();
      addNotification('Cloud', 'Backup completed');
    } catch (e) {
      addNotification('Cloud', 'Sync failed');
    }
    btn.textContent = '🔄 Sync Now';
    btn.disabled = false;
  });

  // ---- ACTIVITY LOG ----
  async function loadActivityLog() {
    const container = document.getElementById('activityLog');
    if (!container) return;
    try {
      const resp = await apiGet(`/api/analytics/${currentUser.id}`);
      const events = resp.analytics || [];
      if (events.length === 0) {
        container.innerHTML = 'No activity yet. Start studying!';
        return;
      }
      const html = events.slice(0, 10).map(e => `
        <div style="display:flex; justify-content:space-between; padding:4px 0; border-bottom:0.5px solid var(--border-light);">
          <span>${escapeHtml(e.event_type.replace(/_/g, ' '))}</span>
          <span class="text-muted">${e.count} times</span>
        </div>
      `).join('');
      container.innerHTML = html;
    } catch (e) {
      container.textContent = 'Could not load activity.';
    }
  }
  loadActivityLog();

  // ---- 2FA (Email) ----
  const enableBtn = document.getElementById('enableEmail2faBtn');
  const verifyArea = document.getElementById('2faVerificationArea');
  const verifyBtn = document.getElementById('verifyEmail2faBtn');
  const codeInput = document.getElementById('email2faCode');
  const disableBtn = document.getElementById('disableEmail2faBtn');
  const status2fa = document.getElementById('2faStatus');

  (async function load2FAStatus() {
    if (!currentUser?.id) return;
    try {
      const resp = await apiGet(`/api/2fa/status/${currentUser.id}`);
      if (resp.enabled) {
        enableBtn.style.display = 'none';
        disableBtn.style.display = 'inline';
        status2fa.textContent = 'Enabled ✅';
      }
    } catch (e) { /* ignore */ }
  })();

  enableBtn?.addEventListener('click', async () => {
    try {
      const resp = await apiPost('/api/2fa/email/send', { userId: currentUser.id });
      if (resp.success) {
        verifyArea.style.display = 'block';
        enableBtn.style.display = 'none';
        addNotification('2FA', 'Code sent to your email');
      } else {
        addNotification('2FA', 'Failed to send code');
      }
    } catch (err) {
      addNotification('2FA', 'Error sending code');
    }
  });

  verifyBtn?.addEventListener('click', async () => {
    const code = codeInput.value.trim();
    if (!code || code.length !== 6) return alert('Please enter the 6‑digit code.');
    try {
      const resp = await apiPost('/api/2fa/email/verify', { userId: currentUser.id, code });
      if (resp.success) {
        status2fa.textContent = 'Enabled ✅';
        verifyArea.style.display = 'none';
        disableBtn.style.display = 'inline';
        addNotification('2FA', 'Two‑factor authentication enabled');
      } else {
        alert('Invalid or expired code. Please request a new one.');
      }
    } catch (err) {
      alert('Error verifying code.');
    }
  });

  disableBtn?.addEventListener('click', async () => {
    if (confirm('Disable 2FA?')) {
      await apiPost('/api/2fa/email/disable', { userId: currentUser.id });
      status2fa.textContent = 'Not enabled';
      enableBtn.style.display = 'inline';
      disableBtn.style.display = 'none';
      addNotification('2FA', 'Two‑factor authentication disabled');
    }
  });

  // ---- EMAIL REMINDERS ----
  const emailToggle = document.getElementById('emailToggle');
  const emailStatus = document.getElementById('emailToggleStatus');
  if (emailToggle) {
    emailToggle.checked = localStorage.getItem('email_reminders_enabled') === 'true';
    emailStatus.textContent = emailToggle.checked ? 'You are subscribed.' : 'You are unsubscribed.';

    emailToggle.addEventListener('change', async function(e) {
      const enabled = e.target.checked;
      try {
        if (enabled) {
          await apiPost('/api/email/subscribe', { userId: currentUser.id, email: currentUser.email });
          addNotification('Email', 'Subscribed to reminders');
          emailStatus.textContent = 'You are subscribed.';
        } else {
          await apiPost('/api/email/unsubscribe', { userId: currentUser.id });
          addNotification('Email', 'Unsubscribed from reminders');
          emailStatus.textContent = 'You are unsubscribed.';
        }
        localStorage.setItem('email_reminders_enabled', enabled.toString());
      } catch (err) {
        this.checked = !enabled;
        addNotification('Email', 'Update failed. Please try again.');
        emailStatus.textContent = this.checked ? 'You are subscribed.' : 'You are unsubscribed.';
      }
    });
  }

  // ---- FULLSCREEN TOGGLE ----
  const fullscreenToggle = document.getElementById('fullscreenToggle');
  const fullscreenEnabled = localStorage.getItem('fullscreen_mode') === 'true';
  if (fullscreenToggle) {
    fullscreenToggle.checked = fullscreenEnabled;
    if (fullscreenEnabled) {
      document.body.classList.add('fullscreen-mode');
    }

    fullscreenToggle.addEventListener('change', function(e) {
      const enable = e.target.checked;
      localStorage.setItem('fullscreen_mode', enable.toString());
      if (enable) {
        if (document.documentElement.requestFullscreen) {
          document.documentElement.requestFullscreen().catch(() => {});
        }
        document.body.classList.add('fullscreen-mode');
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen().catch(() => {});
        }
        document.body.classList.remove('fullscreen-mode');
      }
    });
  }

  // ---- DATA EXPORT ----
  document.getElementById('exportDataBtn')?.addEventListener('click', async () => {
    try {
      const resp = await apiGet(`/api/export/${currentUser.id}`);
      const blob = new Blob([JSON.stringify(resp.exportedData || {}, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `studentnija-${currentUser.id}.json`;
      a.click();
      URL.revokeObjectURL(url);
      addNotification('Export', 'Backup downloaded');
    } catch (e) {
      addNotification('Export', 'Failed to export data');
    }
  });

  // ---- FEEDBACK ----
  document.getElementById('sendFeedbackBtn')?.addEventListener('click', async () => {
    const msg = document.getElementById('feedbackMsg').value.trim();
    if (!msg) return;
    try {
      await apiPost('/api/feedback', { userId: currentUser.id, message: msg });
      addNotification('Feedback', 'Thank you for your feedback!');
      document.getElementById('feedbackMsg').value = '';
    } catch (e) {
      addNotification('Feedback', 'Failed to send feedback');
    }
  });

  // ---- CHANGE PASSWORD ----
  document.getElementById('changePasswordBtn')?.addEventListener('click', () => {
    // This would ideally use the backend endpoint to change password.
    // Currently, we use local state.js changePassword which only works for local users.
    // For now, we'll keep it but note that it only works for local accounts.
    const old = prompt('Current password:');
    const newp = prompt('New password:');
    if (old && newp) {
      // Use the state.js changePassword function
      import('../state.js').then(module => {
        const success = module.changePassword(old, newp);
        if (success) {
          alert('Password changed successfully');
        } else {
          alert('Incorrect current password or empty fields');
        }
      }).catch(() => {
        alert('Password change not available');
      });
    }
  });

  // ---- LOGOUT ----
  // In renderProfilePage, the logout button should call window.logout
document.getElementById('logoutBtn')?.addEventListener('click', function() {
  if (typeof window.logout === 'function') {
    window.logout();
  } else {
    // fallback
    localStorage.removeItem('studentnija_jwt');
    localStorage.removeItem('studentnija_currentUser');
    window.location.reload();
  }
});

  // ---- DELETE ACCOUNT ----
  document.getElementById('deleteAccountBtn')?.addEventListener('click', function() {
  if (typeof window.deleteAccount === 'function') {
    window.deleteAccount();
  } else {
    alert('Delete account function not available.');
  }
});

  // ---- THEME SELECT ----
  document.getElementById('themeSelect')?.addEventListener('change', (e) => {
    applyTheme(e.target.value);
    // Re-render to reflect changes
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
      dot.style.borderColor = 'white';
      dot.style.boxShadow = '0 0 0 2px var(--accent)';
    }
  });
}

// ============================================================
// HELPER: Update user profile (local + cloud sync)
// ============================================================
function updateUserProfile(data) {
  if (currentUser) {
    Object.assign(currentUser, data);
    saveAll();
    // Trigger cloud sync after a short delay
    if (typeof window.scheduleCloudSync === 'function') {
      window.scheduleCloudSync();
    }
    addNotification('Profile', 'Profile updated');
  }
}
window.updateUserProfile = updateUserProfile;