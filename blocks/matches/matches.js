// blocks/matches/matches.js
// Matches block: calls /api/fixtures and renders live & upcoming matches.

(async function init() {
  const rootLive = document.getElementById('ls-live-matches');
  const rootUp = document.getElementById('ls-upcoming-matches');
  const ticker = document.getElementById('ls-live-ticker');
  const hero = document.getElementById('ls-hero-feature');
  const refreshBtn = document.getElementById('ls-refresh');
  const searchInput = document.getElementById('ls-search');

  const toLocal = (d) => (d ? new Date(d).toLocaleString() : '');
  const safe = (v) => v || '';

  const renderMatchCard = (m) => {
    const home = (m.teams && m.teams.home) || {};
    const away = (m.teams && m.teams.away) || {};
    const hasScore = m.goals && m.goals.home !== null && m.goals.home !== undefined;
    const score = hasScore ? `${m.goals.home} - ${m.goals.away}` : 'vs';
    const id = m.fixture && m.fixture.id ? m.fixture.id : '';
    const date = m.fixture && m.fixture.date ? m.fixture.date : '';
    const statusShort = m.fixture && m.fixture.status && m.fixture.status.short ? m.fixture.status.short : '';

    return `
<div class="ls-match-card" data-id="${id}">
  <div class="ls-teams">
    <div class="ls-team">
      <img class="ls-logo" src="${safe(home.logo)}" alt="${safe(home.name)}"/>
      <span>${safe(home.name)}</span>
    </div>
    <div class="ls-score">${score}</div>
    <div class="ls-team">
      <img class="ls-logo" src="${safe(away.logo)}" alt="${safe(away.name)}"/>
      <span>${safe(away.name)}</span>
    </div>
  </div>
  <div class="ls-time">${toLocal(date)} · ${safe(statusShort)}</div>
</div>
`;
  };

  const renderTicker = (live) => {
    if (!ticker) return;
    if (!live || live.length === 0) {
      ticker.innerHTML = '<span class="ls-ticker-item">No live matches right now</span>';
      return;
    }
    ticker.innerHTML = live
      .map((m) => {
        const hn = (m.teams && m.teams.home && m.teams.home.name) || '';
        const an = (m.teams && m.teams.away && m.teams.away.name) || '';
        const hg = m.goals && m.goals.home !== null ? m.goals.home : '';
        const ag = m.goals && m.goals.away !== null ? m.goals.away : '';
        return `<span class="ls-ticker-item">${hn} ${hg} - ${ag} ${an}</span>`;
      })
      .join('');
  };

  async function fetchFixtures(date) {
    try {
      const url = '/api/fixtures?date=' + encodeURIComponent(date);
      const res = await fetch(url, { cache: 'no-cache' });

      if (!res.ok) {
        if (rootLive) rootLive.innerHTML = '<div class="ls-error">Failed to load matches</div>';
        if (rootUp) rootUp.innerHTML = '<div class="ls-error">Failed to load matches</div>';
        return { response: [] };
      }

      return await res.json();
    } catch (_err) {
      if (rootLive) rootLive.innerHTML = '<div class="ls-error">Network error</div>';
      if (rootUp) rootUp.innerHTML = '<div class="ls-error">Network error</div>';
      return { response: [] };
    }
  }

  async function refreshUI() {
    const date = new Date().toISOString().split('T')[0];
    const json = await fetchFixtures(date);
    const resp = json.response || [];

    const live = resp.filter((m) => {
      const s1 = (m.fixture && m.fixture.status && m.fixture.status.short) || '';
      const s2 = (m.fixture && m.fixture.status && m.fixture.status.long) || '';
      return s1.toLowerCase() === 'live' || s2.toLowerCase().includes('live');
    });

    const upcoming = resp
      .filter((m) => live.indexOf(m) === -1)
      .sort((a, b) => new Date(a.fixture.date) - new Date(b.fixture.date));

    if (rootLive) {
      rootLive.innerHTML = live.length ? live.map(renderMatchCard).join('') : '<div class="ls-muted">No live matches</div>';
    }

    if (rootUp) {
      rootUp.innerHTML = upcoming.length ? upcoming.map(renderMatchCard).join('') : '<div class="ls-muted">No upcoming matches</div>';
    }

    renderTicker(live);

    const featured = (live && live[0]) || (upcoming && upcoming[0]);
    if (featured && hero) hero.innerHTML = renderMatchCard(featured);
  }

  const onRefresh = () => {
    refreshUI();
  };

  const onSearch = (e) => {
    const q = (e && e.target && e.target.value && e.target.value.toLowerCase()) || '';
    const cards = document.querySelectorAll('.ls-match-card');
    Array.prototype.forEach.call(cards, (card) => {
      card.style.display = card.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
    });
  };

  if (refreshBtn) refreshBtn.addEventListener('click', onRefresh);
  if (searchInput) searchInput.addEventListener('input', onSearch);

  // initial load + polling
  await refreshUI();

  const poller = async () => {
    await refreshUI();
  };

  setInterval(poller, 60 * 1000);
}());
