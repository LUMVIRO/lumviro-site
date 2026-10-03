'use strict';
(() => {
  const canvas = document.querySelector('#led-demo');
  const ctx = canvas.getContext('2d');
  const stage = document.querySelector('#demo-stage');
  const input = document.querySelector('#demo-message');
  const color = document.querySelector('#demo-color');
  const speed = document.querySelector('#demo-speed');
  const play = document.querySelector('#demo-play');
  const full = document.querySelector('#demo-fullscreen');
  const status = document.querySelector('#demo-status');
  const menu = document.querySelector('#mode-menu');
  const editor = document.querySelector('#mode-editor');
  const back = document.querySelector('#mode-back');
  const motion = document.querySelector('#demo-motion');
  const style = document.querySelector('#demo-style');
  const background = document.querySelector('#demo-background');
  let activeMode = null, origin = null, pulseTime = 0;
  const drafts = {
    love: {text:'I LOVE YOU ♥', color:'#ff86ce', background:'#170d22', motion:'pulse', style:'led', speed:'110'},
    note: {text:'BACK IN 5 MIN', color:'#ffffff', background:'#02040a', motion:'static', style:'plain', speed:'110'}
  };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const ink = document.createElement('canvas');
  const pen = ink.getContext('2d');
  let paused = reduced.matches, visible = true, frame = 0, last = 0;
  let w = 0, h = 0, x = 0, textWidth = 0, fontSize = 0;
  let dots, unlit;
  function message() { return input.value.trim() || 'HELLO!'; }
  function pattern(fill, radius) {
    const tile = document.createElement('canvas');
    tile.width = tile.height = 7;
    const p = tile.getContext('2d');
    p.fillStyle = fill; p.beginPath(); p.arc(3.5, 3.5, radius, 0, Math.PI * 2); p.fill();
    return pen.createPattern(tile, 'repeat');
  }
  function measure(reset = false) {
    fontSize = Math.min(h * .54, 190);
    pen.font = `800 ${fontSize}px system-ui, sans-serif`;
    textWidth = pen.measureText(message()).width;
    if ((paused || motion.value !== 'scroll') && textWidth > w - 40) {
      fontSize *= Math.max(1, w - 40) / textWidth;
      pen.font = `800 ${fontSize}px system-ui, sans-serif`;
      textWidth = pen.measureText(message()).width;
    }
    if (reset) x = textWidth <= w - 32 ? (w - textWidth) / 2 : 24;
  }
  function resize() {
    const rect = canvas.getBoundingClientRect();
    w = Math.max(1, rect.width); h = Math.max(1, rect.height);
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = ink.width = Math.round(w * dpr);
    canvas.height = ink.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    pen.setTransform(dpr, 0, 0, dpr, 0, 0);
    dots = pattern(color.value, 2.8); unlit = pattern('#101522', 2.2);
    measure(true); draw();
  }
  function draw() {
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = background.value; ctx.fillRect(0, 0, w, h);
    if (style.value === 'led') { ctx.fillStyle = unlit; ctx.fillRect(0, 0, w, h); }
    pen.clearRect(0, 0, w, h); pen.globalCompositeOperation = 'source-over';
    pen.font = `800 ${fontSize}px system-ui, sans-serif`;
    pen.textBaseline = 'middle'; pen.fillStyle = color.value;
    const pos = motion.value === 'scroll' && !paused ? x : (w - textWidth) / 2;
    pen.fillText(message(), pos, h / 2);
    if (style.value === 'led') {
      pen.globalCompositeOperation = 'source-in'; pen.fillStyle = dots; pen.fillRect(0, 0, w, h);
    }
    pen.globalCompositeOperation = 'source-over';
    ctx.shadowColor = color.value; ctx.shadowBlur = style.value === 'led' ? 7 : 0;
    ctx.globalAlpha = motion.value === 'pulse' && !paused ? .90 + .10 * Math.sin(pulseTime) : 1;
    ctx.drawImage(ink, 0, 0, w, h); ctx.shadowBlur = 0; ctx.globalAlpha = 1;
  }
  function tick(now) {
    frame = 0;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
    pulseTime += dt * Number(speed.value) / 55;
    if (motion.value === 'scroll') x -= Number(speed.value) * dt;
    if (x + textWidth < 0) x = w;
    draw(); schedule();
  }
  function schedule() {
    if (activeMode && motion.value !== 'static' && !paused && visible && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    play.hidden = motion.value === 'static';
    document.querySelector('#speed-control').hidden = motion.value === 'static';
    play.textContent = paused ? 'Play' : 'Pause';
    play.setAttribute('aria-pressed', String(paused));
    draw(); schedule();
  }
  function saveDraft() {
    if (activeMode) drafts[activeMode] = {text:input.value, color:color.value,
      background:background.value, motion:motion.value, style:style.value, speed:speed.value};
  }
  document.querySelectorAll('[data-mode].scenario').forEach(card => card.addEventListener('click', () => {
    origin = card; activeMode = card.dataset.mode;
    const d = drafts[activeMode];
    input.value = d.text; color.value = d.color; background.value = d.background;
    motion.value = d.motion; style.value = d.style; speed.value = d.speed;
    paused = reduced.matches; pulseTime = 0;
    menu.hidden = true; document.querySelector('#scenario-caption').hidden = true;
    editor.hidden = false; editor.dataset.mode = activeMode;
    document.querySelector('#mode-title').textContent = activeMode === 'love' ? '♥ Love' : 'Leave a message';
    document.querySelector('#mode-tip').textContent = activeMode === 'love'
      ? 'Make it personal: try a name, a greeting, or a message for someone special.'
      : 'Your note is visible to everyone nearby. This demo does not lock your phone. Keep it out of heat and direct sunlight.';
    canvas.setAttribute('aria-label', 'Message preview: ' + message());
    resize(); sync(); back.focus();
    editor.scrollIntoView({block:'start', behavior:'instant'});
  }));
  back.addEventListener('click', () => {
    saveDraft(); activeMode = null; sync(); editor.hidden = true; menu.hidden = false;
    document.querySelector('#scenario-caption').hidden = false;
    origin?.focus();
  });
  [motion, style, background].forEach(control => control.addEventListener('change', () => {
    if (control === background) {
      if (background.value === '#f5f2e9') color.value = '#18202b';
      else if (color.value === '#18202b') color.value = '#ffffff';
      dots = pattern(color.value, 2.8);
    }
    measure(true); sync();
  }));
  input.addEventListener('input', () => {
    canvas.setAttribute('aria-label', 'LED message: ' + message()); measure(true); draw();
  });
  color.addEventListener('change', () => { dots = pattern(color.value, 2.8); draw(); });
  play.addEventListener('click', () => { paused = !paused; measure(true); sync(); });
  reduced.addEventListener('change', () => { paused = reduced.matches; measure(true); sync(); });
  document.addEventListener('visibilitychange', sync);
  new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; sync(); }).observe(stage);
  new ResizeObserver(resize).observe(canvas);
  function expanded() { return document.fullscreenElement === stage || stage.classList.contains('expanded'); }
  function syncFullscreen() {
    full.textContent = expanded() ? 'Exit fullscreen ✕' : 'Show fullscreen ↗';
    full.setAttribute('aria-expanded', String(expanded()));
    resize();
  }
  function closeFallback() {
    stage.classList.remove('expanded'); document.body.classList.remove('modal-open'); syncFullscreen(); full.focus();
  }
  full.addEventListener('click', async () => {
    if (document.fullscreenElement === stage) { await document.exitFullscreen(); return; }
    if (stage.classList.contains('expanded')) { closeFallback(); return; }
    try {
      if (!stage.requestFullscreen) throw new Error('Unsupported');
      await stage.requestFullscreen();
    } catch {
      stage.classList.add('expanded'); document.body.classList.add('modal-open');
      status.textContent = 'Expanded preview opened. Use Exit fullscreen to return.';
    }
    syncFullscreen();
  });
  document.addEventListener('fullscreenchange', syncFullscreen);
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && stage.classList.contains('expanded')) closeFallback();
    if (event.key === 'Tab' && stage.classList.contains('expanded')) {
      if (event.shiftKey && document.activeElement === (play.hidden ? full : play)) { event.preventDefault(); full.focus(); }
      else if (!event.shiftKey && document.activeElement === full) { event.preventDefault(); (play.hidden ? full : play).focus(); }
    }
  });
  const dialog = document.querySelector('#screenshot-dialog');
  const large = document.querySelector('#screenshot-large');
  document.querySelectorAll('.screenshot-link').forEach(link => link.addEventListener('click', event => {
    if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || typeof dialog.showModal !== 'function') return;
    event.preventDefault();
    large.src = link.getAttribute('href'); large.alt = link.querySelector('img').alt;
    document.querySelector('#screenshot-title').textContent = link.dataset.title;
    dialog.showModal(); document.body.classList.add('modal-open');
  }));
  document.querySelector('#close-screenshot').addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => document.body.classList.remove('modal-open'));
  dialog.addEventListener('click', event => { if (event.target === dialog) {
    const r = dialog.getBoundingClientRect();
    if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) dialog.close();
  }});
  resize(); sync();
})();
