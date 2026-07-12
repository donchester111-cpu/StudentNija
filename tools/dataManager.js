import { openToolModal } from './modal.js';
import {
  currentUser, coursesData, plannerTasks, timetableEvents,
  exams, savedNotes, flashcards, achievements, studyHoursLog,
  notifications, userStats, settings,
  saveAll, addNotification
} from '../state.js';

export function openDataManager() {
  const html = `
    <div class="data-manager">
      <h3>💾 Backup & Restore</h3>
      <p class="text-muted">Export all your data as a JSON file, or import a previously saved backup.</p>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin-top:16px;">
        <button id="exportDataBtn" class="btn-primary" style="width:auto;">📤 Export All</button>
        <button id="importDataBtn" class="btn-outline" style="width:auto;">📥 Import Backup</button>
        <input type="file" id="importFileInput" accept=".json" style="display:none;">
      </div>
      <div id="dataStatus" class="text-muted" style="margin-top:12px;"></div>
    </div>
  `;
  openToolModal('Data Manager', html);

  document.getElementById('exportDataBtn').onclick = () => {
    const data = {
      user: currentUser,
      courses: coursesData,
      planner: plannerTasks,
      timetable: timetableEvents,
      exams: exams,
      notes: savedNotes,
      flashcards: flashcards,
      achievements: achievements,
      studyLog: studyHoursLog,
      notifications: notifications,
      stats: userStats,
      settings: settings
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `StudentNija_Backup_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById('dataStatus').textContent = '✅ Backup downloaded.';
    addNotification('Backup', 'Data exported');
  };

  document.getElementById('importDataBtn').onclick = () => {
    document.getElementById('importFileInput').click();
  };

  document.getElementById('importFileInput').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.courses) Object.assign(coursesData, data.courses);
        if (data.planner) plannerTasks = data.planner;
        if (data.timetable) timetableEvents = data.timetable;
        if (data.exams) exams = data.exams;
        if (data.notes) savedNotes = data.notes;
        if (data.flashcards) flashcards = data.flashcards;
        if (data.achievements) achievements = data.achievements;
        if (data.studyLog) studyHoursLog = data.studyLog;
        if (data.notifications) notifications = data.notifications;
        if (data.stats) Object.assign(userStats, data.stats);
        if (data.settings) Object.assign(settings, data.settings);
        saveAll();
        localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
        localStorage.setItem('studentnija_notes_list', JSON.stringify(savedNotes));
        document.getElementById('dataStatus').textContent = '✅ Data imported successfully! Refresh to see changes.';
        addNotification('Backup', 'Data imported');
      } catch (err) {
        document.getElementById('dataStatus').textContent = '❌ Invalid backup file.';
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };
}