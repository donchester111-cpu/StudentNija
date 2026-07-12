import { openToolModal } from './modal.js';
import { pastQuestions, saveAll, addNotification, escapeHtml } from '../state.js';
import { callAIHelper } from './helpers.js';

export function openPastQuestions() {
  let importHtml = `
    <div class="search-group">
      <input type="file" id="pastqFile" accept=".txt,.pdf,.jpg,.png" style="flex:1;">
      <button id="importPastqBtn" class="btn-primary">Import</button>
    </div>
    <div id="pastqPreview" style="margin:12px 0; display:none;">
      <img id="pastqImagePreview" style="max-width:100%; max-height:200px; border-radius:12px;">
      <p class="text-muted" style="margin-top:4px;">Image imported – text extracted (not shown).</p>
    </div>
    <div id="pastqList" class="pastq-list"></div>
  `;
  openToolModal('Past Questions Library', importHtml);

  function refreshList() {
    const container = document.getElementById('pastqList');
    if (!container) return;
    if (pastQuestions.length === 0) {
      container.innerHTML = '<div class="text-muted">No past questions imported yet.</div>';
      return;
    }
    container.innerHTML = pastQuestions.map((pq, idx) => `
      <div class="pastq-item">
        <div>
          ${pq.imageData ? `<img src="${pq.imageData}" style="max-width:80px; max-height:80px; border-radius:8px; margin-right:10px; float:left;">` : ''}
          <strong>${escapeHtml(pq.name)}</strong><br>
          <span class="text-muted">${pq.date}</span>
        </div>
        <div style="display:flex; gap:8px; align-items:center;">
          ${pq.imageData ? `<button class="btn-primary generate-answer-btn" data-idx="${idx}" style="width:auto; padding:4px 12px;">🤖 Generate Answers</button>` : ''}
          <button class="btn-outline view-pastq" data-idx="${idx}" style="margin-right:8px;">View</button>
          <button class="btn-outline delete-pastq" data-idx="${idx}">Delete</button>
        </div>
      </div>
    `).join('');

    document.querySelectorAll('.view-pastq').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        const pq = pastQuestions[idx];
        if (pq.type === 'text') alert(pq.content);
        else if (pq.imageData) window.open(pq.imageData, '_blank');
        else if (pq.dataUrl) window.open(pq.dataUrl, '_blank');
      };
    });
    document.querySelectorAll('.delete-pastq').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.dataset.idx);
        pastQuestions.splice(idx, 1);
        saveAll();
        refreshList();
        addNotification('Past Questions', 'Deleted one entry');
      };
    });
    document.querySelectorAll('.generate-answer-btn').forEach(btn => {
      btn.onclick = async () => {
        const idx = parseInt(btn.dataset.idx);
        const pq = pastQuestions[idx];
        if (!pq.extractedText) {
          alert('No text extracted from this image.');
          return;
        }
        const prompt = `You are a study assistant. Based on the following text extracted from a past question image, provide detailed answers and explanations for each question. If the text contains multiple questions, answer all of them.\n\nExtracted text:\n${pq.extractedText}`;
        try {
          const result = await callAIHelper(prompt, 'chat');
          const answerHtml = `
            <div style="position:relative; padding:16px;">
              <h4>✦AI Generated Answers</h4>
              <div style="white-space:pre-wrap;">${escapeHtml(result)}</div>
              <button class="copy-btn" data-text="${escapeHtml(result)}" style="position:absolute; top:0; right:0;">⧉</button>
            </div>
          `;
          openToolModal('AI Answers', answerHtml);
          addNotification('Past Questions', 'AI answers generated');
        } catch (err) {
          alert('Oops! Could not generate answers. Please try again later.');
        }
      };
    });
  }

  const importBtn = document.getElementById('importPastqBtn');
  const fileInput = document.getElementById('pastqFile');
  const previewDiv = document.getElementById('pastqPreview');
  const previewImg = document.getElementById('pastqImagePreview');

  if (importBtn) {
    importBtn.onclick = () => {
      if (!fileInput.files.length) { alert('Select a file'); return; }
      const file = fileInput.files[0];
      const reader = new FileReader();

      if (file.type.startsWith('image/')) {
        const objectUrl = URL.createObjectURL(file);
        previewImg.src = objectUrl;
        previewDiv.style.display = 'block';

        if (typeof Tesseract === 'undefined') {
          const script = document.createElement('script');
          script.src = 'https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js';
          script.async = true;
          document.head.appendChild(script);
          alert('Tesseract is loading, please try again in a moment.');
          return;
        }
        Tesseract.recognize(file, 'eng', {
          logger: (m) => { if (m.status === 'recognizing text') console.log(`OCR progress: ${m.progress * 100}%`); }
        }).then((result) => {
          const text = result.data.text.trim();
          const dataUrl = URL.createObjectURL(file);
          pastQuestions.push({
            id: Date.now(),
            name: file.name,
            date: new Date().toLocaleDateString(),
            type: 'image',
            imageData: dataUrl,
            extractedText: text
          });
          saveAll();
          refreshList();
          addNotification('Past Questions', `Imported ${file.name} with OCR`);
          previewDiv.style.display = 'none';
          fileInput.value = '';
        }).catch(err => {
          alert('OCR failed: Could not read image text.');
          previewDiv.style.display = 'none';
        });
      } else if (file.type === 'text/plain' || file.type === 'application/pdf') {
        reader.onload = function(e) {
          let content = e.target.result;
          pastQuestions.push({
            id: Date.now(),
            name: file.name,
            date: new Date().toLocaleDateString(),
            type: 'text',
            content: content,
            dataUrl: file.type === 'application/pdf' ? URL.createObjectURL(file) : null,
            extractedText: content
          });
          saveAll();
          refreshList();
          addNotification('Past Questions', `Imported ${file.name}`);
        };
        reader.readAsText(file, 'UTF-8');
      } else {
        alert('Unsupported file type.');
      }
    };
  }
  refreshList();
}