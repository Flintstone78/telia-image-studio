/**
 * GET /api/config-load
 * Loads shared app config from Vercel Blob.
 * Returns the most recently saved config.
 */

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { blobs } = await list({ prefix: 'config/app-config' });
    if (blobs.length === 0) return res.status(200).json({ ok: true, data: null });

    // Get the most recently uploaded config
    const newest = blobs.sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))[0];
    const resp = await fetch(newest.url);
    if (!resp.ok) return res.status(200).json({ ok: true, data: null });
    const data = await resp.json();

    return res.status(200).json({ ok: true, data });
  } catch (e) {
    console.error('[config-load]', e);
    return res.status(500).json({ error: e.message });
  }
}
