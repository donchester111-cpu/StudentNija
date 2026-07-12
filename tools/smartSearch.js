import { openToolModal } from './modal.js';
import { callAIHelper } from './helpers.js';
import { savedNotes, flashcards, coursesData, plannerTasks, escapeHtml } from '../state.js';

export function openSmartSearch() {
  const html = `
    <div class="smart-search">
      <h3>🔍 Smart Search (Notes, Flashcards, Courses)</h3>
      <div style="display:flex; gap:12px; margin:12px 0;">
        <input type="text" id="searchQuery" placeholder="Ask a question or search for keywords..." style="flex:1;">
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

    const allNotes = savedNotes.map(n => `Note: ${n.title} - ${n.content}`).join('\n');
    const allFlashcards = flashcards.map(c => `Flashcard: Q: ${c.question} A: ${c.answer}`).join('\n');
    const allCourses = Object.entries(coursesData).map(([sem, courses]) => 
      `Semester ${sem}: ${courses.map(c => `${c.code} (${c.unit} units, grade ${c.grade})`).join('; ')}`
    ).join('\n');
    const allTasks = plannerTasks.map(t => `Task: ${t.title} (${t.completed ? 'done' : 'pending'})`).join('\n');
    const combinedText = `Notes:\n${allNotes}\n\nFlashcards:\n${allFlashcards}\n\nCourses:\n${allCourses}\n\nTasks:\n${allTasks}`;

    const prompt = `Given the following search query: "${query}", search through the user's data below and return the most relevant passages. List each result with a brief context and the source (Note/Flashcard/Course/Task). If nothing is found, say so.\n\n${combinedText}`;
    try {
      const result = await callAIHelper(prompt, 'chat');
      resultsDiv.innerHTML = `<div style="position:relative;"><div class="glass-card" style="padding:16px; white-space:pre-wrap;">${escapeHtml(result)}</div><button class="copy-btn" data-text="${escapeHtml(result)}" style="position:absolute; top:10px; right:10px;">📋 Copy</button></div>`;
    } catch (err) {
      resultsDiv.innerHTML = '<div class="text-muted">Search service unavailable. Please try again later.</div>';
    }
  }

  searchBtn.onclick = performSearch;
  queryInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') performSearch(); });
}