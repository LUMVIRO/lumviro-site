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
    if (paused && textWidth > w - 32) {
      fontSize *= Math.max(1, w - 32) / textWidth;
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
    ctx.clearRect(0, 0, w, h); ctx.fillStyle = unlit; ctx.fillRect(0, 0, w, h);
    pen.clearRect(0, 0, w, h); pen.globalCompositeOperation = 'source-over';
    pen.font = `800 ${fontSize}px system-ui, sans-serif`;
    pen.textBaseline = 'middle'; pen.fillStyle = '#fff';
    pen.fillText(message(), x, h / 2);
    pen.globalCompositeOperation = 'source-in'; pen.fillStyle = dots; pen.fillRect(0, 0, w, h);
    pen.globalCompositeOperation = 'source-over';
    ctx.shadowColor = color.value; ctx.shadowBlur = 7;
    ctx.drawImage(ink, 0, 0, w, h); ctx.shadowBlur = 0;
  }
  function tick(now) {
    frame = 0;
    const dt = last ? Math.min((now - last) / 1000, .05) : 0; last = now;
    x -= Number(speed.value) * dt;
    if (x + textWidth < 0) x = w;
    draw(); schedule();
  }
  function schedule() {
    if (!paused && visible && !document.hidden && !frame) frame = requestAnimationFrame(tick);
  }
  function sync() {
    cancelAnimationFrame(frame); frame = 0; last = 0;
    play.textContent = paused ? 'Play' : 'Pause';
    play.setAttribute('aria-pressed', String(paused));
    draw(); schedule();
  }
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
    full.textContent = expanded() ? 'Exit fullscreen ✕' : 'Fullscreen ↗';
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
      if (event.shiftKey && document.activeElement === play) { event.preventDefault(); full.focus(); }
      else if (!event.shiftKey && document.activeElement === full) { event.preventDefault(); play.focus(); }
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
