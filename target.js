'use strict';

function removeDownloadAppBanner() {
  document.querySelectorAll('.top-banner-carousel-item-inner').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed download app banner');
  });
}

removeDownloadAppBanner();

const observer = new MutationObserver(() => {
  removeDownloadAppBanner();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
