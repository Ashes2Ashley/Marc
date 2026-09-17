# Host Marc on Cloudflare Workers

Deploy from your own Cloudflare account. This repo is ready; credentials stay on your machine.

```bash
npm install
npm run cf:login   # once
npm run cf:deploy  # vite build && wrangler deploy
```

Or step by step:

```bash
npm run build
npx wrangler deploy
```

After deploy, the Worker URL serves the SPA and:

- `GET /api/health`
- `GET /api/hosts`
- `POST /api/robots` `{ "url": "https://official-allowlisted-host/..." }`
- `POST /api/fetch` `{ "url": "https://official-allowlisted-host/..." }`

The fetch route only accepts official public registry hosts listed in `worker/index.js`, uses HTTPS only, and rate-limits to 8 requests per IP per minute. It does not invent records.

`wrangler` is a devDependency so `npm run cf:deploy` works after `npm install`.

Optional `.env` (see `.env.example`):

```
VITE_WORKER_URL=https://marc-live.<your-subdomain>.workers.dev
```

Leave `VITE_WORKER_URL` unset when the SPA is served from the same Worker (recommended).
