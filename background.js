'use strict';

// Known tracking cookie name patterns
const EXEMPT_DOMAINS = [
  'adp.com',
];

function isExemptDomain(cookieDomain) {
  const domain = cookieDomain.replace(/^\./, '');
  return EXEMPT_DOMAINS.some(d => domain === d || domain.endsWith('.' + d));
}

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

// Serialise all read-modify-write storage updates to prevent concurrent
// onChanged events from overwriting each other's increments.
let _logQueue = Promise.resolve();

function logRemoval(cookie) {
  _logQueue = _logQueue.then(() => new Promise(resolve => {
    const today = new Date().toISOString().slice(0, 10);
    const domain = cookie.domain.replace(/^\./, '');
    chrome.storage.local.get(['removedLog', 'totalCount', 'domainStats', 'nameStats', 'dailyStats'], (data) => {
      if (chrome.runtime.lastError) {
        console.warn(`[cookie-cleaner] logRemoval read error: ${chrome.runtime.lastError.message}`);
        resolve();
        return;
      }
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
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn(`[cookie-cleaner] logRemoval write error: ${chrome.runtime.lastError.message}`);
        }
        resolve();
      });
    });
  }));
}

chrome.cookies.onChanged.addListener((changeInfo) => {
  if (changeInfo.removed) return;

  const cookie = changeInfo.cookie;
  if (isExemptDomain(cookie.domain)) return;
  if (!isTrackingCookie(cookie.name)) return;

  chrome.storage.local.get(['enabled'], (data) => {
    if (chrome.runtime.lastError) {
      console.warn(`[cookie-cleaner] onChanged: storage read error: ${chrome.runtime.lastError.message}`);
      return;
    }
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
      if (chrome.runtime.lastError) {
        console.warn(`[cookie-cleaner] GET_STATS error: ${chrome.runtime.lastError.message}`);
        sendResponse({ log: [], totalCount: 0 });
        return;
      }
      sendResponse({ log: data.removedLog || [], totalCount: data.totalCount || 0 });
    });
    return true;
  }

  if (msg.type === 'GET_DASHBOARD_STATS') {
    chrome.storage.local.get(
      ['removedLog', 'totalCount', 'domainStats', 'nameStats', 'dailyStats', 'lsTotalCount', 'lsKeyStats'],
      (data) => {
        if (chrome.runtime.lastError) {
          console.warn(`[cookie-cleaner] GET_DASHBOARD_STATS error: ${chrome.runtime.lastError.message}`);
          sendResponse({ log: [], totalCount: 0, domainStats: {}, nameStats: {}, dailyStats: {}, lsTotalCount: 0, lsKeyStats: {} });
          return;
        }
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
    // Validate key: non-empty string, max 200 chars to prevent storage exhaustion
    const key = typeof msg.key === 'string' && msg.key.length > 0 && msg.key.length <= 200
      ? msg.key : null;
    if (!key) {
      console.warn('[cookie-cleaner] LS_EVENT: invalid or oversized key dropped', msg.key);
      return false;
    }

    chrome.storage.local.get(['lsTotalCount', 'lsKeyStats'], (data) => {
      if (chrome.runtime.lastError) {
        console.warn(`[cookie-cleaner] LS_EVENT read error: ${chrome.runtime.lastError.message}`);
        return;
      }
      const lsKeyStats = data.lsKeyStats || {};
      // Cap at 1000 unique keys to bound storage usage
      if (!lsKeyStats[key] && Object.keys(lsKeyStats).length >= 1000) return;
      lsKeyStats[key] = (lsKeyStats[key] || 0) + 1;
      chrome.storage.local.set({
        lsTotalCount: (data.lsTotalCount || 0) + 1,
        lsKeyStats,
      }, () => {
        if (chrome.runtime.lastError) {
          console.warn(`[cookie-cleaner] LS_EVENT write error: ${chrome.runtime.lastError.message}`);
        }
      });
    });
    return false; // no response needed
  }

  if (msg.type === 'REMOVE_COOKIE') {
    if (typeof msg.url !== 'string' || typeof msg.name !== 'string') {
      console.warn('[cookie-cleaner] REMOVE_COOKIE: invalid url or name', msg.url, msg.name);
      sendResponse({ ok: false });
      return true;
    }
    chrome.cookies.remove({ url: msg.url, name: msg.name }, () => {
      if (chrome.runtime.lastError) {
        console.warn(`[cookie-cleaner] REMOVE_COOKIE failed for "${msg.name}": ${chrome.runtime.lastError.message}`);
      }
      sendResponse({ ok: !chrome.runtime.lastError });
    });
    return true;
  }

  if (msg.type === 'GET_ENABLED') {
    chrome.storage.local.get(['enabled'], (data) => {
      if (chrome.runtime.lastError) {
        console.warn(`[cookie-cleaner] GET_ENABLED error: ${chrome.runtime.lastError.message}`);
        sendResponse({ enabled: true });
        return;
      }
      sendResponse({ enabled: data.enabled !== false });
    });
    return true;
  }

  if (msg.type === 'SET_ENABLED') {
    chrome.storage.local.set({ enabled: msg.enabled }, () => {
      if (chrome.runtime.lastError) {
        console.warn(`[cookie-cleaner] SET_ENABLED error: ${chrome.runtime.lastError.message}`);
        sendResponse({ ok: false });
        return;
      }
      sendResponse({ ok: true });
    });
    return true;
  }

  if (msg.type === 'CLEAR_LOG') {
    chrome.storage.local.set({
      removedLog: [], totalCount: 0, domainStats: {}, nameStats: {}, dailyStats: {},
      lsTotalCount: 0, lsKeyStats: {},
    }, () => {
      if (chrome.runtime.lastError) {
        console.warn(`[cookie-cleaner] CLEAR_LOG error: ${chrome.runtime.lastError.message}`);
        sendResponse({ ok: false });
        return;
      }
      sendResponse({ ok: true });
    });
    return true;
  }
});

console.log('[cookie-cleaner] Service worker initialized');
