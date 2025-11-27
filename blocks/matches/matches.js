// Minimal client block that calls the proxy at /api/fixtures.
// Expects serverless proxy at /api/fixtures (Vercel) or /.netlify/functions/fixtures.

(async function init() {
  const rootLive = document.getElementById('ls-live-matches');
  const rootUp = document.getElementById('ls-upcoming-matches');
  const ticker = document.getElementById('ls-live-ticker');
  const hero = document.getElementById('ls-hero-feature');
  const refreshBtn = document.getElementById('ls-refresh');
  const searchInput = document.getElementById('ls-search');

  function toLocal(d) {
    return new Date(d).toLocaleString();
  }

  function safe(v) {
    return v || '';
  }

  function renderMatchCard(m) {
    const home = (m.teams && m.teams.home) || {};
    const away = (m.teams && m.teams.away) || {};
    const hasScore =
      m.goals && m.goals.home !== null && m.goals.home !== undefined;
    const score = hasScore ? `${m.goals.home} - ${m.goals.away}` : 'vs';

    return (
      '<div class="ls-match-card" data-id="' +
      (m.fixture && m.fixture.id ? m.fixture.id : '') +
      '">' +
      '<div class="ls-teams">' +
      '<div class="ls-team"><img class="ls-logo" src="' +
      safe(home.logo) +
      '" alt="' +
      safe(home.name) +
      '"/> <span>' +
      safe(home.name) +
      '</span></div>' +
      '<div class="ls-score">' +
      score +
      '</div>' +
      '<div class="ls-team"><img class="ls-logo" src="' +
      safe(away.logo) +
      '" alt="' +
      safe(away.name) +
      '"/> <span>' +
      safe(away.name) +
      '</span></div>' +
      '</div>' +
      '<div class="ls-time">' +
      toLocal(m.fixture && m.fixture.date ? m.fixture.date : '') +
      ' · ' +
      safe(m.fixture && m.fixture.status && m.fixture.status.short) +
      '</div>' +
      '</div>'
    );
  }

  function renderTicker(live) {
    if (!live || live.length === 0) {
      if (ticker) {
        ticker.innerHTML =
          '<span class="ls-ticker-item">No live matches right now</span>';
      }
      return;
    }

    if (ticker) {
      ticker.innerHTML = live
        .map(function (m) {
          const homeName =
            (m.teams && m.teams.home && m.teams.home.name) || '';
          const awayName =
            (m.teams && m.teams.away && m.teams.away.name) || '';
          const homeGoals =
            m.goals && m.goals.home !== null ? m.goals.home : '';
          const awayGoals =
            m.goals && m.goals.away !== null ? m.goals.away : '';
          return (
            '<span class="ls-ticker-item">' +
            homeName +
            ' ' +
            homeGoals +
            ' - ' +
            awayGoals +
            ' ' +
            awayName +
            '</span>'
          );
        })
        .join('');
    }
  }

  async function fetchFixtures(date) {
    try {
      const res = await fetch('/api/fixtures?date=' + encodeURIComponent(date), {
        cache: 'no-cache'
      });

      if (!res.ok) {
        if (rootLive) {
          rootLive.innerHTML =
            '<div class="ls-error">Failed to load matches</div>';
        }
        if (rootUp) {
          rootUp.innerHTML =
            '<div class="ls-error">Failed to load matches</div>';
        }
        return { response: [] };
      }

      return await res.json();
    } catch (_err) {
      if (rootLive) {
        rootLive.innerHTML = '<div class="ls-error">Network error</div>';
      }
      if (rootUp) {
        rootUp.innerHTML = '<div class="ls-error">Network error</div>';
      }
      return { response: [] };
    }
  }

  async function refreshUI() {
    const date = new Date().toISOString().split('T')[0];
    const json = await fetchFixtures(date);
    const resp = json.response || [];

    var live = resp.filter(function (m) {
      var s1 =
        (m.fixture && m.fixture.status && m.fixture.status.short) || '';
      var s2 =
        (m.fixture && m.fixture.status && m.fixture.status.long) || '';
      return s1.toLowerCase() === 'live' || s2.toLowerCase().indexOf('live') !== -1;
    });

    var upcoming = resp
      .filter(function (m) {
        return live.indexOf(m) === -1;
      })
      .sort(function (a, b) {
        return new Date(a.fixture.date) - new Date(b.fixture.date);
      });

    if (rootLive) {
      rootLive.innerHTML = live.length
        ? live.map(renderMatchCard).join('')
        : '<div class="ls-muted">No live matches</div>';
    }

    if (rootUp) {
      rootUp.innerHTML = upcoming.length
        ? upcoming.map(renderMatchCard).join('')
        : '<div class="ls-muted">No upcoming matches</div>';
    }

    renderTicker(live);

    var featured = (live && live[0]) || (upcoming && upcoming[0]);
    if (featured && hero) {
      hero.innerHTML = renderMatchCard(featured);
    }
  }

  function onRefresh() {
    refreshUI();
  }

  function onSearch(e) {
    var q = (e.target && e.target.value && e.target.value.toLowerCase()) || '';
    var cards = document.querySelectorAll('.ls-match-card');
    Array.prototype.forEach.call(cards, function (card) {
      card.style.display =
        card.textContent.toLowerCase().indexOf(q) !== -1 ? '' : 'none';
    });
  }

  if (refreshBtn) {
    refreshBtn.addEventListener('click', onRefresh);
  }

  if (searchInput) {
    searchInput.addEventListener('input', onSearch);
  }

  // initial load + polling
  await refreshUI();

  async function poller() {
    await refreshUI();
  }

  setInterval(poller, 60 * 1000);
}());
