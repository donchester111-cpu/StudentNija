import { openToolModal } from './modal.js';
import { callAIHelper } from './helpers.js';
import { addNotification, escapeHtml } from '../state.js';

export function openEssayAssistant() {
  const html = `
    <div class="essay-assistant">
      <h3>✍️ Essay Assistant</h3>
      <div style="display:flex; gap:12px; flex-wrap:wrap; margin:12px 0;">
        <input type="text" id="essayTopic" placeholder="Essay topic / prompt" style="flex:3;">
        <input type="number" id="essayWords" placeholder="Word count (optional)" style="flex:1; min-width:100px;">
        <button id="generateEssayBtn" class="btn-primary" style="width:auto;">Generate Outline</button>
      </div>
      <div id="essayActions" style="display:flex; gap:8px; flex-wrap:wrap; margin:8px 0;">
        <button class="btn-outline essay-action" data-action="draft">Write Draft</button>
        <button class="btn-outline essay-action" data-action="improve">Improve Text</button>
        <button class="btn-outline essay-action" data-action="summarize">Summarize</button>
        <button class="btn-outline essay-action" data-action="expand">Expand</button>
      </div>
      <div style="position:relative;">
        <textarea id="essayOutput" class="notepad-area" rows="10" placeholder="Essay content will appear here..."></textarea>
        <button class="copy-btn" id="copyEssayOutput" style="position:absolute; top:8px; right:8px;">⧉</button>
      </div>
    </div>
  `;
  openToolModal('Essay Assistant', html);

  const topicInput = document.getElementById('essayTopic');
  const wordsInput = document.getElementById('essayWords');
  const outputArea = document.getElementById('essayOutput');
  const generateBtn = document.getElementById('generateEssayBtn');

  document.getElementById('copyEssayOutput').addEventListener('click', () => {
    const text = outputArea.value;
    if (text) {
      navigator.clipboard.writeText(text).then(() => addNotification('Copied', 'Essay copied to clipboard'));
    }
  });

  async function performEssayAction(action) {
    const text = outputArea.value;
    if (!text.trim() && action !== 'draft') {
      alert('Please enter some text first.');
      return;
    }
    let prompt = '';
    if (action === 'draft') {
      const topic = topicInput.value.trim();
      const words = wordsInput.value.trim() || '500';
      if (!topic) { alert('Enter a topic first.'); return; }
      prompt = `Write a ${words}-word essay on "${topic}". Include an introduction, body paragraphs, and a conclusion. Use academic tone.`;
    } else if (action === 'improve') {
      prompt = `Improve the following text for clarity, grammar, and flow:\n\n${text}`;
    } else if (action === 'summarize') {
      prompt = `Summarize the following text concisely:\n\n${text}`;
    } else if (action === 'expand') {
      prompt = `Expand the following text by adding more detail and examples:\n\n${text}`;
    }
    outputArea.value = '⏳ Processing...';
    try {
      const result = await callAIHelper(prompt, 'essay');
      outputArea.value = result;
      addNotification('Essay', `Action: ${action} completed`);
    } catch (err) {
      outputArea.value = 'Oops! Something went wrong. Please try again.';
    }
  }

  generateBtn.onclick = () => performEssayAction('draft');
  document.querySelectorAll('.essay-action').forEach(btn => {
    btn.onclick = () => performEssayAction(btn.dataset.action);
  });
}