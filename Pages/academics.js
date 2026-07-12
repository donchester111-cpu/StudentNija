import {
  coursesData, semesterList, semesterNames, gradeMap,
  saveAll, addNotification, checkAchievements,
  computeOverallCGPA, getClassification, escapeHtml
} from '../state.js';

export function renderAcademics() {
  let semSelect = `<select id="cgpaSemSelect" style="margin-bottom:16px;">${semesterList.map(s=>`<option value="${s}">${semesterNames[s]}</option>`).join('')}</select>`;
  let coursesHtml = `<div id="semesterCoursesList"></div><button id="addCourseSemBtn" class="btn-primary">+ Add Course</button><div id="semesterStatsBlock"></div><div class="stats-row"><div>Overall CGPA: ${computeOverallCGPA()}</div><div>Class: ${getClassification(computeOverallCGPA())}</div></div><button id="exportResultBtn" class="btn-outline">📄 Export Result</button>`;
  document.getElementById('academicsContent').innerHTML = `<div class="glass-card" style="padding:20px;">${semSelect}${coursesHtml}</div>`;

  function loadSemesterCourses(semId) {
    let courses = coursesData[semId]||[];
    let units=0, points=0;
    courses.forEach(c=>{units+=c.unit; points+=c.points;});
    let gpa=units===0?0:(points/units).toFixed(2);
    document.getElementById('semesterStatsBlock').innerHTML=`<div class="stats-row"><div>📊 Units: ${units}</div><div>⭐ Points: ${points}</div><div>📈 GPA: ${gpa}</div></div>`;
    document.getElementById('semesterCoursesList').innerHTML = courses.map(c=>`
      <div class="course-item flex-between"><div><strong>${escapeHtml(c.code)}</strong><div class="text-muted">${c.unit} units · Grade ${c.grade}</div></div><div><button class="editCourseBtn" data-id="${c.id}" data-sem="${semId}" style="background:transparent;border:none;margin-right:8px;">✏️</button><button class="delCourseBtn" data-id="${c.id}" data-sem="${semId}" style="background:transparent;border:none;">🗑️</button></div></div>
    `).join('') || '<div class="text-muted" style="padding:20px;text-align:center;">No courses, add one</div>';
    attachCourseEvents(semId);
  }

  function attachCourseEvents(semId) {
    document.querySelectorAll('.delCourseBtn').forEach(btn=>btn.addEventListener('click',()=>{
      let id=parseInt(btn.getAttribute('data-id'));
      coursesData[semId]=coursesData[semId].filter(c=>c.id!=id);
      saveAll();
      loadSemesterCourses(semId);
      addNotification("Course","Deleted");
    }));
    document.querySelectorAll('.editCourseBtn').forEach(btn=>btn.addEventListener('click',()=>{
      let id=parseInt(btn.getAttribute('data-id'));
      let course=coursesData[semId].find(c=>c.id===id);
      let newCode=prompt("Code",course.code), newUnit=prompt("Units",course.unit), newGrade=prompt("Grade A-F",course.grade);
      if(newCode&&newUnit&&newGrade) {
        course.code=newCode.toUpperCase();
        course.unit=parseFloat(newUnit);
        course.grade=newGrade.toUpperCase();
        course.points=course.unit*gradeMap[course.grade];
        saveAll();
        loadSemesterCourses(semId);
        addNotification("Course","Updated");
      }
    }));
  }

  document.getElementById('cgpaSemSelect').addEventListener('change',(e)=>loadSemesterCourses(e.target.value));
  document.getElementById('addCourseSemBtn').addEventListener('click',()=>{
    let sem=document.getElementById('cgpaSemSelect').value;
    let code=prompt("Course code");
    let unit=parseFloat(prompt("Units"));
    let grade=prompt("Grade A-F").toUpperCase();
    if(code && unit && gradeMap[grade]!==undefined){
      let newCourse={id:Date.now(),code,unit,grade,points:unit*gradeMap[grade]};
      coursesData[sem].push(newCourse);
      saveAll();
      loadSemesterCourses(sem);
      addNotification("CGPA","Course added");
      checkAchievements();
    }
  });
  document.getElementById('exportResultBtn').addEventListener('click',()=>{
    let result=`Student: ${currentUser.fullName}\nCGPA:${computeOverallCGPA()}\nClassification:${getClassification(computeOverallCGPA())}\nCourses:\n`;
    for(let s of semesterList){
      coursesData[s].forEach(c=>{
        result+=`${c.code} - ${c.grade} (${c.unit} units)\n`;
      });
    }
    navigator.clipboard.writeText(result);
    alert("Result copied to clipboard!");
    addNotification("Export","Result copied");
  });
  loadSemesterCourses(semesterList[0]);
}