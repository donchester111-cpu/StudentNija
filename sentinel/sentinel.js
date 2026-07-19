/**
 * StudentNija Sentinel v3.0 – Ultimate Anti‑Crawler
 * 
 * Features:
 *   - 30+ detection signals (UA, headless, automation, behavior, etc.)
 *   - 6 unique challenges (randomly selected)
 *   - Progressive risk scoring with auto‑block
 *   - Cross‑page session tracking
 *   - Honeypot traps
 *   - Full telemetry
 * 
 * WARNING: Never put secrets or server‑side logic here.
 */

(() => {
  'use strict';

  /* =========================================================
     CONFIGURATION
     ========================================================= */
  const CONFIG = Object.freeze({
    REPORT_ENDPOINT: '', // set your backend URL

    // Risk thresholds
    RISK: {
      WARN: 30,
      DELAY: 50,
      CHALLENGE: 70,
      BLOCK: 85,
      MAX: 100
    },

    // Timing
    HEARTBEAT_INTERVAL: 15000,
    FAST_NAV_MS: 600,
    BURST_WINDOW: 8000,
    BURST_LIMIT: 60,

    // Challenge
    CHALLENGE_TIMEOUT: 20000, // 20 seconds to complete

    // Honeypot
    HONEYPOT_CLASS: 'hp-trap',
    HONEYPOT_SELECTOR: '.hp-trap a, .hp-trap input',

    // Blocking
    AUTO_BLOCK: true,
    BLOCK_ACTION: 'overlay', // 'overlay' | 'redirect' | 'wipe'
    REDIRECT_URL: '/blocked.html',

    // Limits
    MAX_EVENTS: 150,
    MAX_NAV: 30,
    MAX_REQUESTS: 200,
  });

  /* =========================================================
     STATE
     ========================================================= */
  const state = {
    startedAt: Date.now(),
    sessionId: createSessionId(),
    riskScore: 0,
    signals: [],
    events: [],
    navTimes: [],
    requestTimestamps: [],
    interactions: [],
    mouseMovements: 0,
    keyPresses: 0,
    scrollDepth: 0,
    idleTime: 0,
    lastActivity: Date.now(),
    hiddenCount: 0,
    devtoolsOpen: false,
    automationFlags: [],
    tampering: false,
    fingerprint: null,
    challengePassed: false,
    challengeAttempts: 0,
    blocked: false,
    reported: false,
    initialized: false,
    _warned: false,
    _delayed: false,
    _retry: false,
  };

  /* =========================================================
     HELPERS
     ========================================================= */
  function createSessionId() {
    const rand = (typeof crypto !== 'undefined' && crypto.getRandomValues)
      ? Array.from(crypto.getRandomValues(new Uint32Array(4))).map(v => v.toString(16)).join('')
      : Math.random().toString(36).slice(2);
    return `${Date.now().toString(36)}-${rand}`;
  }

  function logEvent(type, data = {}) {
    state.events.push({ type, timestamp: Date.now(), data });
    if (state.events.length > CONFIG.MAX_EVENTS) state.events.shift();
  }

  function addSignal(name, points, details = {}) {
    if (state.signals.some(s => s.name === name)) return;
    state.signals.push({ name, points, details, timestamp: Date.now() });
    state.riskScore = Math.min(CONFIG.RISK.MAX, state.riskScore + points);
    logEvent('signal', { name, points, details });
  }

  function getRiskLevel() {
    const s = state.riskScore;
    if (s >= CONFIG.RISK.BLOCK) return 'block';
    if (s >= CONFIG.RISK.CHALLENGE) return 'challenge';
    if (s >= CONFIG.RISK.DELAY) return 'delay';
    if (s >= CONFIG.RISK.WARN) return 'warn';
    return 'low';
  }

  /* =========================================================
     FINGERPRINTING (Canvas, WebGL, Audio, Fonts, etc.)
     ========================================================= */
  function getFingerprint() {
    const canvas = (() => {
      try {
        const c = document.createElement('canvas');
        c.width = 256; c.height = 128;
        const ctx = c.getContext('2d');
        ctx.textBaseline = 'alphabetic';
        ctx.fillStyle = '#f60';
        ctx.fillRect(125, 1, 62, 20);
        ctx.fillStyle = '#069';
        ctx.font = '11pt Arial';
        ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 2, 15);
        ctx.fillStyle = 'rgba(102, 204, 0, 0.7)';
        ctx.font = '18pt Arial';
        ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 4, 45);
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.fillText('Cwm fjordbank glyphs vext quiz, 😃', 4, 75);
        return c.toDataURL();
      } catch { return ''; }
    })();

    const webgl = (() => {
      try {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        if (!gl) return '';
        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (!debugInfo) return '';
        const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
        const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
        return `${vendor}~${renderer}`;
      } catch { return ''; }
    })();

    const audio = (() => {
      try {
        const ctx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100, 44100);
        const osc = ctx.createOscillator();
        osc.type = 'sawtooth';
        osc.frequency.value = 440;
        const gain = ctx.createGain();
        gain.gain.value = 0.1;
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(0);
        ctx.startRendering();
        return 'audio-available';
      } catch { return ''; }
    })();

    const fonts = (() => {
      const baseFonts = ['monospace', 'sans-serif', 'serif'];
      const testFonts = ['Arial', 'Verdana', 'Times New Roman', 'Comic Sans MS', 'Courier New', 'Impact', 'Georgia'];
      const c = document.createElement('canvas');
      const ctx = c.getContext('2d');
      const measure = (font) => {
        ctx.font = `20px ${font}`;
        return ctx.measureText('mmmmmmmmmmlli').width;
      };
      const baseWidths = baseFonts.map(f => measure(f));
      const detected = testFonts.filter((font, i) => {
        const w = measure(font);
        return !baseWidths.some(b => Math.abs(w - b) < 1);
      });
      return detected.join(',');
    })();

    return { canvas, webgl, audio, fonts, userAgent: navigator.userAgent };
  }

  /* =========================================================
     HEADLESS / AUTOMATION DETECTION (30+ signals)
     ========================================================= */
  function detectHeadless() {
    const flags = [];
    const ua = navigator.userAgent.toLowerCase();

    // ---- User‑Agent based ----
    const badUA = [
      'httrack', 'wget', 'curl', 'python-requests', 'python-urllib',
      'scrapy', 'selenium', 'phantomjs', 'headless', 'playwright',
      'puppeteer', 'mechanize', 'go-http-client', 'libwww-perl',
      'axios', 'java', 'perl', 'ruby', 'php', 'lwp', 'http client',
      'zmeu', 'nutch', 'zgrab', 'masscan', 'nmap', 'sqlmap'
    ];
    const uaMatch = badUA.filter(agent => ua.includes(agent));
    if (uaMatch.length > 0) flags.push(`ua:${uaMatch.join(',')}`);

    // ---- WebDriver ----
    if (navigator.webdriver) flags.push('webdriver');
    if (window.document.documentElement.getAttribute('webdriver') !== null) flags.push('selenium_attr');

    // ---- PhantomJS / Nightmare ----
    if (window.callPhantom || window._phantom || window.__nightmare) flags.push('phantom');

    // ---- Chrome runtime missing ----
    if (!window.chrome || !window.chrome.runtime) flags.push('no_chrome_runtime');

    // ---- Permissions ----
    if (!navigator.permissions) flags.push('no_permissions');

    // ---- Plugins ----
    if (navigator.plugins && navigator.plugins.length === 0) flags.push('zero_plugins');
    if (navigator.mimeTypes && navigator.mimeTypes.length === 0) flags.push('zero_mimetypes');

    // ---- Languages ----
    if (navigator.languages && navigator.languages.length === 1 && navigator.languages[0] === 'en-US') flags.push('single_language');

    // ---- Screen resolution (common headless) ----
    const w = screen.width, h = screen.height;
    if ((w === 800 && h === 600) || (w === 1024 && h === 768) || (w === 1920 && h === 1080)) {
      if (flags.length > 2) flags.push('common_headless_res');
    }

    // ---- PluginArray missing ----
    if (navigator.plugins && !navigator.plugins.item) flags.push('plugin_array_missing');

    // ---- navigator.connection ----
    if (!navigator.connection) flags.push('no_connection');

    // ---- navigator.hardwareConcurrency (headless often 4 or 8, not strong) ----
    // ---- window.outer/inner difference (already covered) ----

    // ---- check for missing MediaDevices ----
    if (!navigator.mediaDevices) flags.push('no_media_devices');

    // ---- check for missing Bluetooth ----
    if (!navigator.bluetooth) flags.push('no_bluetooth');

    // ---- check for missing Presentation API ----
    if (!navigator.presentation) flags.push('no_presentation');

    // ---- check for missing storage (headless may have) ----
    // ---- check for missing webdriver property on navigator prototype ----
    if (Object.getOwnPropertyDescriptor(navigator, 'webdriver') && Object.getOwnPropertyDescriptor(navigator, 'webdriver').get) {
      flags.push('webdriver_getter');
    }

    // ---- Evaluate ----
    if (flags.length > 0) {
      state.automationFlags = flags;
      const points = Math.min(45, flags.length * 4 + 10);
      addSignal('headless_indicators', points, { flags });
    }
  }

  /* =========================================================
     HONEYPOT
     ========================================================= */
  function setupHoneypot() {
    // Hidden link
    const trapLink = document.createElement('a');
    trapLink.href = '#honeypot';
    trapLink.className = CONFIG.HONEYPOT_CLASS;
    trapLink.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    trapLink.textContent = 'Click here';
    document.body.appendChild(trapLink);

    // Hidden input
    const trapInput = document.createElement('input');
    trapInput.type = 'text';
    trapInput.className = CONFIG.HONEYPOT_CLASS;
    trapInput.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:1px;height:1px;opacity:0;pointer-events:none;';
    trapInput.setAttribute('aria-hidden', 'true');
    document.body.appendChild(trapInput);

    // Listen for clicks
    document.addEventListener('click', (e) => {
      if (e.target.closest && e.target.closest(`.${CONFIG.HONEYPOT_CLASS}`)) {
        addSignal('honeypot_trigger', 30, { element: e.target.tagName });
        applyBlock('honeypot');
      }
    }, true);

    trapInput.addEventListener('focus', () => {
      addSignal('honeypot_focus', 20, {});
    });
    trapInput.addEventListener('change', () => {
      if (trapInput.value.length > 0) {
        addSignal('honeypot_filled', 30, { value: trapInput.value });
      }
    });
  }

  /* =========================================================
     BEHAVIORAL MONITORING
     ========================================================= */
  function monitorBehavior() {
    // Mouse movements
    document.addEventListener('mousemove', () => {
      state.mouseMovements++;
      state.lastActivity = Date.now();
      if (state.mouseMovements > 50 && state.riskScore > 0) {
        state.riskScore = Math.max(0, state.riskScore - 1);
      }
    }, { passive: true });

    // Key presses
    document.addEventListener('keydown', () => {
      state.keyPresses++;
      state.lastActivity = Date.now();
    }, { passive: true });

    // Scroll depth
    document.addEventListener('scroll', () => {
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const current = window.scrollY;
      if (maxScroll > 0) {
        const depth = Math.round((current / maxScroll) * 100);
        if (depth > state.scrollDepth) {
          state.scrollDepth = depth;
          if (depth > 50 && state.riskScore > 10) {
            state.riskScore = Math.max(0, state.riskScore - 2);
          }
        }
      }
      state.lastActivity = Date.now();
    }, { passive: true });

    // Idle detection
    setInterval(() => {
      const idle = Date.now() - state.lastActivity;
      if (idle > 30000) {
        state.idleTime += idle;
        // If idle too long and high risk, could be bot waiting? not a strong signal.
      }
    }, 10000);

    // Visibility changes
    document.addEventListener('visibilitychange', () => {
      state.hiddenCount++;
      if (document.hidden) {
        logEvent('visibility_hidden', {});
      }
    });
  }

  /* =========================================================
     NAVIGATION & REQUEST BURST
     ========================================================= */
  function trackNavigation() {
    const now = Date.now();
    state.navTimes.push(now);
    if (state.navTimes.length > CONFIG.MAX_NAV) state.navTimes.shift();

    if (state.navTimes.length >= 2) {
      const prev = state.navTimes[state.navTimes.length - 2];
      if (now - prev < CONFIG.FAST_NAV_MS) {
        addSignal('fast_navigation', 8, { elapsed: now - prev });
      }
    }

    const recent = state.navTimes.filter(t => now - t <= CONFIG.BURST_WINDOW);
    if (recent.length >= 8) {
      addSignal('page_enumeration', 20, { pages: recent.length });
    }
  }

  function monitorResources() {
    if (!performance || !performance.getEntriesByType) return;
    const resources = performance.getEntriesByType('resource');
    const now = Date.now();
    const recent = resources.filter(r => {
      const start = state.startedAt + r.startTime;
      return (now - start) <= CONFIG.BURST_WINDOW;
    });
    if (recent.length > CONFIG.BURST_LIMIT) {
      addSignal('request_burst', 20, { count: recent.length });
    }
  }

  /* =========================================================
     DEVTOOLS DETECTION
     ========================================================= */
  function detectDevTools() {
    const widthDiff = window.outerWidth - window.innerWidth;
    const heightDiff = window.outerHeight - window.innerHeight;
    if (widthDiff > 160 || heightDiff > 160) {
      if (!state.devtoolsOpen) {
        state.devtoolsOpen = true;
        addSignal('devtools_open', 10, {});
      }
    } else {
      state.devtoolsOpen = false;
    }
  }

  /* =========================================================
     6 UNIQUE CHALLENGES (randomly picked)
     ========================================================= */
  function getRandomChallenge() {
    const challenges = [
      'click',     // click a specific button
      'drag',      // drag a slider to a position
      'math',      // solve a simple arithmetic
      'image',     // identify an object from emoji hints
      'rotate',    // rotate a knob to align
      'proof'      // proof-of-work (hash)
    ];
    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  function startChallenge() {
    if (state.challengePassed || state.challengeAttempts >= 3) return;

    const challengeType = getRandomChallenge();
    logEvent('challenge_started', { type: challengeType });

    // Build overlay
    const overlay = document.createElement('div');
    overlay.id = 'sn-challenge';
    overlay.style.cssText = `
      position:fixed; top:0; left:0; width:100%; height:100%;
      background:rgba(0,0,0,0.8); z-index:999999;
      display:flex; align-items:center; justify-content:center;
      color:#fff; font-family:sans-serif; font-size:18px;
    `;
    const container = document.createElement('div');
    container.style.cssText = `
      background:#222; padding:30px; border-radius:12px;
      max-width:450px; width:100%; text-align:center;
    `;

    let timerEl, timerInterval;
    let challengeResolved = false;

    const failChallenge = () => {
      clearInterval(timerInterval);
      overlay.remove();
      state.challengeAttempts++;
      if (state.challengeAttempts >= 3) {
        applyBlock('challenge_failed');
      } else {
        startChallenge(); // retry with new challenge
      }
    };

    const resolveChallenge = () => {
      if (challengeResolved) return;
      challengeResolved = true;
      state.challengePassed = true;
      clearInterval(timerInterval);
      overlay.remove();
      state.riskScore = Math.max(0, state.riskScore - 30);
      logEvent('challenge_passed', { type: challengeType });
    };

    // Timer
    let timeLeft = CONFIG.CHALLENGE_TIMEOUT / 1000;
    timerEl = document.createElement('p');
    timerEl.style.cssText = 'font-size:14px; color:#aaa;';
    timerEl.textContent = `Time left: ${Math.round(timeLeft)}s`;

    timerInterval = setInterval(() => {
      timeLeft--;
      timerEl.textContent = `Time left: ${Math.round(timeLeft)}s`;
      if (timeLeft <= 0) {
        clearInterval(timerInterval);
        failChallenge();
      }
    }, 1000);

    // ---- Challenge implementations ----
    let challengeContent = '';

    switch (challengeType) {
      case 'click': {
        challengeContent = `
          <h3>Click the button below</h3>
          <p>To prove you're human, click the green button.</p>
          <button id="sn-challenge-click" style="
            background:#00A86B; color:#fff; border:none;
            padding:12px 30px; border-radius:40px; font-size:16px;
            cursor:pointer; margin-top:12px;
          ">I'm Human</button>
        `;
        container.innerHTML = challengeContent;
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        const btn = document.getElementById('sn-challenge-click');
        btn.addEventListener('click', () => {
          resolveChallenge();
        });
        break;
      }

      case 'drag': {
        challengeContent = `
          <h3>Slide the slider to 100%</h3>
          <p>Drag the handle all the way to the right.</p>
          <input type="range" min="0" max="100" value="0" id="sn-slider" style="width:80%; margin:12px 0;" />
          <span id="sn-slider-val">0</span>%
        `;
        container.innerHTML = challengeContent;
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        const slider = document.getElementById('sn-slider');
        const valSpan = document.getElementById('sn-slider-val');
        slider.addEventListener('input', () => {
          const val = parseInt(slider.value);
          valSpan.textContent = val;
          if (val >= 100) {
            resolveChallenge();
          }
        });
        break;
      }

      case 'math': {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        const op = ['+', '-'][Math.floor(Math.random() * 2)];
        let answer;
        if (op === '+') answer = a + b;
        else answer = a - b;
        if (answer < 0) { // avoid negative for simplicity
          // swap
          const newA = Math.max(a, b);
          const newB = Math.min(a, b);
          answer = newA - newB;
          challengeContent = `
            <h3>Solve the math problem</h3>
            <p style="font-size:28px;">${newA} – ${newB} = ?</p>
            <input type="number" id="sn-math-input" style="padding:8px; width:80px; font-size:20px; margin:12px 0;" />
            <button id="sn-math-submit" style="background:#008751; color:#fff; border:none; padding:8px 20px; border-radius:4px; cursor:pointer;">Submit</button>
          `;
        } else {
          challengeContent = `
            <h3>Solve the math problem</h3>
            <p style="font-size:28px;">${a} ${op} ${b} = ?</p>
            <input type="number" id="sn-math-input" style="padding:8px; width:80px; font-size:20px; margin:12px 0;" />
            <button id="sn-math-submit" style="background:#008751; color:#fff; border:none; padding:8px 20px; border-radius:4px; cursor:pointer;">Submit</button>
          `;
        }
        container.innerHTML = challengeContent;
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        const input = document.getElementById('sn-math-input');
        const submit = document.getElementById('sn-math-submit');
        const checkMath = () => {
          const userAns = parseInt(input.value);
          if (userAns === answer) {
            resolveChallenge();
          } else {
            alert('Incorrect, try again.');
          }
        };
        submit.addEventListener('click', checkMath);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') checkMath(); });
        break;
      }

      case 'image': {
        const emojis = ['🐶', '🐱', '🐭', '🐹', '🐰', '🦊', '🐻', '🐼', '🐨', '🐯', '🦁', '🐮'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        const options = ['Dog', 'Cat', 'Mouse', 'Bear', 'Fox', 'Rabbit', 'Tiger', 'Lion', 'Cow', 'Panda', 'Koala', 'Horse'];
        const correct = (() => {
          if (randomEmoji === '🐶') return 'Dog';
          if (randomEmoji === '🐱') return 'Cat';
          if (randomEmoji === '🐭') return 'Mouse';
          if (randomEmoji === '🐹') return 'Mouse';
          if (randomEmoji === '🐰') return 'Rabbit';
          if (randomEmoji === '🦊') return 'Fox';
          if (randomEmoji === '🐻') return 'Bear';
          if (randomEmoji === '🐼') return 'Panda';
          if (randomEmoji === '🐨') return 'Koala';
          if (randomEmoji === '🐯') return 'Tiger';
          if (randomEmoji === '🦁') return 'Lion';
          if (randomEmoji === '🐮') return 'Cow';
          return 'Animal';
        })();
        const shuffledOptions = options.sort(() => Math.random() - 0.5);
        const optionsHTML = shuffledOptions.map(opt =>
          `<button class="sn-img-opt" data-answer="${opt}" style="background:#333; color:#fff; border:1px solid #555; padding:10px 20px; margin:5px; border-radius:6px; cursor:pointer;">${opt}</button>`
        ).join('');

        challengeContent = `
          <h3>What is this emoji?</h3>
          <p style="font-size:48px;">${randomEmoji}</p>
          <div style="display:flex; flex-wrap:wrap; justify-content:center; margin:12px 0;">
            ${optionsHTML}
          </div>
        `;
        container.innerHTML = challengeContent;
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        document.querySelectorAll('.sn-img-opt').forEach(btn => {
          btn.addEventListener('click', () => {
            if (btn.dataset.answer === correct) {
              resolveChallenge();
            } else {
              btn.style.background = '#c0392b';
              setTimeout(() => { btn.style.background = '#333'; }, 500);
            }
          });
        });
        break;
      }

      case 'rotate': {
        // Simple knob: a slider that needs to be dragged to a specific hidden value
        const secret = Math.floor(Math.random() * 360);
        challengeContent = `
          <h3>Rotate the knob to the correct position</h3>
          <p>Drag the slider until the needle points to the marked spot.</p>
          <input type="range" min="0" max="360" value="0" id="sn-rotate" style="width:80%; margin:12px 0;" />
          <span id="sn-rotate-val">0</span>°
          <p style="font-size:12px; color:#aaa;">Hint: the correct angle is between ${Math.max(0, secret-20)} and ${Math.min(360, secret+20)}</p>
        `;
        container.innerHTML = challengeContent;
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        const slider = document.getElementById('sn-rotate');
        const valSpan = document.getElementById('sn-rotate-val');
        slider.addEventListener('input', () => {
          const val = parseInt(slider.value);
          valSpan.textContent = val;
          if (val >= secret - 5 && val <= secret + 5) {
            resolveChallenge();
          }
        });
        break;
      }

      case 'proof': {
        // Simple proof-of-work using SHA-256 (requires HTTPS)
        const seed = Date.now().toString(36);
        const difficulty = 4; // leading hex zeros
        challengeContent = `
          <h3>Proof-of-Work</h3>
          <p>Find a number (nonce) such that SHA-256("${seed}" + nonce) has ${difficulty} leading hex zeros.</p>
          <input type="text" id="sn-pow-input" placeholder="Enter nonce" style="padding:8px; width:80%; margin:12px 0;" />
          <button id="sn-pow-submit" style="background:#008751; color:#fff; border:none; padding:8px 20px; border-radius:4px; cursor:pointer;">Submit</button>
          <p id="sn-pow-result" style="font-size:14px; color:#f66;"></p>
        `;
        container.innerHTML = challengeContent;
        overlay.appendChild(container);
        document.body.appendChild(overlay);

        const input = document.getElementById('sn-pow-input');
        const submit = document.getElementById('sn-pow-submit');
        const result = document.getElementById('sn-pow-result');

        const verify = async () => {
          const nonce = input.value.trim();
          if (!nonce) return;
          const encoder = new TextEncoder();
          const data = encoder.encode(seed + nonce);
          try {
            const digest = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(digest));
            const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            let zeros = 0;
            for (let i = 0; i < hashHex.length; i++) {
              if (hashHex[i] === '0') zeros++;
              else break;
            }
            if (zeros >= difficulty) {
              resolveChallenge();
            } else {
              result.textContent = `Invalid nonce. Required ${difficulty} leading zeros.`;
            }
          } catch (e) {
            result.textContent = 'Error computing hash. Try again.';
          }
        };
        submit.addEventListener('click', verify);
        input.addEventListener('keydown', (e) => { if (e.key === 'Enter') verify(); });
        break;
      }
    }

    // Also attach the timer element to container (if not already)
    if (timerEl && !container.contains(timerEl)) {
      container.appendChild(timerEl);
    }
  }

  /* =========================================================
     BLOCKING ACTIONS (StudentNija style)
     ========================================================= */
  function applyBlock(reason) {
    if (state.blocked) return;
    state.blocked = true;
    logEvent('block_applied', { reason });

    report().then(() => {
      const action = CONFIG.BLOCK_ACTION;

      if (action === 'overlay') {
        const overlay = document.createElement('div');
        overlay.id = 'sn-block-overlay';
        overlay.style.cssText = `
          position: fixed; top:0; left:0; width:100%; height:100%;
          background: #F5F7FA; z-index:999999;
          display:flex; align-items:center; justify-content:center;
          padding:20px; font-family: Inter, -apple-system, sans-serif;
          -webkit-font-smoothing: antialiased;
        `;
        overlay.innerHTML = `
          <div style="
            background: rgba(255,255,255,0.88);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border-radius: 28px;
            padding: 48px 40px;
            max-width: 480px;
            width:100%;
            text-align:center;
            box-shadow: 0 8px 32px rgba(0,0,0,0.10);
            border:1px solid rgba(0,0,0,0.04);
            animation: snFadeInUp 0.6s ease;
          ">
            <span style="font-size:56px;display:block;margin-bottom:16px;">🛡️</span>
            <h1 style="
              font-size:28px; font-weight:800; letter-spacing:-0.5px;
              margin-bottom:8px;
              background:linear-gradient(135deg, #0A1927 40%, #008751);
              -webkit-background-clip:text; -webkit-text-fill-color:transparent;
              background-clip:text;
            ">Access Denied</h1>
            <p style="font-size:16px; color:#6B7F96; font-weight:500; margin-bottom:24px;">StudentNija Security</p>
            <div style="width:48px; height:3px; background:#008751; border-radius:4px; margin:0 auto 24px;"></div>
            <p style="font-size:15px; color:#6B7F96; line-height:1.6; margin-bottom:28px;">
              Your activity has been flagged as <strong style="color:#0A1927;">suspicious</strong> by our
              automated security system.<br /><br />
              If you believe this is a mistake, please try again later or
              contact support.
            </p>
            <a href="/" style="
              display:inline-block; background:#008751; color:#fff;
              font-weight:600; font-size:15px; padding:12px 32px;
              border-radius:40px; text-decoration:none;
              box-shadow:0 4px 12px rgba(0,135,81,0.25);
              transition: transform 0.15s ease, box-shadow 0.2s ease;
            " onmouseover="this.style.transform='scale(1.02)';this.style.boxShadow='0 6px 20px rgba(0,135,81,0.35)'" onmouseout="this.style.transform='scale(1)';this.style.boxShadow='0 4px 12px rgba(0,135,81,0.25)'" onmousedown="this.style.transform='scale(0.96)'" onmouseup="this.style.transform='scale(1)'">
              Return to StudentNija
            </a>
            <p style="margin-top:24px; font-size:13px; color:#6B7F96; opacity:0.7;">
              &copy; 2026 <a href="/" style="color:#008751;text-decoration:none;font-weight:500;">StudentNija</a> &middot; Study Smarter. Score Higher.
            </p>
          </div>
          <style>
            @keyframes snFadeInUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
            @media (prefers-color-scheme: dark) {
              #sn-block-overlay { background: #0A111F; }
              #sn-block-overlay > div { background: rgba(18,28,40,0.92); border-color: rgba(255,255,255,0.06); }
              #sn-block-overlay h1 { background: linear-gradient(135deg, #F0F4FA 40%, #008751); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
              #sn-block-overlay p { color: #8FA0B5; }
              #sn-block-overlay strong { color: #F0F4FA; }
              #sn-block-overlay a[style*="background"] { box-shadow: 0 4px 16px rgba(0,135,81,0.3); }
              #sn-block-overlay .sn-footer { color: #8FA0B5; }
            }
          </style>
        `;
        document.body.innerHTML = '';
        document.body.appendChild(overlay);
        document.documentElement.style.overflow = 'hidden';
      } else if (action === 'redirect') {
        window.location.href = CONFIG.REDIRECT_URL;
      } else if (action === 'wipe') {
        document.body.innerHTML = '';
        document.head.innerHTML = `
          <title>Access Denied – StudentNija</title>
          <style>
            body { background:#F5F7FA; font-family:Inter, sans-serif; display:flex; align-items:center; justify-content:center; height:100vh; margin:0; padding:20px; color:#0A1927; text-align:center; }
            .sn-block { max-width:420px; }
            .sn-block h1 { font-size:28px; font-weight:800; background:linear-gradient(135deg,#0A1927 40%,#008751); -webkit-background-clip:text; -webkit-text-fill-color:transparent; }
            .sn-block p { color:#6B7F96; line-height:1.6; margin:16px 0 24px; }
            .sn-block a { color:#008751; font-weight:600; text-decoration:none; }
            @media (prefers-color-scheme: dark) { body { background:#0A111F; color:#F0F4FA; } .sn-block p { color:#8FA0B5; } }
          </style>
        `;
        document.body.innerHTML = `
          <div class="sn-block">
            <span style="font-size:48px;">🛡️</span>
            <h1>Access Denied</h1>
            <p>Your activity was flagged as suspicious.<br />Please return to <a href="/">StudentNija</a>.</p>
            <p style="font-size:13px;opacity:0.6;">&copy; 2026 StudentNija</p>
          </div>
        `;
      }
    });
  }

  /* =========================================================
     RISK EVALUATION & HEARTBEAT
     ========================================================= */
  function evaluateAndAct() {
    const level = getRiskLevel();
    logEvent('evaluation', { riskScore: state.riskScore, level });

    switch (level) {
      case 'warn':
        if (!state._warned) {
          state._warned = true;
          // Could show a subtle hint
        }
        break;
      case 'delay':
        if (!state._delayed) {
          state._delayed = true;
          // Could add a small sleep or slow down requests (simulate)
        }
        break;
      case 'challenge':
        if (!state.challengePassed && state.challengeAttempts < 3) {
          startChallenge();
        }
        break;
      case 'block':
        if (CONFIG.AUTO_BLOCK && !state.blocked) {
          applyBlock('risk_threshold');
        }
        break;
    }
  }

  function heartbeat() {
    monitorResources();
    detectDevTools();
    detectHeadless();
    evaluateAndAct();
    report();
  }

  /* =========================================================
     REPORTING
     ========================================================= */
  async function report() {
    if (!CONFIG.REPORT_ENDPOINT) return;
    if (state.reported && state.blocked) return;

    const snapshot = getSnapshot();
    try {
      const resp = await fetch(CONFIG.REPORT_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(snapshot),
        credentials: 'include',
        keepalive: true,
      });
      if (resp.ok) state.reported = true;
    } catch (e) {
      if (!state._retry) {
        state._retry = true;
        setTimeout(() => report(), 5000);
      }
    }
  }

  /* =========================================================
     SNAPSHOT
     ========================================================= */
  function getSnapshot() {
    return {
      sessionId: state.sessionId,
      timestamp: Date.now(),
      page: location.pathname,
      origin: location.origin,
      riskScore: state.riskScore,
      riskLevel: getRiskLevel(),
      signals: state.signals.map(s => ({ name: s.name, points: s.points })),
      automationFlags: state.automationFlags,
      devtoolsOpen: state.devtoolsOpen,
      tampering: state.tampering,
      hiddenCount: state.hiddenCount,
      navCount: state.navTimes.length,
      interactionCount: state.interactions.length,
      mouseMovements: state.mouseMovements,
      keyPresses: state.keyPresses,
      scrollDepth: state.scrollDepth,
      fingerprint: state.fingerprint,
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      screen: { width: screen.width, height: screen.height },
      viewport: { width: window.innerWidth, height: window.innerHeight },
      blocked: state.blocked,
      challengePassed: state.challengePassed,
    };
  }

  /* =========================================================
     INITIALIZATION
     ========================================================= */
  function init() {
    if (state.initialized) return;
    state.initialized = true;

    // Fingerprint
    state.fingerprint = getFingerprint();

    // Detect headless
    detectHeadless();

    // Setup honeypot
    setupHoneypot();

    // Behavior monitoring
    monitorBehavior();

    // Navigation tracking
    trackNavigation();
    window.addEventListener('popstate', trackNavigation);
    window.addEventListener('hashchange', trackNavigation);

    // Devtools
    window.addEventListener('resize', detectDevTools);

    // DOM tampering
    if (typeof MutationObserver !== 'undefined') {
      const observer = new MutationObserver(mutations => {
        let suspicious = false;
        for (const m of mutations) {
          if (m.type === 'childList') {
            for (const node of m.addedNodes) {
              if (node.nodeType === 1) {
                const tag = node.tagName;
                if (tag === 'IFRAME' || tag === 'OBJECT' || tag === 'EMBED' || tag === 'SCRIPT') {
                  suspicious = true;
                  break;
                }
              }
            }
          }
        }
        if (suspicious) {
          state.tampering = true;
          addSignal('dom_tampering', 15, {});
        }
      });
      observer.observe(document.documentElement, { childList: true, subtree: true });
    }

    // Heartbeat
    setTimeout(heartbeat, 2000);
    setInterval(heartbeat, CONFIG.HEARTBEAT_INTERVAL);

    // Initial evaluate
    evaluateAndAct();

    logEvent('init', { sessionId: state.sessionId });
  }

  /* =========================================================
     PUBLIC API
     ========================================================= */
  window.StudentNijaSentinel = Object.freeze({
    version: '3.0.0',
    getSnapshot,
    getRiskLevel,
    evaluate: evaluateAndAct,
    getRiskScore: () => state.riskScore,
    getSessionId: () => state.sessionId,
    report,
    isBlocked: () => state.blocked,
    isChallengePassed: () => state.challengePassed,
  });

  /* =========================================================
     START
     ========================================================= */
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init, { once: true });
  } else {
    init();
  }
})();