import { openToolModal } from './modal.js';
import { escapeHtml, addNotification } from '../state.js';

export function openFlashcards() {
  let flashcards = JSON.parse(localStorage.getItem('studentnija_flashcards') || '[]');

  const html = `
    <div class="flashcard-container">
      <div class="flex-between" style="margin-bottom:16px;">
        <h3>📚 Flashcards</h3>
        <button id="addFlashcardBtn" class="btn-primary" style="width:auto;">+ New</button>
      </div>
      <div id="flashcardList" style="display:flex; flex-direction:column; gap:12px; max-height:60vh; overflow-y:auto;"></div>
    </div>
  `;
  openToolModal('Flashcards', html);

  function renderFlashcards() {
    const container = document.getElementById('flashcardList');
    if (!container) return;
    if (flashcards.length === 0) {
      container.innerHTML = '<div class="text-muted">No flashcards yet. Create one!</div>';
      return;
    }
    container.innerHTML = flashcards.map((card, idx) => `
      <div class="glass-card" style="padding:16px;">
        <div><strong>Q:</strong> ${escapeHtml(card.question)}</div>
        <div style="margin-top:6px;"><strong>A:</strong> ${escapeHtml(card.answer)}</div>
        <div style="margin-top:8px; display:flex; gap:8px;">
          <button class="btn-outline edit-flashcard" data-idx="${idx}" style="width:auto; padding:4px 12px;">✏️</button>
          <button class="btn-outline delete-flashcard" data-idx="${idx}" style="width:auto; padding:4px 12px;">🗑️</button>
          <button class="btn-outline review-flashcard" data-idx="${idx}" style="width:auto; padding:4px 12px;">📖 Review</button>
        </div>
      </div>
    `).join('');

    container.querySelectorAll('.edit-flashcard').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const card = flashcards[idx];
        const newQ = prompt('Question:', card.question);
        if (newQ) {
          const newA = prompt('Answer:', card.answer);
          if (newA) {
            flashcards[idx] = { question: newQ.trim(), answer: newA.trim() };
            localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
            renderFlashcards();
            addNotification('Flashcard', 'Updated');
          }
        }
      };
    });
    container.querySelectorAll('.delete-flashcard').forEach(btn => {
      btn.onclick = () => {
        if (confirm('Delete this flashcard?')) {
          const idx = parseInt(btn.dataset.idx);
          flashcards.splice(idx, 1);
          localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
          renderFlashcards();
          addNotification('Flashcard', 'Deleted');
        }
      };
    });
    container.querySelectorAll('.review-flashcard').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const card = flashcards[idx];
        alert(`Question: ${card.question}\n\nAnswer: ${card.answer}`);
      };
    });
  }

  document.getElementById('addFlashcardBtn').onclick = () => {
    const q = prompt('Enter question:');
    if (q) {
      const a = prompt('Enter answer:');
      if (a) {
        flashcards.push({ question: q.trim(), answer: a.trim() });
        localStorage.setItem('studentnija_flashcards', JSON.stringify(flashcards));
        renderFlashcards();
        addNotification('Flashcard', 'Added');
      }
    }
  };

  renderFlashcards();
}