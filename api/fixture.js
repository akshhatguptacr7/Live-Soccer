// api/fixture.js
// Vercel serverless proxy (Node 18+). Uses global fetch, no node-fetch import.

export default async function handler(req, res) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const url = `https://v3.football.api-sports.io/fixtures?date=${encodeURIComponent(date)}`;

    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) {
      res.status(500).json({ error: 'API_FOOTBALL_KEY not configured' });
      return;
    }

    const r = await fetch(url, {
      headers: {
        'x-apisports-key': apiKey,
      },
    });

    const json = await r.json();

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');

    res.status(r.status).json(json);
  } catch (_err) {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(500).json({ error: 'proxy error' });
  }
}
