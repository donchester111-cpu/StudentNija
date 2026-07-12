import { openToolModal } from './modal.js';
import { semesterList, semesterNames, coursesData, gradeMap, computeOverallCGPA, addNotification, escapeHtml } from '../state.js';

export function openGradePredictor() {
  const html = `
    <div class="grade-predictor">
      <h3>📊 What-If Grade Simulator</h3>
      <p class="text-muted">Add your desired grades for a semester and see the impact on your overall CGPA.</p>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin:12px 0;">
        <select id="predSemSelect" style="flex:1; min-width:150px;">
          ${semesterList.map(s => `<option value="${s}">${semesterNames[s]}</option>`).join('')}
        </select>
        <input type="number" id="predUnit" placeholder="Credit Units" style="flex:1; min-width:100px;">
        <input type="text" id="predGrade" placeholder="Grade (A-F)" style="flex:1; min-width:80px;">
        <button id="addPredCourseBtn" class="btn-primary" style="width:auto;">Add Course</button>
      </div>
      <div id="predCourseList"></div>
      <button id="simulateGpaBtn" class="btn-primary">Simulate CGPA</button>
      <div id="simulationResult" class="math-solution" style="margin-top:16px;"></div>
    </div>
  `;
  openToolModal('Grade Predictor', html);

  const predictedCourses = [];

  function renderPredCourses() {
    const container = document.getElementById('predCourseList');
    if (!container) return;
    if (predictedCourses.length === 0) {
      container.innerHTML = '<div class="text-muted">No courses added yet.</div>';
      return;
    }
    container.innerHTML = predictedCourses.map((c, idx) => `
      <div class="course-item flex-between">
        <div><strong>${c.code || 'Course'}</strong> (${c.unit} units, Grade ${c.grade})</div>
        <button class="del-pred" data-idx="${idx}" style="background:none;border:none;">🗑️</button>
      </div>
    `).join('');
    container.querySelectorAll('.del-pred').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        predictedCourses.splice(idx, 1);
        renderPredCourses();
      };
    });
  }

  document.getElementById('addPredCourseBtn').onclick = () => {
    const sem = document.getElementById('predSemSelect').value;
    const unit = parseFloat(document.getElementById('predUnit').value);
    const grade = document.getElementById('predGrade').value.toUpperCase();
    if (!unit || !grade || !gradeMap[grade]) {
      alert('Enter valid unit and grade (A-F).');
      return;
    }
    predictedCourses.push({ code: `${sem} (pred)`, unit, grade, points: unit * gradeMap[grade] });
    renderPredCourses();
    document.getElementById('predUnit').value = '';
    document.getElementById('predGrade').value = '';
    addNotification('Grade Predictor', 'Course added');
  };

  document.getElementById('simulateGpaBtn').onclick = () => {
    if (predictedCourses.length === 0) {
      document.getElementById('simulationResult').innerHTML = 'Please add at least one course.';
      return;
    }
    const totalUnits = predictedCourses.reduce((sum, c) => sum + c.unit, 0);
    const totalPoints = predictedCourses.reduce((sum, c) => sum + c.points, 0);
    const predGpa = totalUnits === 0 ? 0 : (totalPoints / totalUnits).toFixed(2);

    const allCourses = [];
    for (const s of semesterList) {
      allCourses.push(...coursesData[s]);
    }
    const allUnits = allCourses.reduce((sum, c) => sum + c.unit, 0);
    const allPoints = allCourses.reduce((sum, c) => sum + c.points, 0);
    const combinedUnits = allUnits + totalUnits;
    const combinedPoints = allPoints + totalPoints;
    const newCgpa = combinedUnits === 0 ? 0 : (combinedPoints / combinedUnits).toFixed(2);

    document.getElementById('simulationResult').innerHTML = `
      <strong>Predicted semester GPA:</strong> ${predGpa}<br>
      <strong>New overall CGPA:</strong> ${newCgpa} (was ${computeOverallCGPA()})<br>
      <span class="text-muted">Based on ${predictedCourses.length} predicted course(s).</span>
    `;
  };
  renderPredCourses();
}