import {
  currentUser, coursesData, semesterList, semesterNames, gradeMap,
  saveAll, addNotification, checkAchievements,
  computeOverallCGPA, getClassification, escapeHtml, settings
} from '../state.js';

// Secondary school grade map (WAEC/NECO)
const secondaryGradeMap = {
  'A1': 8, 'B2': 7, 'B3': 6, 'C4': 5, 'C5': 4, 'C6': 3,
  'D7': 2, 'E8': 1, 'F9': 0
};

// University classification (5‑point)
function uniClassification(cgpa) {
  if (cgpa >= 4.50) return 'First Class';
  if (cgpa >= 3.50) return 'Second Class Upper';
  if (cgpa >= 2.50) return 'Second Class Lower';
  if (cgpa >= 1.50) return 'Third Class';
  return 'Pass';
}

// Polytechnic classification
function polyClassification(cgpa) {
  if (cgpa >= 3.50) return 'Distinction';
  if (cgpa >= 3.00) return 'Upper Credit';
  if (cgpa >= 2.00) return 'Lower Credit';
  return 'Pass';
}

// Secondary school aggregate
function secondaryAggregate(subjects) {
  if (!subjects || subjects.length === 0) return { total: 0, avg: 0, best8: 0 };
  const scores = subjects.map(s => secondaryGradeMap[s.grade] || 0).sort((a, b) => b - a);
  const total = scores.reduce((a, b) => a + b, 0);
  const best8 = scores.slice(0, 8).reduce((a, b) => a + b, 0);
  return { total, avg: (total / subjects.length).toFixed(1), best8 };
}

// Get school type from settings (default 'university')
function getSchoolType() {
  return settings.schoolType || 'university';
}

function setSchoolType(type) {
  settings.schoolType = type;
  saveAll();
}

// Calculate CGPA for uni/poly
function calculateCGPA(courses) {
  let totalUnits = 0, totalPoints = 0;
  courses.forEach(c => {
    totalUnits += c.unit;
    totalPoints += c.unit * gradeMap[c.grade];
  });
  return totalUnits === 0 ? 0 : totalPoints / totalUnits;
}

