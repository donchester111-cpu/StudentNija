import { openToolModal, closeToolModal } from './modal.js';
import { addNotification, escapeHtml } from '../state.js';

export function openCalculator() {
  let expression = '';
  let result = '';
  let history = [];
  let memory = 0;
  let isScientific = false;
  let angleMode = 'rad'; // 'deg' or 'rad'
  let displayExpr, displayResult, historyPanel, modeToggle;

  function updateDisplay() {
    if (displayExpr) displayExpr.textContent = expression || '0';
    if (displayResult) displayResult.textContent = result ? '= ' + result : '';
  }

  // Helper to convert degrees to radians if needed
  function toAngle(val) {
    if (angleMode === 'deg') return val * Math.PI / 180;
    return val;
  }

  function evaluate(expr) {
    try {
      // Replace display symbols with JS equivalents
      let sanitized = expr
        .replace(/×/g, '*')
        .replace(/÷/g, '/')
        .replace(/−/g, '-')
        .replace(/π/g, 'Math.PI')
        .replace(/e/g, 'Math.E')
        .replace(/sin\(/g, `Math.sin(${angleMode === 'deg' ? '(Math.PI/180)*' : ''}`)
        .replace(/cos\(/g, `Math.cos(${angleMode === 'deg' ? '(Math.PI/180)*' : ''}`)
        .replace(/tan\(/g, `Math.tan(${angleMode === 'deg' ? '(Math.PI/180)*' : ''}`)
        .replace(/log\(/g, 'Math.log10(')
        .replace(/ln\(/g, 'Math.log(')
        .replace(/√\(/g, 'Math.sqrt(')
        .replace(/exp\(/g, 'Math.exp(')
        .replace(/x²/g, '**2')
        .replace(/x³/g, '**3')
        .replace(/factorial\(/g, 'factorial(');

      // Safe evaluation (only for numeric expressions)
      const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);
      const result = Function('"use strict"; return (' + sanitized + ')')();
      return result;
    } catch (e) {
      return 'Error';
    }
  }

  // ---------------------------------------
  // Embedded CSS – modern, theme‑aware
  // ---------------------------------------
  const styles = `
    .calc-container {
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      -webkit-backdrop-filter: blur(20px);
      border-radius: 24px;
      padding: 16px;
      box-shadow: var(--shadow-md);
      border: 1px solid var(--border-light);
      max-width: 360px;
      margin: 0 auto;
      font-family: 'Inter', sans-serif;
      color: var(--text-primary);
    }
    .calc-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }
    .calc-mode-toggle {
      display: flex;
      gap: 4px;
      background: var(--bg-solid);
      border-radius: 30px;
      padding: 3px;
    }
    .calc-mode-btn {
      background: transparent;
      border: none;
      padding: 6px 16px;
      border-radius: 30px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-muted);
    }
    .calc-mode-btn.active {
      background: var(--accent);
      color: white;
      box-shadow: 0 2px 8px var(--accent-glow);
    }
    .calc-angle-toggle {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--bg-solid);
      border-radius: 30px;
      padding: 3px;
    }
    .angle-btn {
      background: transparent;
      border: none;
      padding: 4px 12px;
      border-radius: 30px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      color: var(--text-muted);
    }
    .angle-btn.active {
      background: var(--accent-gold);
      color: #0A1927;
    }
    .calc-display-area {
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 16px;
      margin-bottom: 12px;
      text-align: right;
      min-height: 80px;
      display: flex;
      flex-direction: column;
      justify-content: flex-end;
      border: 1px solid var(--border-light);
    }
    .calc-expression {
      font-size: 16px;
      color: var(--text-muted);
      word-break: break-all;
      line-height: 1.3;
    }
    .calc-result {
      font-size: 32px;
      font-weight: 700;
      color: var(--accent);
      margin-top: 8px;
      word-break: break-all;
    }
    .calc-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 10px;
      margin-bottom: 10px;
    }
    .calc-btn {
      background: var(--bg-solid);
      border: none;
      border-radius: 16px;
      padding: 14px 0;
      font-size: 18px;
      font-weight: 600;
      color: var(--text-primary);
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: var(--shadow-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 52px;
      user-select: none;
    }
    .calc-btn:active {
      transform: scale(0.94);
      background: var(--accent);
      color: white;
    }
    .calc-btn.operator {
      color: var(--accent);
      font-weight: 700;
    }
    .calc-btn.equals {
      background: linear-gradient(135deg, var(--accent), var(--accent-light));
      color: white;
      box-shadow: 0 4px 12px var(--accent-glow);
    }
    .calc-scientific {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 8px;
      margin-top: 6px;
      padding-top: 10px;
      border-top: 1px solid var(--border-light);
    }
    .calc-fn {
      background: var(--bg-primary);
      border: none;
      border-radius: 12px;
      padding: 10px 0;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-muted);
      cursor: pointer;
      transition: all 0.15s;
      box-shadow: var(--shadow-sm);
    }
    .calc-fn:active {
      background: var(--accent);
      color: white;
      transform: scale(0.92);
    }
    .calc-memory {
      display: flex;
      gap: 8px;
      justify-content: center;
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .calc-mem-btn {
      background: var(--bg-primary);
      border: 1px solid var(--border-light);
      border-radius: 20px;
      padding: 6px 14px;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      color: var(--text-muted);
      transition: all 0.15s;
    }
    .calc-mem-btn:active {
      background: var(--accent);
      color: white;
    }
    .calc-history-panel {
      margin-top: 12px;
      background: var(--bg-primary);
      border-radius: 16px;
      padding: 12px;
      border: 1px solid var(--border-light);
      max-height: 200px;
      overflow-y: auto;
    }
    .calc-history-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-weight: 700;
      font-size: 14px;
    }
    .calc-history-clear {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 12px;
    }
    .history-item {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 0.5px solid var(--border-light);
      font-size: 13px;
    }
    .history-expr { color: var(--text-muted); }
    .history-result { font-weight: 600; color: var(--accent); }
    @media (max-width: 480px) {
      .calc-btn { padding: 12px 0; font-size: 16px; min-height: 46px; }
      .calc-result { font-size: 26px; }
    }
  `;

  // ---------------------------------------
  // HTML structure
  // ---------------------------------------
  const html = `
    <style>${styles}</style>
    <div class="calc-container">
      <div class="calc-header">
        <div class="calc-mode-toggle">
          <button class="calc-mode-btn active" data-mode="standard">Standard</button>
          <button class="calc-mode-btn" data-mode="scientific">Scientific</button>
        </div>
        <div class="calc-angle-toggle" id="angleToggle" style="display:none;">
          <button class="angle-btn active" data-mode="rad">RAD</button>
          <button class="angle-btn" data-mode="deg">DEG</button>
        </div>
        <button class="calc-history-toggle" id="calcHistoryToggle" style="background:none;border:none;font-size:20px;cursor:pointer;">📜</button>
      </div>
      <div class="calc-display-area">
        <div class="calc-expression" id="calcExpression">0</div>
        <div class="calc-result" id="calcResult"></div>
      </div>
      <div class="calc-grid" id="calcGrid">
        <button class="calc-btn" data-val="C">C</button>
        <button class="calc-btn" data-val="CE">CE</button>
        <button class="calc-btn" data-val="%">%</button>
        <button class="calc-btn operator" data-val="÷">÷</button>
        <button class="calc-btn" data-val="7">7</button>
        <button class="calc-btn" data-val="8">8</button>
        <button class="calc-btn" data-val="9">9</button>
        <button class="calc-btn operator" data-val="×">×</button>
        <button class="calc-btn" data-val="4">4</button>
        <button class="calc-btn" data-val="5">5</button>
        <button class="calc-btn" data-val="6">6</button>
        <button class="calc-btn operator" data-val="−">−</button>
        <button class="calc-btn" data-val="1">1</button>
        <button class="calc-btn" data-val="2">2</button>
        <button class="calc-btn" data-val="3">3</button>
        <button class="calc-btn operator" data-val="+">+</button>
        <button class="calc-btn" data-val="0">0</button>
        <button class="calc-btn" data-val=".">.</button>
        <button class="calc-btn" data-val="⌫">⌫</button>
        <button class="calc-btn equals" data-val="=">=</button>
      </div>
      <div class="calc-scientific" id="calcScientific" style="display:none;">
        <button class="calc-fn" data-fn="sin">sin</button>
        <button class="calc-fn" data-fn="cos">cos</button>
        <button class="calc-fn" data-fn="tan">tan</button>
        <button class="calc-fn" data-fn="log">log</button>
        <button class="calc-fn" data-fn="ln">ln</button>
        <button class="calc-fn" data-fn="√">√</button>
        <button class="calc-fn" data-fn="x²">x²</button>
        <button class="calc-fn" data-fn="x³">x³</button>
        <button class="calc-fn" data-fn="x!">x!</button>
        <button class="calc-fn" data-fn="π">π</button>
        <button class="calc-fn" data-fn="e">e</button>
        <button class="calc-fn" data-fn="exp">exp</button>
        <button class="calc-fn" data-fn="(">(</button>
        <button class="calc-fn" data-fn=")">)</button>
      </div>
      <div class="calc-memory">
        <button class="calc-mem-btn" data-mem="MC">MC</button>
        <button class="calc-mem-btn" data-mem="MR">MR</button>
        <button class="calc-mem-btn" data-mem="M+">M+</button>
        <button class="calc-mem-btn" data-mem="M−">M−</button>
      </div>
      <div class="calc-history-panel" id="calcHistoryPanel" style="display:none;">
        <div class="calc-history-header">
          <span>History</span>
          <button class="calc-history-clear" id="calcHistoryClear">Clear</button>
        </div>
        <div class="calc-history-list" id="calcHistoryList"></div>
      </div>
    </div>
  `;

  openToolModal('Calculator', html);

  // DOM elements
  displayExpr = document.getElementById('calcExpression');
  displayResult = document.getElementById('calcResult');
  const grid = document.getElementById('calcGrid');
  const scientificDiv = document.getElementById('calcScientific');
  historyPanel = document.getElementById('calcHistoryPanel');
  const historyList = document.getElementById('calcHistoryList');
  const historyToggle = document.getElementById('calcHistoryToggle');
  const historyClear = document.getElementById('calcHistoryClear');
  const modeButtons = document.querySelectorAll('.calc-mode-btn');
  const angleToggle = document.getElementById('angleToggle');
  const angleButtons = document.querySelectorAll('.angle-btn');

  // ---- History rendering ----
  function renderHistory() {
    if (!historyList) return;
    if (history.length === 0) {
      historyList.innerHTML = '<div class="text-muted" style="padding:8px;">No calculations yet.</div>';
      return;
    }
    historyList.innerHTML = history.slice(-15).reverse().map(entry => `
      <div class="history-item">
        <div class="history-expr">${escapeHtml(entry.expr)}</div>
        <div class="history-result">= ${escapeHtml(entry.result)}</div>
      </div>
    `).join('');
  }

  // ---- Mode toggle (standard/scientific) ----
  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      isScientific = btn.dataset.mode === 'scientific';
      scientificDiv.style.display = isScientific ? 'grid' : 'none';
      angleToggle.style.display = isScientific ? 'flex' : 'none';
    });
  });

  // ---- Angle mode toggle ----
  angleButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      angleButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      angleMode = btn.dataset.mode;
    });
  });

  // ---- History toggle & clear ----
  historyToggle.addEventListener('click', () => {
    const visible = historyPanel.style.display !== 'none';
    historyPanel.style.display = visible ? 'none' : 'block';
    if (!visible) renderHistory();
  });
  historyClear.addEventListener('click', () => {
    history = [];
    renderHistory();
  });

  // ---- Memory buttons ----
  document.querySelectorAll('.calc-mem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.mem;
      const currentVal = parseFloat(result) || parseFloat(expression) || 0;
      switch (action) {
        case 'MC': memory = 0; break;
        case 'MR': if (memory !== 0) { expression += memory.toString(); updateDisplay(); } break;
        case 'M+': memory += currentVal; break;
        case 'M−': memory -= currentVal; break;
      }
      addNotification('Calculator', `Memory: ${action}`);
    });
  });

  // ---- Core button handler ----
  function handleButtonClick(val) {
    if (val === 'C') { expression = ''; result = ''; updateDisplay(); return; }
    if (val === 'CE') {
      // Clear current entry (last number/operator segment)
      const match = expression.match(/[\d.]+$/);
      expression = expression.slice(0, expression.length - (match ? match[0].length : 0));
      updateDisplay();
      return;
    }
    if (val === '⌫') { expression = expression.slice(0, -1); updateDisplay(); return; }
    if (val === '=') {
      if (!expression) return;
      const res = evaluate(expression);
      result = res.toString();
      history.push({ expr: expression, result: result });
      displayResult.textContent = '= ' + result;
      expression = result;
      updateDisplay();
      renderHistory();
      return;
    }
    if (val === '±') {
      if (expression.startsWith('-')) expression = expression.slice(1);
      else expression = '-' + expression;
      updateDisplay();
      return;
    }
    if (val === '%') {
      const current = parseFloat(expression) || 0;
      expression = (current / 100).toString();
      updateDisplay();
      return;
    }
    expression += val;
    updateDisplay();
  }

  grid.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => handleButtonClick(btn.dataset.val));
  });

  // ---- Scientific function buttons ----
  document.querySelectorAll('.calc-fn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fn = btn.dataset.fn;
      switch (fn) {
        case 'π': expression += 'π'; break;
        case 'e': expression += 'e'; break;
        case 'x²': expression += 'x²'; break;
        case 'x³': expression += 'x³'; break;
        case 'x!': expression += 'factorial('; break;
        case '(': expression += '('; break;
        case ')': expression += ')'; break;
        default: expression += fn + '('; break;
      }
      updateDisplay();
    });
  });

  // ---- Keyboard support ----
  document.addEventListener('keydown', (e) => {
    const modal = document.getElementById('toolModal');
    if (!modal || !modal.classList.contains('active')) return;
    const key = e.key;
    if (key >= '0' && key <= '9') { handleButtonClick(key); e.preventDefault(); }
    else if (key === '.') { handleButtonClick('.'); e.preventDefault(); }
    else if (key === '+') { handleButtonClick('+'); e.preventDefault(); }
    else if (key === '-') { handleButtonClick('−'); e.preventDefault(); }
    else if (key === '*') { handleButtonClick('×'); e.preventDefault(); }
    else if (key === '/') { handleButtonClick('÷'); e.preventDefault(); }
    else if (key === 'Enter') { handleButtonClick('='); e.preventDefault(); }
    else if (key === 'Backspace') { handleButtonClick('⌫'); e.preventDefault(); }
    else if (key === 'Escape' || key === 'Delete') { handleButtonClick('C'); e.preventDefault(); }
    else if (key === '%') { handleButtonClick('%'); e.preventDefault(); }
    else if (key === '(') { handleButtonClick('('); e.preventDefault(); }
    else if (key === ')') { handleButtonClick(')'); e.preventDefault(); }
    else if (key === '^') { expression += '^'; updateDisplay(); e.preventDefault(); }
  });

  // Initial display
  updateDisplay();
}