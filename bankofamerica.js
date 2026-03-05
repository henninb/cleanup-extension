'use strict';

function selectTextAndClickNext() {
  const container = document.getElementById('ah-authcode-select-body-container');
  if (!container) return false;

  // Ensure "Text message" radio is selected
  const textRadio = document.getElementById('authcodeTextReceive');
  if (textRadio && !textRadio.checked) {
    textRadio.checked = true;
    textRadio.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[cleanup-extension] Selected Text message radio');
  }

  // Find and click the Next button
  const nextBtn =
    document.querySelector('button#ah-authcode-select-submit') ||
    document.querySelector('button[id*="submit"]') ||
    document.querySelector('button[id*="next"]') ||
    Array.from(document.querySelectorAll('button')).find(
      b => /^\s*next\s*$/i.test(b.textContent)
    );

  if (nextBtn) {
    nextBtn.click();
    console.log('[cleanup-extension] Clicked Next button');
    return true;
  }

  return false;
}

function selectDontRememberDevice() {
  const container = document.getElementById('ah-authcode-validate-body-container');
  if (!container) return false;

  const dontRemember = document.getElementById('dontRememberDevice');
  if (dontRemember && !dontRemember.checked) {
    dontRemember.checked = true;
    dontRemember.dispatchEvent(new Event('change', { bubbles: true }));
    console.log('[cleanup-extension] Selected: No, don\'t remember this device');
  }

  return !!dontRemember;
}

function cleanup() {
  selectTextAndClickNext();
  selectDontRememberDevice();
}

const observer = new MutationObserver(() => {
  cleanup();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

cleanup();
