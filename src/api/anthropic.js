import { parseJSON } from '../utils/json.js';

export function sleep(ms) {
  return new Promise(function (r) { setTimeout(r, ms); });
}

const USE_PROXY = typeof window !== 'undefined';
export const API_BASE = USE_PROXY ? '/api/anthropic-proxy' : 'https://api.anthropic.com';

/** Proxy kullanırken path query ile gider (Vercel 404 önleme); doğrudan API'de path URL'de. */
export function apiUrl(path) {
  const p = (path || 'v1/messages').replace(/^\/+/, '');
  return USE_PROXY ? API_BASE + '?path=' + encodeURIComponent(p) : API_BASE + '/' + p;
}

/** Header'da kullanılacak API anahtarını temizler (gizli karakterler kaldırılır). Dışa aktarılır; Ayarlar'da kaydetmeden önce kullanın. */
export function sanitizeApiKey(str) {
  if (typeof str !== 'string') return '';
  return str.replace(/[^\x20-\x7E]/g, '').trim();
}

function toHeaderSafe(str) {
  return sanitizeApiKey(str);
}

export function getApiKey() {
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_ANTHROPIC_API_KEY) {
    return import.meta.env.VITE_ANTHROPIC_API_KEY;
  }
  if (typeof localStorage !== 'undefined') {
    return localStorage.getItem('anthropic_api_key') || '';
  }
  return '';
}

export function getAnthropicHeaders() {
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
  };
  const key = toHeaderSafe(getApiKey());
  if (key) {
    if (USE_PROXY) {
      headers['X-Client-Api-Key'] = key;
    } else {
      headers['x-api-key'] = key;
    }
  }
  return headers;
}

/** Verilen anahtar ile gerçek bir API çağrısı dener. Kaydetmeden önce test için kullanın. */
export async function testApiKey(keyOrEmpty) {
  const raw = typeof keyOrEmpty === 'string' ? keyOrEmpty : getApiKey();
  const key = toHeaderSafe(raw);
  if (!key) return { ok: false, error: 'Lütfen API anahtarını girin (sk-ant-...)' };
  const headers = {
    'Content-Type': 'application/json',
    'anthropic-version': '2023-06-01',
    'X-Client-Api-Key': key,
  };
  try {
    const res = await fetch(apiUrl('v1/messages'), {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: 'claude-3-5-haiku-20241022',
        max_tokens: 20,
        messages: [{ role: 'user', content: 'Say "OK"' }],
      }),
    });
    const text = await res.text();
    if (res.ok) return { ok: true };
    let errMsg = 'HTTP ' + res.status;
    try {
      const j = JSON.parse(text);
      errMsg = (j.error && (j.error.message || j.error.type)) || (j.message) || errMsg;
    } catch (_) {}
    return { ok: false, error: errMsg };
  } catch (e) {
    return { ok: false, error: (e && e.message) || 'Bağlantı hatası' };
  }
}

export async function callAIStream(sysP, userP, onChunk, maxTok) {
  const res = await fetch(apiUrl('v1/messages'), {
    method: 'POST',
    headers: getAnthropicHeaders(),
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: maxTok || 1200,
      stream: true,
      system: sysP,
      messages: [{ role: 'user', content: userP }],
    }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error((err.error && err.error.message) || 'API hata: ' + res.status);
  }
  const reader = res.body.getReader();
  const dec = new TextDecoder();
  let buf = '';
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    const lines = buf.split('\n');
    buf = lines.pop() || '';
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line.startsWith('data:')) continue;
      const data = line.slice(5).trim();
      if (data === '[DONE]') break;
      try {
        const ev = JSON.parse(data);
        if (ev.type === 'content_block_delta' && ev.delta && ev.delta.text) onChunk(ev.delta.text);
      } catch (e) {}
    }
  }
}

export async function callAI(prompt, maxTok) {
  for (let att = 0; att < 3; att++) {
    try {
      const res = await fetch(apiUrl('v1/messages'), {
        method: 'POST',
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTok || 900,
          messages: [{ role: 'user', content: prompt }, { role: 'assistant', content: '{' }],
        }),
      });
      const body = await res.text();
      if (!res.ok) {
        if (res.status === 429) { await sleep(2500 * (att + 1)); continue; }
        if (res.status === 404 && att < 2) { await sleep(1500 * (att + 1)); continue; }
        if (res.status === 401) throw new Error('Bu özellik şu an kullanılamıyor. Lütfen daha sonra tekrar deneyin.');
        let em = '';
        try { em = JSON.parse(body).error.message; } catch (e2) { em = 'HTTP ' + res.status; }
        throw new Error(em);
      }
      const data = JSON.parse(body);
      const text = (data.content || []).map(function (b) { return b.text || ''; }).join('').trim();
      if (!text) throw new Error('Boş yanıt');
      return parseJSON('{' + text);
    } catch (e) {
      if (att < 2) { await sleep(800 * (att + 1)); continue; }
      throw e;
    }
  }
}

export async function callAIText(sysP, msgs, maxTok) {
  for (let att = 0; att < 3; att++) {
    try {
      const allMsgs = msgs.concat([{ role: 'assistant', content: '{' }]);
      const res = await fetch(apiUrl('v1/messages'), {
        method: 'POST',
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTok || 900,
          system: sysP,
          messages: allMsgs,
        }),
      });
      const body = await res.text();
      if (!res.ok) {
        if (res.status === 429) { await sleep(2500 * (att + 1)); continue; }
        if (res.status === 404 && att < 2) { await sleep(1500 * (att + 1)); continue; }
        let em = '';
        try { em = JSON.parse(body).error.message; } catch (e2) { em = 'HTTP ' + res.status; }
        throw new Error(em);
      }
      const data = JSON.parse(body);
      const text = (data.content || []).map(function (b) { return b.text || ''; }).join('').trim();
      if (!text) throw new Error('Boş yanıt');
      return parseJSON('{' + text);
    } catch (e) {
      if (att < 2) { await sleep(800 * (att + 1)); continue; }
      throw e;
    }
  }
}

export async function callAIVision(b64, mtype, prompt, maxTok) {
  for (let att = 0; att < 3; att++) {
    try {
      const res = await fetch(apiUrl('v1/messages'), {
        method: 'POST',
        headers: getAnthropicHeaders(),
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: maxTok || 800,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'image', source: { type: 'base64', media_type: mtype, data: b64 } },
                { type: 'text', text: prompt },
              ],
            },
            { role: 'assistant', content: '{' },
          ],
        }),
      });
      const body = await res.text();
      if (!res.ok) {
        if (res.status === 429) { await sleep(2500 * (att + 1)); continue; }
        throw new Error('HTTP ' + res.status);
      }
      const data = JSON.parse(body);
      return parseJSON('{' + (data.content || []).map(function (b) { return b.text || ''; }).join('').trim());
    } catch (e) {
      if (att < 2) { await sleep(800 * (att + 1)); continue; }
      throw e;
    }
  }
}
