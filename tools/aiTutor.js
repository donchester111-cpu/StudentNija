import { openToolModal } from './modal.js';
import { callAIHelper } from './helpers.js';
import { buildUserContext, escapeHtml, addNotification } from '../state.js';

export async function openAITutor() {
  const context = buildUserContext();
  const prompt = `Based on the user's app data below, create a personalized study plan for the next week. Include daily focus areas, topics to review, and actionable tips. Keep it concise and motivating.\n\n${context}`;
  try {
    const result = await callAIHelper(prompt, 'tutor', '');
    const html = `
      <div class="ai-tutor-container">
        <h3>🧑‍🏫 Personal AI Tutor</h3>
        <div class="glass-card" style="padding:20px; white-space:pre-wrap; max-height:60vh; overflow-y:auto; position:relative;">
          ${escapeHtml(result)}
          <button class="copy-btn" data-text="${escapeHtml(result)}" style="position:absolute; top:10px; right:10px;">⧉</button>
        </div>
        <button id="refreshTutorPlan" class="btn-outline" style="margin-top:16px; width:auto;">🔄 Generate New Plan</button>
      </div>
    `;
    openToolModal('AI Tutor', html);
    document.getElementById('refreshTutorPlan').onclick = () => { openAITutor(); };
  } catch (err) {
    openToolModal('AI Tutor', `<div class="text-muted">Oops! The tutor service is temporarily unavailable. Please try again later.</div>`);
  }
}