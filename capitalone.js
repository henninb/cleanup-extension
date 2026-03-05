'use strict';

function removeHeroBar() {
  document.querySelectorAll('.c1-ease-hero-bar').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed Capital One hero bar');
  });
}

removeHeroBar();

const observer = new MutationObserver(() => {
  removeHeroBar();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
