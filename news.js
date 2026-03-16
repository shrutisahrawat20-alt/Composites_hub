module.exports = async function handler(req, res) {
  const host = req.headers.host || 'localhost:3000';
  const proto = host.includes('localhost') ? 'http' : 'https';
  const refreshUrl = `${proto}://${host}/api/refresh`;
  try {
    const upstream = await fetch(refreshUrl);
    const data = await upstream.json();
    res.setHeader('Cache-Control', 's-maxage=3600, stale-while-revalidate=86400');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.status(upstream.status).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
