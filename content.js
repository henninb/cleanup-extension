'use strict';

// Remove the enroll options dialog if present
function removeEnrollDialog() {
  const dialogContent = document.querySelector(
    'div[matdialogcontent].mat-mdc-dialog-content bki-enroll-options2'
  );

  if (dialogContent) {
    const overlay = document.querySelector('.cdk-overlay-container');
    if (overlay) {
      overlay.innerHTML = '';
    } else {
      const wrapper = dialogContent.closest('div[matdialogcontent]');
      if (wrapper) wrapper.remove();
    }

    document.querySelectorAll('.cdk-overlay-backdrop').forEach(el => el.remove());
    console.log('[cleanup-extension] Removed enroll options dialog');
  }
}

// Remove marketing/ad blocks
function removeMarketingAds() {
  document.querySelectorAll('[sd-action-client-config-trackmarketingclick]').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed marketing ad');
  });
}

// Remove neighborhood property value section
function removeNeighborhoodSection() {
  document.querySelectorAll('[sd-h2-dashboard-neighborhood-item1]').forEach(el => {
    const wrapper = el.closest('.wrapper') || el.parentElement;
    if (wrapper) {
      wrapper.remove();
      console.log('[cleanup-extension] Removed neighborhood property value section');
    }
  });
}

// Remove marketing-box cards
function removeMarketingBox() {
  document.querySelectorAll('.marketing-box').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed marketing box');
  });
}

// Remove neighborhood grid item (bki-dashboard-neighborhood)
function removeNeighborhoodGridItem() {
  document.querySelectorAll('bki-dashboard-neighborhood').forEach(el => {
    const gridItem = el.closest('.grid-item') || el.parentElement;
    if (gridItem) {
      gridItem.remove();
      console.log('[cleanup-extension] Removed neighborhood grid item');
    }
  });
}

function cleanup() {
  removeEnrollDialog();
  removeMarketingAds();
  removeNeighborhoodSection();
  removeMarketingBox();
  removeNeighborhoodGridItem();
}

const observer = new MutationObserver(cleanup);

observer.observe(document.body, {
  childList: true,
  subtree: true
});

cleanup();
