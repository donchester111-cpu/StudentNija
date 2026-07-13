export function renderExamsPage() {
  const content = document.getElementById('examsContent');
  if (content) {
    content.innerHTML = `
      <iframe src="exam_tool.html"
              style="width:100%; height:100%; border:none; display:block;"
              allow="microphone; camera; autoplay">
      </iframe>
    `;
  }
}

window.closeExamsPage = function() {
  const backBtn = document.getElementById('examsBackBtn');
  if (backBtn) backBtn.remove();
  if (window.currentPage !== undefined) {
    window.currentPage = 'home';
  }
  if (typeof window.renderMainApp === 'function') {
    window.renderMainApp();
  }
};