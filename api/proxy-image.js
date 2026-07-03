/**
 * Vercel Serverless Function — Image proxy for downloads
 * Fetches external image and returns as downloadable blob
 * Route: /api/proxy-image?url=https://...
 */

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const imageUrl = req.query.url;
  if (!imageUrl) {
    return res.status(400).json({ error: 'Missing url parameter' });
  }

  try {
    const response = await fetch(imageUrl, {
      headers: { 'User-Agent': 'TeliaImageStudio/1.0' },
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: `Upstream returned ${response.status}` });
    }

    const buffer = Buffer.from(await response.arrayBuffer());
    const ct = response.headers.get('content-type') || 'image/png';

    res.setHeader('Content-Type', ct);
    res.setHeader('Content-Length', buffer.length);
    res.setHeader('Content-Disposition', 'attachment; filename=telia-image.png');
    return res.send(buffer);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
