// /api/fixtures.js - Vercel (Node 18+)
import fetch from 'node-fetch';

export default async function handler(req, res) {
  try {
    const date = req.query.date || new Date().toISOString().split('T')[0];
    const url = `https://v3.football.api-sports.io/fixtures?date=${encodeURIComponent(date)}`;
    const apiKey = process.env.API_FOOTBALL_KEY;
    if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

    const r = await fetch(url, { headers: { 'x-apisports-key': apiKey } });
    const json = await r.json();

    // allow public access from aem.page — set appropriate CORS for production
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=30');
    return res.status(r.status).json(json);
  } catch (err) {
    console.error(err);
    res.setHeader('Access-Control-Allow-Origin', '*');
    return res.status(500).json({ error: 'proxy error' });
  }
}
