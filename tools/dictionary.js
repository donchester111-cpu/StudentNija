import { openToolModal } from './modal.js';
import { callAIHelper } from './helpers.js';
import { escapeHtml } from '../state.js';

// ---- Enhanced AI helper ----
async function explainWordWithAI(word, definitions) {
  const prompt = `Explain the word "${word}" in a friendly, student-friendly way. Include its meanings, synonyms, antonyms, and a few example sentences. Keep it clear and conversational. Definitions from dictionary: ${definitions}`;
  return await callAIHelper(prompt, 'dictionary');
}

export function openDictionary() {
  // ---------- Embedded CSS ----------
  const styles = `
    .dict-modern {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .search-group {
      display: flex;
      gap: 10px;
      align-items: center;
    }
    .search-group input {
      flex: 1;
      padding: 12px 16px;
      border-radius: 30px;
      border: 1px solid var(--border-light);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 15px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      min-height: 48px;
    }
    .search-group input:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .search-group .btn-primary {
      width: auto;
      padding: 12px 24px;
      border-radius: 30px;
      background: linear-gradient(135deg, var(--accent), var(--accent-light));
      border: none;
      color: white;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px var(--accent-glow);
      min-height: 48px;
      white-space: nowrap;
    }
    .search-group .btn-primary:active {
      transform: scale(0.96);
    }
    .dict-result {
      animation: fadeSlideUp 0.3s ease;
    }
    @keyframes fadeSlideUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    .word-card {
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 24px;
      padding: 20px;
      border: 1px solid var(--border-light);
      box-shadow: var(--shadow-sm);
    }
    .word-title {
      font-size: 28px;
      font-weight: 800;
      margin-bottom: 4px;
    }
    .phonetic {
      color: var(--text-muted);
      font-family: monospace;
      font-size: 15px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .audio-btn {
      background: var(--bg-solid);
      border: none;
      border-radius: 30px;
      padding: 6px 12px;
      font-size: 16px;
      cursor: pointer;
      transition: background 0.2s;
      color: var(--accent);
      display: inline-flex;
      align-items: center;
      gap: 4px;
    }
    .audio-btn:active { background: var(--accent-glow); }
    .ai-explanation {
      background: rgba(0,135,81,0.06);
      border-left: 4px solid var(--accent);
      padding: 12px 14px;
      border-radius: 12px;
      margin: 14px 0;
      font-size: 14px;
      line-height: 1.6;
      color: var(--text-primary);
      white-space: pre-wrap;
    }
    .dict-entries {
      margin-top: 12px;
    }
    .part-of-speech {
      font-weight: 700;
      font-size: 14px;
      color: var(--accent);
      margin: 10px 0 4px;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
    .definition-item {
      padding: 8px 0;
      border-bottom: 0.5px solid var(--border-light);
      font-size: 14px;
      line-height: 1.5;
    }
    .definition-item:last-child { border-bottom: none; }
    .example {
      color: var(--text-muted);
      font-style: italic;
      font-size: 13px;
      margin-top: 4px;
    }
    .synonyms, .antonyms {
      margin-top: 6px;
      font-size: 12px;
      color: var(--text-muted);
    }
    .synonyms span, .antonyms span {
      display: inline-block;
      background: var(--bg-solid);
      padding: 2px 8px;
      border-radius: 12px;
      margin: 2px;
    }
    .error-message {
      text-align: center;
      padding: 20px;
      color: var(--text-muted);
    }
    .loading-placeholder {
      text-align: center;
      padding: 20px;
      color: var(--text-muted);
      display: flex;
      gap: 12px;
      flex-direction: column;
      align-items: center;
    }
    .spinner {
      width: 28px;
      height: 28px;
      border: 3px solid rgba(0,135,81,0.15);
      border-top: 3px solid var(--accent);
      border-radius: 50%;
      animation: dictSpin 0.8s linear infinite;
    }
    @keyframes dictSpin { to { transform: rotate(360deg); } }
    @media (max-width: 480px) {
      .search-group { flex-direction: column; }
      .search-group .btn-primary { width: 100%; }
    }
  `;

  // ---------- HTML structure ----------
  const html = `
    <style>${styles}</style>
    <div class="dict-modern">
      <div class="search-group">
        <input type="text" id="dictWord" placeholder="Type a word..." autocomplete="off">
        <button id="searchDictBtn" class="btn-primary">Define</button>
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

    // Show loading
    resultDiv.innerHTML = `
      <div class="loading-placeholder">
        <div class="spinner"></div>
        <p>Looking up "${escapeHtml(word)}"...</p>
      </div>
    `;

    try {
      const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`);
      if (!response.ok) throw new Error('Word not found');

      const data = await response.json();
      const entry = data[0];

      // Build dictionary definitions string
      let dictDefinitions = '';
      const meanings = entry.meanings || [];
      meanings.forEach(meaning => {
        meaning.definitions.forEach(def => {
          dictDefinitions += `${def.definition} `;
        });
      });

      // Fetch AI explanation
      let aiExplanation = '';
      try {
        aiExplanation = await explainWordWithAI(word, dictDefinitions);
      } catch (e) {
        aiExplanation = 'AI explanation unavailable right now.';
      }

      // Phonetic & audio
      const phonetic = entry.phonetic || (entry.phonetics && entry.phonetics[0] && entry.phonetics[0].text) || '';
      let audioUrl = '';
      if (entry.phonetics) {
        for (const ph of entry.phonetics) {
          if (ph.audio) { audioUrl = ph.audio; break; }
        }
      }

      // Build HTML
      let htmlOutput = `<div class="word-card">`;

      // Title
      htmlOutput += `<div class="word-title">${escapeHtml(entry.word)}</div>`;

      // Phonetic + audio
      if (phonetic || audioUrl) {
        htmlOutput += `<div class="phonetic">${escapeHtml(phonetic)}`;
        if (audioUrl) {
          htmlOutput += ` <button class="audio-btn" data-audio="${escapeHtml(audioUrl)}">🔊 Listen</button>`;
        }
        htmlOutput += `</div>`;
      }

      // AI explanation
      if (aiExplanation) {
        htmlOutput += `<div class="ai-explanation">${escapeHtml(aiExplanation).replace(/\n/g, '<br>')}</div>`;
      }

      // Dictionary definitions
      htmlOutput += `<div class="dict-entries">`;
      meanings.forEach(meaning => {
        htmlOutput += `<div class="part-of-speech">${escapeHtml(meaning.partOfSpeech)}</div>`;
        meaning.definitions.forEach(def => {
          htmlOutput += `<div class="definition-item">`;
          htmlOutput += `<div>${escapeHtml(def.definition)}</div>`;
          if (def.example) htmlOutput += `<div class="example">“${escapeHtml(def.example)}”</div>`;
          if (def.synonyms && def.synonyms.length) {
            htmlOutput += `<div class="synonyms"><strong>Synonyms:</strong> ${def.synonyms.map(s => `<span>${escapeHtml(s)}</span>`).join('')}</div>`;
          }
          if (def.antonyms && def.antonyms.length) {
            htmlOutput += `<div class="antonyms"><strong>Antonyms:</strong> ${def.antonyms.map(a => `<span>${escapeHtml(a)}</span>`).join('')}</div>`;
          }
          htmlOutput += `</div>`;
        });
      });
      htmlOutput += `</div>`;
      htmlOutput += `</div>`; // close card

      resultDiv.innerHTML = htmlOutput;

      // Audio button event
      const audioBtn = resultDiv.querySelector('.audio-btn');
      if (audioBtn) {
        audioBtn.addEventListener('click', () => {
          const url = audioBtn.dataset.audio;
          if (url) {
            try {
              new Audio(url).play();
            } catch (e) {
              // fallback: try to open in new tab
              window.open(url, '_blank');
            }
          }
        });
      }
    } catch (err) {
      resultDiv.innerHTML = `
        <div class="error-message">
          <p style="font-size: 48px;">🔍</p>
          <p>No definition found for "<strong>${escapeHtml(word)}</strong>".</p>
          <p>Check the spelling or try another word.</p>
        </div>
      `;
    }
  }

  searchBtn.addEventListener('click', fetchWord);
  wordInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') fetchWord();
  });

  // Focus input on open
  setTimeout(() => wordInput.focus(), 100);
}