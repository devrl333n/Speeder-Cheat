// ==UserScript==
// @name         Speeder Cheat
// @namespace    speeder-cheat-v1-2-plus-stable
// @version      1.2 Plus Stable
// @description  professional time accelerator with GhostShield™
// @author       devrl333
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const N = {
    setTimeout:   window.setTimeout.bind(window),
    setInterval:  window.setInterval.bind(window),
    clearTimeout: window.clearTimeout.bind(window),
    clearInterval: window.clearInterval.bind(window),
    DateNow:      Date.now.bind(Date),
    PerfNow:      window.performance?.now.bind(window.performance) ?? (() => 0),
    RAF:          window.requestAnimationFrame?.bind(window) ?? (cb => cb(0)),
    Fetch:        window.fetch?.bind(window) ?? null,
    FnToString:   Function.prototype.toString,
    AudioCtx:     window.AudioContext || window.webkitAudioContext,
    SW:           navigator.serviceWorker,
  };

  const _ns = new WeakMap();
  Function.prototype.toString = function() {
    return _ns.has(this) ? _ns.get(this) : N.FnToString.call(this);
  };

  const MIN = 1, MAX = 100, STEP = 0.25;
  const PRESETS = [1, 2, 3, 5, 8, 10, 16, 32, 50, 100];
  const DEFAULT_SPEED = 3;
  const STORAGE_KEY = 'sc_speed_' + location.hostname;
  let SPEED = parseFloat(localStorage.getItem(STORAGE_KEY)) || DEFAULT_SPEED;
  if (SPEED < MIN || SPEED > MAX) SPEED = DEFAULT_SPEED;

  let dVE, dRE, pVE, pRE, cachedTO;
  dVE = dRE = N.DateNow();
  pVE = pRE = N.PerfNow();

  const vNow = () => dVE + (N.DateNow() - dRE) * SPEED;
  const vPerf = () => pVE + (N.PerfNow() - pRE) * SPEED;

  function setSpeed(v, save = true) {
    const s = Math.max(MIN, Math.min(MAX, Math.round(v * 4) / 4));
    if (s === SPEED) return;
    const rn = N.DateNow(), pn = N.PerfNow();
    dVE = dVE + (rn - dRE) * SPEED;
    dRE = rn;
    pVE = pVE + (pn - pRE) * SPEED;
    pRE = pn;
    SPEED = s;
    cachedTO = dVE - pVE;
    if (UI.speedEl) UI.speedEl.textContent = SPEED % 1 === 0 ? SPEED.toFixed(0) : SPEED.toFixed(2);
    if (save) localStorage.setItem(STORAGE_KEY, SPEED);
    UI.updatePresetButtons();
  }

  const OrigDate = window.Date;
  class VDate extends OrigDate {
    constructor(...a) { super(...(a.length ? a : [vNow()])); }
    static now() { return vNow(); }
    static parse = OrigDate.parse;
    static UTC = OrigDate.UTC;
  }
  window.Date = VDate;
  _ns.set(VDate, 'function Date() { [native code] }');
  _ns.set(VDate.now, 'function now() { [native code] }');

  if (window.performance) {
    const vp = vPerf;
    Object.defineProperty(window.performance, 'now', { value: vp, configurable: true, writable: true });
    _ns.set(vp, 'function now() { [native code] }');
    if ('timeOrigin' in window.performance) {
      Object.defineProperty(window.performance, 'timeOrigin', { get: () => cachedTO, configurable: true });
    }
    cachedTO = dVE - pVE;
  }

  const wrapTimer = (orig, rep) => {
    const fn = function(cb, ms, ...a) {
      const t = Math.max(rep ? 4 : 0, Math.round((+ms || 0) / SPEED));
      return orig.call(window, cb, t, ...a);
    };
    _ns.set(fn, rep ? 'function setInterval() { [native code] }' : 'function setTimeout() { [native code] }');
    return fn;
  };
  window.setTimeout = wrapTimer(N.setTimeout, false);
  window.setInterval = wrapTimer(N.setInterval, true);

  window.requestAnimationFrame = function(cb) {
    return N.RAF(() => cb(vPerf()));
  };
  _ns.set(window.requestAnimationFrame, 'function requestAnimationFrame() { [native code] }');

  if (window.HTMLMediaElement?.prototype) {
    const d = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, 'playbackRate');
    if (d?.set) {
      const orig = d.set;
      Object.defineProperty(window.HTMLMediaElement.prototype, 'playbackRate', {
        get: d.get,
        set(v) { orig.call(this, Math.max(0.0625, Math.min(MAX, v * SPEED))); },
        configurable: true
      });
    }
  }

  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  const def = (o, k, g) => { try { Object.defineProperty(o, k, { get: g, configurable: true }); } catch(e) {} };
  def(navigator, 'webdriver', () => false);
  def(navigator, 'plugins', () => ({ length: 3, item: () => null, namedItem: () => null }));
  def(navigator, 'languages', () => ['en-US', 'en']);
  def(navigator, 'hardwareConcurrency', () => isMobile ? 8 : 12);
  def(navigator, 'deviceMemory', () => isMobile ? 4 : 8);
  def(navigator, 'connection', () => ({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false }));
  def(screen, 'colorDepth', () => 24);
  def(screen, 'pixelDepth', () => 24);

  if (window.HTMLCanvasElement) {
    const oURL = window.HTMLCanvasElement.prototype.toDataURL;
    const oBlob = window.HTMLCanvasElement.prototype.toBlob;
    const fuzz = function() {
      const ctx = this.getContext('2d');
      if (!ctx || !this.width || !this.height) return;
      try {
        const img = ctx.getImageData(0, 0, this.width, this.height);
        const data = img.data;
        const buf = new Uint8Array(Math.ceil(data.length / 4));
        crypto.getRandomValues(buf);
        for (let i = 0, b = 0; i < data.length; i += 4, b++) {
          if ((buf[b] & 0x3F) === 0) {
            data[i]   ^= buf[b] & 1;
            data[i+1] ^= (buf[b] >> 1) & 1;
            data[i+2] ^= (buf[b] >> 2) & 1;
          }
        }
        ctx.putImageData(img, 0, 0);
        const s = new Uint8Array(4);
        crypto.getRandomValues(s);
        const pa = ctx.globalAlpha;
        ctx.globalAlpha = 0.002;
        ctx.fillStyle = `rgb(${s[0]%4},${s[1]%4},${s[2]%4})`;
        ctx.fillRect(s[3] % Math.max(1, this.width - 1), 0, 1, 1);
        ctx.globalAlpha = pa;
      } catch(e) {}
    };
    window.HTMLCanvasElement.prototype.toDataURL = function(...a) { fuzz.call(this); return oURL.apply(this, a); };
    window.HTMLCanvasElement.prototype.toBlob    = function(...a) { fuzz.call(this); return oBlob.apply(this, a); };
  }

  const glPatch = proto => {
    if (!proto) return;
    const og = proto.getParameter;
    proto.getParameter = function(p) {
      if (p === 37445) return isMobile ? 'Qualcomm' : 'Google Inc. (AMD)';
      if (p === 37446) return isMobile ? 'Adreno (TM) 640' : 'ANGLE (AMD, Radeon RX 5700 XT Direct3D11 vs_5_0 ps_5_0, D3D11)';
      return og.call(this, p);
    };
  };
  glPatch(window.WebGLRenderingContext?.prototype);
  glPatch(window.WebGL2RenderingContext?.prototype);

  if (N.AudioCtx) {
    try {
      const analyserProto = window.AnalyserNode?.prototype;
      if (analyserProto && analyserProto.getFloatTimeDomainData) {
        const origMethod = analyserProto.getFloatTimeDomainData;
        analyserProto.getFloatTimeDomainData = function(array) {
          origMethod.call(this, array);
          for (let i = 0; i < array.length; i++) {
            array[i] += (Math.random() - 0.5) * 1e-8;
          }
        };
      }
    } catch(e) {}
  }

  if (N.SW) {
    def(navigator, 'serviceWorker', () => ({
      getRegistrations: () => Promise.resolve([]),
      register: () => Promise.reject(new Error('registration failed')),
      ready: Promise.resolve({ active: null })
    }));
  }

  const forceVisible = () => {
    try { Object.defineProperty(document, 'hidden', { get: () => false, configurable: true }); } catch(e) {}
    try { Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true }); } catch(e) {}
  };
  forceVisible();
  N.setInterval(forceVisible, 200);

  let countdownObserver = null;
  let countdownTargets = [];
  let autoBoostActive = false;
  let originalSpeedBeforeBoost = SPEED;

  function scanCountdowns() {
    try {
      const elems = document.querySelectorAll('[id*="count" i], [class*="count" i], [id*="timer" i], [class*="timer" i], [data-countdown], [data-timer]');
      countdownTargets = Array.from(elems).filter(el => /^\d+$/.test(el.textContent.trim()));
    } catch(e) {
      countdownTargets = [];
    }
  }

  function startAutoBoost() {
    if (autoBoostActive) return;
    originalSpeedBeforeBoost = SPEED;
    setSpeed(MAX, false);
    autoBoostActive = true;
    if (UI.boostIndicator) UI.boostIndicator.style.display = 'block';
  }

  function stopAutoBoost() {
    if (!autoBoostActive) return;
    setSpeed(originalSpeedBeforeBoost, false);
    autoBoostActive = false;
    if (UI.boostIndicator) UI.boostIndicator.style.display = 'none';
  }

  function checkAndBoost() {
    scanCountdowns();
    if (countdownTargets.length > 0) {
      startAutoBoost();
    } else if (autoBoostActive) {
      stopAutoBoost();
    }
  }

  function installCountdownObserver() {
    if (document.body) {
      checkAndBoost();
      countdownObserver = new MutationObserver(() => {
        try { checkAndBoost(); } catch(e) {}
      });
      countdownObserver.observe(document.body, { childList: true, subtree: true, characterData: true });
    }
  }

  const UI = {
    dot: null,
    controller: null,
    speedEl: null,
    presetButtons: [],
    boostIndicator: null,
    hideTimer: null,

    createDot() {
      if (UI.dot) return;
      UI.dot = document.createElement('div');
      UI.dot.style.cssText = 'position:fixed; bottom:20px; right:16px; width:18px; height:18px; border-radius:50%; background:rgba(255,255,255,0.25); z-index:2147483645; cursor:pointer; box-shadow:0 0 6px rgba(0,0,0,0.4);';
      UI.dot.addEventListener('click', (e) => {
        e.stopPropagation();
        if (UI.controller) UI.hideController();
        else UI.showController();
      });
      UI.dot.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (UI.controller) UI.hideController();
        else UI.showController();
      });
      document.body.appendChild(UI.dot);
    },

    showController() {
      if (UI.controller) return;
      const ctrl = document.createElement('div');
      ctrl.id = 'sc-controller';
      ctrl.style.cssText = `
        position:fixed; bottom:52px; right:10px; z-index:2147483647;
        background:rgba(10,10,18,0.92); backdrop-filter:blur(12px);
        border:1px solid rgba(255,255,255,0.12); border-radius:18px;
        padding:14px; display:flex; flex-direction:column; align-items:center;
        gap:10px; font-family:system-ui, -apple-system, sans-serif; min-width:170px;
        box-shadow:0 12px 32px rgba(0,0,0,0.5);
      `;

      const presetRow = document.createElement('div');
      presetRow.style.cssText = 'display:flex; flex-wrap:wrap; gap:5px; justify-content:center;';
      PRESETS.forEach(p => {
        const btn = document.createElement('button');
        btn.textContent = p + 'x';
        btn.style.cssText = 'padding:4px 7px; border-radius:6px; background:rgba(255,255,255,0.06); color:#ccc; border:1px solid rgba(255,255,255,0.12); font-size:11px; cursor:pointer;';
        btn.addEventListener('click', (e) => { e.stopPropagation(); setSpeed(p); });
        btn.addEventListener('touchstart', (e) => { e.stopPropagation(); e.preventDefault(); setSpeed(p); });
        presetRow.appendChild(btn);
        UI.presetButtons.push({ btn, speed: p });
      });
      ctrl.appendChild(presetRow);

      const row = document.createElement('div');
      row.style.cssText = 'display:flex; align-items:center; gap:8px;';

      const btnMinus = UI.createButton('−', () => setSpeed(SPEED - STEP));
      UI.speedEl = document.createElement('span');
      UI.speedEl.textContent = SPEED % 1 === 0 ? SPEED.toFixed(0) : SPEED.toFixed(2);
      UI.speedEl.style.cssText = 'font-size:26px; font-weight:700; color:#fff; min-width:54px; text-align:center; cursor:pointer; user-select:none;';
      UI.speedEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'number'; input.min = MIN; input.max = MAX; input.step = STEP;
        input.value = SPEED;
        input.style.cssText = 'width:60px; background:transparent; border:1px solid rgba(255,255,255,0.3); color:#fff; font-size:24px; text-align:center; border-radius:6px; outline:none;';
        UI.speedEl.replaceWith(input);
        input.focus();
        const commit = () => {
          setSpeed(parseFloat(input.value) || SPEED);
          input.replaceWith(UI.speedEl);
        };
        input.addEventListener('blur', commit);
        input.addEventListener('keydown', ev => { if (ev.key === 'Enter') commit(); });
      });
      const btnPlus = UI.createButton('+', () => setSpeed(SPEED + STEP));

      row.appendChild(btnMinus);
      row.appendChild(UI.speedEl);
      row.appendChild(btnPlus);
      ctrl.appendChild(row);

      const btnClear = UI.createButton('🗑 Clear Data', () => {
        document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'));
        try { localStorage.clear(); } catch(e) {}
        try { sessionStorage.clear(); } catch(e) {}
        location.reload();
      });
      btnClear.style.width = '100%';
      btnClear.style.fontSize = '12px';
      btnClear.style.height = '32px';
      ctrl.appendChild(btnClear);

      document.body.appendChild(ctrl);
      UI.controller = ctrl;
      UI.updatePresetButtons();
      UI.makeDraggable(ctrl);
      UI.resetHideTimer();
    },

    hideController() {
      if (UI.controller) {
        UI.controller.remove();
        UI.controller = null;
        UI.speedEl = null;
      }
      if (UI.hideTimer) {
        clearTimeout(UI.hideTimer);
        UI.hideTimer = null;
      }
    },

    toggleController() {
      if (UI.controller) UI.hideController();
      else UI.showController();
    },

    resetHideTimer() {
      if (UI.hideTimer) clearTimeout(UI.hideTimer);
      UI.hideTimer = N.setTimeout(() => UI.hideController(), 20000);
    },

    createButton(text, handler) {
      const btn = document.createElement('button');
      btn.textContent = text;
      btn.style.cssText = `
        height:34px; border-radius:8px; background:rgba(255,255,255,0.08);
        color:#ddd; border:1px solid rgba(255,255,255,0.1); font-size:18px;
        cursor:pointer; display:flex; align-items:center; justify-content:center;
        padding:0 10px;
      `;
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        handler();
        UI.resetHideTimer();
      });
      btn.addEventListener('touchstart', (e) => {
        e.stopPropagation();
        e.preventDefault();
        handler();
        UI.resetHideTimer();
      });
      return btn;
    },

    updatePresetButtons() {
      UI.presetButtons.forEach(({ btn, speed }) => {
        if (speed === SPEED) {
          btn.style.background = 'rgba(255,255,255,0.18)';
          btn.style.color = '#fff';
          btn.style.borderColor = 'rgba(255,255,255,0.3)';
        } else {
          btn.style.background = 'rgba(255,255,255,0.06)';
          btn.style.color = '#ccc';
          btn.style.borderColor = 'rgba(255,255,255,0.12)';
        }
      });
    },

    makeDraggable(el) {
      let startX, startY, initX, initY, dragging = false;
      const start = (e) => {
        e.preventDefault();
        const p = e.touches ? e.touches[0] : e;
        startX = p.clientX; startY = p.clientY;
        initX = el.offsetLeft; initY = el.offsetTop;
        dragging = true;
        el.style.transition = 'none';
        UI.resetHideTimer();
      };
      const move = (e) => {
        if (!dragging) return;
        const p = e.touches ? e.touches[0] : e;
        const dx = p.clientX - startX;
        const dy = p.clientY - startY;
        el.style.left = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, initX + dx)) + 'px';
        el.style.top = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, initY + dy)) + 'px';
      };
      const end = () => { dragging = false; };
      el.addEventListener('mousedown', start);
      el.addEventListener('touchstart', start, { passive: false });
      window.addEventListener('mousemove', move);
      window.addEventListener('touchmove', move, { passive: false });
      window.addEventListener('mouseup', end);
      window.addEventListener('touchend', end);
    },

    build() {
      UI.createDot();
      UI.boostIndicator = document.createElement('div');
      UI.boostIndicator.textContent = '⚡';
      UI.boostIndicator.style.cssText = `
        display:none; position:fixed; top:10px; right:10px;
        background:rgba(255,200,0,0.8); color:#000; border-radius:50%;
        width:32px; height:32px; line-height:32px; text-align:center;
        font-size:18px; z-index:2147483647; pointer-events:none;
      `;
      document.body.appendChild(UI.boostIndicator);

      const brand = document.createElement('div');
      brand.textContent = 'Speeder Cheat';
      brand.style.cssText = 'position:fixed; top:10px; left:50%; transform:translateX(-50%); font-size:13px; font-weight:600; color:#fff; background:rgba(0,0,0,0.55); padding:3px 14px; border-radius:12px; z-index:2147483646; pointer-events:none; font-family:system-ui, sans-serif; letter-spacing:0.3px;';
      document.body.appendChild(brand);
    }
  };

  document.addEventListener('keydown', e => {
    if (e.ctrlKey && e.shiftKey && e.code === 'KeyZ') {
      e.preventDefault();
      UI.toggleController();
    }
  });

  function initUI() {
    UI.build();
    const sig = document.createElement('div');
    sig.textContent = 'Created by devrl333';
    sig.style.cssText = `
      position:fixed; bottom:12px; left:50%; transform:translateX(-50%);
      font-size:11px; font-weight:600; z-index:2147483646; pointer-events:none;
      font-family:system-ui, sans-serif;
      background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);
      -webkit-background-clip:text; -webkit-text-fill-color:transparent;
      animation:sc-rainbow 3s linear infinite;
    `;
    document.body.appendChild(sig);
    if (!document.getElementById('sc-rainbow')) {
      const s = document.createElement('style');
      s.id = 'sc-rainbow';
      s.textContent = '@keyframes sc-rainbow{0%{filter:hue-rotate(0deg)}100%{filter:hue-rotate(360deg)}}';
      document.head.appendChild(s);
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initUI();
      installCountdownObserver();
    });
  } else {
    initUI();
    installCountdownObserver();
  }

  window.SpeedCheat = {
    get speed() { return SPEED; },
    set speed(v) { setSpeed(v); },
    clearData: () => {
      document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'));
      try { localStorage.clear(); } catch(e) {}
      try { sessionStorage.clear(); } catch(e) {}
      location.reload();
    }
  };
})();
