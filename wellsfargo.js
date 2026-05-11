'use strict';

function removeMobileQR() {
  document.querySelectorAll('[data-testid="mobile-qr"]').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed Wells Fargo mobile QR code');
  });
}

function removePromotionalImage() {
  document.querySelectorAll('[data-testid="promotional-image"]').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed Wells Fargo promotional image');
  });
}

function cleanup() {
  removeMobileQR();
  removePromotionalImage();
}

try {
  cleanup();
} catch (err) {
  console.warn('[cleanup-extension] wellsfargo.js init error:', err);
}

const observer = new MutationObserver(() => {
  try {
    cleanup();
  } catch (err) {
    console.warn('[cleanup-extension] wellsfargo.js observer error:', err);
  }
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
