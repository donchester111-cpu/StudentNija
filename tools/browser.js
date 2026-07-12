import { openToolModal, closeToolModal } from './modal.js';
import { addNotification, escapeHtml } from '../state.js';

let browserTabs = [];
let browserCurrentTabId = null;
let browserBookmarks = JSON.parse(localStorage.getItem('browser_bookmarks') || '[]');
let browserHistory = JSON.parse(localStorage.getItem('browser_history') || '[]');
let browserTabCounter = 0;
let browserIsOpen = false;
let browserCurrentSearchEngine = 'google';

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
          <button id="browserBookmark" title="Bookmark">☆</button>
          <button id="browserTabs" title="Tabs">⊞</button>
          <button id="browserSettings" title="Settings">⚙</button>
          <button id="browserClose" title="Close">✕</button>
        </div>
      </div>
      <div class="browser-tab-bar" id="browserTabBar"></div>
      <div class="browser-frame" id="browserFrame">
        <div id="browserLoading" class="browser-loading" style="display:none;">
          <div class="spinner"></div>
          <span>Loading...</span>
        </div>
        <div id="browserError" style="display:none; flex-direction:column; align-items:center; justify-content:center; height:100%; padding:20px; text-align:center; background:var(--bg-primary);">
          <div style="font-size:48px; margin-bottom:16px;">🌐</div>
          <h3 style="margin-bottom:8px; color:var(--text-primary);">Cannot display this page</h3>
          <p class="text-muted" style="max-width:400px; margin-bottom:16px;">This site prevents being loaded inside an app. Tap the button below to open it in your browser.</p>
          <button id="browserOpenExternal" class="btn-primary" style="width:auto; padding:12px 32px;">Open in Browser</button>
          <button id="browserGoBackBtn" class="btn-outline" style="width:auto; padding:12px 32px; margin-top:8px;">Go Back</button>
        </div>
        <div id="browserWebContainer" style="width:100%; height:100%; position:relative;"></div>
      </div>
      <div class="browser-status" id="browserStatus">Ready</div>
    </div>
  `;

  document.body.appendChild(overlay);

  const webContainer = document.getElementById('browserWebContainer');
  const urlInput = document.getElementById('browserUrl');
  const goBtn = document.getElementById('browserGo');
  const backBtn = document.getElementById('browserBack');
  const forwardBtn = document.getElementById('browserForward');
  const refreshBtn = document.getElementById('browserRefresh');
  const homeBtn = document.getElementById('browserHome');
  const bookmarkBtn = document.getElementById('browserBookmark');
  const tabsBtn = document.getElementById('browserTabs');
  const settingsBtn = document.getElementById('browserSettings');
  const closeBtn = document.getElementById('browserClose');
  const statusDiv = document.getElementById('browserStatus');
  const loadingDiv = document.getElementById('browserLoading');
  const errorDiv = document.getElementById('browserError');
  const openExternalBtn = document.getElementById('browserOpenExternal');
  const goBackBtn = document.getElementById('browserGoBackBtn');
  const tabBar = document.getElementById('browserTabBar');

  let currentTabId = null;
  let isError = false;

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
  }
  function updateStatus(text) { statusDiv.textContent = text; }
  function updateNavButtons() {
    const tab = getCurrentTab();
    if (tab && tab.web) {
      const canGoBack = tab.historyIndex > 0;
      const canGoForward = tab.historyIndex < tab.history.length - 1;
      backBtn.disabled = !canGoBack;
      forwardBtn.disabled = !canGoForward;
    } else {
      backBtn.disabled = true;
      forwardBtn.disabled = true;
    }
  }
  function showLoading() { loadingDiv.style.display = 'flex'; errorDiv.style.display = 'none'; }
  function hideLoading() { loadingDiv.style.display = 'none'; }
  function showError(url) {
    isError = true;
    errorDiv.style.display = 'flex';
    loadingDiv.style.display = 'none';
    updateStatus(`Cannot load: ${url}`);
    updateUrlBar(url);
  }
  function hideError() { isError = false; errorDiv.style.display = 'none'; }
  function isUrlBlocked(url) {
    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.replace('www.', '');
      return BLOCKED_DOMAINS.some(d => hostname.includes(d));
    } catch { return false; }
  }

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
    tab.web.contentDocument.write(BROWSER_HOME_HTML);
    tab.web.contentDocument.close();
    updateUrlBar('');
    updateStatus('Home');
    hideLoading();
    hideError();
    renderTabs();
    updateNavButtons();
  }
  function goHome() { loadHome(); }

  function createTab(url) {
    const id = ++browserTabCounter;
    const iframe = document.createElement('iframe');
    iframe.style.cssText = 'width:100%; height:100%; border:none; display:none;';
    iframe.sandbox = 'allow-scripts allow-same-origin allow-popups allow-forms';
    iframe.setAttribute('allow', 'autoplay; encrypted-media; fullscreen');

    const tab = { id, web: iframe, url: url || 'home', title: 'New Tab', history: [], historyIndex: -1 };
    webContainer.appendChild(iframe);

    iframe.addEventListener('load', function() {
      hideLoading();
      try {
        if (iframe.contentDocument) {
          const title = iframe.contentDocument.title || iframe.src;
          tab.title = title;
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
          updateStatus(tab.title);
          const isBookmarked = browserBookmarks.some(b => b.url === tab.url);
          bookmarkBtn.textContent = isBookmarked ? '★' : '☆';
        }
      } catch (e) { updateStatus('Loaded'); }
      renderTabs();
      updateNavButtons();
      try {
        if (iframe.contentDocument && iframe.contentDocument.title &&
            iframe.contentDocument.title.includes('error')) {
          showError(tab.url);
        }
      } catch(e) {}
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
      updateUrlBar(tab.url);
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
    tab.web.remove();
    browserTabs.splice(index, 1);
    if (currentTabId === id) {
      const newIndex = Math.min(index, browserTabs.length - 1);
      switchTab(browserTabs[newIndex].id);
    } else { renderTabs(); }
  }

  function renderTabs() {
    tabBar.innerHTML = '';
    browserTabs.forEach(tab => {
      const div = document.createElement('div');
      div.className = 'browser-tab' + (tab.id === currentTabId ? ' active' : '');
      const title = tab.title || 'New Tab';
      div.textContent = title.length > 15 ? title.substring(0, 14) + '…' : title;
      div.title = tab.url || '';
      div.dataset.id = tab.id;
      div.addEventListener('click', function(e) {
        if (e.target === this || e.target === div) {
          switchTab(parseInt(this.dataset.id));
        }
      });
      const close = document.createElement('span');
      close.textContent = '✕';
      close.className = 'browser-tab-close';
      close.addEventListener('click', function(e) {
        e.stopPropagation();
        closeTab(parseInt(this.parentNode.dataset.id));
      });
      div.appendChild(close);
      tabBar.appendChild(div);
    });
    const activeTab = tabBar.querySelector('.browser-tab.active');
    if (activeTab) activeTab.scrollIntoView({ behavior: 'smooth', inline: 'center' });
  }

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
        ${browserBookmarks.map((b, i) => `
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
        const url = this.dataset.url;
        closeToolModal();
        browserNavigateTo(url);
      });
    });
  }

  function showHistory() {
    if (browserHistory.length === 0) { addNotification('Browser', 'No history'); return; }
    const recent = browserHistory.slice(0, 20);
    const html = `
      <div style="padding:16px; max-height:400px; overflow-y:auto;">
        <h3>📜 History (last 20)</h3>
        ${recent.map((h, i) => `
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
        const url = this.dataset.url;
        closeToolModal();
        browserNavigateTo(url);
      });
    });
  }

  function showTabs() {
    if (browserTabs.length === 0) return;
    const html = `
      <div style="padding:16px; max-height:400px; overflow-y:auto;">
        <h3>⊞ Open Tabs (${browserTabs.length})</h3>
        ${browserTabs.map((t, i) => `
          <div class="tab-item" style="padding:10px; border-bottom:1px solid var(--border-light); cursor:pointer;" data-id="${t.id}">
            <div style="font-weight:500;">${escapeHtml(t.title || 'New Tab')}</div>
            <div class="text-muted" style="font-size:12px;">${escapeHtml(t.url || 'Home')}</div>
          </div>
        `).join('')}
        <button class="btn-primary" style="width:auto; margin-top:12px;" onclick="closeToolModal()">Close</button>
      </div>
    `;
    openToolModal('Tabs', html);
    document.querySelectorAll('.tab-item').forEach(el => {
      el.addEventListener('click', function() {
        const id = parseInt(this.dataset.id);
        closeToolModal();
        switchTab(id);
      });
    });
  }

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
        <div style="display:flex; gap:12px; flex-wrap:wrap;">
          <button class="btn-primary" style="width:auto; padding:10px 24px;" onclick="document.getElementById('browserEngineSelect') && (browserCurrentSearchEngine = document.getElementById('browserEngineSelect').value); localStorage.setItem('browser_search_engine', browserCurrentSearchEngine); closeToolModal(); addNotification('Browser', 'Search engine updated');">Save</button>
          <button class="btn-outline" style="width:auto; padding:10px 24px;" onclick="closeToolModal()">Cancel</button>
        </div>
      </div>
    `;
    openToolModal('Settings', html);
    const saved = localStorage.getItem('browser_search_engine');
    if (saved) browserCurrentSearchEngine = saved;
  }

  goBtn.addEventListener('click', function() {
    const val = urlInput.value.trim();
    if (val) browserNavigateTo(val);
  });
  urlInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      const val = urlInput.value.trim();
      if (val) browserNavigateTo(val);
    }
  });
  backBtn.addEventListener('click', goBack);
  forwardBtn.addEventListener('click', goForward);
  refreshBtn.addEventListener('click', refreshTab);
  homeBtn.addEventListener('click', goHome);
  bookmarkBtn.addEventListener('click', toggleBookmark);
  tabsBtn.addEventListener('click', showTabs);
  settingsBtn.addEventListener('click', showSettings);
  closeBtn.addEventListener('click', function() {
    overlay.remove();
    browserIsOpen = false;
    browserTabs = [];
    browserCurrentTabId = null;
  });
  openExternalBtn.addEventListener('click', function() {
    const tab = getCurrentTab();
    if (tab && tab.url && tab.url !== 'home') {
      window.open(tab.url, '_blank');
    }
  });
  goBackBtn.addEventListener('click', goBack);

  let loadTimeout;
  function setupTimeout() {
    clearTimeout(loadTimeout);
    loadTimeout = setTimeout(function() {
      if (loadingDiv.style.display !== 'none') {
        const tab = getCurrentTab();
        if (tab && tab.url && tab.url !== 'home') showError(tab.url);
      }
    }, 15000);
  }
  const originalShowLoading = showLoading;
  showLoading = function() {
    originalShowLoading();
    setupTimeout();
  };

  if (initialUrl) createTab(initialUrl);
  else createTab('home');

  const savedEngine = localStorage.getItem('browser_search_engine');
  if (savedEngine) browserCurrentSearchEngine = savedEngine;
}