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

cleanup();

const observer = new MutationObserver(() => {
  cleanup();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
