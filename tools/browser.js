import { openToolModal, closeToolModal } from './modal.js';
import { addNotification, escapeHtml } from '../state.js';

let browserTabs = [];
let browserCurrentTabId = null;
let browserBookmarks = JSON.parse(localStorage.getItem('browser_bookmarks') || '[]');
let browserHistory = JSON.parse(localStorage.getItem('browser_history') || '[]');
let browserTabCounter = 0;
let browserIsOpen = false;
let browserCurrentSearchEngine = localStorage.getItem('browser_search_engine') || 'google';
const browserClosedTabs = [];

const browserSearchEngines = {
  google: 'https://www.google.com/search?q=',
  duckduckgo: 'https://duckduckgo.com/?q=',
  wikipedia: 'https://en.wikipedia.org/wiki/',
  youtube: 'https://www.youtube.com/results?search_query=',
  bing: 'https://www.bing.com/search?q='
};

const BLOCKED_DOMAINS = [
  'google.com', 'youtube.com', 'facebook.com', 'twitter.com',
  'instagram.com', 'tiktok.com', 'whatsapp.com', 'linkedin.com',
  'netflix.com', 'spotify.com'
];

const BROWSER_HOME_HTML = `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Home</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{background:#0F0F0F;color:#fff;font-family:system-ui,-apple-system,sans-serif;display:flex;flex-direction:column;align-items:center;justify-content:center;height:100vh;padding:20px;text-align:center}
h1{font-size:2.5rem;font-weight:700;background:linear-gradient(135deg,#00C3FF,#008751);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:20px}
.search-box{width:90%;max-width:500px;display:flex;gap:10px}
.search-box input{flex:1;padding:14px 20px;border-radius:30px;border:none;background:#1C1C1C;color:#fff;font-size:16px;outline:2px solid transparent;transition:0.2s}
.search-box input:focus{outline-color:#00C3FF}
.search-box button{padding:14px 24px;border-radius:30px;border:none;background:#00C3FF;color:#0F0F0F;font-weight:600;cursor:pointer;font-size:16px}
.quick-links{display:flex;flex-wrap:wrap;gap:12px;margin-top:30px;justify-content:center}
.quick-links a{color:#00C3FF;text-decoration:none;font-size:16px;padding:8px 16px;border-radius:20px;background:#1C1C1C;transition:0.2s;cursor:pointer}
.quick-links a:active{background:#00C3FF;color:#0F0F0F}
</style>
</head>
<body>
<h1>StudentNija Browser</h1>
<div class="search-box">
<input id="homeSearch" placeholder="Search or enter URL" onkeydown="if(event.key==='Enter'){window.parent.browserSearchFromHome(this.value)}">
<button onclick="window.parent.browserSearchFromHome(document.getElementById('homeSearch').value)">Go</button>
</div>
<div class="quick-links">
<a onclick="window.parent.browserNavigateTo('https://www.google.com')">Google</a>
<a onclick="window.parent.browserNavigateTo('https://www.youtube.com')">YouTube</a>
<a onclick="window.parent.browserNavigateTo('https://github.com')">GitHub</a>
<a onclick="window.parent.browserNavigateTo('https://wikipedia.org')">Wikipedia</a>
<a onclick="window.parent.browserNavigateTo('https://openlibrary.org')">OpenLibrary</a>
</div>
</body>
</html>`;

