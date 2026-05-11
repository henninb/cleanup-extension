'use strict';

// Runs in ISOLATED world — receives postMessage events from ls-guard.js
// and forwards them to the background service worker for stat tracking.

window.addEventListener('message', (event) => {
  if (event.source !== window) return;
  // Reject messages from cross-origin iframes that somehow share this window reference
  if (event.origin !== location.origin) return;
  if (!event.data || event.data.type !== '__CLEANUP_EXT_LS__') return;

  const { action, key, store } = event.data;
  if (!key || !action) return;

  chrome.runtime.sendMessage({
    type: 'LS_EVENT',
    action,   // 'blocked' | 'purged'
    key,
    store,    // 'localStorage' | 'sessionStorage'
  }).catch((err) => {
    console.debug('[cleanup-extension] ls-reporter: sendMessage failed (background not ready?):', err.message);
  });
});
