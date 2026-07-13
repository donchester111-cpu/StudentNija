// pages/studygroups.js
export function renderStudyGroupsPage() {
  const content = document.getElementById('studyGroupsContent');
  if (content) {
    content.innerHTML = `
      <iframe src="Public_Chat.html"
              style="width:100%; height:100%; border:none; display:block;"
              allow="microphone; camera; autoplay">
      </iframe>
    `;
  }
}

// Keep as a fallback, but the main handling is in app.js
window.closeStudyGroups = function() {
  // This will be called only if the message listener fails, but we can still use it.
  if (window.currentPage !== undefined) {
    window.currentPage = 'home';
  }
  if (typeof window.renderMainApp === 'function') {
    window.renderMainApp();
  }
  const backBtn = document.getElementById('studyGroupsBackBtn');
  if (backBtn) backBtn.remove();
};