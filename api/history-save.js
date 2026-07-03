/**
 * POST /api/history-save
 * Saves a generated image + metadata to Vercel Blob shared history.
 * Body: { imageData: "data:image/jpeg;base64,...", prompt, env, brandCheck, ts, model }
 */

import { put, list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { imageData, prompt, env, brandCheck, ts, model } = req.body;
    if (!imageData) return res.status(400).json({ error: 'Missing imageData' });

    // Convert base64 data URL to Buffer
    const base64 = imageData.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64, 'base64');
    const mimeType = imageData.match(/^data:(image\/\w+);base64,/)?.[1] || 'image/jpeg';
    const ext = mimeType === 'image/png' ? 'png' : 'jpg';

    const timestamp = ts || Date.now();
    const filename = `history/${timestamp}-${Math.random().toString(36).slice(2, 7)}.${ext}`;

    // Upload image to Blob
    const blob = await put(filename, imageBuffer, {
      access: 'public',
      contentType: mimeType,
    });

    // Save metadata as a small JSON blob alongside the image
    const meta = { url: blob.url, prompt, env, brandCheck, ts: timestamp, model };
    const metaFilename = filename.replace(`.${ext}`, '.json');
    await put(metaFilename, JSON.stringify(meta), {
      access: 'public',
      contentType: 'application/json',
    });

    return res.status(200).json({ ok: true, url: blob.url, meta });
  } catch (e) {
    console.error('[history-save]', e);
    return res.status(500).json({ error: e.message });
  }
}
