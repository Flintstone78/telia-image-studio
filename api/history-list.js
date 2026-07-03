/**
 * GET /api/history-list
 * Returns list of all history items from Vercel Blob (shared across all users).
 * Returns most recent items first, max 100.
 */

import { list } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  try {
    // List all JSON metadata files in the history/ prefix
    const { blobs } = await list({ prefix: 'history/', limit: 200 });

    // Only grab .json files (metadata)
    const metaBlobs = blobs.filter(b => b.pathname.endsWith('.json'));

    // Fetch metadata from each JSON blob in parallel (max 50 most recent)
    const sorted = metaBlobs
      .sort((a, b) => new Date(b.uploadedAt) - new Date(a.uploadedAt))
      .slice(0, 50);

    const items = await Promise.all(sorted.map(async (blob) => {
      try {
        const resp = await fetch(blob.url);
        return await resp.json();
      } catch (e) {
        return null;
      }
    }));

    const valid = items.filter(Boolean);
    return res.status(200).json({ ok: true, items: valid });
  } catch (e) {
    console.error('[history-list]', e);
    return res.status(500).json({ error: e.message });
  }
}
