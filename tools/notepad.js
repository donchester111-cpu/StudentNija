import { openToolModal } from './modal.js';
import { savedNotes, addNotification, escapeHtml } from '../state.js';
import { callAIHelper } from './helpers.js';

export function openNotepad() {
  let currentNoteIndex = -1;
  let noteCategories = ['School', 'Work', 'Personal', 'Misc'];
  let autoSaveEnabled = JSON.parse(localStorage.getItem('notepad_autoSave')) !== false;
  let fontSize = parseInt(localStorage.getItem('notepad_fontSize')) || 16;

  async function aiAction(action) {
    const editor = document.getElementById('notepadText');
    const text = editor.value;
    if (!text.trim()) { alert('Nothing to process.'); return; }
    const selected = text.substring(editor.selectionStart, editor.selectionEnd);
    const target = selected || text;
    let prompt = '';
    switch (action) {
      case 'summarize': prompt = 'Summarize the following text concisely:'; break;
      case 'rewrite': prompt = 'Rewrite this text with better clarity and fluency:'; break;
      case 'translate': prompt = 'Translate the following text to English (if not already) or to the user\'s preferred language:'; break;
      case 'grammar': prompt = 'Fix grammar and spelling mistakes in this text:'; break;
      case 'expand': prompt = 'Expand this text to provide more detail and explanation:'; break;
      default: return;
    }
    const result = await callAIHelper(`${prompt}\n\n${target}`, 'chat');
    if (selected) {
      const before = text.substring(0, editor.selectionStart);
      const after = text.substring(editor.selectionEnd);
      editor.value = before + result + after;
    } else {
      editor.value = result;
    }
    addNotification('Notepad', `AI ${action} applied`);
  }

  function setupAutoComplete(input) {
    const datalistId = 'wordSuggestions';
    let datalist = document.getElementById(datalistId);
    if (!datalist) {
      datalist = document.createElement('datalist');
      datalist.id = datalistId;
      document.body.appendChild(datalist);
    }
    const commonWords = ['the','be','to','of','and','a','in','that','have','i','it','for','not','on','with','he','as','you','do','at','this','but','his','by','from','they','we','say','her','she','or','an','will','my','one','all','would','there','their','what','so','up','out','if','about','who','get','which','go','me','when','make','can','like','time','no','just','him','know','take','people','into','year','your','good','some','could','them','see','other','than','then','now','look','only','come','its','over','think','also','back','after','use','two','how','our','work','first','well','way','even','new','want','because','any','these','give','day','most','us'];
    datalist.innerHTML = commonWords.map(w => `<option value="${w}">`).join('');
    input.setAttribute('list', datalistId);
  }

  function renderNoteList() {
    const container = document.getElementById('noteList');
    if (!container) return;
    const categoryFilter = document.getElementById('categoryFilter')?.value || 'All';
    let filtered = savedNotes;
    if (categoryFilter !== 'All') {
      filtered = savedNotes.filter(note => note.category === categoryFilter);
    }
    if (filtered.length === 0) {
      container.innerHTML = `<div class="text-muted">No notes in this category.</div>`;
      return;
    }
    container.innerHTML = filtered.map((note, idx) => {
      const realIdx = savedNotes.indexOf(note);
      return `<div class="note-item">
        <div>
          <strong>${escapeHtml(note.title || 'Untitled')}</strong>
          <span class="text-muted" style="font-size:12px;">[${note.category || 'Misc'}]</span>
          <br><span class="text-muted">${new Date(note.updated).toLocaleString()}</span>
        </div>
        <div>
          <button class="btn-outline load-note" data-idx="${realIdx}" style="margin-right:8px;">Load</button>
          <button class="btn-outline delete-note" data-idx="${realIdx}">Delete</button>
        </div>
      </div>`;
    }).join('');

    document.querySelectorAll('.load-note').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        const note = savedNotes[idx];
        document.getElementById('notepadText').value = note.content;
        document.getElementById('noteTitle').value = note.title || '';
        document.getElementById('categorySelect').value = note.category || 'Misc';
        currentNoteIndex = idx;
        addNotification('Notepad', `Loaded: ${note.title || 'Untitled'}`);
      };
    });
    document.querySelectorAll('.delete-note').forEach(btn => {
      btn.onclick = () => {
        const idx = parseInt(btn.getAttribute('data-idx'));
        if (confirm('Delete this note?')) {
          savedNotes.splice(idx, 1);
          saveNotesList();
          renderNoteList();
          addNotification('Notepad', 'Note deleted');
          if (currentNoteIndex === idx) {
            document.getElementById('notepadText').value = '';
            document.getElementById('noteTitle').value = '';
            document.getElementById('categorySelect').value = 'Misc';
            currentNoteIndex = -1;
          }
        }
      };
    });
  }

  function saveCurrentNote() {
    const editor = document.getElementById('notepadText');
    const title = document.getElementById('noteTitle').value.trim() || 'Untitled';
    const category = document.getElementById('categorySelect').value || 'Misc';
    if (currentNoteIndex === -1) {
      alert('Load a note first or use "Save as New".');
      return;
    }
    savedNotes[currentNoteIndex].content = editor.value;
    savedNotes[currentNoteIndex].title = title;
    savedNotes[currentNoteIndex].category = category;
    savedNotes[currentNoteIndex].updated = new Date().toISOString();
    saveNotesList();
    renderNoteList();
    addNotification('Notepad', 'Note updated');
  }

  function saveNotesList() {
    localStorage.setItem('studentnija_notes_list', JSON.stringify(savedNotes));
  }

  let autoSaveTimer = null;
  function startAutoSave() {
    if (autoSaveTimer) clearInterval(autoSaveTimer);
    if (!autoSaveEnabled) return;
    autoSaveTimer = setInterval(() => {
      if (currentNoteIndex !== -1) {
        const editor = document.getElementById('notepadText');
        const title = document.getElementById('noteTitle').value.trim() || 'Untitled';
        const category = document.getElementById('categorySelect').value || 'Misc';
        savedNotes[currentNoteIndex].content = editor.value;
        savedNotes[currentNoteIndex].title = title;
        savedNotes[currentNoteIndex].category = category;
        savedNotes[currentNoteIndex].updated = new Date().toISOString();
        saveNotesList();
        const status = document.getElementById('autoSaveStatus');
        if (status) status.textContent = '✓ Auto-saved';
      }
    }, 5000);
  }

  const html = `
    <div class="notepad-modern">
      <div class="notepad-toolbar">
        <div style="display:flex; gap:6px; flex-wrap:wrap;">
          <select id="categorySelect" class="modern-select" style="padding:6px 12px; border-radius:20px;">
            <option value="Misc">📂 Misc</option>
            ${noteCategories.map(c => `<option value="${c}">📂 ${c}</option>`).join('')}
            <option value="new">+ New Category</option>
          </select>
          <input type="text" id="noteTitle" placeholder="Note title" style="flex:1; min-width:120px;">
        </div>
        <div style="display:flex; gap:4px; flex-wrap:wrap;">
          <button class="notepad-btn" data-ai="summarize">📝 Summarize</button>
          <button class="notepad-btn" data-ai="rewrite">✍️ Rewrite</button>
          <button class="notepad-btn" data-ai="translate">🌐 Translate</button>
          <button class="notepad-btn" data-ai="grammar">✅ Grammar</button>
          <button class="notepad-btn" data-ai="expand">📈 Expand</button>
          <button class="notepad-btn" id="notepadSettingsBtn">⚙️</button>
        </div>
      </div>
      <textarea id="notepadText" class="notepad-area" placeholder="Write your notes here..." style="font-size:${fontSize}px;"></textarea>
      <div style="display:flex; justify-content:space-between; font-size:12px; color:var(--text-muted); margin:4px 0;">
        <span id="autoSaveStatus">Auto-save ${autoSaveEnabled ? 'ON' : 'OFF'}</span>
        <span id="wordCount">0 words</span>
      </div>
      <div class="flex-between" style="margin-top:12px; gap:12px; flex-wrap:wrap;">
        <button id="saveNewNoteBtn" class="btn-outline" style="width:auto;">💾 Save as New</button>
        <button id="saveCurrentNoteBtn" class="btn-primary" style="width:auto;">📌 Update Current</button>
        <button id="duplicateNoteBtn" class="btn-outline" style="width:auto;">⧉Duplicate</button>
      </div>
      <div style="margin-top:20px; display:flex; align-items:center; gap:12px;">
        <span style="font-weight:600;">📚 My Notes</span>
        <select id="categoryFilter" style="padding:4px 12px; border-radius:16px; background:var(--bg-card-solid); border:1px solid var(--border-light);">
          <option value="All">All Categories</option>
          ${noteCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
        </select>
      </div>
      <div id="noteList" class="note-list" style="margin-top:8px;"></div>
    </div>
  `;

  openToolModal('📒 Smart Notepad', html);

  const editor = document.getElementById('notepadText');
  const titleInput = document.getElementById('noteTitle');
  const categorySelect = document.getElementById('categorySelect');
  const categoryFilter = document.getElementById('categoryFilter');
  const saveNewBtn = document.getElementById('saveNewNoteBtn');
  const saveCurrentBtn = document.getElementById('saveCurrentNoteBtn');
  const duplicateBtn = document.getElementById('duplicateNoteBtn');
  const settingsBtn = document.getElementById('notepadSettingsBtn');
  const wordCount = document.getElementById('wordCount');

  categorySelect.addEventListener('change', () => {
    if (categorySelect.value === 'new') {
      const newCat = prompt('Enter new category name:');
      if (newCat && newCat.trim()) {
        noteCategories.push(newCat.trim());
        categorySelect.innerHTML = `
          <option value="Misc">📂 Misc</option>
          ${noteCategories.map(c => `<option value="${c}">📂 ${c}</option>`).join('')}
          <option value="new">+ New Category</option>
        `;
        categorySelect.value = newCat.trim();
        categoryFilter.innerHTML = `
          <option value="All">All Categories</option>
          ${noteCategories.map(c => `<option value="${c}">${c}</option>`).join('')}
        `;
        categoryFilter.value = 'All';
      } else {
        categorySelect.value = 'Misc';
      }
    }
  });

  editor.addEventListener('input', () => {
    const words = editor.value.trim().split(/\s+/).filter(w => w.length > 0).length;
    wordCount.textContent = `${words} words`;
  });

  setupAutoComplete(editor);

  document.querySelectorAll('.notepad-btn[data-ai]').forEach(btn => {
    btn.onclick = () => { aiAction(btn.getAttribute('data-ai')); };
  });

  settingsBtn.onclick = () => {
    const newSize = prompt('Font size (px):', fontSize);
    if (newSize && !isNaN(newSize) && newSize > 0) {
      fontSize = parseInt(newSize);
      editor.style.fontSize = fontSize + 'px';
      localStorage.setItem('notepad_fontSize', fontSize);
    }
    const toggleAutoSave = confirm('Toggle auto-save? (Currently ' + (autoSaveEnabled ? 'ON' : 'OFF') + ')');
    if (toggleAutoSave) {
      autoSaveEnabled = !autoSaveEnabled;
      localStorage.setItem('notepad_autoSave', JSON.stringify(autoSaveEnabled));
      document.getElementById('autoSaveStatus').textContent = `Auto-save ${autoSaveEnabled ? 'ON' : 'OFF'}`;
      if (autoSaveEnabled) startAutoSave(); else clearInterval(autoSaveTimer);
    }
  };

  saveNewBtn.onclick = () => {
    const content = editor.value;
    const title = titleInput.value.trim() || 'Note ' + (savedNotes.length + 1);
    const category = categorySelect.value || 'Misc';
    savedNotes.push({ id: Date.now(), title, content, category, updated: new Date().toISOString() });
    saveNotesList();
    renderNoteList();
    editor.value = '';
    titleInput.value = '';
    categorySelect.value = 'Misc';
    currentNoteIndex = -1;
    addNotification('Notepad', 'New note saved');
  };

  saveCurrentBtn.onclick = saveCurrentNote;

  duplicateBtn.onclick = () => {
    if (currentNoteIndex === -1) { alert('Load a note first.'); return; }
    const note = savedNotes[currentNoteIndex];
    const dup = { id: Date.now(), title: note.title + ' (copy)', content: note.content, category: note.category, updated: new Date().toISOString() };
    savedNotes.push(dup);
    saveNotesList();
    renderNoteList();
    addNotification('Notepad', 'Note duplicated');
  };

  categoryFilter.addEventListener('change', renderNoteList);
  startAutoSave();
  renderNoteList();
}