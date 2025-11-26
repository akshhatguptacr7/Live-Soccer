// Minimal client block that calls your proxy at /api/fixtures
// It expects the serverless proxy to be hosted at /api/fixtures (Vercel) or /.netlify/functions/fixtures (Netlify).
// This code will auto-run when the block is loaded by EDS.

(async function () {
  const rootLive = document.getElementById('ls-live-matches');
  const rootUp = document.getElementById('ls-upcoming-matches');
  const ticker = document.getElementById('ls-live-ticker');
  const hero = document.getElementById('ls-hero-feature');
  const refreshBtn = document.getElementById('ls-refresh');
  const searchInput = document.getElementById('ls-search');

  function toLocal(d){ return new Date(d).toLocaleString(); }
  function safe(v){ return v || ''; }

  function renderMatchCard(m){
    const home = m.teams.home || {};
    const away = m.teams.away || {};
    const score = (m.goals.home !== null && m.goals.home !== undefined) ? `${m.goals.home} - ${m.goals.away}` : 'vs';
    return `
      <div class="ls-match-card" data-id="${m.fixture?.id || ''}">
        <div class="ls-teams">
          <div class="ls-team"><img class="ls-logo" src="${safe(home.logo)}" alt="${safe(home.name)}"/> <span>${safe(home.name)}</span></div>
          <div class="ls-score">${score}</div>
          <div class="ls-team"><img class="ls-logo" src="${safe(away.logo)}" alt="${safe(away.name)}"/> <span>${safe(away.name)}</span></div>
        </div>
        <div class="ls-time">${toLocal(m.fixture?.date)} · ${safe(m.fixture?.status?.short)}</div>
      </div>`;
  }

  function renderTicker(live){
    if(!live || live.length === 0){
      ticker.innerHTML = '<span class="ls-ticker-item">No live matches right now</span>';
      return;
    }
    ticker.innerHTML = live.map(m=>`<span class="ls-ticker-item">${m.teams.home.name} ${m.goals.home ?? ''} - ${m.goals.away ?? ''} ${m.teams.away.name}</span>`).join('');
  }

  async function fetchFixtures(date){
    try {
      const res = await fetch(`/api/fixtures?date=${encodeURIComponent(date)}`, { cache: 'no-cache' });
      if(!res.ok) throw new Error('Fetch failed: ' + res.status);
      return await res.json();
    } catch(e) {
      console.error('fetchFixtures error', e);
      return { response: [] };
    }
  }

  async function refreshUI(){
    const date = new Date().toISOString().split('T')[0];
    const json = await fetchFixtures(date);
    const resp = json.response || [];
    const live = resp.filter(m => (m.fixture?.status?.short || '').toLowerCase() === 'live' || (m.fixture?.status?.long || '').toLowerCase().includes('live'));
    const upcoming = resp.filter(m => !live.includes(m)).sort((a,b)=>new Date(a.fixture.date)-new Date(b.fixture.date));

    rootLive.innerHTML = live.length ? live.map(renderMatchCard).join('') : '<div class="ls-muted">No live matches</div>';
    rootUp.innerHTML = upcoming.length ? upcoming.map(renderMatchCard).join('') : '<div class="ls-muted">No upcoming matches</div>';
    renderTicker(live);

    const featured = live[0] || upcoming[0];
    if(featured && hero) hero.innerHTML = renderMatchCard(featured);
  }

  refreshBtn?.addEventListener('click', ()=>refreshUI());
  searchInput?.addEventListener('input', (e)=>{
    const q = e.target.value.toLowerCase();
    [...document.querySelectorAll('.ls-match-card')].forEach(card=>{
      card.style.display = card.textContent.toLowerCase().includes(q) ? '' : 'none';
    });
  });

  // initial load + polling
  await refreshUI();
  setInterval(async () => {
    await refreshUI();
  }, 60 * 1000); // 60s default polling
})();
