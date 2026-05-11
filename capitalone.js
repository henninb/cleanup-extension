'use strict';

function removeHeroBar() {
  document.querySelectorAll('.c1-ease-hero-bar').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed Capital One hero bar');
  });
}

try {
  removeHeroBar();
} catch (err) {
  console.warn('[cleanup-extension] capitalone.js init error:', err);
}

const observer = new MutationObserver(() => {
  try {
    removeHeroBar();
  } catch (err) {
    console.warn('[cleanup-extension] capitalone.js observer error:', err);
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
