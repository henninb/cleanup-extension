'use strict';

function checkTerms() {
  const checkbox = document.querySelector('.terms-and-conditions-checkbox');
  if (checkbox && !checkbox.checked) {
    checkbox.checked = true;
    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[cleanup-extension] Checked terms and conditions checkbox');
  }
}

function selectPayToday() {
  // Strategy 1: radio input whose label text contains "pay today"
  const labels = document.querySelectorAll('label');
  for (const label of labels) {
    if (/pay today/i.test(label.textContent)) {
      const radio =
        label.querySelector('input[type="radio"]') ||
        (label.htmlFor && document.getElementById(label.htmlFor));
      if (radio && !radio.checked) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('[cleanup-extension] Selected Pay Today (radio)');
        return true;
      }
      if (radio && radio.checked) return false; // already selected, nothing to do
    }
  }

  // Strategy 2: button or tab element whose text is "pay today"
  const candidates = document.querySelectorAll('button, [role="tab"], [role="radio"], .ic-payment-option');
  for (const el of candidates) {
    if (/pay today/i.test(el.textContent) && !el.dataset.cleanupSelected) {
      el.dataset.cleanupSelected = 'true';
      el.click();
      console.log('[cleanup-extension] Clicked Pay Today (button/tab)');
      return true;
    }
  }

  return false;
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

// Watch for "Proceed to Payment" and "Pay Today" appearing at any time
const observer = new MutationObserver(() => {
  selectPayToday();
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
selectPayToday();
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
