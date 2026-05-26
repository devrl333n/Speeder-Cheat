// ==UserScript==
// @name         Speeder Cheat
// @namespace    speeder-cheat-official
// @version      1.2.2 Official
// @description  Professional time accelerator with GhostShield™
// @author       devrl333
// @match        *://*/*
// @grant        none
// @run-at       document-start
// ==/UserScript==

(function() {
  'use strict';

  const N = {
    setTimeout:    window.setTimeout.bind(window),
    setInterval:   window.setInterval.bind(window),
    clearTimeout:  window.clearTimeout.bind(window),
    clearInterval: window.clearInterval.bind(window),
    DateNow:       Date.now.bind(Date),
    PerfNow:       window.performance?.now.bind(window.performance) ?? (() => 0),
    RAF:           window.requestAnimationFrame?.bind(window) ?? (cb => cb(0)),
    Fetch:         window.fetch?.bind(window) ?? null,
    XHROpen:       XMLHttpRequest.prototype.open,
    XHRSend:       XMLHttpRequest.prototype.send,
    WebSocket:     window.WebSocket,
    FnToString:    Function.prototype.toString,
    AudioCtx:      window.AudioContext || window.webkitAudioContext,
    RTCPeerConn:   window.RTCPeerConnection || window.webkitRTCPeerConnection,
  };

  const _ns = new WeakMap();
  Function.prototype.toString = function() {
    return _ns.has(this) ? _ns.get(this) : N.FnToString.call(this);
  };
  _ns.set(Function.prototype.toString, 'function toString() { [native code] }');

  const DOMAIN = location.hostname.replace(/^www\./, '');
  const SKEY = 'sc_official_' + DOMAIN;
  const _load = () => { try { return JSON.parse(localStorage.getItem(SKEY) || '{}'); } catch { return {}; } };
  const _save = d => { try { localStorage.setItem(SKEY, JSON.stringify(d)); } catch {} };

  const P = _load();
  const MIN = 1, MAX = 1000, STEP = 0.25;
  let SPEED = Math.max(MIN, Math.min(MAX, parseFloat(P.speed) || 3));
  if (isNaN(SPEED)) SPEED = 3;
  let TIME_SYNC = P.timeSync !== undefined ? P.timeSync : true;
  let USER_SIM  = P.simulate || false;

  const persist = () => _save({ speed: SPEED, timeSync: TIME_SYNC, simulate: USER_SIM });

  const realNow = () => N.DateNow();

  let dVE = N.DateNow(), dRE = dVE;
  let pVE = N.PerfNow(), pRE = pVE;
  let cachedTO = dVE - pVE;

  const vNow  = () => dVE + (N.DateNow() - dRE) * SPEED;
  const vPerf = () => pVE + (N.PerfNow() - pRE) * SPEED;

  function setSpeed(v, save = true) {
    let s = parseFloat(v);
    if (isNaN(s)) s = SPEED;
    s = Math.max(MIN, Math.min(MAX, s));
    if (s === SPEED) return;
    const rn = N.DateNow(), pn = N.PerfNow();
    dVE = dVE + (rn - dRE) * SPEED; dRE = rn;
    pVE = pVE + (pn - pRE) * SPEED; pRE = pn;
    SPEED = s;
    cachedTO = dVE - pVE;
    if (UI.speedEl) UI.speedEl.textContent = SPEED % 1 === 0 ? SPEED.toFixed(0) : SPEED.toFixed(2);
    if (save) persist();
  }

  const OrigDate = window.Date;
  const VDate = new Proxy(OrigDate, {
    construct(target, args) {
      if (args.length === 0) return new target(vNow());
      return new target(...args);
    },
    apply(target, thisArg, args) {
      return new target(vNow()).toString();
    }
  });
  VDate.now = () => vNow();
  VDate.parse = OrigDate.parse;
  VDate.UTC = OrigDate.UTC;
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
  }

  const wrapTimer = (orig, rep) => {
    const fn = function(cb, ms, ...a) {
      return orig.call(window, cb, Math.max(rep ? 4 : 0, Math.round((+ms || 0) / SPEED)), ...a);
    };
    _ns.set(fn, rep ? 'function setInterval() { [native code] }' : 'function setTimeout() { [native code] }');
    return fn;
  };
  window.setTimeout  = wrapTimer(N.setTimeout, false);
  window.setInterval = wrapTimer(N.setInterval, true);

  const rafWrap = cb => N.RAF(() => cb(vPerf()));
  _ns.set(rafWrap, 'function requestAnimationFrame() { [native code] }');
  window.requestAnimationFrame = rafWrap;

  if (window.HTMLMediaElement?.prototype) {
    const d = Object.getOwnPropertyDescriptor(window.HTMLMediaElement.prototype, 'playbackRate');
    if (d?.set) {
      const orig = d.set;
      Object.defineProperty(window.HTMLMediaElement.prototype, 'playbackRate', {
        get: d.get,
        set(v) { orig.call(this, Math.max(0.0625, Math.min(16, v * SPEED))); },
        configurable: true
      });
    }
  }

  function patchTS(str) {
    if (typeof str !== 'string') return str;
    return str.replace(/([?&])(timestamp|time|ts)=(\d{10,13})/gi, (_, sep, key) => `${sep}${key}=${Math.floor(realNow())}`);
  }

  function patchBody(body) {
    if (!body) return body;
    if (typeof body === 'string') {
      try {
        const json = JSON.parse(body);
        let changed = false;
        for (const k of ['timestamp','time','ts']) {
          if (typeof json[k] === 'number') { json[k] = Math.floor(realNow()); changed = true; }
        }
        return changed ? JSON.stringify(json) : patchTS(body);
      } catch { return patchTS(body); }
    }
    if (body instanceof URLSearchParams) {
      const p = new URLSearchParams(body);
      for (const k of ['timestamp','time','ts']) if (p.has(k)) p.set(k, Math.floor(realNow()));
      return p;
    }
    if (body instanceof FormData) {
      const f = new FormData();
      body.forEach((v, k) => {
        f.append(k, ['timestamp','time','ts'].includes(k) ? Math.floor(realNow()) : v);
      });
      return f;
    }
    return body;
  }

  if (N.Fetch) {
    window.fetch = async function(...args) {
      let url = '', opts = args[1] ? { ...args[1] } : {};
      let finalUrl, finalOpts;
      if (args[0] instanceof Request) {
        const req = args[0];
        url = req.url;
        finalUrl = TIME_SYNC ? patchTS(url) : url;
        finalOpts = {
          method: req.method, headers: new Headers(req.headers),
          body: req.body, mode: req.mode,
          credentials: req.credentials, cache: req.cache,
          redirect: req.redirect, referrer: req.referrer,
          integrity: req.integrity,
        };
        if (TIME_SYNC && finalOpts.body && req.method !== 'GET' && req.method !== 'HEAD') {
          try { finalOpts.body = patchBody(finalOpts.body); } catch(e) {}
        }
      } else {
        url = args[0]?.toString() || '';
        finalUrl = TIME_SYNC ? patchTS(url) : url;
        finalOpts = { ...opts, headers: new Headers(opts.headers || {}) };
        if (TIME_SYNC && finalOpts.body) {
          try { finalOpts.body = patchBody(finalOpts.body); } catch(e) {}
        }
      }
      return N.Fetch(finalUrl, finalOpts);
    };
    _ns.set(window.fetch, 'function fetch() { [native code] }');
  }

  XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
    this._sc = { method, url: TIME_SYNC ? patchTS(url) : url, async: async !== false };
    return N.XHROpen.call(this, method, this._sc.url, async, user, password);
  };
  XMLHttpRequest.prototype.send = function(body) {
    if (TIME_SYNC && this._sc && body) {
      try { body = patchBody(body); } catch(e) {}
    }
    return N.XHRSend.call(this, body);
  };

  if (navigator.sendBeacon) {
    const ob = navigator.sendBeacon.bind(navigator);
    navigator.sendBeacon = function(url, data) {
      return ob(TIME_SYNC ? patchTS(url) : url, TIME_SYNC ? patchBody(data) : data);
    };
  }

  if (N.WebSocket) {
    window.WebSocket = new Proxy(N.WebSocket, {
      construct(target, args) {
        const ws = Reflect.construct(target, args);
        try {
          const origSend = ws.send.bind(ws);
          ws.send = function(data) {
            if (typeof data === 'string') data = patchTS(data);
            return origSend(data);
          };
          let listener = null;
          Object.defineProperty(ws, 'onmessage', {
            set(fn) {
              this._realMsg = fn;
              if (listener) ws.removeEventListener('message', listener);
              listener = e => {
                if (typeof e.data !== 'string') return fn.call(this, e);
                try {
                  const p = JSON.parse(e.data);
                  let hit = false;
                  for (const k of ['remaining','countdown','seconds','wait','delay','timeLeft']) {
                    if (typeof p[k] === 'number' && p[k] > 0) {
                      p[k] = Math.max(0, Math.ceil(p[k] / SPEED)); hit = true;
                    }
                  }
                  fn.call(this, hit ? new MessageEvent('message', { data: JSON.stringify(p), origin: e.origin }) : e);
                } catch { fn.call(this, e); }
              };
              ws.addEventListener('message', listener);
            },
            get() { return this._realMsg; },
            configurable: true
          });
        } catch(e) {}
        return ws;
      }
    });
    _ns.set(window.WebSocket, 'function WebSocket() { [native code] }');
  }

  if (N.RTCPeerConn) {
    const origRTC = N.RTCPeerConn;
    const fakeRTC = function(config) {
      config = config || {};
      config.iceTransportPolicy = 'relay';
      return new origRTC(config);
    };
    fakeRTC.prototype = origRTC.prototype;
    window.RTCPeerConnection = fakeRTC;
    window.webkitRTCPeerConnection = fakeRTC;
    _ns.set(fakeRTC, 'function RTCPeerConnection() { [native code] }');
  }

  const isMobile = /android|iphone|ipad|ipod/i.test(navigator.userAgent);
  const safeProtoDef = (cls, key, getter) => {
    try {
      if (!(key in cls.prototype) || Object.getOwnPropertyDescriptor(cls.prototype, key)?.configurable) {
        Object.defineProperty(cls.prototype, key, { get: getter, configurable: true, enumerable: true });
      }
    } catch(e) {}
  };
  safeProtoDef(Navigator, 'webdriver',           () => false);
  safeProtoDef(Navigator, 'plugins',             () => ({ length: 3, item: () => null, namedItem: () => null }));
  safeProtoDef(Navigator, 'languages',           () => ['en-US', 'en']);
  safeProtoDef(Navigator, 'hardwareConcurrency', () => isMobile ? 8 : 12);
  safeProtoDef(Navigator, 'deviceMemory',        () => isMobile ? 4 : 8);
  safeProtoDef(Navigator, 'connection',          () => ({ effectiveType: '4g', rtt: 50, downlink: 10, saveData: false }));
  if ('permissions' in Navigator.prototype) {
    safeProtoDef(Navigator, 'permissions', () => ({ query: () => Promise.resolve({ state: 'prompt' }) }));
  }
  if ('mediaDevices' in Navigator.prototype) {
    safeProtoDef(Navigator, 'mediaDevices', () => ({ getUserMedia: () => Promise.reject(new Error('NotAllowedError')), enumerateDevices: () => Promise.resolve([]) }));
  }
  safeProtoDef(Screen,    'colorDepth',          () => 24);
  safeProtoDef(Screen,    'pixelDepth',          () => 24);

  try { Object.defineProperty(Error.prototype, 'stack', { get: () => '', configurable: true }); } catch(e) {}

  if (window.HTMLCanvasElement) {
    const oURL  = window.HTMLCanvasElement.prototype.toDataURL;
    const oBlob = window.HTMLCanvasElement.prototype.toBlob;
    const fuzz  = function() {
      const ctx = this.getContext('2d');
      if (!ctx || !this.width || !this.height) return;
      try {
        const s = new Uint8Array(4);
        crypto.getRandomValues(s);
        const pa = ctx.globalAlpha;
        const pc = ctx.globalCompositeOperation;
        ctx.globalAlpha = 0.003;
        ctx.globalCompositeOperation = 'difference';
        ctx.fillStyle = `rgb(${s[0]%5},${s[1]%5},${s[2]%5})`;
        ctx.fillRect(s[3] % Math.max(1, this.width - 1), 0, 1, 1);
        ctx.globalAlpha = pa;
        ctx.globalCompositeOperation = pc;
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

  try {
    const ana = window.AnalyserNode?.prototype;
    if (ana?.getFloatTimeDomainData) {
      const oa = ana.getFloatTimeDomainData;
      ana.getFloatTimeDomainData = function(arr) {
        oa.call(this, arr);
        const b = new Uint8Array(arr.length * 4);
        crypto.getRandomValues(b);
        const f = new Float32Array(b.buffer);
        for (let i = 0; i < arr.length; i++) arr[i] += f[i] * 1e-10;
      };
    }
  } catch(e) {}

  try {
    Object.defineProperty(document, 'hidden',          { get: () => false,     configurable: true });
    Object.defineProperty(document, 'visibilityState', { get: () => 'visible', configurable: true });
  } catch(e) {}

  const origAdd = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function(type, fn, opt) {
    if (type === 'visibilitychange') return;
    return origAdd.call(this, type, fn, opt);
  };
  _ns.set(EventTarget.prototype.addEventListener, 'function addEventListener() { [native code] }');

  const UserSim = {
    id: null,
    start() {
      if (this.id) return;
      this.id = N.setInterval(() => {
        if (!USER_SIM) return;
        window.scrollBy({ top: (Math.random() - 0.5) * 80, behavior: 'smooth' });
        if (Math.random() < 0.2) {
          const x = 50 + Math.random() * (innerWidth  - 100);
          const y = 50 + Math.random() * (innerHeight - 100);
          document.elementFromPoint(x, y)?.dispatchEvent(
            new MouseEvent('mousemove', { clientX: x, clientY: y, bubbles: true })
          );
        }
      }, 10000 + Math.random() * 5000);
    },
    stop() { if (this.id) { N.clearInterval(this.id); this.id = null; } }
  };

  const UI = {
    dot: null, panel: null, speedEl: null, hideTimer: null,

    init() {
      const mount = () => {
        if (document.getElementById('sc-dot')) return;
        this.build();
      };
      document.body ? mount() : document.addEventListener('DOMContentLoaded', mount);
    },

    build() {
      this.dot = document.createElement('div');
      this.dot.id = 'sc-dot';
      Object.assign(this.dot.style, {
        position: 'fixed', bottom: '20px', right: '16px',
        width: '20px', height: '20px', borderRadius: '50%',
        background: 'rgba(255,255,255,0.3)',
        zIndex: '2147483645', cursor: 'pointer',
        boxShadow: '0 0 8px rgba(0,0,0,0.5)'
      });
      this.dot.addEventListener('pointerup', e => {
        e.preventDefault(); e.stopPropagation(); this.togglePanel();
      });
      this.dot.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
      });

      this.panel = document.createElement('div');
      this.panel.id = 'sc-panel';
      Object.assign(this.panel.style, {
        display: 'none', position: 'fixed', bottom: '52px', right: '10px',
        background: 'rgba(10,10,20,0.94)',
        border: '1px solid rgba(255,255,255,0.12)', borderRadius: '14px',
        padding: '12px', minWidth: '172px',
        zIndex: '2147483647', flexDirection: 'column', alignItems: 'stretch',
        gap: '8px', fontFamily: 'system-ui, -apple-system, sans-serif',
        boxShadow: '0 8px 28px rgba(0,0,0,0.65), 0 0 20px rgba(0,240,255,0.15)'
      });

      const row = document.createElement('div');
      row.style.cssText = 'display:flex;align-items:center;justify-content:center;gap:8px;';

      const btnM = document.createElement('button');
      btnM.textContent = '−';
      btnM.style.cssText = 'width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
      btnM.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); setSpeed(SPEED - STEP); this.resetTimer(); });

      this.speedEl = document.createElement('span');
      this.speedEl.id = 'sc-spd';
      this.speedEl.textContent = SPEED % 1 === 0 ? SPEED.toFixed(0) : SPEED.toFixed(2);
      this.speedEl.style.cssText = 'font-size:28px;font-weight:800;color:#fff;min-width:54px;text-align:center;cursor:pointer;';
      this.speedEl.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        const inp = document.createElement('input');
        inp.id = 'sc-spd-input'; inp.type = 'number';
        inp.min = MIN; inp.max = MAX; inp.step = 'any'; inp.value = SPEED;
        inp.style.cssText = 'width:54px;font-size:22px;font-weight:700;background:transparent;border:1px solid rgba(255,255,255,0.3);color:#fff;text-align:center;border-radius:6px;outline:none;padding:2px 0;';
        this.speedEl.replaceWith(inp);
        inp.focus();
        const done = () => { setSpeed(inp.value); inp.replaceWith(this.speedEl); };
        inp.addEventListener('blur', done);
        inp.addEventListener('keydown', ev => { if (ev.key === 'Enter') done(); });
      });

      const btnP = document.createElement('button');
      btnP.textContent = '+';
      btnP.style.cssText = 'width:36px;height:36px;border-radius:8px;background:rgba(255,255,255,0.09);border:1px solid rgba(255,255,255,0.12);color:#fff;font-size:18px;cursor:pointer;display:flex;align-items:center;justify-content:center;';
      btnP.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); setSpeed(SPEED + STEP); this.resetTimer(); });

      row.appendChild(btnM);
      row.appendChild(this.speedEl);
      row.appendChild(btnP);
      this.panel.appendChild(row);

      const turbo = document.createElement('button');
      turbo.id = 'sc-turbo';
      turbo.textContent = 'Turbo 1000x';
      turbo.style.cssText = 'width:100%;height:32px;border-radius:8px;font-size:12px;font-weight:700;background:rgba(255,170,0,0.2);color:#ffa500;border:1px solid rgba(255,170,0,0.3);cursor:pointer;';
      turbo.addEventListener('pointerdown', e => { e.preventDefault(); e.stopPropagation(); setSpeed(1000); this.resetTimer(); });
      this.panel.appendChild(turbo);

      const clearBtn = document.createElement('button');
      clearBtn.id = 'sc-clear';
      clearBtn.textContent = 'Clear Data';
      clearBtn.style.cssText = 'width:100%;height:32px;border-radius:8px;font-size:12px;font-weight:700;background:rgba(200,50,50,0.15);color:#f88;border:1px solid rgba(200,50,50,0.3);cursor:pointer;';
      clearBtn.addEventListener('pointerdown', e => {
        e.preventDefault(); e.stopPropagation();
        document.cookie.split(';').forEach(c => {
          document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
        });
        try { localStorage.clear(); } catch(e) {}
        try { sessionStorage.clear(); } catch(e) {}
        location.reload();
      });
      this.panel.appendChild(clearBtn);

      document.body.appendChild(this.panel);
      document.body.appendChild(this.dot);

      const brand = document.createElement('div');
      brand.id = 'sc-brand';
      brand.textContent = 'Speeder Cheat';
      brand.style.cssText = 'position:fixed;top:10px;left:50%;transform:translateX(-50%);font-size:17px;font-weight:800;z-index:2147483646;pointer-events:none;font-family:system-ui,sans-serif;letter-spacing:1px;background:linear-gradient(90deg,transparent,#fff,transparent);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:sc-shine 2.5s linear infinite;';
      document.body.appendChild(brand);

      const sig = document.createElement('div');
      sig.id = 'sc-sig';
      sig.textContent = 'Created by devrl333';
      sig.style.cssText = 'position:fixed;bottom:12px;left:50%;transform:translateX(-50%);font-size:12px;font-weight:600;z-index:2147483646;pointer-events:none;font-family:system-ui,sans-serif;background:linear-gradient(90deg,red,orange,yellow,green,blue,indigo,violet);background-size:200% 100%;-webkit-background-clip:text;-webkit-text-fill-color:transparent;animation:sc-rainbow 3s linear infinite;';
      document.body.appendChild(sig);

      if (!document.getElementById('sc-styles')) {
        const style = document.createElement('style');
        style.id = 'sc-styles';
        style.textContent = `
          @keyframes sc-rainbow { 0% { background-position: 0% 50%; } 100% { background-position: 200% 50%; } }
          @keyframes sc-shine   { 0% { background-position: -200% 50%; } 100% { background-position: 200% 50%; } }
        `;
        document.head.appendChild(style);
      }

      this.bindDrag(this.dot, this.panel);
    },

    togglePanel() {
      if (!this.panel) return;
      const isOpen = this.panel.style.display === 'flex';
      this.panel.style.display = isOpen ? 'none' : 'flex';
      if (!isOpen) this.resetTimer();
      else this.clearTimer();
    },

    clearTimer() { if (this.hideTimer) { N.clearTimeout(this.hideTimer); this.hideTimer = null; } },
    resetTimer() {
      this.clearTimer();
      this.hideTimer = N.setTimeout(() => { if (this.panel) this.panel.style.display = 'none'; }, 12000);
    },

    bindDrag(handle, panel) {
      let sx, sy, bx, by, mv = false;
      handle.addEventListener('pointerdown', e => {
        if (e.target.tagName === 'BUTTON' || e.target.id === 'sc-spd') return;
        sx = e.clientX; sy = e.clientY;
        bx = parseInt(panel.style.right  || 10);
        by = parseInt(panel.style.bottom || 52);
        mv = false;
        handle.setPointerCapture(e.pointerId);
        e.stopPropagation();
      });
      handle.addEventListener('pointermove', e => {
        const dx = e.clientX - sx, dy = e.clientY - sy;
        if (!mv && Math.abs(dx) < 4 && Math.abs(dy) < 4) return;
        mv = true;
        panel.style.right  = Math.max(0, bx - dx) + 'px';
        panel.style.bottom = Math.max(0, by + dy) + 'px';
      });
      handle.addEventListener('pointerup', e => {
        mv = false;
        handle.releasePointerCapture(e.pointerId);
      });
    }
  };

  window.SpeedCheat = {
    setSpeed,
    get speed()     { return SPEED; },
    set timeSync(v) { TIME_SYNC = v; persist(); },
    get timeSync()  { return TIME_SYNC; },
    set simulate(v) { USER_SIM = v; v ? UserSim.start() : UserSim.stop(); persist(); },
    get simulate()  { return USER_SIM; },
    clearData() {
      document.cookie.split(';').forEach(c => {
        document.cookie = c.replace(/^ +/, '').replace(/=.*/, '=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/');
      });
      try { localStorage.clear(); } catch(e) {}
      try { sessionStorage.clear(); } catch(e) {}
      location.reload();
    },
  };

  function init() {
    UI.init();
    if (USER_SIM) UserSim.start();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();

})();
