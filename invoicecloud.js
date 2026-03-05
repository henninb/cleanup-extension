'use strict';

function checkTerms() {
  const checkbox = document.querySelector('.terms-and-conditions-checkbox');
  if (checkbox && !checkbox.checked) {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[cleanup-extension] Checked terms and conditions checkbox');
  }
}

function clickProceedToPayment() {
  const btn = document.querySelector('a.ic-button-primary');
  if (btn && btn.textContent.includes('Proceed to Payment')) {
    checkTerms();
    btn.click();
    console.log('[cleanup-extension] Clicked Proceed to Payment');
    return true;
  }
  return false;
}

// Watch for "Proceed to Payment" appearing at any time
const observer = new MutationObserver(() => {
  checkTerms();
  clickProceedToPayment();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

// When "Pay Selected" is clicked, we're already watching via the observer above.
// Also intercept the click so we can call checkTerms immediately before the
// new component renders, giving it the best chance to be checked on arrival.
function hookPaySelected() {
  const payBtn = document.querySelector('a.ic-button-primary-pay');
  if (payBtn && !payBtn.dataset.cleanupHooked) {
    payBtn.dataset.cleanupHooked = 'true';
    payBtn.addEventListener('click', () => {
      checkTerms();
      console.log('[cleanup-extension] Pay Selected clicked — watching for Proceed to Payment');
    });
    console.log('[cleanup-extension] Hooked Pay Selected button');
  }
}

// Run immediately and via observer for dynamically loaded buttons
checkTerms();
clickProceedToPayment();
hookPaySelected();

// Also hook the Pay Selected button if it loads later
const hookObserver = new MutationObserver(() => {
  hookPaySelected();
});

hookObserver.observe(document.documentElement, {
  childList: true,
  subtree: true
});
