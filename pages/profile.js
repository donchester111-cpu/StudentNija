import {
  currentUser, users, coursesData, plannerTasks, flashcards,
  userStats, settings, saveAll, addNotification,
  computeOverallCGPA, applyTheme, applyAccentColor,
  escapeHtml
} from '../state.js';

export function renderProfilePage() {
  // Ensure studentId exists
  if (currentUser && !currentUser.studentId) {
    currentUser.studentId = '';
    saveAll();
  }

  const html = `
    <!-- ====== PROFILE HEADER ====== -->
    <div class="profile-header glass-card" style="padding:24px; text-align:center; position:relative;">
      <div class="avatar-upload" id="avatarUpload">
        ${currentUser.profilePic ? `<img src="${currentUser.profilePic}">` : `<span>📷</span>`}
      </div>
      <input type="file" id="profilePicInput" accept="image/*" style="display:none">
      <h2 style="margin:4px 0 2px;">${escapeHtml(currentUser.fullName)}</h2>
      <p class="text-muted" style="margin:0;">${escapeHtml(currentUser.email)}</p>
      <div style="margin-top:8px; display:flex; justify-content:center; gap:12px; flex-wrap:wrap;">
        <span class="badge">🎓 ${escapeHtml(currentUser.level || 'Student')}</span>
        <span class="badge" style="background:var(--accent-green); color:white;">CGPA ${computeOverallCGPA().toFixed(2)}</span>
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
          <button class="edit-field-btn" data-field="school">✏️</button>
        </div>
        <!-- Department -->
        <div class="profile-grid-item">
          <div class="profile-grid-label">📚 Department</div>
          <div class="profile-grid-value" id="profileDept">${escapeHtml(currentUser.department || 'Not set')}</div>
          <button class="edit-field-btn" data-field="department">✏️</button>
        </div>
        <!-- Level -->
        <div class="profile-grid-item">
          <div class="profile-grid-label">📖 Level</div>
          <div class="profile-grid-value" id="profileLevel">${escapeHtml(currentUser.level || 'Not set')}</div>
          <button class="edit-field-btn" data-field="level">✏️</button>
        </div>
        <!-- Student ID -->
        <div class="profile-grid-item">
          <div class="profile-grid-label">🆔 Student ID</div>
          <div class="profile-grid-value" id="profileStudentId">${escapeHtml(currentUser.studentId || 'Not set')}</div>
          <button class="edit-field-btn" data-field="studentId">✏️</button>
        </div>
        <!-- Bio (full width) -->
        <div class="profile-grid-item full-width">
          <div class="profile-grid-label">📝 Bio</div>
          <div class="profile-grid-value" id="profileBio">${escapeHtml(currentUser.bio || 'No bio yet')}</div>
          <button class="edit-field-btn" data-field="bio">✏️</button>
        </div>
      </div>
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
          <span style="background:rgba(255,255,255,0.2); padding:2px 12px; border-radius:40px; font-size:11px; color:white;">v1.2.0</span>
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
    // Use the global logout function (attached to window in app.js)
    if (typeof window.logout === 'function') {
      window.logout();
    } else {
      // Fallback: clear local storage and reload
      localStorage.removeItem('studentnija_jwt');
      localStorage.removeItem('studentnija_currentUser');
      window.location.reload();
    }
  });

  // ---- DELETE ACCOUNT ----
  document.getElementById('deleteAccountBtn')?.addEventListener('click', function() {
    // Use the global deleteAccount (from state.js or app.js)
    if (typeof window.deleteAccount === 'function') {
      window.deleteAccount();
    } else {
      // Fallback: call the imported deleteAccount
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

  // ---- Expose updateUserProfile globally if not already ----
  // (It should be attached to window in app.js, but just in case)
  if (typeof window.updateUserProfile === 'undefined') {
    window.updateUserProfile = function(data) {
      // This is a fallback – should be defined in app.js
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