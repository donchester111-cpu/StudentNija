import { openToolModal, closeToolModal } from './modal.js';
import { callAIHelper, callMathAI } from './helpers.js';
import { escapeHtml } from '../state.js';

export function openMathSolver() {
  if (typeof math === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/mathjs/11.8.0/math.min.js';
    script.async = true;
    document.head.appendChild(script);
  }

  const modalHtml = `
    <div class="math-solver-container">
      <div style="display:flex; gap:12px; margin-bottom:12px; flex-wrap:wrap;">
        <select id="mathServiceSelect" class="modern-select" style="flex:1; min-width:150px;">
          <option value="mathjs">Math.js (local evaluate)</option>
          <option value="aimath">AI Math Solver</option>
        </select>
        <button id="importFileBtn" class="btn-outline" style="width:auto;">📎 Import</button>
        <input type="file" id="fileInput" accept=".txt,.png,.jpg,.jpeg" style="display:none">
      </div>
      <textarea id="mathInput" class="math-input-area" rows="4" placeholder="Enter your math problem..."></textarea>
      <button id="solveMathBtn" class="btn-primary">Solve</button>
      <div id="mathSolution" class="math-solution"></div>
      <div id="mathSteps" class="math-step"></div>
    </div>
  `;
  openToolModal('Math Solver', modalHtml);

  const serviceSelect = document.getElementById('mathServiceSelect');
  const inputEl = document.getElementById('mathInput');
  const solveBtn = document.getElementById('solveMathBtn');
  const solutionDiv = document.getElementById('mathSolution');
  const stepsDiv = document.getElementById('mathSteps');
  const importBtn = document.getElementById('importFileBtn');
  const fileInput = document.getElementById('fileInput');

  importBtn.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.type === 'text/plain') {
      const reader = new FileReader();
      reader.onload = (ev) => { inputEl.value = ev.target.result; addNotification('File', `Imported ${file.name}`); };
      reader.readAsText(file);
    } else if (file.type.startsWith('image/')) {
      const previewDiv = document.createElement('div');
      previewDiv.style.cssText = 'margin:8px 0;';
      const img = document.createElement('img');
      img.src = URL.createObjectURL(file);
      img.style.cssText = 'max-width:100%; max-height:200px; border-radius:12px;';
      previewDiv.appendChild(img);
      const statusMsg = document.createElement('p');
      statusMsg.className = 'text-muted';
      statusMsg.textContent = '🔄 Extracting text... (not shown)';
      previewDiv.appendChild(statusMsg);
      inputEl.parentNode.insertBefore(previewDiv, inputEl.nextSibling);

      if (typeof Tesseract === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
        script.async = true;
        document.head.appendChild(script);
        statusMsg.textContent = '⚠️ Tesseract loading, please try again.';
        return;
      }
      try {
        const result = await Tesseract.recognize(file, 'eng', {
          logger: (m) => { if (m.status === 'recognizing text') statusMsg.textContent = `🔄 OCR ${Math.round(m.progress * 100)}%`; }
        });
        const text = result.data.text.trim();
        if (text) {
          inputEl.value = text;
          statusMsg.textContent = '✅ Text extracted successfully. You can now solve.';
          addNotification('OCR', 'Image text extracted');
        } else {
          statusMsg.textContent = '❌ No text found.';
        }
      } catch (err) {
        statusMsg.textContent = '❌ OCR error: could not read image.';
      }
    } else {
      alert('Unsupported file type.');
    }
    fileInput.value = '';
  });

  async function performSolve() {
    const query = inputEl.value.trim();
    if (!query) { solutionDiv.innerHTML = 'Please enter a problem.'; return; }
    const service = serviceSelect.value;
    solutionDiv.innerHTML = '';
    stepsDiv.innerHTML = '';

    if (service === 'mathjs') {
      if (typeof math === 'undefined') { solutionDiv.innerHTML = 'Math.js loading...'; return; }
      try {
        const result = math.evaluate(query);
        solutionDiv.innerHTML = `<strong>🧠 Result:</strong><br>${result}`;
      } catch (err) {
        solutionDiv.innerHTML = 'Invalid expression – please check your input.';
      }
    } else if (service === 'aimath') {
      try {
        const aiResult = await callMathAI(query);
        solutionDiv.innerHTML = `<div style="position:relative;"><strong>✦AI Solution:</strong><br><div style="white-space:pre-wrap;">${escapeHtml(aiResult)}</div><button class="copy-btn" data-text="${escapeHtml(aiResult)}">⧉</button></div>`;
      } catch (err) {
        solutionDiv.innerHTML = 'Oops! The AI service is temporarily unavailable. Please try again later.';
      }
    }
  }

  solveBtn.addEventListener('click', performSolve);
  inputEl.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); performSolve(); } });
}