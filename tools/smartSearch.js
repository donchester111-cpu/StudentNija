import { openToolModal } from './modal.js';
import { apiGet } from '../api.js';
import { escapeHtml } from '../state.js';

export function openSmartSearch() {
  const html = `
    <div class="smart-search">
      <h3>🔍 Smart Search (Notes & Flashcards)</h3>
      <div style="display:flex; gap:12px; margin:12px 0;">
        <input type="text" id="searchQuery" placeholder="Search your notes and flashcards..." style="flex:1;">
        <button id="searchBtn" class="btn-primary" style="width:auto;">Search</button>
      </div>
      <div id="searchResults" class="search-results" style="max-height:60vh; overflow-y:auto;"></div>
    </div>
  `;
  openToolModal('Smart Search', html);

  const queryInput = document.getElementById('searchQuery');
  const resultsDiv = document.getElementById('searchResults');
  const searchBtn = document.getElementById('searchBtn');

  async function performSearch() {
    const query = queryInput.value.trim();
    if (!query) return;
    resultsDiv.innerHTML = '<div class="text-muted">🔎 Searching...</div>';

    // Get user ID from localStorage
    const userData = JSON.parse(localStorage.getItem('studentnija_currentUser') || '{}');
    const userId = userData.id;
    if (!userId) {
      resultsDiv.innerHTML = '<div class="text-muted">⚠️ You must be logged in to search.</div>';
      return;
    }

    try {
      const resp = await apiGet(`/api/search?q=${encodeURIComponent(query)}&userId=${userId}`);
      const { notes, flashcards: flashcardResults } = resp;

      let html = '';
      if (notes && notes.length) {
        html += `<h4 style="margin:12px 0 6px;">📝 Notes (${notes.length})</h4>`;
        notes.forEach(note => {
          html += `
            <div style="margin-bottom:10px; background:var(--bg-card); border-radius:12px; padding:10px;">
              <strong>${escapeHtml(note.title || 'Untitled')}</strong>
              <p style="font-size:13px; color:var(--text-muted);">${escapeHtml(note.content.substring(0, 120))}...</p>
              <button class="copy-btn" data-text="${escapeHtml(note.content)}" style="font-size:12px;">📋</button>
            </div>`;
        });
      }
      if (flashcardResults && flashcardResults.length) {
        html += `<h4 style="margin:12px 0 6px;">🃏 Flashcards (${flashcardResults.length})</h4>`;
        flashcardResults.forEach(card => {
          html += `
            <div style="margin-bottom:10px; background:var(--bg-card); border-radius:12px; padding:10px;">
              <strong>Q: ${escapeHtml(card.question)}</strong>
              <p style="font-size:13px; color:var(--text-muted);">A: ${escapeHtml(card.answer.substring(0, 120))}...</p>
              <button class="copy-btn" data-text="${escapeHtml(card.answer)}" style="font-size:12px;">📋</button>
            </div>`;
        });
      }
      if (!html) {
        html = '<div class="text-muted">No results found.</div>';
      }
      resultsDiv.innerHTML = html;

      // Copy button events
      document.querySelectorAll('.copy-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const text = btn.dataset.text;
          navigator.clipboard.writeText(text).then(() => {
            btn.textContent = '✅';
            setTimeout(() => { btn.textContent = '📋'; }, 1500);
          });
        });
      });
    } catch (err) {
      resultsDiv.innerHTML = '<div class="text-muted">Search service unavailable. Please try again later.</div>';
    }
  }

  searchBtn.onclick = performSearch;
  queryInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
}