// ============================ EMBEDDED CSS ============================
const BROWSER_CSS = `
  .fullscreen-browser-overlay {
    position: fixed; top:0; left:0; width:100%; height:100%;
    background: var(--bg-primary);
    z-index: 9999; display: flex; flex-direction: column;
    animation: browserFadeIn 0.25s ease;
  }
  @keyframes browserFadeIn { from{opacity:0;} to{opacity:1;} }
  .browser-container {
    display: flex; flex-direction: column; height:100%; width:100%;
    background: var(--bg-primary);
  }
  .browser-toolbar {
    display: flex; align-items: center; gap:6px; padding:6px 10px;
    background: var(--bg-card);
    backdrop-filter: blur(20px); -webkit-backdrop-filter: blur(20px);
    border-bottom: 1px solid var(--border-light);
    flex-wrap: wrap; flex-shrink: 0; min-height: 50px;
    box-shadow: var(--shadow-sm);
  }
  .browser-nav, .browser-actions { display: flex; gap:2px; align-items:center; }
  .browser-nav button, .browser-actions button,
  .browser-toolbar .browser-search-engine select {
    background: none; border: none; font-size: 16px; cursor: pointer;
    padding: 6px 8px; border-radius: 10px; color: var(--text-primary);
    transition: background 0.15s, transform 0.1s;
    display: flex; align-items: center; justify-content: center;
    min-width: 36px; min-height: 36px;
  }
  .browser-nav button:disabled { opacity:0.3; cursor:default; }
  .browser-nav button:active:not(:disabled),
  .browser-actions button:active {
    background: rgba(0,135,81,0.1); transform: scale(0.92);
  }
  .browser-url {
    flex:1; display: flex; gap:4px; min-width: 120px;
  }
  .browser-url input {
    flex:1; padding: 8px 14px; border-radius: 30px;
    border: 1px solid var(--border-light);
    background: var(--bg-primary); color: var(--text-primary);
    font-size: 13px; outline: none; transition: border-color 0.2s, box-shadow 0.2s;
    min-height: 36px;
  }
  .browser-url input:focus {
    border-color: var(--accent); box-shadow: 0 0 0 3px var(--accent-glow);
  }
  .browser-url button {
    background: var(--accent); border: none; border-radius: 30px;
    padding: 6px 14px; color: white; font-weight: 700; cursor: pointer;
    transition: transform 0.15s, background 0.2s; min-height: 36px; font-size: 14px;
  }
  .browser-url button:active {
    transform: scale(0.93); background: var(--accent-light);
  }
  .browser-search-engine {
    display: flex; align-items: center;
  }
  .browser-search-engine select {
    background: var(--bg-primary); border: 1px solid var(--border-light);
    border-radius: 20px; padding: 4px 8px; color: var(--text-primary);
    font-size: 12px; min-height: 28px; outline: none; cursor: pointer;
  }
  .browser-tab-bar {
    display: flex; align-items: center; flex-wrap: nowrap; overflow-x: auto;
    background: var(--bg-secondary); border-bottom: 1px solid var(--border-light);
    padding: 4px 6px 0; gap: 4px; flex-shrink: 0; min-height: 36px;
    -webkit-overflow-scrolling: touch; scrollbar-width: none;
  }
  .browser-tab-bar::-webkit-scrollbar { height:0; }
  .browser-tab {
    background: var(--bg-primary); padding: 4px 12px; border-radius: 8px 8px 0 0;
    cursor: pointer; white-space: nowrap; font-size: 11px; font-weight: 500;
    display: flex; align-items: center; gap: 4px;
    border: 1px solid transparent; border-bottom: none;
    color: var(--text-muted); flex-shrink: 0; max-width: 120px; overflow: hidden;
    transition: background 0.2s, color 0.2s;
  }
  .browser-tab.active {
    background: var(--bg-card); border-color: var(--border-light);
    color: var(--text-primary); font-weight: 600;
    box-shadow: 0 -2px 8px rgba(0,0,0,0.05);
  }
  .browser-tab-close {
    font-size: 10px; cursor: pointer; opacity: 0.5; padding: 0 2px;
    transition: opacity 0.2s;
  }
  .browser-tab-close:hover { opacity:1; color: var(--accent-red, #ff4444); }
  .browser-tab-bar button#browserNewTab,
  .browser-tab-bar button#browserNewTabInline {
    background: none; border: none; font-size: 18px; color: var(--text-muted);
    cursor: pointer; padding: 0 6px; min-width: 28px;
    display: flex; align-items: center; justify-content: center;
  }
  .browser-frame {
    flex:1; position: relative; background: white; overflow: hidden;
  }
  .browser-frame iframe { width:100%; height:100%; border:none; }
  .browser-loading {
    position: absolute; inset:0; display: flex; align-items: center;
    justify-content: center; background: rgba(255,255,255,0.85);
    flex-direction: column; gap:12px; z-index:10; backdrop-filter: blur(4px);
  }
  .dark-theme .browser-loading { background: rgba(0,0,0,0.7); }
  .browser-loading .spinner {
    width: 32px; height: 32px; border: 3px solid rgba(0,135,81,0.15);
    border-top: 3px solid var(--accent); border-radius: 50%;
    animation: browserSpin 0.9s linear infinite;
  }
  @keyframes browserSpin { to{transform:rotate(360deg);} }
  .browser-loading span { font-size: 13px; color: var(--text-muted); font-weight: 500; }
  .browser-error {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; height:100%; padding: 20px; text-align: center;
    background: var(--bg-primary);
  }
  .browser-error h3 { margin-bottom: 8px; color: var(--text-primary); font-size: 18px; font-weight: 700; }
  .browser-error p { color: var(--text-muted); max-width: 400px; margin-bottom: 16px; font-size: 14px; line-height: 1.5; }
  .browser-error .btn-primary { width:auto; padding: 12px 32px; }
  .browser-status {
    padding: 3px 12px; font-size: 11px; color: var(--text-muted);
    border-top: 1px solid var(--border-light);
    background: var(--bg-card); flex-shrink: 0; min-height: 22px;
    overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
  }
  @media (max-width: 600px) {
    .browser-toolbar { padding:4px 6px; gap:4px; }
    .browser-url input { font-size:12px; padding:6px 10px; min-height:32px; }
    .browser-url button { font-size:13px; padding:4px 10px; min-height:32px; }
    .browser-nav button, .browser-actions button { font-size:14px; min-width:30px; min-height:30px; padding:4px 6px; }
    .browser-tab { font-size:10px; max-width:80px; padding:3px 8px; }
    .browser-search-engine select { font-size:10px; padding:3px 6px; }
  }
`;

