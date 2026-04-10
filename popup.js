'use strict';

// Must match the patterns in background.js
const TRACKING_PATTERNS = [
  /^_ga$/, /^_gid$/, /^_gat/, /^__utma$/, /^__utmb$/, /^__utmc$/, /^__utmz$/, /^__utmt$/,
  /^_gcl_/, /^IDE$/, /^NID$/, /^DSID$/, /^ANID$/, /^RUL$/,
  // Facebook / Meta
  /^_fb/, /^fr$/, /^datr$/, /^sb$/, /^wd$/, /^dpr$/, /^presence$/, /^fbm_/, /^fbs_/,
  // TikTok
  /^_tt/, /^tt_/, /^ttwid$/, /^msToken$/, /^s_v_web_id$/, /^odin_tt$/, /^tt_chain_token$/,
  // Mixpanel
  /^mp_/, /^mixpanel_/,
  /^hubspotutk$/, /^__hstc$/, /^__hssc$/, /^__hssrc$/,
  /^_hj/,
  /^_pin_unauth$/, /^_pinterest_/,
  /^s_cc$/, /^s_sq$/, /^s_vi$/, /^mbox$/, /^demdex$/, /^dpm$/, /^AMCV_/, /^at_check$/,
  /^MUID$/, /^_uetsid$/, /^_uetvid$/,
  /^uuid2$/, /^anj$/, /^sess$/,
  /^_twitter_sess$/, /^eu_cn$/, /^ct0$/,
  /^bcookie$/, /^bscookie$/, /^lidc$/, /^li_sugr$/,
  /^ajs_user_id$/, /^ajs_anonymous_id$/,
  /^_omappvp$/, /^_omappvs$/,
  /^intercom-/,
  /^uid$/, /^dis$/,
  /^B$/, /^APID$/, /^APIDTS$/,
  /^__gads$/, /^__gpi$/, /^_dc_gtm_/,
  // Amplitude
  /^amplitude_/, /^amp_/,
  /^_device_id$/,
];

function isTracking(name) {
  return TRACKING_PATTERNS.some(p => p.test(name));
}

function cookieUrl(cookie) {
  const domain = cookie.domain.replace(/^\./, '');
  return `${cookie.secure ? 'https' : 'http'}://${domain}${cookie.path}`;
}

function timeAgo(ts) {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return `${s}s ago`;
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  return `${Math.floor(s / 86400)}d ago`;
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

async function getSiteCookies(tab) {
  try {
    const url = new URL(tab.url);
    const cookies = await chrome.cookies.getAll({ domain: url.hostname });
    return { domain: url.hostname, cookies };
  } catch {
    return { domain: '', cookies: [] };
  }
}

function renderSiteCookies(domain, cookies) {
  document.getElementById('site-domain').textContent = domain;
  const container = document.getElementById('site-cookies');
  if (!cookies.length) {
    container.innerHTML = '<div class="empty">No cookies found</div>';
    return;
  }

  // Sort: tracking first
  cookies.sort((a, b) => isTracking(b.name) - isTracking(a.name));

  container.innerHTML = cookies.map(c => {
    const tracking = isTracking(c.name);
    const url = cookieUrl(c);
    return `
      <div class="cookie-row" data-url="${escapeHtml(url)}" data-name="${escapeHtml(c.name)}">
        <span class="cookie-name ${tracking ? 'tracking' : ''}" title="${escapeHtml(c.name)}">${escapeHtml(c.name)}</span>
        <span class="tag ${tracking ? '' : 'safe'}">${tracking ? 'tracker' : 'safe'}</span>
        <button class="remove-btn">✕</button>
      </div>`;
  }).join('');

  container.querySelectorAll('.remove-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      const row = btn.closest('.cookie-row');
      const url = row.dataset.url;
      const name = row.dataset.name;
      await chrome.runtime.sendMessage({ type: 'REMOVE_COOKIE', url, name });
      row.remove();
      if (!container.querySelector('.cookie-row')) {
        container.innerHTML = '<div class="empty">All cookies removed</div>';
      }
    });
  });
}

function renderLog(log) {
  const container = document.getElementById('removed-log');
  if (!log.length) {
    container.innerHTML = '<div class="empty">None yet</div>';
    return;
  }
  container.innerHTML = log.slice(0, 50).map(entry =>
    `<div class="log-row"><span>${escapeHtml(entry.name)}</span> — ${escapeHtml(entry.domain)} <span style="color:#555">${timeAgo(entry.ts)}</span></div>`
  ).join('');
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function init() {
  const tab = await getCurrentTab();
  const { domain, cookies } = await getSiteCookies(tab);
  renderSiteCookies(domain, cookies);

  const stats = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
  document.getElementById('total-badge').textContent = `${stats.totalCount} removed`;
  renderLog(stats.log);

  const { enabled } = await chrome.runtime.sendMessage({ type: 'GET_ENABLED' });
  const toggle = document.getElementById('toggle-enabled');
  const label = document.getElementById('toggle-label');
  toggle.checked = enabled;
  label.textContent = enabled ? 'ON' : 'OFF';
  label.style.color = enabled ? '#27ae60' : '#888';

  toggle.addEventListener('change', async () => {
    const isEnabled = toggle.checked;
    label.textContent = isEnabled ? 'ON' : 'OFF';
    label.style.color = isEnabled ? '#27ae60' : '#888';
    await chrome.runtime.sendMessage({ type: 'SET_ENABLED', enabled: isEnabled });
  });

  document.getElementById('btn-remove-all').addEventListener('click', async () => {
    const trackingCookies = cookies.filter(c => isTracking(c.name));
    for (const c of trackingCookies) {
      await chrome.runtime.sendMessage({ type: 'REMOVE_COOKIE', url: cookieUrl(c), name: c.name });
    }
    // Refresh
    const { cookies: fresh } = await getSiteCookies(tab);
    renderSiteCookies(domain, fresh);
    const updated = await chrome.runtime.sendMessage({ type: 'GET_STATS' });
    document.getElementById('total-badge').textContent = `${updated.totalCount} removed`;
    renderLog(updated.log);
  });

  document.getElementById('btn-clear-log').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ type: 'CLEAR_LOG' });
    document.getElementById('total-badge').textContent = '0 removed';
    renderLog([]);
  });

  document.getElementById('btn-dashboard').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('dashboard.html') });
  });
}

init();
