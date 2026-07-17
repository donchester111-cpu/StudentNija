import {
  currentUser, users, coursesData, plannerTasks, flashcards,
  userStats, settings, saveAll, addNotification,
  computeOverallCGPA, applyTheme, applyAccentColor,
  escapeHtml, achievements, timetableEvents, exams
} from '../state.js';

// API helpers – adjust path if needed
const API_BASE = 'https://studentnija-public-chat.onrender.com';

async function apiPost(path, body) {
  const res = await fetch(API_BASE + path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function apiGet(path) {
  const res = await fetch(API_BASE + path);
  return res.json();
}

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
    <div class="glass-card" style="padding:24px; text-align:center; position:relative;">
      <div class="avatar-upload" id="avatarUpload">
        ${currentUser.profilePic ? `<img src="${currentUser.profilePic}" style="width:100%;height:100%;object-fit:cover;border-radius:50%;">` : `<span style="font-size:40px;">📷</span>`}
      </div>
      <input type="file" id="profilePicInput" accept="image/*" style="display:none">
      <h2 style="margin:4px 0 2px;">${escapeHtml(currentUser.fullName)}</h2>
      <p class="text-muted" style="margin:0;">${escapeHtml(currentUser.email)}</p>
      <div style="margin-top:8px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
        <span class="badge">🎓 ${escapeHtml(currentUser.level || 'Student')}</span>
        <span class="badge" style="background:var(--accent-green); color:white;">CGPA ${cgpa}</span>
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

    <!-- ====== CLOUD SYNC STATUS ====== -->
    <div class="glass-card" style="padding:16px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-size:20px;">☁️</span>
        <h3 style="margin:0; font-size:16px; font-weight:600;">Cloud Backup</h3>
      </div>
      <div id="cloudSyncStatus" class="text-muted" style="font-size:13px;">
        Loading...
      </div>
      <button id="manualSyncBtn" class="btn-outline" style="width:100%; margin-top:8px;">🔄 Sync Now</button>
    </div>

    <!-- ====== ACTIVITY LOG ====== -->
    <div class="glass-card" style="padding:16px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:8px;">
        <span style="font-size:20px;">📜</span>
        <h3 style="margin:0; font-size:16px; font-weight:600;">Recent Activity</h3>
      </div>
      <div id="activityLog" class="text-muted" style="font-size:13px;">
        Loading...
      </div>
    </div>

    <!-- ====== ACHIEVEMENTS ====== -->
    <div class="glass-card" style="padding:16px; margin-bottom:16px;">
      <div class="flex-between" style="margin-bottom:8px;">
        <div style="display:flex; align-items:center; gap:8px;">
          <span style="font-size:20px;">🏅</span>
          <h3 style="margin:0; font-size:16px; font-weight:600;">Achievements</h3>
        </div>
        <span class="text-muted" style="font-size:13px;">${earned}/${totalAchievements}</span>
      </div>
      <div class="achievement-grid" id="profileAchievements">
        ${achievements.map(a => `
          <div class="ach-item" style="text-align:center; opacity:${a.achieved ? 1 : 0.4};">
            <span class="ach-icon">${a.icon}</span>
            <span class="ach-status ${a.achieved ? 'unlocked' : 'locked'}">${a.achieved ? '✓' : '🔒'}</span>
            <div style="font-size:11px; margin-top:4px;">${a.name}</div>
          </div>
        `).join('')}
      </div>
    </div>

    <!-- ====== PERSONAL INFORMATION CARD ====== -->
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
          <button class="edit-field-btn" data-field="school" style="display:none;">✏️</button>
        </div>
        <!-- Department -->
        <div class="profile-grid-item">
          <div class="profile-grid-label">📚 Department</div>
          <div class="profile-grid-value" id="profileDept">${escapeHtml(currentUser.department || 'Not set')}</div>
          <button class="edit-field-btn" data-field="department" style="display:none;">✏️</button>
        </div>
        <!-- Level -->
        <div class="profile-grid-item">
          <div class="profile-grid-label">📖 Level</div>
          <div class="profile-grid-value" id="profileLevel">${escapeHtml(currentUser.level || 'Not set')}</div>
          <button class="edit-field-btn" data-field="level" style="display:none;">✏️</button>
        </div>
        <!-- Student ID -->
        <div class="profile-grid-item">
          <div class="profile-grid-label">🆔 Student ID</div>
          <div class="profile-grid-value" id="profileStudentId">${escapeHtml(currentUser.studentId || 'Not set')}</div>
          <button class="edit-field-btn" data-field="studentId" style="display:none;">✏️</button>
        </div>
        <!-- Bio (full width) -->
        <div class="profile-grid-item full-width">
          <div class="profile-grid-label">📝 Bio</div>
          <div class="profile-grid-value" id="profileBio">${escapeHtml(currentUser.bio || 'No bio yet')}</div>
          <button class="edit-field-btn" data-field="bio" style="display:none;">✏️</button>
        </div>
      </div>
    </div>

    <!-- ====== 2‑FACTOR AUTH (EMAIL) ====== -->
    <div class="glass-card" style="padding:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">🔐</span>
        <h3 style="margin:0; font-size:18px; font-weight:600;">Two‑Factor Authentication</h3>
      </div>
      <div id="2faStatus">Not enabled</div>
      <button id="enableEmail2faBtn" class="btn-outline" style="margin-top:8px;">Enable Email 2FA</button>
      <div id="2faVerificationArea" style="display:none; margin-top:8px;">
        <p class="text-muted">A verification code has been sent to your email. Enter it below.</p>
        <input type="text" id="email2faCode" placeholder="6‑digit code" maxlength="6" style="width:100%; padding:10px; border-radius:12px; border:1px solid var(--border-light); background:var(--bg-primary); color:var(--text-primary);">
        <button id="verifyEmail2faBtn" class="btn-primary" style="margin-top:6px;">Verify & Enable</button>
      </div>
      <button id="disableEmail2faBtn" class="btn-outline" style="display:none; margin-top:8px;">Disable 2FA</button>
    </div>

    <!-- ====== EMAIL REMINDERS ====== -->
    <div class="glass-card" style="padding:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">📧</span>
        <h3 style="margin:0; font-size:18px; font-weight:600;">Email Reminders</h3>
      </div>
      <label style="display:flex; align-items:center; gap:8px;">
        <input type="checkbox" id="emailToggle" /> Send study reminders to my email
      </label>
    </div>

    <!-- ====== DATA EXPORT ====== -->
    <div class="glass-card" style="padding:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">📤</span>
        <h3 style="margin:0; font-size:18px; font-weight:600;">Export My Data</h3>
      </div>
      <button id="exportDataBtn" class="btn-outline">Download Backup</button>
    </div>

    <!-- ====== FEEDBACK ====== -->
    <div class="glass-card" style="padding:20px; margin-bottom:16px;">
      <div style="display:flex; align-items:center; gap:8px; margin-bottom:16px;">
        <span style="font-size:20px;">📬</span>
        <h3 style="margin:0; font-size:18px; font-weight:600;">Send Feedback</h3>
      </div>
      <textarea id="feedbackMsg" rows="3" placeholder="We'd love to hear from you..." style="width:100%; padding:10px; border-radius:12px; border:1px solid var(--border-light); background:var(--bg-primary); color:var(--text-primary);"></textarea>
      <button id="sendFeedbackBtn" class="btn-primary" style="margin-top:8px;">Send</button>
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
          <span style="background:rgba(255,255,255,0.2); padding:2px 12px; border-radius:40px; font-size:11px; color:white;">v1.4.0</span>
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
      // Trigger the global sync function
      if (window.scheduleCloudSync) {
        await window.syncUserDataToCloud?.();
      }
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

  // Check current 2FA status on load
  (async function load2FAStatus() {
    if (!currentUser?.id) return;
    const resp = await apiGet(`/api/2fa/status/${currentUser.id}`);
    if (resp.enabled) {
      enableBtn.style.display = 'none';
      disableBtn.style.display = 'inline';
      status2fa.textContent = 'Enabled ✅';
    }
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
if (emailToggle) {
  // Load current subscription status – check localStorage or default to false
  emailToggle.checked = localStorage.getItem('email_reminders_enabled') !== 'false';

  emailToggle.addEventListener('change', async (e) => {
    const enabled = e.target.checked;
    try {
      if (enabled) {
        await apiPost('/api/email/subscribe', { userId: currentUser.id, email: currentUser.email });
        addNotification('Email', 'Subscribed to reminders');
      } else {
        await apiPost('/api/email/unsubscribe', { userId: currentUser.id });
        addNotification('Email', 'Unsubscribed from reminders');
      }
      localStorage.setItem('email_reminders_enabled', enabled);
    } catch (err) {
      // Revert the toggle if it fails
      emailToggle.checked = !enabled;
      addNotification('Email', 'Failed to update. Please try again.');
    }
  });
}

  // ---- DATA EXPORT ----
  document.getElementById('exportDataBtn')?.addEventListener('click', async () => {
    const resp = await apiGet(`/api/export/${currentUser.id}`);
    const blob = new Blob([JSON.stringify(resp.exportedData || {}, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `studentnija-${currentUser.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
    addNotification('Export', 'Backup downloaded');
  });

  // ---- FEEDBACK ----
  document.getElementById('sendFeedbackBtn')?.addEventListener('click', async () => {
    const msg = document.getElementById('feedbackMsg').value.trim();
    if (!msg) return;
    await apiPost('/api/feedback', { userId: currentUser.id, message: msg });
    addNotification('Feedback', 'Thank you for your feedback!');
    document.getElementById('feedbackMsg').value = '';
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
  document.getElementById('logoutBtn')?.addEventListener('click', function() {
    if (typeof window.logout === 'function') {
      window.logout();
    } else {
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
      import('../state.js').then(module => {
        module.deleteAccount();
      });
    }
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

  // Expose updateUserProfile globally if not already
  if (typeof window.updateUserProfile === 'undefined') {
    window.updateUserProfile = function(data) {
      if (currentUser) {
        Object.assign(currentUser, data);
        localStorage.setItem('studentnija_currentUser', JSON.stringify(currentUser));
        saveAll();
        renderProfilePage();
        addNotification('Profile', 'Profile updated');
      }
    };
  }
}
