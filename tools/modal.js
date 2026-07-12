import { escapeHtml } from '../state.js';

let activeModal = null;

export function openToolModal(title, contentHtml) {
  if (activeModal) closeToolModal();
  const modalDiv = document.createElement('div');
  modalDiv.className = 'modal-full modern-modal';
  modalDiv.id = 'toolModal';
  modalDiv.innerHTML = `
    <div class="tool-header">
      <h2>${escapeHtml(title)}</h2>
      <span class="tool-close">&times;</span>
    </div>
    <div class="tool-body">${contentHtml}</div>
  `;
  document.body.appendChild(modalDiv);
  activeModal = modalDiv;
  setTimeout(() => modalDiv.classList.add('active'), 10);
  modalDiv.querySelector('.tool-close').onclick = closeToolModal;
}

export function closeToolModal() {
  if (activeModal) {
    activeModal.classList.remove('active');
    setTimeout(() => { if (activeModal) activeModal.remove(); activeModal = null; }, 300);
  }
}