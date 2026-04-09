// Wordle Bootcamp — thin wrapper that loads bootcamp.html in an iframe
// This avoids all scope/CSS conflicts with game.js

const Bootcamp = {
  overlay: null,
  iframe: null,
  active: false,
  onComplete: null,
  phase1Done: false,

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
    // Reload — show phase selector if Phase I already done
    const src = this.phase1Done ? 'bootcamp.html?phases=1' : 'bootcamp.html';
    this.iframe.src = src;
  },

  hide() {
    if (this.overlay) this.overlay.style.display = 'none';
    this.active = false;
    this.phase1Done = true; // they've been through at least once
    if (this.onComplete) this.onComplete();
  },
};
