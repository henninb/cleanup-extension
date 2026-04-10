'use strict';

const PAGE_SIZE = 25;
let allLog = [];
let filteredLog = [];
let currentPage = 0;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function formatTime(ts) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
}

function last7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function shortDate(isoDate) {
  const [, , dd] = isoDate.split('-');
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const d = new Date(isoDate + 'T12:00:00');
  return days[d.getDay()];
}

function topN(obj, n) {
  return Object.entries(obj)
    .sort((a, b) => b[1] - a[1])
    .slice(0, n);
}

// ── Stat cards ──────────────────────────────────────────────
function renderCards(totalCount, lsTotalCount, dailyStats, domainStats) {
  const days7 = last7Days();

  document.getElementById('stat-total').textContent = totalCount.toLocaleString();
  document.getElementById('stat-ls-total').textContent = lsTotalCount.toLocaleString();

  const weekCount = days7.reduce((sum, d) => sum + (dailyStats[d] || 0), 0);
  document.getElementById('stat-week').textContent = weekCount.toLocaleString();

  const top = topN(domainStats, 1);
  if (top.length) {
    document.getElementById('stat-top-domain').textContent = top[0][0];
    document.getElementById('stat-top-domain-count').textContent = `${top[0][1]} cookies removed`;
  } else {
    document.getElementById('stat-top-domain').textContent = '—';
    document.getElementById('stat-top-domain-count').textContent = '';
  }
}

// ── 7-day bar chart ──────────────────────────────────────────
function renderDailyChart(dailyStats) {
  const days = last7Days();
  const today = days[days.length - 1];
  const counts = days.map(d => dailyStats[d] || 0);
  const max = Math.max(...counts, 1);
  const container = document.getElementById('daily-chart');

  container.innerHTML = days.map((d, i) => {
    const pct = Math.round((counts[i] / max) * 100);
    const isToday = d === today;
    return `
      <div class="day-col">
        <span class="day-count">${counts[i] || ''}</span>
        <div class="day-bar ${isToday ? 'today' : ''}" style="height:${pct}%" title="${d}: ${counts[i]} removed"></div>
        <span class="day-label">${shortDate(d)}</span>
      </div>`;
  }).join('');
}

// ── Horizontal bar chart ─────────────────────────────────────
function renderHbarChart(containerId, entries, altColor) {
  const container = document.getElementById(containerId);
  if (!entries.length) {
    container.innerHTML = '<div class="empty">No data yet</div>';
    return;
  }
  const max = entries[0][1];
  container.innerHTML = entries.map(([label, count]) => {
    const pct = Math.round((count / max) * 100);
    return `
      <div class="hbar-row">
        <span class="hbar-label" title="${escapeHtml(label)}">${escapeHtml(label)}</span>
        <div class="hbar-track">
          <div class="hbar-fill ${altColor ? 'alt' : ''}" style="width:${pct}%"></div>
        </div>
        <span class="hbar-count">${count}</span>
      </div>`;
  }).join('');
}

// ── Log table ────────────────────────────────────────────────
function renderLog() {
  const tbody = document.getElementById('log-body');
  const start = currentPage * PAGE_SIZE;
  const page = filteredLog.slice(start, start + PAGE_SIZE);
  const totalPages = Math.max(1, Math.ceil(filteredLog.length / PAGE_SIZE));

  if (!page.length) {
    tbody.innerHTML = '<tr><td colspan="4" class="empty" style="padding:12px 10px">No entries</td></tr>';
  } else {
    tbody.innerHTML = page.map((entry, i) => `
      <tr>
        <td class="time-cell">${start + i + 1}</td>
        <td class="cookie-name-cell">${escapeHtml(entry.name)}</td>
        <td class="domain-cell">${escapeHtml(entry.domain)}</td>
        <td class="time-cell">${formatTime(entry.ts)}</td>
      </tr>`).join('');
  }

  document.getElementById('page-info').textContent = `Page ${currentPage + 1} of ${totalPages}`;
  document.getElementById('log-count').textContent = `${filteredLog.length.toLocaleString()} entries`;
  document.getElementById('btn-prev').disabled = currentPage === 0;
  document.getElementById('btn-next').disabled = currentPage >= totalPages - 1;
}

function applyFilter(query) {
  const q = query.trim().toLowerCase();
  filteredLog = q
    ? allLog.filter(e => e.name.toLowerCase().includes(q) || e.domain.toLowerCase().includes(q))
    : allLog;
  currentPage = 0;
  renderLog();
}

// ── Init ─────────────────────────────────────────────────────
async function init() {
  const stats = await chrome.runtime.sendMessage({ type: 'GET_DASHBOARD_STATS' });

  renderCards(stats.totalCount, stats.lsTotalCount, stats.dailyStats, stats.domainStats);
  renderDailyChart(stats.dailyStats);
  renderHbarChart('domain-chart', topN(stats.domainStats, 12), false);
  renderHbarChart('name-chart', topN(stats.nameStats, 12), true);
  renderHbarChart('ls-chart', topN(stats.lsKeyStats, 12), true);

  allLog = stats.log;
  filteredLog = allLog;
  renderLog();

  document.getElementById('log-search').addEventListener('input', (e) => {
    applyFilter(e.target.value);
  });

  document.getElementById('btn-prev').addEventListener('click', () => {
    currentPage--;
    renderLog();
  });
  document.getElementById('btn-next').addEventListener('click', () => {
    currentPage++;
    renderLog();
  });

  document.getElementById('btn-clear').addEventListener('click', async () => {
    if (!confirm('Clear all cookie removal history and stats?')) return;
    await chrome.runtime.sendMessage({ type: 'CLEAR_LOG' });
    location.reload();
  });
}

init();
