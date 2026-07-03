/**
 * Vercel Serverless Function — hubb-endpoint för bildgenerering
 *
 * POST /api/generate
 * Body:    { prompt: string, aspectRatio?: "1:1"|"16:9"|"9:16"|"4:3"|"3:4", model?: string }
 * Auth:    Authorization: Bearer <HUB_API_SECRET>   (krävs om env-variabeln är satt)
 * Svar:    { imageUrl, model, predictionId }
 *
 * Skapar en Replicate-prediction och väntar in resultatet server-side,
 * så att anroparen (t.ex. NAVET) får en färdig bild-URL i ett enda anrop.
 */

const ALLOWED_MODELS = new Set([
  'google/imagen-4',
  'google/nano-banana-2',
  'google/nano-banana-pro',
]);

const POLL_INTERVAL_MS = 2000;
const MAX_WAIT_MS = 100_000; // under vercel.json:s maxDuration på 120 s

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Use POST' });

  const secret = process.env.HUB_API_SECRET;
  if (secret) {
    const auth = req.headers.authorization || '';
    if (auth !== `Bearer ${secret}`) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
  }

  const replicateToken = process.env.REPLICATE_API_TOKEN;
  if (!replicateToken) {
    return res.status(500).json({ error: 'REPLICATE_API_TOKEN is not configured' });
  }

  const { prompt, aspectRatio = '16:9', model = 'google/imagen-4' } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'Missing "prompt" in body' });
  }
  if (!ALLOWED_MODELS.has(model)) {
    return res.status(400).json({ error: `Unknown model. Allowed: ${[...ALLOWED_MODELS].join(', ')}` });
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${replicateToken}`,
    'User-Agent': 'TeliaImageStudio-Hub/1.0',
  };

  try {
    // Skapa prediction — Prefer: wait håller anropet öppet upp till 60 s
    const createRes = await fetch(`https://api.replicate.com/v1/models/${model}/predictions`, {
      method: 'POST',
      headers: { ...headers, 'Prefer': 'wait=60' },
      body: JSON.stringify({ input: { prompt, aspect_ratio: aspectRatio } }),
    });
    let prediction = await createRes.json();
    if (!createRes.ok) {
      return res.status(createRes.status).json({ error: prediction?.detail || 'Replicate error', prediction });
    }

    // Polla vidare om den inte hann bli klar
    const deadline = Date.now() + MAX_WAIT_MS;
    while (
      prediction.status !== 'succeeded' &&
      prediction.status !== 'failed' &&
      prediction.status !== 'canceled' &&
      Date.now() < deadline
    ) {
      await new Promise((r) => setTimeout(r, POLL_INTERVAL_MS));
      const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${prediction.id}`, { headers });
      prediction = await pollRes.json();
    }

    if (prediction.status !== 'succeeded') {
      return res.status(502).json({
        error: `Generation ${prediction.status}: ${prediction.error || 'timeout'}`,
        predictionId: prediction.id,
      });
    }

    // Output är en URL-sträng eller en lista av URL:er beroende på modell
    const output = prediction.output;
    const imageUrl = Array.isArray(output) ? output[0] : output;
    return res.status(200).json({ imageUrl, model, predictionId: prediction.id });
  } catch (e) {
    return res.status(502).json({ error: e.message });
  }
}
