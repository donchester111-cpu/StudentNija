import { openToolModal } from './modal.js';
import { escapeHtml } from '../state.js';

export function openLibrary() {
  openToolModal('Library - Search Books', `
    <div class="search-group">
      <input type="text" id="bookSearch" placeholder="Search by title or author...">
      <button id="searchBookBtn" class="btn-primary" style="width:auto;">Search</button>
    </div>
    <div class="search-group">
      <input type="text" id="yearFilter" placeholder="Filter by year (optional)" style="width:150px;">
    </div>
    <div id="bookResults" class="library-results"></div>
  `);
  const searchBtn = document.getElementById('searchBookBtn');
  const searchInput = document.getElementById('bookSearch');
  const yearFilter = document.getElementById('yearFilter');
  
  async function performSearch() {
    const query = searchInput.value.trim();
    if (!query) return;
    const year = yearFilter.value.trim();
    const resultsDiv = document.getElementById('bookResults');
    resultsDiv.innerHTML = '<div class="text-muted">Searching...</div>';
    try {
      let url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=24`;
      const response = await fetch(url);
      const data = await response.json();
      let docs = data.docs;
      if (year) docs = docs.filter(book => book.first_publish_year && book.first_publish_year.toString().includes(year));
      if (docs.length === 0) { resultsDiv.innerHTML = '<div class="text-muted">No books found.</div>'; return; }
      resultsDiv.innerHTML = docs.map(book => `
        <div class="book-card" data-key="${book.key}">
          <img class="book-cover" src="https://covers.openlibrary.org/b/id/${book.cover_i || ''}-M.jpg" onerror="this.src='https://via.placeholder.com/150x200?text=No+Cover'">
          <div class="book-title">${escapeHtml(book.title)}</div>
          <div class="book-author">${book.author_name ? book.author_name.join(', ') : 'Unknown'}</div>
          <div class="book-year">${book.first_publish_year || 'Year unknown'}</div>
        </div>
      `).join('');
      document.querySelectorAll('.book-card').forEach(card => {
        card.onclick = () => {
          const key = card.getAttribute('data-key');
          window.open(`https://openlibrary.org${key}`, '_blank');
        };
      });
    } catch(e) { resultsDiv.innerHTML = '<div class="text-muted">Error fetching data. Check your internet connection.</div>'; }
  }
  if (searchBtn) searchBtn.onclick = performSearch;
  if (searchInput) searchInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
}