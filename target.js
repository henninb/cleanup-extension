'use strict';

function removeDownloadAppBanner() {
  document.querySelectorAll('.top-banner-carousel-item-inner').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed download app banner');
  });
}

try {
  removeDownloadAppBanner();
} catch (err) {
  console.warn('[cleanup-extension] target.js init error:', err);
}

const observer = new MutationObserver(() => {
  try {
    removeDownloadAppBanner();
  } catch (err) {
    console.warn('[cleanup-extension] target.js observer error:', err);
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
