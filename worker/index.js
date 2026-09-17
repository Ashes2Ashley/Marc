const ALLOWED_HOSTS = new Set([
  'sor.dps.texas.gov','www.meganslaw.ca.gov','meganslaw.ca.gov','offender.fdle.state.fl.us',
  'www.criminaljustice.ny.gov','www.isp.state.il.us','gbi.georgia.gov','www.icrimewatch.net','www.pameganslaw.state.pa.us',
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
  if (now - row.t > WINDOW_MS) { RATE.set(ip, { n: 1, t: now }); return false; }
  if (row.n >= MAX_PER_WINDOW) return true;
  row.n += 1; RATE.set(ip, row); return false;
}
function harden(h) {
  h.set('X-Content-Type-Options', 'nosniff');
  h.set('X-Frame-Options', 'DENY');
  h.set('Referrer-Policy', 'no-referrer');
  h.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  h.set('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  h.set('Content-Security-Policy', "default-src 'self'; img-src 'self' data:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self'");
  h.set('Cache-Control', 'no-store');
  return h;
}
function cors(res) {
  const h = harden(new Headers(res.headers));
  h.set('Access-Control-Allow-Origin', '*');
  h.set('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  h.set('Access-Control-Allow-Headers', 'Content-Type');
  return new Response(res.body, { status: res.status, headers: h });
}
function json(data, status = 200) {
  return cors(new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json; charset=utf-8' } }));
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (request.method === 'OPTIONS') return cors(new Response(null, { status: 204 }));
    if (url.pathname === '/api/health') return json({ ok: true, service: 'marc-live', ts: new Date().toISOString(), hardened: true });
    if (url.pathname === '/api/hosts') return json({ hosts: Array.from(ALLOWED_HOSTS) });
    if (url.pathname === '/api/robots' && request.method === 'POST') {
      if (limited(clientIp(request))) return json({ error: 'Rate limited' }, 429);
      let body; try { body = await request.json(); } catch { return json({ error: 'JSON body required' }, 400); }
      let parsed; try { parsed = new URL(String(body.url || '')); } catch { return json({ error: 'Invalid URL' }, 400); }
      if (parsed.protocol !== 'https:' || !ALLOWED_HOSTS.has(parsed.hostname)) return json({ error: 'Host not allowed' }, 403);
      try {
        const robotsUrl = `${parsed.protocol}//${parsed.hostname}/robots.txt`;
        const res = await fetch(robotsUrl, { method: 'GET', redirect: 'follow' });
        return json({ url: robotsUrl, status: res.status, body: (await res.text()).slice(0, 4000) });
      } catch (err) { return json({ error: String(err) }, 502); }
    }
    if (url.pathname === '/api/fetch' && request.method === 'POST') {
      if (limited(clientIp(request))) return json({ error: 'Rate limited. Try again in a minute.' }, 429);
      let body; try { body = await request.json(); } catch { return json({ error: 'JSON body required' }, 400); }
      let parsed; try { parsed = new URL(String(body.url || '')); } catch { return json({ error: 'Invalid URL' }, 400); }
      if (parsed.protocol !== 'https:') return json({ error: 'HTTPS only' }, 400);
      if (!ALLOWED_HOSTS.has(parsed.hostname)) return json({ error: 'Host not on official public allowlist', host: parsed.hostname }, 403);
      try {
        const upstream = await fetch(parsed.toString(), {
          method: 'GET',
          headers: { Accept: 'text/html,application/json,application/xml;q=0.9,*/*;q=0.8', 'User-Agent': 'MarcLiveResearch/1.0' },
          redirect: 'follow',
        });
        const ctype = (upstream.headers.get('content-type') || 'unknown').toLowerCase();
        if (!/html|json|xml|text\//.test(ctype)) return json({ error: 'Rejected content-type', contentType: ctype, status: upstream.status }, 415);
        const raw = await upstream.text();
        if (raw.length > 2000000) return json({ error: 'Upstream body too large', byteSize: raw.length }, 413);
        return json({ url: parsed.toString(), status: upstream.status, statusText: upstream.statusText, contentType: ctype, byteSize: raw.length, rawBody: raw.slice(0, 8000), corsBlocked: false });
      } catch (err) {
        return json({ error: String(err), corsBlocked: true, status: 0 }, 502);
      }
    }
    if (env.ASSETS) return env.ASSETS.fetch(request);
    return json({ error: 'Not found. Build the SPA and bind assets, or call /api/health.' }, 404);
  },
};