export function renderAcademics() {
  const schoolType = getSchoolType();
  const allSemesters = Object.keys(semesterNames);
  const activeSemester = semesterList[0] || allSemesters[0] || 'default';
  const cgpa = computeOverallCGPA();
  const classification = schoolType === 'university'
    ? uniClassification(cgpa)
    : schoolType === 'polytechnic'
      ? polyClassification(cgpa)
      : '';

  const html = `
    <style>
      /* Academics specific styles */
      .academics-container {
        display: flex;
        flex-direction: column;
        gap: 20px;
      }
      .school-type-selector {
        display: flex;
        gap: 10px;
        align-items: center;
        flex-wrap: wrap;
      }
      .school-type-btn {
        background: var(--bg-card);
        border: 2px solid transparent;
        border-radius: 20px;
        padding: 8px 18px;
        font-weight: 600;
        cursor: pointer;
        transition: all 0.2s;
        font-size: 14px;
        color: var(--text-primary);
        font-family: inherit;
      }
      .school-type-btn.active {
        border-color: var(--accent);
        background: var(--accent);
        color: white;
        box-shadow: 0 4px 12px var(--accent-glow);
      }
      .semester-bar {
        display: flex;
        gap: 8px;
        flex-wrap: wrap;
        align-items: center;
      }
      .semester-pill {
        background: var(--bg-card);
        border: 1px solid var(--border-light);
        border-radius: 30px;
        padding: 6px 16px;
        font-weight: 500;
        cursor: pointer;
        font-size: 14px;
        transition: 0.2s;
        color: var(--text-primary);
      }
      .semester-pill.active {
        background: var(--accent);
        color: white;
        border-color: var(--accent);
      }
      .course-card {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 16px;
        margin-bottom: 12px;
        border: 1px solid var(--border-light);
      }
      .course-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
      }
      .cgpa-circle-container {
        position: relative;
        width: 120px;
        height: 120px;
        margin: 0 auto;
      }
      .cgpa-circle-container svg {
        width: 120px;
        height: 120px;
        transform: rotate(-90deg);
      }
      .cgpa-circle-bg {
        fill: none;
        stroke: rgba(255,255,255,0.1);
        stroke-width: 10;
      }
      .cgpa-circle-fg {
        fill: none;
        stroke: var(--accent);
        stroke-width: 10;
        stroke-linecap: round;
        transition: stroke-dashoffset 0.8s ease;
      }
      .cgpa-value {
        position: absolute;
        inset: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 28px;
        color: var(--text-primary);
      }
      .cgpa-label {
        font-size: 12px;
        font-weight: 600;
        color: var(--text-muted);
        margin-top: 2px;
      }
      .target-calc {
        background: var(--bg-card);
        border-radius: 16px;
        padding: 16px;
        display: flex;
        flex-direction: column;
        gap: 10px;
        border: 1px solid var(--border-light);
      }
      .target-calc input {
        background: var(--bg-primary);
        border: 1px solid var(--border-light);
        border-radius: 12px;
        padding: 10px 14px;
        color: var(--text-primary);
        font-family: inherit;
        font-size: 14px;
        outline: none;
        transition: border-color 0.2s;
      }
      .target-calc input:focus {
        border-color: var(--accent);
      }
      .target-calc .calc-row {
        display: flex;
        gap: 10px;
        flex-wrap: wrap;
        align-items: center;
      }
      .target-calc .btn {
        width: auto;
        padding: 10px 20px;
      }
      .target-result {
        font-weight: 600;
        padding: 8px;
        border-radius: 12px;
        background: var(--bg-primary);
      }
      .grade-legend {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(100px,1fr));
        gap: 4px;
        font-size: 13px;
        margin-top: 8px;
      }
    </style>

    <div class="academics-container">
      <!-- School Type Selector -->
      <div class="glass-card" style="padding:16px;">
        <div class="school-type-selector">
          <span style="font-weight:600;">Institution:</span>
          <button class="school-type-btn ${schoolType==='university'?'active':''}" data-type="university">🏛️ University</button>
          <button class="school-type-btn ${schoolType==='polytechnic'?'active':''}" data-type="polytechnic">🏭 Polytechnic</button>
          <button class="school-type-btn ${schoolType==='secondary'?'active':''}" data-type="secondary">🏫 Secondary</button>
        </div>
      </div>

      <!-- CGPA / Aggregate Overview -->
      <div class="glass-card" style="padding:20px; text-align:center;">
        ${schoolType !== 'secondary' ? `
        <div class="cgpa-circle-container">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="54" class="cgpa-circle-bg" />
            <circle cx="60" cy="60" r="54" class="cgpa-circle-fg" id="cgpaCircleFg"
                    stroke-dasharray="${2 * Math.PI * 54}" stroke-dashoffset="${2 * Math.PI * 54 * (1 - cgpa / (schoolType === 'university' ? 5.0 : 4.0))}" />
          </svg>
          <div class="cgpa-value">
            <span id="cgpaDisplay">${cgpa.toFixed(2)}</span>
            <span class="cgpa-label">CGPA</span>
          </div>
        </div>
        <div style="font-size:16px; margin-top:8px; color:var(--accent-light);" id="classificationDisplay">
          ${classification}
        </div>` : `
        <div id="secondaryStats"></div>`}
      </div>

      <!-- Semester / Term Selector -->
      <div class="glass-card" style="padding:16px;">
        <div class="semester-bar" id="semesterBar">
          ${allSemesters.map(sem => `
            <div class="semester-pill ${sem === activeSemester ? 'active' : ''}" data-sem="${sem}">
              ${semesterNames[sem] || sem}
            </div>
          `).join('')}
          <button id="addSemesterBtn" class="btn-outline" style="width:auto; padding:6px 14px; margin-left:auto;">+ Add Term</button>
        </div>
      </div>

      <!-- Courses / Subjects List -->
      <div class="glass-card" style="padding:16px;">
        <h3 style="margin-bottom:12px;">📚 ${schoolType === 'secondary' ? 'Subjects' : 'Courses'}</h3>
        <div id="coursesContainer"></div>
        <button id="addCourseBtn" class="btn-primary" style="margin-top:12px;">+ Add ${schoolType === 'secondary' ? 'Subject' : 'Course'}</button>
      </div>

      <!-- Grade Reference (secondary) -->
      ${schoolType === 'secondary' ? `
      <div class="glass-card" style="padding:16px;">
        <h3 style="margin-bottom:8px;">📈 Grade Points</h3>
        <div class="grade-legend">
          ${Object.entries(secondaryGradeMap).map(([grade, points]) => `
            <span><strong>${grade}</strong> → ${points} pt</span>
          `).join('')}
        </div>
      </div>` : ''}

      <!-- Target GPA Calculator -->
      <div class="glass-card target-calc">
        <h3>🎯 Target GPA</h3>
        <div class="calc-row">
          <input type="number" id="targetCgpa" placeholder="Target CGPA" step="0.01" min="0">
          <input type="number" id="remainingUnits" placeholder="Remaining units">
          <button id="calcTargetBtn" class="btn">Calculate</button>
        </div>
        <div id="targetResult" class="target-result text-muted"></div>
      </div>

      <!-- Export -->
      <button id="exportResultBtn" class="btn-outline" style="width:100%;">📄 Export Result</button>
    </div>
  `;

  document.getElementById('academicsContent').innerHTML = html;

  // Current active semester
  let currentSemester = activeSemester;
  const schoolTypeState = getSchoolType();

  // School type buttons
  document.querySelectorAll('.school-type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const type = btn.dataset.type;
      setSchoolType(type);
      renderAcademics(); // re‑render with new type
    });
  });

  // Semester pills
  document.querySelectorAll('.semester-pill').forEach(pill => {
    pill.addEventListener('click', () => {
      document.querySelectorAll('.semester-pill').forEach(p => p.classList.remove('active'));
      pill.classList.add('active');
      currentSemester = pill.dataset.sem;
      loadSemesterCourses(currentSemester);
    });
  });

  // Add semester
  document.getElementById('addSemesterBtn').addEventListener('click', () => {
    const name = prompt('Term name (e.g., "First Term 2026"):');
    if (!name) return;
    const key = name.toLowerCase().replace(/\s+/g, '_');
    if (semesterNames[key]) return alert('Term already exists');
    semesterList.push(key);
    semesterNames[key] = name;
    coursesData[key] = coursesData[key] || [];
    saveAll();
    renderAcademics();
  });

  // Load courses for current semester
  function loadSemesterCourses(semId) {
    const container = document.getElementById('coursesContainer');
    const courses = coursesData[semId] || [];
    const isSecondary = schoolTypeState === 'secondary';

    if (courses.length === 0) {
      container.innerHTML = `<div class="text-muted" style="padding:20px;text-align:center;">No ${isSecondary ? 'subjects' : 'courses'} added yet.</div>`;
    } else {
      container.innerHTML = courses.map(c => `
        <div class="course-card">
          <div class="course-row">
            <div>
              <strong>${escapeHtml(c.code)}</strong>
              <div class="text-muted">
                ${isSecondary ? '' : `${c.unit} units · `} Grade: ${c.grade}
              </div>
            </div>
            <div style="display:flex; gap:6px;">
              <button class="edit-course-btn" data-id="${c.id}" data-sem="${semId}" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;">✏️</button>
              <button class="delete-course-btn" data-id="${c.id}" data-sem="${semId}" style="background:transparent;border:none;color:var(--text-muted);cursor:pointer;">🗑️</button>
            </div>
          </div>
          ${isSecondary ? `<div class="text-muted" style="font-size:13px;">Points: ${secondaryGradeMap[c.grade] || 0}</div>` : ''}
        </div>
      `).join('');
    }

    // Attach events
    document.querySelectorAll('.delete-course-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        coursesData[semId] = coursesData[semId].filter(c => c.id !== id);
        saveAll();
        loadSemesterCourses(semId);
        updateAllStats();
        checkAchievements();
        addNotification('Academics', `${isSecondary ? 'Subject' : 'Course'} deleted`);
      });
    });

    document.querySelectorAll('.edit-course-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = parseInt(btn.dataset.id);
        const course = coursesData[semId].find(c => c.id === id);
        if (!course) return;
        const newCode = prompt(`${isSecondary ? 'Subject' : 'Code'}`, course.code);
        if (!newCode) return;
        const newGrade = prompt('Grade', course.grade).toUpperCase();
        if (!newGrade) return;
        let newUnit = course.unit;
        if (!isSecondary) {
          const unitInput = prompt('Units', course.unit);
          if (unitInput === null) return;
          newUnit = parseFloat(unitInput);
        }
        if (isSecondary && secondaryGradeMap[newGrade] === undefined) return alert('Invalid grade');
        if (!isSecondary && gradeMap[newGrade] === undefined) return alert('Invalid grade');

        course.code = newCode.toUpperCase();
        course.grade = newGrade;
        if (!isSecondary) course.unit = newUnit;
        course.points = isSecondary ? secondaryGradeMap[newGrade] : newUnit * gradeMap[newGrade];
        saveAll();
        loadSemesterCourses(semId);
        updateAllStats();
        addNotification('Academics', 'Updated');
      });
    });

    updateAllStats();
  }

  // Update all CGPA/secondary stats on display
  function updateAllStats() {
    const st = getSchoolType();
    if (st === 'secondary') {
      const allCourses = Object.values(coursesData).flat();
      const stats = secondaryAggregate(allCourses);
      const statsDiv = document.getElementById('secondaryStats');
      if (statsDiv) {
        statsDiv.innerHTML = `
          <div style="display:flex; gap:20px; flex-wrap:wrap; justify-content:center;">
            <div><strong>Total Points:</strong> ${stats.total}</div>
            <div><strong>Best 8 Subjects:</strong> ${stats.best8}</div>
            <div><strong>Average:</strong> ${stats.avg}</div>
          </div>`;
      }
    } else {
      const cgpa = computeOverallCGPA();
      const classification = st === 'university' ? uniClassification(cgpa) : polyClassification(cgpa);
      const cgpaDisplay = document.getElementById('cgpaDisplay');
      const classificationDisplay = document.getElementById('classificationDisplay');
      const cgpaCircleFg = document.getElementById('cgpaCircleFg');
      if (cgpaDisplay) cgpaDisplay.textContent = cgpa.toFixed(2);
      if (classificationDisplay) classificationDisplay.textContent = classification;
      if (cgpaCircleFg) {
        const maxCgpa = st === 'university' ? 5.0 : 4.0;
        const offset = 2 * Math.PI * 54 * (1 - cgpa / maxCgpa);
        cgpaCircleFg.setAttribute('stroke-dashoffset', offset);
      }
    }
  }

  // Add course button
  document.getElementById('addCourseBtn').addEventListener('click', () => {
    const semId = currentSemester;
    const isSecondary = schoolTypeState === 'secondary';
    const code = prompt(isSecondary ? 'Subject name:' : 'Course code:');
    if (!code) return;
    const grade = prompt(isSecondary ? 'Grade (e.g., A1, B2):' : 'Grade (A-F):').toUpperCase();
    if (!grade) return;

    if (isSecondary) {
      if (secondaryGradeMap[grade] === undefined) return alert('Invalid grade');
      const newSubject = {
        id: Date.now(),
        code: code.toUpperCase(),
        grade: grade,
        points: secondaryGradeMap[grade]
      };
      coursesData[semId].push(newSubject);
    } else {
      let unit = parseFloat(prompt('Units:'));
      if (isNaN(unit)) return;
      if (gradeMap[grade] === undefined) return alert('Invalid grade');
      const newCourse = {
        id: Date.now(),
        code: code.toUpperCase(),
        unit: unit,
        grade: grade,
        points: unit * gradeMap[grade]
      };
      coursesData[semId].push(newCourse);
    }

    saveAll();
    loadSemesterCourses(semId);
    updateAllStats();
    checkAchievements();
    addNotification('Academics', `${isSecondary ? 'Subject' : 'Course'} added`);
  });

  // Target GPA calculator
  document.getElementById('calcTargetBtn').addEventListener('click', () => {
    const target = parseFloat(document.getElementById('targetCgpa').value);
    const remaining = parseFloat(document.getElementById('remainingUnits').value);
    const currentCGPA = computeOverallCGPA();
    const totalUnits = Object.values(coursesData).flat().reduce((acc, c) => acc + (c.unit || 1), 0);
    if (isNaN(target) || isNaN(remaining) || remaining <= 0) {
      document.getElementById('targetResult').textContent = 'Please enter valid numbers.';
      return;
    }
    const neededAverage = (target * (totalUnits + remaining) - currentCGPA * totalUnits) / remaining;
    document.getElementById('targetResult').textContent = neededAverage > 0
      ? `You need an average GPA of ${neededAverage.toFixed(2)} in your remaining ${remaining} units to reach a CGPA of ${target}.`
      : 'Target already achieved or impossible with current grades.';
  });

  // Export result
  document.getElementById('exportResultBtn').addEventListener('click', () => {
    let result = `Student: ${currentUser.fullName}\n`;
    if (schoolTypeState === 'secondary') {
      const allCourses = Object.values(coursesData).flat();
      const stats = secondaryAggregate(allCourses);
      result += `O'Level Summary:\nTotal Points: ${stats.total}\nBest 8: ${stats.best8}\n\nSubjects:\n`;
      allCourses.forEach(c => {
        result += `${c.code} - ${c.grade} (${secondaryGradeMap[c.grade]} pts)\n`;
      });
    } else {
      result += `CGPA: ${computeOverallCGPA().toFixed(2)}\nClassification: ${schoolTypeState === 'university' ? uniClassification(computeOverallCGPA()) : polyClassification(computeOverallCGPA())}\n\nCourses:\n`;
      for (let sem of semesterList) {
        (coursesData[sem] || []).forEach(c => {
          result += `${c.code} - ${c.grade} (${c.unit} units)\n`;
        });
      }
    }
    navigator.clipboard.writeText(result);
    alert('Result copied to clipboard!');
    addNotification('Export', 'Result copied');
  });

  // Initial load
  loadSemesterCourses(currentSemester);
}