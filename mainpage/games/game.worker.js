// games.worker.js
self.onmessage = async (e) => {
  const m = e.data;
  if (!m || m.cmd !== 'load') return;
  try {
    const res = await fetch(m.url);
    if (!res.ok) throw new Error('games.json not found');
    const reader = res.body && res.body.getReader ? res.body.getReader() : null;
    if (!reader) {
      const data = await res.json();
      self.postMessage({ type: 'ready', data });
      return;
    }

    const contentLength = +res.headers.get('Content-Length') || 0;
    let received = 0;
    const chunks = [];

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      chunks.push(value);
      received += value.length;
      const pct = contentLength ? Math.min(99, Math.round(received / contentLength * 100)) : Math.min(99, Math.round(received / 1000000 * 10));
      self.postMessage({ type: 'progress', pct });
    }

    const totalLen = chunks.reduce((p, c) => p + c.length, 0);
    const full = new Uint8Array(totalLen);
    let offset = 0;
    for (const c of chunks) { full.set(c, offset); offset += c.length; }

    const text = new TextDecoder('utf-8').decode(full);
    self.postMessage({ type: 'progress', pct: 99 });
    const data = JSON.parse(text);
    self.postMessage({ type: 'ready', data });
  } catch (err) {
    self.postMessage({ type: 'error', message: err.message || String(err) });
  }
};
