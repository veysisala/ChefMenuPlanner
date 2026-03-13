/**
 * Vercel serverless proxy: /api/anthropic/* -> https://api.anthropic.com/*
 * API anahtarı: istek header'ı X-Client-Api-Key veya ortam değişkeni ANTHROPIC_API_KEY
 */
export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const path = Array.isArray(req.query.path) ? req.query.path.join('/') : (req.query.path || 'v1/messages');
  const rawKey = (req.headers['x-client-api-key'] || process.env.ANTHROPIC_API_KEY || process.env.VITE_ANTHROPIC_API_KEY || '').trim();
  const apiKey = rawKey.replace(/[^\x20-\x7E]/g, '').trim();

  if (!apiKey) {
    res.status(401).json({ error: 'API anahtarı gerekli. Vercel ortam değişkenlerine ANTHROPIC_API_KEY ekleyin veya uygulama Ayarlar\'dan girin.' });
    return;
  }

  const url = `https://api.anthropic.com/${path}`;
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'x-api-key': apiKey,
  };

  try {
    const body = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body,
    });

    const contentType = response.headers.get('content-type') || '';

    if (contentType.includes('text/event-stream')) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');
      res.status(response.status);
      if (!response.ok) {
        const err = await response.text();
        res.end(err);
        return;
      }
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      res.end();
      return;
    }

    const text = await response.text();
    res.status(response.status);
    if (contentType) res.setHeader('Content-Type', contentType);
    res.end(text);
  } catch (e) {
    res.status(502).json({ error: 'Proxy hatası: ' + (e.message || 'Failed to fetch') });
  }
}
