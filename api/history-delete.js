/**
 * DELETE /api/history-delete
 * Deletes an image and its metadata from Vercel Blob.
 * Body: { url: "https://..." } — the blob URL of the image
 */

import { del } from '@vercel/blob';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: 'Missing url' });

    // Delete both the image and its companion JSON metadata
    const metaUrl = url.replace(/\.(jpg|png)$/, '.json');
    await del([url, metaUrl]);

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('[history-delete]', e);
    return res.status(500).json({ error: e.message });
  }
}
