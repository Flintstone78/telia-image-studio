/**
 * Vercel Serverless Function — Replicate API proxy
 * Handles both POST (create prediction) and GET (poll status)
 * Routes: /api/replicate?path=/v1/models/google/imagen-4/predictions
 */

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type, Prefer');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const remotePath = req.query.path;
  if (!remotePath) {
    return res.status(400).json({ error: 'Missing ?path= parameter' });
  }

  const url = 'https://api.replicate.com' + remotePath;

  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'TeliaImageStudio/1.0',
  };

  // Use server-side token, fall back to client-provided auth
  const token = process.env.REPLICATE_API_TOKEN;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else if (req.headers.authorization) {
    headers['Authorization'] = req.headers.authorization;
  }

  // Use very short wait to avoid Vercel's function timeout (10s on free plan)
  // Just get the prediction ID back fast, client-side polling handles the rest
  headers['Prefer'] = 'wait=1';

  try {
    const fetchOpts = {
      method: req.method,
      headers,
    };

    if (req.method === 'POST' && req.body) {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const response = await fetch(url, fetchOpts);
    const data = await response.text();

    res.status(response.status);
    res.setHeader('Content-Type', response.headers.get('content-type') || 'application/json');
    return res.send(data);
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
