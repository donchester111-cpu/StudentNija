import { openToolModal, closeToolModal } from './modal.js';
import { addNotification, escapeHtml } from '../state.js';

export function openCalculator() {
  let expression = '';
  let result = '';
  let history = [];
  let memory = 0;
  let isScientific = false;
  let displayExpr, displayResult, historyPanel, modeToggle;

  function updateDisplay() {
    if (displayExpr) displayExpr.textContent = expression || '0';
    if (displayResult) displayResult.textContent = result || '';
  }

  function evaluate(expr) {
    try {
      let sanitized = expr
        .replace(/×/g, '*').replace(/÷/g, '/').replace(/π/g, 'Math.PI').replace(/e/g, 'Math.E')
        .replace(/sin\(/g, 'Math.sin(').replace(/cos\(/g, 'Math.cos(').replace(/tan\(/g, 'Math.tan(')
        .replace(/log\(/g, 'Math.log10(').replace(/ln\(/g, 'Math.log(').replace(/√\(/g, 'Math.sqrt(')
        .replace(/exp\(/g, 'Math.exp(').replace(/x²/g, '**2').replace(/x³/g, '**3')
        .replace(/factorial\(/g, 'factorial(');
      const factorial = (n) => n <= 1 ? 1 : n * factorial(n - 1);
      const result = Function('"use strict"; return (' + sanitized + ')')();
      return result;
    } catch (e) {
      return 'Error';
    }
  }

  const html = `
    <div class="calc-container">
      <div class="calc-header">
        <div class="calc-mode-toggle">
          <button class="calc-mode-btn" data-mode="standard">Standard</button>
          <button class="calc-mode-btn" data-mode="scientific">Scientific</button>
        </div>
        <button class="calc-history-toggle" id="calcHistoryToggle">📜</button>
      </div>
      <div class="calc-display-area">
        <div class="calc-expression" id="calcExpression">0</div>
        <div class="calc-result" id="calcResult"></div>
      </div>
      <div class="calc-grid" id="calcGrid">
        <button class="calc-btn" data-val="C">C</button>
        <button class="calc-btn" data-val="±">±</button>
        <button class="calc-btn" data-val="%">%</button>
        <button class="calc-btn" data-val="÷">÷</button>
        <button class="calc-btn" data-val="7">7</button>
        <button class="calc-btn" data-val="8">8</button>
        <button class="calc-btn" data-val="9">9</button>
        <button class="calc-btn" data-val="×">×</button>
        <button class="calc-btn" data-val="4">4</button>
        <button class="calc-btn" data-val="5">5</button>
        <button class="calc-btn" data-val="6">6</button>
        <button class="calc-btn" data-val="−">−</button>
        <button class="calc-btn" data-val="1">1</button>
        <button class="calc-btn" data-val="2">2</button>
        <button class="calc-btn" data-val="3">3</button>
        <button class="calc-btn" data-val="+">+</button>
        <button class="calc-btn" data-val="0">0</button>
        <button class="calc-btn" data-val=".">.</button>
        <button class="calc-btn" data-val="⌫">⌫</button>
        <button class="calc-btn calc-equals" data-val="=">=</button>
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

  displayExpr = document.getElementById('calcExpression');
  displayResult = document.getElementById('calcResult');
  const grid = document.getElementById('calcGrid');
  const scientificDiv = document.getElementById('calcScientific');
  historyPanel = document.getElementById('calcHistoryPanel');
  const historyList = document.getElementById('calcHistoryList');
  const historyToggle = document.getElementById('calcHistoryToggle');
  const historyClear = document.getElementById('calcHistoryClear');
  const modeButtons = document.querySelectorAll('.calc-mode-btn');

  function renderHistory() {
    if (!historyList) return;
    if (history.length === 0) {
      historyList.innerHTML = '<div class="text-muted">No calculations yet.</div>';
      return;
    }
    historyList.innerHTML = history.slice(-10).reverse().map(entry => `
      <div class="history-item">
        <div class="history-expr">${escapeHtml(entry.expr)}</div>
        <div class="history-result">= ${escapeHtml(entry.result)}</div>
      </div>
    `).join('');
  }

  document.querySelectorAll('.calc-mem-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const memAction = btn.dataset.mem;
      const currentVal = parseFloat(result) || parseFloat(expression) || 0;
      switch (memAction) {
        case 'MC': memory = 0; break;
        case 'MR': if (memory !== 0) { expression += memory.toString(); updateDisplay(); } break;
        case 'M+': memory += currentVal; break;
        case 'M−': memory -= currentVal; break;
      }
      addNotification('Calculator', `Memory: ${memAction} done`);
    });
  });

  modeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      modeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      isScientific = btn.dataset.mode === 'scientific';
      scientificDiv.style.display = isScientific ? 'grid' : 'none';
    });
  });
  document.querySelector('.calc-mode-btn[data-mode="standard"]').classList.add('active');

  historyToggle.addEventListener('click', () => {
    const isVisible = historyPanel.style.display !== 'none';
    historyPanel.style.display = isVisible ? 'none' : 'block';
    renderHistory();
  });

  historyClear.addEventListener('click', () => {
    history = [];
    renderHistory();
  });

  function handleButtonClick(val) {
    if (val === 'C') { expression = ''; result = ''; updateDisplay(); return; }
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
    if (val === '±') { if (expression.startsWith('-')) expression = expression.slice(1); else expression = '-' + expression; updateDisplay(); return; }
    if (val === '%') { const current = parseFloat(expression) || 0; expression = (current / 100).toString(); updateDisplay(); return; }
    expression += val;
    updateDisplay();
  }

  grid.querySelectorAll('.calc-btn').forEach(btn => {
    btn.addEventListener('click', () => { handleButtonClick(btn.dataset.val); });
  });

  document.querySelectorAll('.calc-fn').forEach(btn => {
    btn.addEventListener('click', () => {
      const fn = btn.dataset.fn;
      if (fn === 'π') { expression += 'π'; updateDisplay(); return; }
      if (fn === 'e') { expression += 'e'; updateDisplay(); return; }
      if (fn === 'x²') { expression += 'x²'; updateDisplay(); return; }
      if (fn === 'x³') { expression += 'x³'; updateDisplay(); return; }
      if (fn === 'x!') { expression += 'factorial('; updateDisplay(); return; }
      expression += fn + '(';
      updateDisplay();
    });
  });

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
    else if (key === 'Escape') { handleButtonClick('C'); e.preventDefault(); }
    else if (key === '%') { handleButtonClick('%'); e.preventDefault(); }
  });

  updateDisplay();
}