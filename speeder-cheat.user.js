// ==UserScript==
// @name         Speeder Cheat
// @namespace    speeder-cheat
// @version      1.2.1 Official
// @description  time accelerator with GhostShield™
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

  const DOMAIN = location.hostname.replace(/^www\./, '');
  const SKEY = 'sc_off_' + DOMAIN;
  const _load = () => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch { return {}; } };
  const _save = d => { try { localStorage.setItem(SKEY, JSON.stringify(d)); } catch {} };

  const P = _load();
  const MIN = 1, MAX = 1000, STEP = 0.25;
  let SPEED = Math.max(MIN, Math.min(MAX, parseFloat(P.speed) || 3));
  if (isNaN(SPEED)) SPEED = 3;

  function persist() { _save({ speed: SPEED }); }

  let dVE, dRE, pVE, pRE, cachedTO;
  dVE = dRE = N.DateNow();
  pVE = pRE = N.PerfNow();

  const vNow = () => dVE + (N.DateNow() - dRE) * SPEED;
  const vPerf = () => pVE + (N.PerfNow() - pRE) * SPEED;

  function setSpeed(v, save = true) {
    let s = parseFloat(v);
    if (isNaN(s)) s = SPEED;
    s = Math.max(MIN, Math.min(MAX, s));
    if (s === SPEED) return;
    const rn = N.DateNow(), pn = N.PerfNow();
    dVE = dVE + (rn - dRE) * SPEED;
    dRE = rn;
    pVE = pVE + (pn - pRE) * SPEED;
    pRE = pn;
    SPEED = s;
    cachedTO = dVE - pVE;
    if (UI.speedEl) UI.speedEl.textContent = SPEED % 1 === 0 ? SPEED.toFixed(0) : SPEED.toFixed(2);
    if (save) persist();
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

  window.requestAnimationFrame = cb => N.RAF(() => cb(vPerf()));
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
      const proto = window.AnalyserNode?.prototype;
      if (proto?.getFloatTimeDomainData) {
        const orig = proto.getFloatTimeDomainData;
        proto.getFloatTimeDomainData = function(arr) {
          orig.call(this, arr);
          for (let i = 0; i < arr.length; i++) arr[i] += (Math.random() - 0.5) * 1e-8;
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

  const UI = {
    dot: null, panel: null, speedEl: null, hideTimer: null,
    createDot() {
      this.dot = document.createElement('div');
      this.dot.style.cssText = 'position:fixed;bottom:20px;right:16px;width:18px;height:18px;border-radius:50%;background:rgba(255,255,255,0.3);z-index:2147483645;cursor:pointer;';
      this.dot.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        this.toggle();
      });
      document.body.appendChild(this.dot);
    },
    show() {
      if (this.panel) return;
      const p = document.createElement('div');
      p.style.cssText = 'position:fixed;bottom:52px;right:10px;z-index:2147483647;background:rgba(10,10,18,0.92);border:1px solid rgba(255,255,255,0.15);border-radius:16px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:10px;font-family:system-ui,sans-serif;min-width:180px;';
      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;gap:8px;';
      const btnMinus = document.createElement('button');
      btnMinus.textContent = '−';
      btnMinus.style.cssText = 'width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;border:none;font-size:20px;cursor:pointer;';
      btnMinus.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); setSpeed(SPEED - STEP); });
      this.speedEl = document.createElement('span');
      this.speedEl.textContent = SPEED % 1 === 0 ? SPEED.toFixed(0) : SPEED.toFixed(2);
      this.speedEl.style.cssText = 'font-size:32px;font-weight:700;color:#fff;min-width:60px;text-align:center;cursor:pointer;';
      this.speedEl.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const input = document.createElement('input');
        input.type = 'number';
        input.min = MIN;
        input.max = MAX;
        input.step = 'any';
        input.value = SPEED;
        input.style.cssText = 'width:60px;height:36px;background:transparent;border:1px solid rgba(255,255,255,0.3);color:#fff;font-size:24px;text-align:center;border-radius:6px;outline:none;';
        this.speedEl.replaceWith(input);
        input.focus();
        const commit = () => { setSpeed(input.value); input.replaceWith(this.speedEl); };
        input.addEventListener('blur', commit);
        input.addEventListener('keydown', ev => { if (ev.key === 'Enter') commit(); });
      });
      const btnPlus = document.createElement('button');
      btnPlus.textContent = '+';
      btnPlus.style.cssText = 'width:38px;height:38px;border-radius:10px;background:rgba(255,255,255,0.1);color:#fff;border:none;font-size:20px;cursor:pointer;';
      btnPlus.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); setSpeed(SPEED + STEP); });
      row.appendChild(btnMinus);
      row.appendChild(this.speedEl);
      row.appendChild(btnPlus);
      p.appendChild(row);
      const turboBtn = document.createElement('button');
      turboBtn.textContent = 'Turbo 1000x';
      turboBtn.style.cssText = 'padding:6px 12px;border-radius:8px;background:rgba(255,180,0,0.2);color:#ffb400;border:1px solid rgba(255,180,0,0.4);font-size:13px;font-weight:bold;cursor:pointer;';
      turboBtn.addEventListener('pointerdown', (e) => { e.preventDefault(); e.stopPropagation(); setSpeed(1000); });
      p.appendChild(turboBtn);
      const clearBtn = document.createElement('button');
      clearBtn.textContent = 'Clear Data';
      clearBtn.style.cssText = 'width:100%;padding:6px;background:rgba(255,80,80,0.25);border:1px solid rgba(255,80,80,0.4);border-radius:8px;color:#ff8a8a;font-size:12px;cursor:pointer;';
      clearBtn.addEventListener('pointerdown', (e) => {
        e.preventDefault();
        e.stopPropagation();
        document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'));
        try { localStorage.clear(); } catch(e) {}
        try { sessionStorage.clear(); } catch(e) {}
        location.reload();
      });
      p.appendChild(clearBtn);
      document.body.appendChild(p);
      this.panel = p;
      this.resetTimer();
      this.makeDraggable(p);
    },
    hide() {
      if (this.panel) { this.panel.remove(); this.panel = null; }
      if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
    },
    toggle() { this.panel ? this.hide() : this.show(); },
    resetTimer() {
      if (this.hideTimer) clearTimeout(this.hideTimer);
      this.hideTimer = N.setTimeout(() => this.hide(), 15000);
    },
    makeDraggable(el) {
      let sx, sy, sl, st, dragging = false;
      const start = e => {
        e.preventDefault();
        const p = e.touches ? e.touches[0] : e;
        sx = p.clientX; sy = p.clientY;
        sl = el.offsetLeft; st = el.offsetTop;
        dragging = true;
        el.style.transition = 'none';
        this.resetTimer();
      };
      const move = e => {
        if (!dragging) return;
        const p = e.touches ? e.touches[0] : e;
        el.style.left = Math.max(0, Math.min(window.innerWidth - el.offsetWidth, sl + p.clientX - sx)) + 'px';
        el.style.top = Math.max(0, Math.min(window.innerHeight - el.offsetHeight, st + p.clientY - sy)) + 'px';
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
      this.createDot();
      const brand = document.createElement('div');
      brand.textContent = 'Speeder Cheat';
      brand.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);font-size:17px;font-weight:800;z-index:2147483646;pointer-events:none;font-family:system-ui,sans-serif;letter-spacing:1px;background:linear-gradient(90deg,transparent,#fff,transparent);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:sc-shine 2.5s linear infinite;';
      document.body.appendChild(brand);
      const sig = document.createElement('div');
      sig.textContent = 'Created by devrl333';
      sig.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);font-size:12px;font-weight:600;z-index:2147483646;pointer-events:none;font-family:system-ui,sans-serif;background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:sc-rainbow 3s linear infinite;';
      document.body.appendChild(sig);
      if (!document.getElementById('sc-styles')) {
        const s = document.createElement('style');
        s.id = 'sc-styles';
        s.textContent = '@keyframes sc-rainbow{0%{background-position:0% 50%}100%{background-position:200% 50%}}@keyframes sc-shine{0%{background-position:-200% 50%}100%{background-position:200% 50%}}';
        document.head.appendChild(s);
      }
    }
  };

  function init() {
    UI.build();
    window.SpeedCheat = {
      setSpeed,
      get speed() { return SPEED; },
      clearData: () => {
        document.cookie.split(';').forEach(c => document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/'));
        try { localStorage.clear(); } catch(e) {}
        try { sessionStorage.clear(); } catch(e) {}
        location.reload();
      }
    };
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
