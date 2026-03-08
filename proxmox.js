'use strict';

console.log('[cleanup-extension] proxmox.js loaded on', location.href);

function dismissSubscriptionPopup() {
  document.querySelectorAll('.x-message-box').forEach(el => {
    const titleEl = el.querySelector('.x-title-text');
    const msgEl = el.querySelector('.x-window-text');
    const isSubscriptionPopup =
      (titleEl && titleEl.textContent.includes('No valid subscription')) ||
      (msgEl && msgEl.textContent.includes('valid subscription'));

    if (!isSubscriptionPopup) return;

    console.log('[cleanup-extension] Dismissing Proxmox subscription popup');

    const zIndex = el.style.zIndex;
    el.remove();

    // Remove the ExtJS shadow element rendered at the same z-index
    if (zIndex) {
      document.querySelectorAll('.x-css-shadow').forEach(shadow => {
        if (shadow.style.zIndex === zIndex) shadow.remove();
      });
    }

    // Remove backdrop mask
    document.querySelectorAll('.x-mask').forEach(m => m.remove());
  });
}

dismissSubscriptionPopup();

const observer = new MutationObserver(dismissSubscriptionPopup);
observer.observe(document.documentElement, { childList: true, subtree: true });

const interval = setInterval(dismissSubscriptionPopup, 200);
setTimeout(() => clearInterval(interval), 30000);
