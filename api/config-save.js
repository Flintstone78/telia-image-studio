/**
 * POST /api/config-save
 * Saves shared app config (moodboards, models, products, brand rules) to Vercel Blob.
 * Body: { data: { moodboards, models, productImages, rules, avoids, brandColors, masterStyle, negativePrompt } }
 */

import { put, list, del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { data } = req.body;
    if (!data) return res.status(400).json({ error: 'Missing data' });

    // Delete old config files to avoid accumulation
    const { blobs } = await list({ prefix: 'config/app-config' });
    if (blobs.length > 0) {
      await del(blobs.map(b => b.url));
    }

    // Save new config (with random suffix for unique URL)
    const blob = await put('config/app-config.json', JSON.stringify(data), {
      access: 'public',
      contentType: 'application/json',
    });

    return res.status(200).json({ ok: true, url: blob.url });
  } catch (e) {
    console.error('[config-save]', e);
    return res.status(500).json({ error: e.message });
  }
}
