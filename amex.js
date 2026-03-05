'use strict';

function removeCardMemberSection() {
  document.querySelectorAll('.us-card-member').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed us-card-member section');
  });
}

function removeMembershipOffer() {
  document.querySelectorAll('[data-testid="axp-overview-membership-offer"]').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed membership offer panel');
  });
}

function removeMemberOffers() {
  document.querySelectorAll('[data-module-name="axp-overview-member-offers"]').forEach(el => {
    el.remove();
    console.log('[cleanup-extension] Removed Amex member offers section');
  });
}

function removePersonalizedMarketing() {
  document.querySelectorAll('[data-module-name="axp-personalized-marketing"]').forEach(el => {
    const region = el.closest('[aria-label="Marketing"]') || el;
    region.remove();
    console.log('[cleanup-extension] Removed Amex personalized marketing ad');
  });
}

function cleanup() {
  removeCardMemberSection();
  removeMembershipOffer();
  removePersonalizedMarketing();
  removeMemberOffers();
}

cleanup();

const observer = new MutationObserver(() => {
  cleanup();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});
