'use strict';

// Runs in MAIN world (document_start) — can override Storage.prototype before any site JS.

const LS_TRACKING_KEYS = [
  // Google Analytics
  /^_ga/, /^_gid/, /^_gat/, /^__utma/, /^__utmb/, /^__utmc/, /^__utmz/,
  // Google Ads / DoubleClick
  /^_gcl_/, /^_dc_gtm_/, /^AMCV_/,
  // Facebook / Meta
  /^_fb/, /^fr$/, /^datr$/, /^sb$/, /^fbm_/, /^fbs_/,
  // Amplitude
  /^amplitude_/, /^amp_/, /^_device_id$/,
  // Mixpanel
  /^mixpanel_/, /^mp_/,
  // Segment
  /^ajs_/,
  // Hotjar
  /^_hj/,
  // HubSpot
  /^hubspot-/, /^hubspotutk/, /^__hstc/, /^__hssc/, /^__hssrc/,
  // Intercom
  /^intercom-/, /^intercom_/,
  // Drift
  /^drift_/,
  // Zendesk / Zopim
  /^__zlcmid/,
  // Branch.io
  /^_branch_/,
  // Optimizely
  /^optimizely_/,
  // TikTok
  /^_tt_/, /^tt_/,
  // Pinterest
  /^_pinterest_/,
  // Adobe Target
  /^mbox/,
  // Criteo
  /^cto_/,
  // LinkedIn Insight
  /^li_/,
  // Twitter / X
  /^twid/,
];

const MSG_TYPE = '__CLEANUP_EXT_LS__';

function isTracking(key) {
  return LS_TRACKING_KEYS.some(p => p.test(key));
}

function dispatch(action, key, store) {
  window.postMessage({ type: MSG_TYPE, action, key, store }, '*');
}

// ── Intercept setItem / getItem / removeItem on both storages ──
const _setItem = Storage.prototype.setItem;
Storage.prototype.setItem = function (key, value) {
  if (isTracking(key)) {
    const store = this === sessionStorage ? 'sessionStorage' : 'localStorage';
    console.debug(`[cleanup-extension] Blocked ${store}.setItem("${key}")`);
    dispatch('blocked', key, store);
    return;
  }
  return _setItem.call(this, key, value);
};

const _getItem = Storage.prototype.getItem;
Storage.prototype.getItem = function (key) {
  if (isTracking(key)) return null;
  return _getItem.call(this, key);
};

// ── Purge any tracking keys that already exist ──
function purge(storage, storeName) {
  const keys = [];
  for (let i = 0; i < storage.length; i++) keys.push(storage.key(i));
  for (const key of keys) {
    if (isTracking(key)) {
      storage.removeItem(key);
      console.debug(`[cleanup-extension] Purged ${storeName} key: "${key}"`);
      dispatch('purged', key, storeName);
    }
  }
}

purge(localStorage, 'localStorage');
purge(sessionStorage, 'sessionStorage');
