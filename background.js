'use strict';

// Known tracking cookie name patterns
const TRACKING_PATTERNS = [
  // Google Analytics
  /^_ga$/, /^_gid$/, /^_gat/, /^__utma$/, /^__utmb$/, /^__utmc$/, /^__utmz$/, /^__utmt$/,
  // Google Ads / DoubleClick
  /^_gcl_/, /^IDE$/, /^NID$/, /^DSID$/, /^ANID$/, /^RUL$/,
  // Facebook / Meta
  /^_fb/, /^fr$/, /^datr$/, /^sb$/, /^wd$/, /^dpr$/, /^presence$/, /^fbm_/, /^fbs_/,
  // TikTok
  /^_tt/, /^tt_/, /^ttwid$/, /^msToken$/, /^s_v_web_id$/, /^odin_tt$/, /^tt_chain_token$/,
  // Mixpanel
  /^mp_/, /^mixpanel_/,
  // HubSpot
  /^hubspotutk$/, /^__hstc$/, /^__hssc$/, /^__hssrc$/,
  // Hotjar
  /^_hj/,
  // Pinterest
  /^_pin_unauth$/, /^_pinterest_/,
  // Adobe Analytics / Target
  /^s_cc$/, /^s_sq$/, /^s_vi$/, /^mbox$/, /^demdex$/, /^dpm$/, /^AMCV_/, /^at_check$/,
  // Microsoft / Bing
  /^MUID$/, /^_uetsid$/, /^_uetvid$/,
  // AppNexus / Xandr
  /^uuid2$/, /^anj$/, /^sess$/,
  // Twitter / X
  /^_twitter_sess$/, /^eu_cn$/, /^ct0$/,
  // LinkedIn
  /^bcookie$/, /^bscookie$/, /^lidc$/, /^li_sugr$/,
  // Segment
  /^ajs_user_id$/, /^ajs_anonymous_id$/,
  // OptinMonster
  /^_omappvp$/, /^_omappvs$/,
  // Intercom
  /^intercom-/,
  // Criteo
  /^uid$/, /^dis$/,
  // Yahoo / Oath
  /^B$/, /^APID$/, /^APIDTS$/,
  // General ad/tracking patterns
  /^__gads$/, /^__gpi$/, /^_dc_gtm_/,
  // Amplitude
  /^amplitude_/, /^amp_/,
  // Device fingerprinting
  /^_device_id$/,
];

function isTrackingCookie(name) {
  return TRACKING_PATTERNS.some(pattern => pattern.test(name));
}

function cookieUrl(cookie) {
  const domain = cookie.domain.replace(/^\./, '');
  const scheme = cookie.secure ? 'https' : 'http';
  return `${scheme}://${domain}${cookie.path}`;
}

function logRemoval(cookie) {
  const today = new Date().toISOString().slice(0, 10);
  const domain = cookie.domain.replace(/^\./, '');
  chrome.storage.local.get(['removedLog', 'totalCount', 'domainStats', 'nameStats', 'dailyStats'], (data) => {
    const log = data.removedLog || [];
    const domainStats = data.domainStats || {};
    const nameStats = data.nameStats || {};
    const dailyStats = data.dailyStats || {};

    log.unshift({ name: cookie.name, domain, ts: Date.now() });
    if (log.length > 500) log.length = 500;

    domainStats[domain] = (domainStats[domain] || 0) + 1;
    nameStats[cookie.name] = (nameStats[cookie.name] || 0) + 1;
    dailyStats[today] = (dailyStats[today] || 0) + 1;

    // Trim daily stats older than 30 days
    const cutoff = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    for (const d of Object.keys(dailyStats)) {
      if (d < cutoff) delete dailyStats[d];
    }

    chrome.storage.local.set({
      removedLog: log,
      totalCount: (data.totalCount || 0) + 1,
      domainStats,
      nameStats,
      dailyStats,
    });
  });
}

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.removed) return;

  const cookie = changeInfo.cookie;
  if (!isTrackingCookie(cookie.name)) return;

  chrome.storage.local.get(['enabled'], (data) => {
    if (data.enabled === false) return;

    const url = cookieUrl(cookie);
    chrome.cookies.remove({ url, name: cookie.name }, () => {
      if (chrome.runtime.lastError) {
        console.warn(`[cookie-cleaner] Could not remove ${cookie.name}: ${chrome.runtime.lastError.message}`);
        return;
      }
      console.log(`[cookie-cleaner] Removed tracking cookie: ${cookie.name} (${cookie.domain})`);
      logRemoval(cookie);
    });
  });
});

// Handle messages from popup and dashboard
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_STATS') {
    chrome.storage.local.get(['removedLog', 'totalCount'], (data) => {
      sendResponse({ log: data.removedLog || [], totalCount: data.totalCount || 0 });
    });
    return true;
  }

  if (msg.type === 'GET_DASHBOARD_STATS') {
    chrome.storage.local.get(
      ['removedLog', 'totalCount', 'domainStats', 'nameStats', 'dailyStats', 'lsTotalCount', 'lsKeyStats'],
      (data) => {
        sendResponse({
          log: data.removedLog || [],
          totalCount: data.totalCount || 0,
          domainStats: data.domainStats || {},
          nameStats: data.nameStats || {},
          dailyStats: data.dailyStats || {},
          lsTotalCount: data.lsTotalCount || 0,
          lsKeyStats: data.lsKeyStats || {},
        });
      }
    );
    return true;
  }

  if (msg.type === 'LS_EVENT') {
    const today = new Date().toISOString().slice(0, 10);
    chrome.storage.local.get(['lsTotalCount', 'lsKeyStats', 'dailyStats'], (data) => {
      const lsKeyStats = data.lsKeyStats || {};
      const dailyStats = data.dailyStats || {};
      lsKeyStats[msg.key] = (lsKeyStats[msg.key] || 0) + 1;
      dailyStats[today] = (dailyStats[today] || 0); // keep cookie daily count separate
      chrome.storage.local.set({
        lsTotalCount: (data.lsTotalCount || 0) + 1,
        lsKeyStats,
      });
    });
    return false; // no response needed
  }

  if (msg.type === 'REMOVE_COOKIE') {
    chrome.cookies.remove({ url: msg.url, name: msg.name }, () => {
      sendResponse({ ok: !chrome.runtime.lastError });
    });
    return true;
  }

  if (msg.type === 'GET_ENABLED') {
    chrome.storage.local.get(['enabled'], (data) => {
      sendResponse({ enabled: data.enabled !== false });
    });
    return true;
  }

  if (msg.type === 'SET_ENABLED') {
    chrome.storage.local.set({ enabled: msg.enabled }, () => sendResponse({ ok: true }));
    return true;
  }

  if (msg.type === 'CLEAR_LOG') {
    chrome.storage.local.set({
      removedLog: [], totalCount: 0, domainStats: {}, nameStats: {}, dailyStats: {},
      lsTotalCount: 0, lsKeyStats: {},
    }, () => sendResponse({ ok: true }));
    return true;
  }
});
