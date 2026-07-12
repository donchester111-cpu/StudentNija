import { openToolModal } from './modal.js';
import { callAIHelper } from './helpers.js';
import { escapeHtml } from '../state.js';

async function explainWordWithAI(word, definition) {
  const prompt = `The word "${word}" has definitions: ${definition}. Provide a comprehensive explanation, synonyms, example sentences, and usage.`;
          return await callAIHelper(prompt, 'dictionary');
}

export function openDictionary() {
  const html = `
    <div class="dict-modern">
      <div class="search-group">
        <input type="text" id="dictWord" placeholder="Enter a word...">
        <button id="searchDictBtn" class="btn-primary" style="width:auto;">Define</button>
      </div>
      <div id="dictResult" class="dict-result"></div>
    </div>
  `;
  openToolModal('AI Dictionary', html);

  const searchBtn = document.getElementById('searchDictBtn');
  const wordInput = document.getElementById('dictWord');
  const resultDiv = document.getElementById('dictResult');

  async function fetchWord() {
    const word = wordInput.value.trim();
    if (!word) return;
    resultDiv.innerHTML = '<div class="text-muted">Loading...</div>';
    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!response.ok) throw new Error('Word not found');
      const data = await response.json();
      const entry = data[0];
      const definitions = entry.meanings.map(m => m.definitions.map(d => d.definition).join('; ')).join('; ');
      const aiExplanation = await explainWordWithAI(word, definitions);
      let html = `<div class="definition-card">
        <div class="word-title">${escapeHtml(entry.word)}</div>
        <div class="phonetic">${entry.phonetic || ''}</div>
        <div class="ai-explanation">${escapeHtml(aiExplanation)}</div>
        <div class="dict-extra"><strong>Dictionary:</strong> ${escapeHtml(definitions)}</div>
        ${entry.phonetics && entry.phonetics[0] && entry.phonetics[0].audio ? `<button class="audio-btn" data-audio="${entry.phonetics[0].audio}">🔊 Listen</button>` : ''}
        <button class="copy-btn" data-text="${escapeHtml(aiExplanation)}" style="margin-top:8px;">⧉</button>
      </div>`;
      resultDiv.innerHTML = html;
      const audioBtn = resultDiv.querySelector('.audio-btn');
      if (audioBtn) audioBtn.onclick = () => { const url = audioBtn.dataset.audio; if (url) new Audio(url).play(); };
    } catch (err) {
      resultDiv.innerHTML = `<div class="text-muted">Word not found. Please check the spelling.</div>`;
    }
  }

  searchBtn.onclick = fetchWord;
  wordInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') fetchWord(); });
}