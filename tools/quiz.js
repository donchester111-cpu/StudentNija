import { openToolModal } from './modal.js';
import { callAIHelper } from './helpers.js';
import { escapeHtml } from '../state.js';

export function openQuiz() {
  let currentQuiz = [], currentQuizIndex = 0, quizScore = 0;

  async function generateQuizQuestions(topic, count = 5) {
    const prompt = `Generate ${count} multiple-choice questions about "${topic}". Format as JSON array: [{"question":"...", "options":["A)","B)","C)","D)"], "answer":0}] where answer is the index (0-3). Only JSON.`;
    const result = await callAIHelper(prompt, 'quiz');
    const jsonMatch = result.match(/\[.*\]/s);
    if (jsonMatch) return JSON.parse(jsonMatch[0]);
    return [];
  }

  function renderQuizQuestion(container) {
    if (currentQuizIndex >= currentQuiz.length) {
      container.innerHTML = `
        <div class="glass-card" style="padding:24px; text-align:center;">
          <h3>🎉 Done!</h3>
          <p>Score: ${quizScore}/${currentQuiz.length}</p>
          <button id="restartQuizBtn" class="btn-primary" style="width:auto;">Retry</button>
        </div>
      `;
      document.getElementById('restartQuizBtn')?.addEventListener('click', () => {
        currentQuizIndex = 0;
        quizScore = 0;
        renderQuizQuestion(container);
      });
      return;
    }

    const q = currentQuiz[currentQuizIndex];
    let html = `<div class="glass-card" style="padding:20px;">
      <div class="quiz-question">${escapeHtml(q.question)}</div>
      <div class="quiz-options">`;
    q.options.forEach((opt, idx) => {
      html += `<div class="quiz-option" data-opt="${idx}">${escapeHtml(opt)}</div>`;
    });
    html += `</div></div>`;
    container.innerHTML = html;

    document.querySelectorAll('.quiz-option').forEach(opt => {
      opt.addEventListener('click', (e) => {
        const selected = parseInt(e.currentTarget.dataset.opt);
        if (selected === q.answer) quizScore++;
        currentQuizIndex++;
        renderQuizQuestion(container);
      });
    });
  }

  const html = `
    <div class="quiz-modern">
      <div style="display:flex; gap:12px; margin-bottom:20px;">
        <input type="text" id="quizTopic" placeholder="Enter topic (e.g., Algebra, Physics...)" style="flex:1;">
        <button id="generateQuizBtn" class="btn-primary" style="width:auto;">Generate</button>
      </div>
      <div id="quizContainer" class="quiz-container"></div>
    </div>
  `;
  openToolModal('AI Quiz', html);

  const topicInput = document.getElementById('quizTopic');
  const generateBtn = document.getElementById('generateQuizBtn');
  const container = document.getElementById('quizContainer');

  generateBtn.addEventListener('click', async () => {
    const topic = topicInput.value.trim();
    if (!topic) {
      container.innerHTML = '<div class="text-muted">Please enter a topic.</div>';
      return;
    }
    container.innerHTML = '<div class="text-muted">Generating questions…</div>';
    try {
      const questions = await generateQuizQuestions(topic, 5);
      if (!questions || questions.length === 0) {
        container.innerHTML = '<div class="text-muted">Could not generate questions. Please try another topic.</div>';
        return;
      }
      currentQuiz = questions;
      currentQuizIndex = 0;
      quizScore = 0;
      renderQuizQuestion(container);
    } catch (err) {
      container.innerHTML = '<div class="text-muted">Sorry, something went wrong. Please try again.</div>';
    }
  });
}