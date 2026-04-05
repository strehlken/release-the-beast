// Wordle Bootcamp — thin wrapper that loads bootcamp.html in an iframe
// This avoids all scope/CSS conflicts with game.js

const Bootcamp = {
  overlay: null,
  iframe: null,
  active: false,
  onComplete: null,

  init() {
    if (this.overlay) return;
    const el = document.createElement('div');
    el.id = 'bootcamp-overlay';
    Object.assign(el.style, {
      position: 'fixed', top: '0', left: '0', width: '100%', height: '100%',
      display: 'none', zIndex: '10000', background: '#f5f4ef',
    });
    const iframe = document.createElement('iframe');
    iframe.src = 'bootcamp.html';
    iframe.style.cssText = 'width: 100%; height: 100%; border: none;';
    el.appendChild(iframe);
    this.iframe = iframe;
    document.body.appendChild(el);
    this.overlay = el;
  },

  show() {
    this.init();
    this.overlay.style.display = 'block';
    this.active = true;
    // Reload the iframe to reset state
    this.iframe.src = 'bootcamp.html';
  },

  hide() {
    if (this.overlay) this.overlay.style.display = 'none';
    this.active = false;
    if (this.onComplete) this.onComplete();
  },
};
