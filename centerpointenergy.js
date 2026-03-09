'use strict';

let sendCodeClicked = false;

function selectEmailRadio() {
  const emailRadio =
    document.getElementById('custom_email') ||
    document.querySelector('input[type="radio"][value="email"][name="customMfaMethod"]');

  if (emailRadio && !emailRadio.checked) {
    emailRadio.click();
    console.log('[cleanup-extension] Selected email radio button');
  }

  return !!(emailRadio && emailRadio.checked);
}

function clickSendCode() {
  if (sendCodeClicked) return;

  const btn = document.getElementById('sendCode');
  if (btn && btn.offsetParent !== null) {
    sendCodeClicked = true;
    btn.click();
    console.log('[cleanup-extension] Clicked Send Code button');
  }
}

function run() {
  if (selectEmailRadio()) {
    clickSendCode();
  }
}

const observer = new MutationObserver(() => {
  run();
});

observer.observe(document.documentElement, {
  childList: true,
  subtree: true
});

run();