// ============================ BROWSER CODE ============================

export function openBrowser(initialUrl) {
  if (browserIsOpen) {
    if (initialUrl) browserNavigateTo(initialUrl);
    return;
  }
  browserIsOpen = true;

  const existing = document.getElementById('fullscreenBrowser');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'fullscreenBrowser';
  overlay.className = 'fullscreen-browser-overlay';

  // Inject CSS only once
  if (!document.getElementById('browser-inline-css')) {
    const style = document.createElement('style');
    style.id = 'browser-inline-css';
    style.textContent = BROWSER_CSS;
    document.head.appendChild(style);
  }

  overlay.innerHTML = `
    <div class="browser-container">
      <div class="browser-toolbar">
        <div class="browser-nav">
          <button id="browserBack" title="Back">◀</button>
          <button id="browserForward" title="Forward">▶</button>
          <button id="browserRefresh" title="Refresh">⟳</button>
          <button id="browserHome" title="Home">⌂</button>
        </div>
        <div class="browser-url">
          <input type="text" id="browserUrl" placeholder="Search or enter URL">
          <button id="browserGo">➜</button>
        </div>
        <div class="browser-actions">
          <button id="browserShare" title="Share">↗</button>
          <button id="browserCopy" title="Copy URL">⧉</button>
          <button id="browserBookmark" title="Bookmark">☆</button>
          <button id="browserZoomOut" title="Zoom Out">−</button>
          <button id="browserZoomReset" title="Reset Zoom">100%</button>
          <button id="browserZoomIn" title="Zoom In">+</button>
          <button id="browserTabs" title="Tabs">⊞</button>
          <button id="browserSettings" title="Settings">⚙</button>
          <button id="browserClose" title="Close">✕</button>
        </div>
        <div class="browser-search-engine">
          <select id="browserEngineSelectInline">
            <option value="google" ${browserCurrentSearchEngine==='google'?'selected':''}>Google</option>
            <option value="duckduckgo" ${browserCurrentSearchEngine==='duckduckgo'?'selected':''}>DuckDuckGo</option>
            <option value="wikipedia" ${browserCurrentSearchEngine==='wikipedia'?'selected':''}>Wikipedia</option>
            <option value="youtube" ${browserCurrentSearchEngine==='youtube'?'selected':''}>YouTube</option>
            <option value="bing" ${browserCurrentSearchEngine==='bing'?'selected':''}>Bing</option>
          </select>
        </div>
      </div>
      <div class="browser-tab-bar" id="browserTabBar">
        <button id="browserNewTab" style="background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;padding:0 8px;min-width:32px;">+</button>
      </div>
      <div class="browser-frame" id="browserFrame">
        <div id="browserLoading" class="browser-loading" style="display:none;">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
        <div id="browserError" class="browser-error" style="display:none;">
          <div style="font-size:48px; margin-bottom:16px;">🌐</div>
          <h3>Cannot display this page</h3>
          <p>This site prevents being loaded inside an app. Tap the button below to open it in your browser.</p>
          <button id="browserOpenExternal" class="btn-primary">Open in Browser</button>
          <button id="browserGoBackBtn" class="btn-outline" style="width:auto; padding:12px 32px; margin-top:8px;">Go Back</button>
        </div>
        <div id="browserWebContainer" style="width:100%; height:100%; position:relative; overflow:hidden;"></div>
      </div>
      <div class="browser-status" id="browserStatus">Ready</div>
    </div>
  `;

  document.body.appendChild(overlay);

  // ---- DOM refs ----
  const webContainer = document.getElementById('browserWebContainer');
  const urlInput = document.getElementById('browserUrl');
  const goBtn = document.getElementById('browserGo');
  const backBtn = document.getElementById('browserBack');
  const forwardBtn = document.getElementById('browserForward');
  const refreshBtn = document.getElementById('browserRefresh');
  const homeBtn = document.getElementById('browserHome');
  const shareBtn = document.getElementById('browserShare');
  const copyBtn = document.getElementById('browserCopy');
  const bookmarkBtn = document.getElementById('browserBookmark');
  const zoomOutBtn = document.getElementById('browserZoomOut');
  const zoomResetBtn = document.getElementById('browserZoomReset');
  const zoomInBtn = document.getElementById('browserZoomIn');
  const tabsBtn = document.getElementById('browserTabs');
  const settingsBtn = document.getElementById('browserSettings');
  const closeBtn = document.getElementById('browserClose');
  const newTabBtn = document.getElementById('browserNewTab');
  const engineSelect = document.getElementById('browserEngineSelectInline');
  const statusDiv = document.getElementById('browserStatus');
  const loadingDiv = document.getElementById('browserLoading');
  const errorDiv = document.getElementById('browserError');
  const openExternalBtn = document.getElementById('browserOpenExternal');
  const goBackBtn = document.getElementById('browserGoBackBtn');
  const tabBar = document.getElementById('browserTabBar');

  let currentTabId = null;
  let currentZoom = 0.9;

  function getTab(id) { return browserTabs.find(t => t.id === id); }
  function getCurrentTab() { return getTab(currentTabId); }
  function getCurrentWeb() { const tab = getCurrentTab(); return tab ? tab.web : null; }

  function updateUrlBar(url) {
    urlInput.value = url || '';
    if (url) {
      const isBookmarked = browserBookmarks.some(b => b.url === url);
      bookmarkBtn.textContent = isBookmarked ? '★' : '☆';
    } else {
      bookmarkBtn.textContent = '☆';
    }
    zoomResetBtn.textContent = Math.round(currentZoom * 100) + '%';
  }
  function updateStatus(text) { statusDiv.textContent = text; }

  function updateNavButtons() {
    const tab = getCurrentTab();
    if (tab && tab.web) {
      backBtn.disabled = tab.historyIndex <= 0;
      forwardBtn.disabled = tab.historyIndex >= tab.history.length - 1;
    } else {
      backBtn.disabled = true;
      forwardBtn.disabled = true;
    }
  }

  function showLoading() { loadingDiv.style.display = 'flex'; errorDiv.style.display = 'none'; }
  function hideLoading() { loadingDiv.style.display = 'none'; }

  function showError(url) {
    errorDiv.style.display = 'flex';
    loadingDiv.style.display = 'none';
    updateStatus(`Cannot load: ${url}`);
    updateUrlBar(url);
  }
  function hideError() { errorDiv.style.display = 'none'; }

  function isUrlBlocked(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      return BLOCKED_DOMAINS.some(d => hostname.includes(d));
    } catch { return false; }
  }

  // Zoom
  function applyZoom() {
    const container = webContainer;
    container.style.transform = `scale(${currentZoom})`;
    container.style.transformOrigin = '0 0';
    container.style.width = `${100 / currentZoom}%`;
    container.style.height = `${100 / currentZoom}%`;
  }
  function zoomIn() {
    currentZoom = Math.min(currentZoom + 0.1, 3);
    applyZoom();
    updateUrlBar(urlInput.value);
  }
  function zoomOut() {
    currentZoom = Math.max(currentZoom - 0.1, 0.3);
    applyZoom();
    updateUrlBar(urlInput.value);
  }
  function zoomReset() {
    currentZoom = 0.9;
    applyZoom();
    updateUrlBar(urlInput.value);
  }

  zoomInBtn.addEventListener('click', zoomIn);
  zoomOutBtn.addEventListener('click', zoomOut);
  zoomResetBtn.addEventListener('click', zoomReset);

  // Share & Copy
  shareBtn.addEventListener('click', () => {
    const tab = getCurrentTab();
    if (!tab || !tab.url || tab.url === 'home') return;
    if (navigator.share) {
      navigator.share({ title: tab.title, url: tab.url }).catch(() => {});
    } else {
      copyCurrentUrl();
    }
  });
  copyBtn.addEventListener('click', copyCurrentUrl);
  function copyCurrentUrl() {
    const tab = getCurrentTab();
    if (!tab || !tab.url || tab.url === 'home') return;
    navigator.clipboard.writeText(tab.url).then(() => addNotification('Browser', 'URL copied'));
  }

  // Engine inline
  engineSelect.addEventListener('change', () => {
    browserCurrentSearchEngine = engineSelect.value;
    localStorage.setItem('browser_search_engine', browserCurrentSearchEngine);
  });

  // New Tab button
  newTabBtn.addEventListener('click', () => createTab('home'));

  // ---- Core navigation ----
  function browserNavigateTo(url) {
    if (!url) return;
    if (currentTabId === null) return;
    const tab = getCurrentTab();
    if (!tab) return;
    hideError();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      const engine = browserSearchEngines[browserCurrentSearchEngine] || browserSearchEngines.google;
      url = engine + encodeURIComponent(url);
    }
    if (isUrlBlocked(url)) {
      tab.url = url;
      tab.title = url;
      updateUrlBar(url);
      updateStatus('Blocked by site policy');
      showError(url);
      renderTabs();
      updateNavButtons();
      return;
    }
    if (tab.historyIndex < tab.history.length - 1) {
      tab.history = tab.history.slice(0, tab.historyIndex + 1);
    }
    tab.history.push(url);
    tab.historyIndex = tab.history.length - 1;
    tab.url = url;
    tab.title = url;
    tab.web.src = url;
    showLoading();
    updateUrlBar(url);
    updateStatus('Loading...');
    renderTabs();
    updateNavButtons();
    browserHistory.unshift({ url, title: url, date: new Date().toISOString() });
    if (browserHistory.length > 100) browserHistory.pop();
    localStorage.setItem('browser_history', JSON.stringify(browserHistory));
  }

  window.browserNavigateTo = browserNavigateTo;
  window.browserSearchFromHome = function(query) {
    if (query) browserNavigateTo(query);
  };

  function goBack() {
    const tab = getCurrentTab();
    if (!tab) return;
    if (tab.historyIndex > 0) {
      tab.historyIndex--;
      const url = tab.history[tab.historyIndex];
      tab.url = url;
      tab.web.src = url;
      updateUrlBar(url);
      updateStatus('Loading...');
      showLoading();
      renderTabs();
      updateNavButtons();
    }
  }
  function goForward() {
    const tab = getCurrentTab();
    if (!tab) return;
    if (tab.historyIndex < tab.history.length - 1) {
      tab.historyIndex++;
      const url = tab.history[tab.historyIndex];
      tab.url = url;
      tab.web.src = url;
      updateUrlBar(url);
      updateStatus('Loading...');
      showLoading();
      renderTabs();
      updateNavButtons();
    }
  }
  function refreshTab() {
    const tab = getCurrentTab();
    if (!tab) return;
    if (tab.url === 'home' || !tab.url) { loadHome(); return; }
    tab.web.src = tab.url;
    showLoading();
    updateStatus('Refreshing...');
  }
  function loadHome() {
    const tab = getCurrentTab();
    if (!tab) return;
    tab.url = 'home';
    tab.title = 'Home';
    tab.web.src = 'about:blank';
    tab.web.onload = () => {
      tab.web.contentDocument.write(BROWSER_HOME_HTML);
      tab.web.contentDocument.close();
      updateUrlBar('');
      updateStatus('Home');
      hideLoading();
      hideError();
      renderTabs();
      updateNavButtons();
    };
  }
  function goHome() { loadHome(); }

  // ---- Tab management ----
  function createTab(url) {
    const id = ++browserTabCounter;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%; height:100%; border:none; display:none;';
    iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms allow-downloads';
    iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');

    const tab = { id, web: iframe, url: url || 'home', title: 'New Tab', history: [], historyIndex: -1 };
    webContainer.appendChild(iframe);

    iframe.addEventListener('load', function() {
      hideLoading();
      try {
        if (iframe.contentDocument) {
          const title = iframe.contentDocument.title || iframe.src;
          tab.title = title;
          updateStatus(tab.title);
          try {
            const currentSrc = iframe.contentWindow.location.href;
            if (currentSrc && currentSrc !== tab.url && currentSrc !== 'about:blank') {
              tab.url = currentSrc;
              updateUrlBar(currentSrc);
              if (tab.history[tab.historyIndex] !== currentSrc) {
                tab.history.push(currentSrc);
                tab.historyIndex = tab.history.length - 1;
              }
            }
          } catch (e) {}
        }
      } catch (e) { updateStatus('Loaded'); }
      renderTabs();
      updateNavButtons();
      const isBookmarked = browserBookmarks.some(b => b.url === tab.url);
      bookmarkBtn.textContent = isBookmarked ? '★' : '☆';
    });

    iframe.addEventListener('error', function() { showError(tab.url); });

    browserTabs.push(tab);
    switchTab(id);

    if (url === 'home' || !url) {
      tab.url = 'home';
      tab.title = 'Home';
      iframe.src = 'about:blank';
      setTimeout(() => {
        try {
          iframe.contentDocument.write(BROWSER_HOME_HTML);
          iframe.contentDocument.close();
          updateUrlBar('');
          updateStatus('Home');
          hideLoading();
          renderTabs();
        } catch(e) {}
      }, 50);
    } else {
      tab.url = url;
      tab.title = url;
      iframe.src = url;
      showLoading();
      updateUrlBar(url);
      updateStatus('Loading...');
      tab.history.push(url);
      tab.historyIndex = 0;
    }

    renderTabs();
    updateNavButtons();
    return id;
  }

  function switchTab(id) {
    if (currentTabId !== null) {
      const old = getTab(currentTabId);
      if (old && old.web) old.web.style.display = 'none';
    }
    currentTabId = id;
    const tab = getTab(id);
    if (tab) {
      tab.web.style.display = 'block';
      updateUrlBar(tab.url === 'home' ? '' : tab.url);
      if (tab.url === 'home') { updateStatus('Home'); hideLoading(); hideError(); } else { hideLoading(); }
      renderTabs();
      updateNavButtons();
    }
  }

  function closeTab(id) {
    if (browserTabs.length <= 1) { addNotification('Browser', 'Cannot close the last tab'); return; }
    const index = browserTabs.findIndex(t => t.id === id);
    if (index === -1) return;
    const tab = browserTabs[index];
    browserClosedTabs.unshift({ url: tab.url, title: tab.title });
    if (browserClosedTabs.length > 10) browserClosedTabs.pop();
    tab.web.remove();
    browserTabs.splice(index, 1);
    if (currentTabId === id) {
      const newIndex = Math.min(index, browserTabs.length - 1);
      switchTab(browserTabs[newIndex].id);
    } else { renderTabs(); }
  }

  function duplicateTab(id) {
    const tab = getTab(id);
    if (!tab) return;
    const newId = createTab(tab.url);
    const newTab = getTab(newId);
    if (newTab && tab.history) {
      newTab.history = [...tab.history];
      newTab.historyIndex = tab.historyIndex;
    }
  }

  function reopenLastTab() {
    if (browserClosedTabs.length === 0) {
      addNotification('Browser', 'No recently closed tabs');
      return;
    }
    const last = browserClosedTabs.shift();
    createTab(last.url);
  }

  function renderTabs() {
    tabBar.innerHTML = '';
    const addBtn = document.createElement('button');
    addBtn.id = 'browserNewTabInline';
    addBtn.style.cssText = 'background:none;border:none;color:var(--text-muted);font-size:20px;cursor:pointer;padding:0 6px;min-width:32px;';
    addBtn.textContent = '+';
    addBtn.addEventListener('click', () => createTab('home'));
    tabBar.appendChild(addBtn);

    browserTabs.forEach(tab => {
      const div = document.createElement('div');
      div.className = 'browser-tab' + (tab.id === currentTabId ? ' active' : '');
      const title = tab.title || 'New Tab';
      div.textContent = title.length > 15 ? title.substring(0, 14) + '…' : title;
      div.title = tab.url || '';
      div.dataset.id = tab.id;
      div.addEventListener('click', (e) => {
        if (e.target === div) switchTab(parseInt(div.dataset.id));
      });
      const close = document.createElement('span');
      close.textContent = '✕';
      close.className = 'browser-tab-close';
      close.addEventListener('click', (e) => {
        e.stopPropagation();
        closeTab(parseInt(div.dataset.id));
      });
      div.appendChild(close);
      tabBar.appendChild(div);
    });

    const activeTab = tabBar.querySelector('.browser-tab.active');
    if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  }

  // Bookmark, History, Tabs Modals
  function toggleBookmark() {
    const tab = getCurrentTab();
    if (!tab || !tab.url || tab.url === 'home') return;
    const url = tab.url;
    const title = tab.title || url;
    const existing = browserBookmarks.findIndex(b => b.url === url);
    if (existing !== -1) { browserBookmarks.splice(existing, 1); addNotification('Browser', 'Bookmark removed'); }
    else { browserBookmarks.push({ url, title, date: new Date().toISOString() }); addNotification('Browser', 'Bookmarked'); }
    localStorage.setItem('browser_bookmarks', JSON.stringify(browserBookmarks));
    const isBookmarked = browserBookmarks.some(b => b.url === url);
    bookmarkBtn.textContent = isBookmarked ? '★' : '☆';
  }

  function showBookmarks() {
    if (browserBookmarks.length === 0) { addNotification('Browser', 'No bookmarks'); return; }
    const html = `
      <div style="padding:16px; max-height:400px; overflow-y:auto;">
        <h3>📚 Bookmarks</h3>
        ${browserBookmarks.map(b => `
          <div class="bookmark-item" style="padding:10px; border-bottom:1px solid var(--border-light); cursor:pointer;" data-url="${b.url}">
            <div style="font-weight:500;">${escapeHtml(b.title || b.url)}</div>
            <div class="text-muted" style="font-size:12px;">${escapeHtml(b.url)}</div>
          </div>
        `).join('')}
        <button class="btn-primary" style="width:auto; margin-top:12px;" onclick="closeToolModal()">Close</button>
      </div>
    `;
    openToolModal('Bookmarks', html);
    document.querySelectorAll('.bookmark-item').forEach(el => {
      el.addEventListener('click', function() {
        closeToolModal();
        browserNavigateTo(this.dataset.url);
      });
    });
  }

  function showHistory() {
    if (browserHistory.length === 0) { addNotification('Browser', 'No history'); return; }
    const recent = browserHistory.slice(0, 20);
    const html = `
      <div style="padding:16px; max-height:400px; overflow-y:auto;">
        <h3>📜 History</h3>
        ${recent.map(h => `
          <div class="history-item" style="padding:10px; border-bottom:1px solid var(--border-light); cursor:pointer;" data-url="${h.url}">
            <div style="font-weight:500;">${escapeHtml(h.title || h.url)}</div>
            <div class="text-muted" style="font-size:12px;">${escapeHtml(h.url)}</div>
          </div>
        `).join('')}
        <button class="btn-primary" style="width:auto; margin-top:12px;" onclick="closeToolModal()">Close</button>
      </div>
    `;
    openToolModal('History', html);
    document.querySelectorAll('.history-item').forEach(el => {
      el.addEventListener('click', function() {
        closeToolModal();
        browserNavigateTo(this.dataset.url);
      });
    });
  }

  function showTabs() {
    if (browserTabs.length === 0) return;
    const html = `
      <div style="padding:16px; max-height:400px; overflow-y:auto;">
        <h3>⊞ Open Tabs (${browserTabs.length})</h3>
        ${browserTabs.map(t => `
          <div class="tab-item" style="padding:10px; border-bottom:1px solid var(--border-light); cursor:pointer;" data-id="${t.id}">
            <div style="font-weight:500;">${escapeHtml(t.title || 'New Tab')}</div>
            <div class="text-muted" style="font-size:12px;">${escapeHtml(t.url || 'Home')}</div>
            <button class="btn-outline" style="margin-left:8px; padding:2px 12px;" data-dup="${t.id}">Duplicate</button>
          </div>
        `).join('')}
        ${browserClosedTabs.length ? `<button class="btn-outline" style="margin-top:12px;" id="reopenTabBtn">↩ Reopen closed tab</button>` : ''}
        <button class="btn-primary" style="width:auto; margin-top:12px;" onclick="closeToolModal()">Close</button>
      </div>
    `;
    openToolModal('Tabs', html);
    document.querySelectorAll('.tab-item').forEach(el => {
      el.addEventListener('click', (e) => {
        if (e.target.tagName === 'BUTTON') return;
        const id = parseInt(el.dataset.id);
        closeToolModal();
        switchTab(id);
      });
    });
    document.querySelectorAll('[data-dup]').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.dup);
        duplicateTab(id);
        closeToolModal();
      });
    });
    const reopenBtn = document.getElementById('reopenTabBtn');
    if (reopenBtn) reopenBtn.addEventListener('click', () => { closeToolModal(); reopenLastTab(); });
  }

  // Settings
  function showSettings() {
    const html = `
      <div style="padding:16px;">
        <h3>⚙ Settings</h3>
        <div style="margin:12px 0;">
          <label style="display:block; margin-bottom:8px; font-weight:500;">Search Engine</label>
          <select id="browserEngineSelect" style="width:100%; padding:10px; border-radius:12px; border:1px solid var(--border-light); background:var(--bg-primary); color:var(--text-primary);">
            <option value="google" ${browserCurrentSearchEngine === 'google' ? 'selected' : ''}>Google</option>
            <option value="duckduckgo" ${browserCurrentSearchEngine === 'duckduckgo' ? 'selected' : ''}>DuckDuckGo</option>
            <option value="wikipedia" ${browserCurrentSearchEngine === 'wikipedia' ? 'selected' : ''}>Wikipedia</option>
            <option value="youtube" ${browserCurrentSearchEngine === 'youtube' ? 'selected' : ''}>YouTube</option>
            <option value="bing" ${browserCurrentSearchEngine === 'bing' ? 'selected' : ''}>Bing</option>
          </select>
        </div>
        <div style="margin:16px 0;">
          <h4 style="margin-bottom:8px;">Clear Browsing Data</h4>
          <button class="btn-outline" style="margin-bottom:6px;" onclick="window.browserClearHistory()">Clear History</button>
          <button class="btn-outline" style="margin-bottom:6px;" onclick="window.browserClearBookmarks()">Clear Bookmarks</button>
          <button class="btn-outline" style="margin-bottom:6px;" onclick="window.browserClearAll()">Clear All Data</button>
        </div>
        <button class="btn-primary" style="width:auto; margin-top:8px;" onclick="closeToolModal()">Close</button>
      </div>
    `;
    openToolModal('Settings', html);
  }

  // Clear data functions
  window.browserClearHistory = () => {
    browserHistory = [];
    localStorage.removeItem('browser_history');
    addNotification('Browser', 'History cleared');
    closeToolModal();
  };
  window.browserClearBookmarks = () => {
    browserBookmarks = [];
    localStorage.removeItem('browser_bookmarks');
    addNotification('Browser', 'Bookmarks cleared');
    closeToolModal();
  };
  window.browserClearAll = () => {
    browserHistory = [];
    browserBookmarks = [];
    localStorage.removeItem('browser_history');
    localStorage.removeItem('browser_bookmarks');
    addNotification('Browser', 'All browsing data cleared');
    closeToolModal();
  };

  // ---- Event listeners ----
  goBtn.addEventListener('click', () => { const val = urlInput.value.trim(); if (val) browserNavigateTo(val); });
  urlInput.addEventListener('keypress', e => { if (e.key === 'Enter') { const val = urlInput.value.trim(); if (val) browserNavigateTo(val); } });
  backBtn.addEventListener('click', goBack);
  forwardBtn.addEventListener('click', goForward);
  refreshBtn.addEventListener('click', refreshTab);
  homeBtn.addEventListener('click', goHome);
  bookmarkBtn.addEventListener('click', toggleBookmark);
  tabsBtn.addEventListener('click', showTabs);
  settingsBtn.addEventListener('click', showSettings);

  closeBtn.addEventListener('click', () => {
    overlay.remove();
    browserIsOpen = false;
    browserTabs = [];
    browserCurrentTabId = null;
  });

  openExternalBtn.addEventListener('click', () => {
    const tab = getCurrentTab();
    if (tab && tab.url && tab.url !== 'home') window.open(tab.url, '_blank');
  });
  goBackBtn.addEventListener('click', goBack);

  let loadTimeout;
  function setupTimeout() {
    clearTimeout(loadTimeout);
    loadTimeout = setTimeout(() => {
      if (loadingDiv.style.display !== 'none') {
        const tab = getCurrentTab();
        if (tab && tab.url && tab.url !== 'home') showError(tab.url);
      }
    }, 15000);
  }
  const origShowLoading = showLoading;
  showLoading = function() {
    origShowLoading();
    setupTimeout();
  };

  // Init
  if (initialUrl) createTab(initialUrl);
  else createTab('home');

  // Keyboard shortcut for reopen closed tab (Ctrl+Shift+T)
  document.addEventListener('keydown', function(e) {
    if (e.ctrlKey && e.shiftKey && e.key === 'T') {
      e.preventDefault();
      reopenLastTab();
    }
  });
}