# Host Marc on Cloudflare Workers

You must deploy from your own Cloudflare account. This repo is ready; I cannot log into Cloudflare for you.

```bash
npm install
npm run build
npx wrangler login
npx wrangler deploy
```

After deploy, the Worker URL serves the app and:

- `GET /api/health`
- `GET /api/features`
- `POST /api/fetch` `{ "url": "https://official-allowlisted-host/..." }`

The fetch route only accepts official public registry hosts listed in `worker/index.js`, uses HTTPS only, and rate-limits to 8 requests per IP per minute. It does not invent records.

Optional:

```
VITE_WORKER_URL=https://marc-live.<your-subdomain>.workers.dev
```
