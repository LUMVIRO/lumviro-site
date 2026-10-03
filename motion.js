'use strict';
// Progressive enhancement: content is never hidden in the base styles.
(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window) || !Element.prototype.animate) return;
  const running = new Set();
  function animate(node, frames, options) {
    const animation = node.animate(frames, options);
    running.add(animation);
    animation.finished.then(() => running.delete(animation), () => running.delete(animation));
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      const node = entry.target;
      observer.unobserve(node);
      if (reduced.matches || document.hidden) return;
      animate(node, [
        { opacity: .15, transform: 'translateY(18px)' },
        { opacity: 1, transform: 'translateY(0)' }
      ], { duration: 580, easing: 'cubic-bezier(.2,.7,.2,1)' });
      if (node.classList.contains('studio-visual')) {
        node.querySelectorAll('.orbit').forEach((orbit, index) => {
          const start = index ? 35 : -30;
          animate(orbit, [
            { transform: `rotate(${start - 35}deg)` },
            { transform: `rotate(${start}deg)` }
          ], { duration: 1800, easing: 'cubic-bezier(.2,.7,.2,1)' });
        });
      }
    });
  }, { threshold: .08 });
  document.querySelectorAll('.section-title, .life-card, .showcase, .grid article, .featured, .support, .studio-visual, .product-hero, .hero > div:first-child').forEach(node => observer.observe(node));
  function finishMotion() {
    running.forEach(animation => animation.cancel());
    running.clear();
  }
  reduced.addEventListener('change', () => { if (reduced.matches) finishMotion(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) finishMotion(); });
  // Reveal transitions must never obscure a control reached by keyboard.
  document.addEventListener('focusin', finishMotion);
})();
