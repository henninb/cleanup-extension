'use strict';

function uncheckRememberUsername() {
  const checkbox = document.getElementById('rememberUserNameCheckbox');
  if (checkbox) {
    checkbox.checked = false;
    checkbox.removeAttribute('checked');
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[cleanup-extension] Unchecked remember username checkbox');
    return true;
  }
  return false;
}

function removeDownloadBanner() {
  document.querySelectorAll('.download-actions-container').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed download app banner');
  });
}

function removeAdserverTiles() {
  document.querySelectorAll('.adserver-tile').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed adserver tile');
  });
}

function removeAppStoreButtons() {
  const btn = document.getElementById('button-style-apple');
  if (btn) {
    const container = btn.closest('.c-multimedia--contain-1btQT') || btn.closest('picture') || btn.parentElement;
    if (container) {
      container.remove();
      console.log('[cleanup-extension] Removed app store buttons container');
    }
  }
}

function removeLogoutPromo() {
  document.querySelectorAll('div.logout[data-product-info]').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed logout promo banner');
  });
}

function cleanup() {
  uncheckRememberUsername();
  removeDownloadBanner();
  removeAdserverTiles();
  removeAppStoreButtons();
  removeLogoutPromo();
}

try {
  cleanup();
} catch (err) {
  console.warn('[cleanup-extension] barclaycard.js init error:', err);
}

const observer = new MutationObserver(() => {
  try {
    const checkbox = document.getElementById('rememberUserNameCheckbox');
    if (checkbox && checkbox.checked) {
      uncheckRememberUsername();
    }
    removeDownloadBanner();
    removeAdserverTiles();
    removeAppStoreButtons();
    removeLogoutPromo();
  } catch (err) {
    console.warn('[cleanup-extension] barclaycard.js observer error:', err);
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true,
  attributes: true,
  attributeFilter: ['checked']
});

setTimeout(() => {
  try { cleanup(); } catch (err) { console.warn('[cleanup-extension] barclaycard.js setTimeout error:', err); }
}, 500);
setTimeout(() => {
  try { cleanup(); } catch (err) { console.warn('[cleanup-extension] barclaycard.js setTimeout error:', err); }
}, 1500);
