(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const number = new Intl.NumberFormat('en-GB');
  const date = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', timeZone: 'UTC' });
  const countryNames = typeof Intl.DisplayNames === 'function' ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
  let authenticated = false;
  let pending = false;
  let currentSeries = null;

  function showLogin() {
    authenticated = false;
    $('initial-loading').hidden = true;
    $('dashboard-view').hidden = true;
    $('login-view').hidden = false;
    $('password').value = '';
    setError('login-error', '');
  }

  function showDashboard() {
    authenticated = true;
    $('initial-loading').hidden = true;
    $('login-view').hidden = true;
    $('dashboard-view').hidden = false;
  }

  function setError(id, message) {
    $(id).textContent = message;
    $(id).hidden = !message;
  }

  function drawChart(series) {
    const container = $('chart');
    container.replaceChildren();
    $('daily-table').replaceChildren();
    $('chart-details').hidden = !series.length;
    if (!series.length || !series.some((point) => point.visitors || point.pageviews)) {
      const message = document.createElement('p');
      message.className = 'chart-message';
      message.textContent = 'No visits recorded in this period yet. New activity will appear here.';
      container.append(message);
    } else if (series.length === 1) {
      const point = series[0];
      const bars = document.createElement('div');
      bars.className = 'single-day-bars';
      const maximum = Math.max(point.visitors, point.pageviews, 1);
      [['visitors', 'Visitors'], ['pageviews', 'Page views']].forEach(([key, name]) => {
        const column = document.createElement('div');
        column.className = 'single-day-column';
        const value = document.createElement('strong');
        value.textContent = number.format(point[key]);
        const track = document.createElement('div');
        track.className = 'single-day-track';
        const bar = document.createElement('div');
        bar.className = `single-day-bar ${key}`;
        bar.style.height = `${point[key] / maximum * 100}%`;
        bar.setAttribute('aria-hidden', 'true');
        track.append(bar);
        const label = document.createElement('span');
        label.textContent = name;
        column.append(value, track, label);
        bars.append(column);
      });
      const caption = document.createElement('p');
      caption.className = 'single-day-caption';
      caption.textContent = `${date.format(new Date(point.date + 'T00:00:00Z'))} · One day of recorded activity in this period`;
      container.append(bars, caption);
    } else {
      const ns = 'http://www.w3.org/2000/svg';
      const svg = document.createElementNS(ns, 'svg');
      const width = Math.max(280, container.clientWidth);
      const height = container.clientHeight;
      const left = 42;
      const right = width - 12;
      const bottom = height - 35;
      svg.setAttribute('viewBox', `0 0 ${width} ${height}`);
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Daily visitors and page views. Exact numbers are available below the chart.');
      const make = (name, attributes, text) => {
        const element = document.createElementNS(ns, name);
        Object.entries(attributes).forEach(([key, value]) => element.setAttribute(key, String(value)));
        if (text !== undefined) element.textContent = text;
        svg.append(element);
        return element;
      };
      const maximum = Math.max(4, ...series.map((point) => Math.max(point.visitors, point.pageviews)));
      const ceiling = Math.ceil(maximum / 4) * 4;
      const x = (index) => left + index * (right - left) / (series.length - 1);
      const y = (count) => bottom - count * (bottom - 15) / ceiling;
      for (let tick = 0; tick <= 4; tick++) {
        const count = ceiling * tick / 4;
        make('line', { x1: left, y1: y(count), x2: right, y2: y(count), stroke: '#e7e9df', 'stroke-width': 1 });
        make('text', { x: 30, y: y(count) + 4, fill: '#758075', 'font-size': 11, 'text-anchor': 'end' }, number.format(count));
      }
      const indices = [...new Set([0, Math.floor((series.length - 1) / 2), series.length - 1])];
      indices.forEach((index) => make('text', { x: x(index), y: height - 8, fill: '#758075', 'font-size': 11, 'text-anchor': index === 0 ? 'start' : index === series.length - 1 ? 'end' : 'middle' }, date.format(new Date(series[index].date + 'T00:00:00Z'))));
      [['pageviews', '#b58b45'], ['visitors', '#173a2a']].forEach(([key, color]) => {
        const points = series.map((point, index) => `${x(index)},${y(point[key])}`).join(' ');
        make('polyline', { points, fill: 'none', stroke: color, 'stroke-width': 2.5, 'stroke-linecap': 'round', 'stroke-linejoin': 'round', 'vector-effect': 'non-scaling-stroke' });
        series.forEach((point, index) => {
          const circle = make('circle', { cx: x(index), cy: y(point[key]), r: series.length < 15 ? 3.5 : 2, fill: color });
          const title = document.createElementNS(ns, 'title');
          title.textContent = `${point.date}: ${number.format(point[key])} ${key === 'visitors' ? 'visitors' : 'page views'}`;
          circle.append(title);
        });
      });
      container.append(svg);
    }
    series.forEach((point) => {
      const row = document.createElement('tr');
      [point.date, number.format(point.visitors), number.format(point.pageviews), number.format(point.bookingClicks)].forEach((value) => {
        const cell = document.createElement('td');
        cell.textContent = value;
        row.append(cell);
      });
      $('daily-table').append(row);
    });
  }

  function countryLabel(label) {
    if (label === 'XX' || !label) return 'Unknown';
    if (/^[A-Z]{2}$/.test(label) && countryNames) {
      try { return countryNames.of(label) || label; } catch { return label; }
    }
    return label;
  }

  function renderBreakdown(id, entries, format = (label) => label) {
    const list = $(id);
    list.replaceChildren();
    if (!entries.length) {
      const empty = document.createElement('p');
      empty.className = 'empty-list';
      empty.textContent = 'No activity recorded yet.';
      list.append(empty);
      return;
    }
    const maximum = Math.max(1, ...entries.map((entry) => entry.count));
    entries.forEach((entry) => {
      const row = document.createElement('div');
      row.className = 'breakdown-row';
      const fill = document.createElement('span');
      fill.className = 'breakdown-fill';
      fill.style.width = `${Math.min(100, entry.count / maximum * 100)}%`;
      fill.setAttribute('aria-hidden', 'true');
      const label = document.createElement('span');
      label.className = 'breakdown-name';
      label.textContent = format(entry.label);
      label.title = label.textContent;
      const count = document.createElement('span');
      count.className = 'breakdown-count';
      count.textContent = number.format(entry.count);
      row.append(fill, label, count);
      list.append(row);
    });
  }

  function render(data) {
    showDashboard();
    $('visitors-value').textContent = number.format(data.totals.visitors);
    $('pageviews-value').textContent = number.format(data.totals.pageviews);
    $('bookings-value').textContent = number.format(data.totals.bookingClicks);
    $('active-value').textContent = number.format(data.totals.activeVisitors);
    $('range-label').textContent = `${date.format(new Date(data.range.start))} – ${date.format(new Date(data.range.end))} · UTC`;
    $('updated-label').textContent = `Updated ${new Intl.DateTimeFormat('en-GB', { hour: '2-digit', minute: '2-digit' }).format(new Date())}`;
    $('tracking-note').textContent = `Tracking since ${date.format(new Date(data.trackingSince))}. Dates use UTC. Booking clicks count link clicks, not completed bookings.`;
    currentSeries = data.series;
    drawChart(currentSeries);
    renderBreakdown('sources-list', data.sources);
    renderBreakdown('pages-list', data.pages);
    renderBreakdown('countries-list', data.countries, countryLabel);
    renderBreakdown('devices-list', data.devices, (label) => label.charAt(0).toUpperCase() + label.slice(1));
  }

  async function refresh() {
    if (pending) return;
    pending = true;
    $('refresh-button').disabled = true;
    $('range').disabled = true;
    setError('dashboard-error', '');
    try {
      const response = await fetch(`/api/analytics?days=${$('range').value}`, { credentials: 'same-origin', cache: 'no-store' });
      if (response.status === 401) { showLogin(); return; }
      if (response.status === 503) throw new Error('The analytics dashboard is not configured yet. Please try again once setup is complete.');
      if (!response.ok) throw new Error('Unable to load analytics. Please try refreshing in a moment.');
      render(await response.json());
    } catch (error) {
      const message = error instanceof TypeError ? 'Could not connect. Check your connection and try again.' : error.message;
      if (!authenticated) {
        showLogin();
        setError('login-error', message);
      } else {
        setError('dashboard-error', message);
      }
    } finally {
      pending = false;
      $('refresh-button').disabled = false;
      $('range').disabled = false;
    }
  }

  $('login-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    $('login-button').disabled = true;
    $('login-button').textContent = 'Signing in…';
    setError('login-error', '');
    try {
      const response = await fetch('/api/analytics/login', { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: $('password').value }) });
      if (!response.ok) {
        if (response.status === 503) throw new Error('The analytics dashboard is not configured yet. Please try again once setup is complete.');
        if (response.status === 429) throw new Error('Too many attempts. Please wait a few minutes and try again.');
        if (response.status === 401) throw new Error('That password wasn’t recognised. Please try again.');
        throw new Error('Unable to sign in. Please try again in a moment.');
      }
      $('password').value = '';
      await refresh();
    } catch (error) {
      setError('login-error', error instanceof TypeError ? 'Could not connect. Check your connection and try again.' : error.message);
    } finally {
      $('login-button').disabled = false;
      $('login-button').textContent = 'Open dashboard ↗';
    }
  });
  $('logout-button').addEventListener('click', async () => {
    $('logout-button').disabled = true;
    try {
      const response = await fetch('/api/analytics/logout', { method: 'POST', credentials: 'same-origin' });
      if (!response.ok) throw new Error('Unable to sign out. Please try again.');
      showLogin();
    } catch (error) { setError('dashboard-error', 'Unable to sign out. Check your connection and try again.'); }
    finally { $('logout-button').disabled = false; }
  });
  $('range').addEventListener('change', refresh);
  $('refresh-button').addEventListener('click', refresh);
  let chartWidth = 0;
  new ResizeObserver(([entry]) => {
    const width = Math.round(entry.contentRect.width);
    if (width !== chartWidth) {
      chartWidth = width;
      if (authenticated && currentSeries) drawChart(currentSeries);
    }
  }).observe($('chart'));
  setInterval(() => { if (authenticated && document.visibilityState === 'visible') refresh(); }, 60000);
  refresh();
})();
