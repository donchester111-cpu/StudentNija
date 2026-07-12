export function renderAIPage() {
  const aiContent = document.getElementById('aiContent');
  if (aiContent) {
    aiContent.innerHTML = `
      <iframe src="StudentNija_Ai.html"
              style="width:100%; height:100%; border:none; display:block;"
              allow="microphone; camera; autoplay">
      </iframe>
    `;
  }
}

window.closeAIPage = function() {
  if (window.currentPage !== undefined) {
    window.currentPage = 'home';
  }
  if (typeof window.renderMainApp === 'function') {
    window.renderMainApp();
  }
};