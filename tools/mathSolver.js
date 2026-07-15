import { openToolModal } from './modal.js';
import { callMathAI } from './helpers.js';
import { escapeHtml, addNotification } from '../state.js';

// ---------- Math Solver (upgraded) ----------
export function openMathSolver() {
  // ============================================================
  // 1. Load external dependencies if needed
  // ============================================================
  if (typeof math === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js';
    script.async = true;
    document.head.appendChild(script);
  }

  // ============================================================
  // 2. Embedded CSS – modern, theme‑aware
  // ============================================================
  const styles = `
    .math-solver-wrap {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    .solver-toolbar {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
      align-items: center;
    }
    .modern-select {
      flex: 1;
      min-width: 140px;
      padding: 10px 14px;
      border-radius: 14px;
      border: 1px solid var(--border-light);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 14px;
      outline: none;
      transition: border-color 0.2s;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%236B7F96' stroke-width='1.5' fill='none'/%3E%3C/svg%3E");
      background-repeat: no-repeat;
      background-position: right 12px center;
      padding-right: 36px;
    }
    .btn-outline {
      background: transparent;
      border: 1.5px solid var(--accent-light);
      color: var(--text-primary);
      padding: 10px 18px;
      border-radius: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s, transform 0.1s;
      white-space: nowrap;
      display: inline-flex;
      align-items: center;
      gap: 6px;
    }
    .btn-outline:active { background: rgba(0,135,81,0.08); transform: scale(0.96); }
    .btn-primary {
      background: linear-gradient(135deg, var(--accent), var(--accent-light));
      border: none;
      color: white;
      padding: 12px 24px;
      border-radius: 14px;
      font-weight: 700;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
      box-shadow: 0 4px 12px var(--accent-glow);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
    }
    .btn-primary:active { transform: scale(0.96); }
    .btn-primary:disabled { opacity: 0.6; transform: none; }
    .math-input-area {
      width: 100%;
      padding: 14px 16px;
      border-radius: 16px;
      border: 1px solid var(--border-light);
      background: var(--bg-primary);
      color: var(--text-primary);
      font-size: 15px;
      line-height: 1.6;
      resize: vertical;
      min-height: 120px;
      outline: none;
      transition: border-color 0.2s, box-shadow 0.2s;
      font-family: 'Courier New', monospace;
    }
    .math-input-area:focus {
      border-color: var(--accent);
      box-shadow: 0 0 0 3px var(--accent-glow);
    }
    .action-row {
      display: flex;
      gap: 10px;
      align-items: center;
      flex-wrap: wrap;
    }
    .result-card {
      background: var(--bg-card);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border-radius: 20px;
      padding: 18px;
      border: 1px solid var(--border-light);
      box-shadow: var(--shadow-sm);
      animation: fadeUp 0.3s ease;
    }
    .result-card h3 {
      font-size: 16px;
      margin-bottom: 10px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .result-text {
      white-space: pre-wrap;
      line-height: 1.6;
      font-size: 15px;
      word-break: break-word;
    }
    .copy-btn-small {
      background: none;
      border: 1px solid var(--border-light);
      border-radius: 10px;
      padding: 4px 10px;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 13px;
      transition: background 0.2s;
    }
    .copy-btn-small:active { background: rgba(0,135,81,0.1); }
    .history-section {
      margin-top: 8px;
    }
    .history-item {
      background: var(--bg-solid);
      border-radius: 12px;
      padding: 10px 14px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: background 0.2s;
      border: 1px solid var(--border-light);
      font-size: 14px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .history-item:hover { background: var(--bg-primary); }
    .loading-spinner {
      width: 22px;
      height: 22px;
      border: 3px solid rgba(255,255,255,0.3);
      border-top: 3px solid white;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      display: inline-block;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes fadeUp {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @media (max-width: 480px) {
      .solver-toolbar { flex-direction: column; }
      .btn-outline { width: 100%; }
    }
  `;

  // ============================================================
  // 3. HTML structure
  // ============================================================
  const html = `
    <style>${styles}</style>
    <div class="math-solver-wrap">
      <div class="solver-toolbar">
        <select id="mathServiceSelect" class="modern-select">
          <option value="mathjs">🧮 Math.js (direct)</option>
          <option value="aimath">🧠 AI Math Solver</option>
        </select>
        <button id="importFileBtn" class="btn-outline">📎 Import</button>
        <input type="file" id="fileInput" accept=".txt,.png,.jpg,.jpeg" style="display:none">
      </div>

      <textarea id="mathInput" class="math-input-area" rows="4" placeholder="Enter your math problem… (e.g., solve 2x+3=7)"></textarea>

      <div class="action-row">
        <button id="solveMathBtn" class="btn-primary">🔍 Solve</button>
        <button id="clearBtn" class="btn-outline">🗑️ Clear</button>
      </div>

      <div id="mathSolution" class="result-card" style="display:none;"></div>
      <div id="mathSteps" class="result-card" style="display:none;"></div>

      <!-- History -->
      <div class="history-section" id="historySection">
        <h4 style="margin-bottom: 8px; color: var(--text-muted); font-size: 14px;">📋 Recent problems</h4>
        <div id="historyList"></div>
      </div>
    </div>
  `;

  openToolModal('Math Solver', html);

  // ============================================================
  // 4. State & DOM references
  // ============================================================
  const serviceSelect = document.getElementById('mathServiceSelect');
  const inputEl = document.getElementById('mathInput');
  const solveBtn = document.getElementById('solveMathBtn');
  const clearBtn = document.getElementById('clearBtn');
  const solutionDiv = document.getElementById('mathSolution');
  const stepsDiv = document.getElementById('mathSteps');
  const historyList = document.getElementById('historyList');
  const importBtn = document.getElementById('importFileBtn');
  const fileInput = document.getElementById('fileInput');

  // Local history
  let mathHistory = JSON.parse(localStorage.getItem('math_solver_history') || '[]');

  function saveHistory(problem, result) {
    mathHistory.unshift({ problem, result, date: new Date().toISOString() });
    if (mathHistory.length > 10) mathHistory.pop();
    localStorage.setItem('math_solver_history', JSON.stringify(mathHistory));
    renderHistory();
  }

  function renderHistory() {
    if (!historyList) return;
    if (mathHistory.length === 0) {
      historyList.innerHTML = '<div class="text-muted" style="font-size:13px;">No recent problems.</div>';
      return;
    }
    historyList.innerHTML = mathHistory.slice(0, 10).map((item, i) => `
      <div class="history-item" data-idx="${i}">
        <div style="flex:1; overflow:hidden; text-overflow:ellipsis;">
          <strong>${escapeHtml(item.problem.substring(0, 60))}</strong>
          <div style="font-size:12px; color:var(--text-muted);">${escapeHtml(item.result.substring(0, 60))}</div>
        </div>
        <button class="copy-btn-small" onclick="event.stopPropagation(); navigator.clipboard.writeText('${escapeHtml(item.result).replace(/'/g, "\\'")}')">⧉</button>
      </div>
    `).join('');

    // Click to load problem
    document.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', function() {
        const idx = parseInt(this.dataset.idx);
        const item = mathHistory[idx];
        if (item) {
          inputEl.value = item.problem;
        }
      });
    });
  }

  // ============================================================
  // 5. Solve function
  // ============================================================
  async function performSolve() {
    const query = inputEl.value.trim();
    if (!query) {
      solutionDiv.style.display = 'none';
      stepsDiv.style.display = 'none';
      return;
    }

    // Show loading
    solveBtn.disabled = true;
    solveBtn.innerHTML = '<span class="loading-spinner"></span> Solving…';
    solutionDiv.style.display = 'none';
    stepsDiv.style.display = 'none';

    const service = serviceSelect.value;

    try {
      let result = '';
      let steps = '';

      if (service === 'mathjs') {
        if (typeof math === 'undefined') {
          result = '⚠️ Math.js is still loading. Please try again in a moment.';
        } else {
          try {
            const ans = math.evaluate(query);
            result = `Result: ${ans}`;
            steps = 'No step‑by‑step available for direct evaluation.';
          } catch (err) {
            result = 'Invalid expression – please check your input.';
          }
        }
      } else if (service === 'aimath') {
        try {
          const aiResponse = await callMathAI(query);
          // Expect AI to return both result and steps; split intelligently
          const parts = aiResponse.split(/Step[s]?[:\-]?\s*/i);
          if (parts.length > 1) {
            steps = 'Step‑by‑step:\n' + parts.slice(1).join('\n');
            result = parts[0];
          } else {
            result = aiResponse;
            steps = '';
          }
        } catch (err) {
          result = 'Oops! The AI service is temporarily unavailable.';
        }
      }

      // Display result
      solutionDiv.style.display = 'block';
      solutionDiv.innerHTML = `
        <h3>🧮 Result</h3>
        <div class="result-text">${escapeHtml(result)}</div>
        <button class="copy-btn-small" style="margin-top:10px;" onclick="navigator.clipboard.writeText('${escapeHtml(result).replace(/'/g, "\\'")}')">⧉ Copy</button>
      `;

      // Display steps (if any)
      if (steps) {
        stepsDiv.style.display = 'block';
        stepsDiv.innerHTML = `
          <h3>📖 Steps</h3>
          <div class="result-text">${escapeHtml(steps)}</div>
        `;
      } else {
        stepsDiv.style.display = 'none';
      }

      // Save to history
      saveHistory(query, result);

    } catch (e) {
      solutionDiv.style.display = 'block';
      solutionDiv.innerHTML = '<div class="result-text">An unexpected error occurred.</div>';
    } finally {
      solveBtn.disabled = false;
      solveBtn.innerHTML = '🔍 Solve';
    }
  }

  // ============================================================
  // 6. File import (unchanged core, improved UI feedback)
  // ============================================================
  importBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => {
        inputEl.value = ev.target.result;
        addNotification('Imported', `File "${file.name}" loaded.`);
      };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      // Show preview
      const previewDiv = document.createElement('div');
      previewDiv.style.cssText = 'margin:8px 0; text-align:center;';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.cssText = 'max-width:100%; max-height:180px; border-radius:12px;';
      previewDiv.appendChild(img);
      const statusMsg = document.createElement('p');
      statusMsg.className = 'text-muted';
      statusMsg.textContent = '🔄 Extracting text…';
      previewDiv.appendChild(statusMsg);
      inputEl.parentNode.insertBefore(previewDiv, inputEl.nextSibling);

      // Load Tesseract if needed
      if (typeof Tesseract === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.async = true;
        document.head.appendChild(script);
        statusMsg.textContent = '⚡ OCR engine loading… Please wait.';
        return;
      }

      try {
        const { data: { text } } = await Tesseract.recognize(file, 'eng', {
          logger: m => {
            if (m.status === 'recognizing text') statusMsg.textContent = `🔄 OCR ${Math.round(m.progress*100)}%`;
          }
        });
        const cleanText = text.trim();
        if (cleanText) {
          inputEl.value = cleanText;
          statusMsg.textContent = '✅ Text extracted. Ready to solve!';
          addNotification('OCR', 'Image text extracted');
        } else {
          statusMsg.textContent = '❌ No text found.';
        }
      } catch (err) {
        statusMsg.textContent = '❌ OCR error. Please try again.';
      }
    } else {
      addNotification('Unsupported file', 'Please use a .txt or image file.');
    }
    fileInput.value = '';
  });

  // ============================================================
  // 7. Buttons & keyboard
  // ============================================================
  solveBtn.addEventListener('click', performSolve);
  clearBtn.addEventListener('click', () => {
    inputEl.value = '';
    solutionDiv.style.display = 'none';
    stepsDiv.style.display = 'none';
  });

  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      performSolve();
    }
  });

  // Initial render
  renderHistory();
  // Focus input
  setTimeout(() => inputEl.focus(), 100);
}