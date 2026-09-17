const ALLOWED_HOSTS = new Set([
  'sor.dps.texas.gov',
  'www.meganslaw.ca.gov',
  'meganslaw.ca.gov',
  'offender.fdle.state.fl.us',
  'www.criminaljustice.ny.gov',
  'www.isp.state.il.us',
  'gbi.georgia.gov',
  'www.icrimewatch.net',
  'www.pameganslaw.state.pa.us',
]);

const RATE = new Map();
const WINDOW_MS = 60000;
const MAX_PER_WINDOW = 8;

function clientIp(req) {
  return req.headers.get('cf-connecting-ip') || req.headers.get('x-forwarded-for') || 'anon';
}

function limited(ip) {
  const now = Date.now();
  const row = RATE.get(ip) || { n: 0, t: now };
  if (now - row.t > WINDOW_MS) {
    RATE.set(ip, { n: 1, t: now });
    return false;
  }
  if (row.n >= MAX_PER_WINDOW) return true;
  row.n += 1;
  RATE.set(ip, row);
  return false;
}

function cors(res) {
  const h = new Headers(res.headers);
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(res.body, { status: res.status, headers: h });
}

function json(data, status = 200) {
  return cors(new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (url.pathname === '/api/health') {
      return json({ ok: true, service: 'marc-live', ts: new Date().toISOString(), features: 10 });
    }
    if (url.pathname === '/api/features') {
      return json({
        features: [
          { id: 1, name: 'Allowlisted live gateway' },
          { id: 2, name: 'Command palette' },
          { id: 3, name: 'Source health' },
          { id: 4, name: 'Hash dedup' },
          { id: 5, name: 'Parse confidence' },
          { id: 6, name: 'Run journal' },
          { id: 7, name: 'Idle auto-lock' },
          { id: 8, name: 'Retention window' },
          { id: 9, name: 'Record notes' },
          { id: 10, name: 'Export checksum' },
        ],
      });
    }
    if (url.pathname === '/api/fetch' && request.method === 'POST') {
      if (limited(clientIp(request))) return json({ error: 'Rate limited. Try again in a minute.' }, 429);
      let body;
      try { body = await request.json(); } catch { return json({ error: 'JSON body required' }, 400); }
      const target = String(body.url || '');
      let parsed;
      try { parsed = new URL(target); } catch { return json({ error: 'Invalid URL' }, 400); }
      if (parsed.protocol !== 'https:') return json({ error: 'HTTPS only' }, 400);
      if (!ALLOWED_HOSTS.has(parsed.hostname)) return json({ error: 'Host not on official public allowlist', host: parsed.hostname }, 403);
      try {
        const upstream = await fetch(parsed.toString(), {
          method: 'GET',
          headers: {
            Accept: 'text/html,application/json,application/xml;q=0.9,*/*;q=0.8',
            'User-Agent': 'MarcLiveResearch/1.0',
          },
          redirect: 'follow',
        });
        const raw = await upstream.text();
        return json({
          url: parsed.toString(),
          status: upstream.status,
          statusText: upstream.statusText,
          contentType: upstream.headers.get('content-type') || 'unknown',
          byteSize: raw.length,
          rawBody: raw.slice(0, 8000),
          corsBlocked: false,
        });
      } catch (err) {
        return json({ error: String(err), corsBlocked: true, status: 0 }, 502);
      }
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ error: 'Not found. Build the SPA and bind assets, or call /api/health.' }, 404);
  },
};
