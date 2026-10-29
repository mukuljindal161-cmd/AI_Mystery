# Deploy Whodunit AI: Render + Vercel

Use the same Git repository for both hosts. **Keep Root Directory at the repository root on both hosts**, not `server` or `client`. This repository uses npm workspaces and one root `package-lock.json`.

## 1. Push the repository

Commit source files, `package-lock.json`, `render.yaml`, and the root `vercel.json`, then push to your Git provider. Never commit `.env` files or `node_modules`. The `.env.example` templates are safe to commit. Local `.env` files are not uploaded: configure production values in the hosting dashboards.

## 2. Deploy the backend to Render

Create a **Blueprint** from your repository. Render reads `render.yaml` and asks for the environment values marked `sync: false`. Alternatively, create a **Web Service** with these settings:

| Setting | Value |
| --- | --- |
| Runtime | Node |
| Root Directory | Leave blank (repository root) |
| Build Command | `npm ci --workspace server --include-workspace-root=false --omit=dev` |
| Start Command | `npm start --workspace server` |
| Health Check Path | `/api/health` |
| Node version | 24.x (declared in root `package.json`) |

Set these **Render environment variables**:

| Variable | Value |
| --- | --- |
| `MONGODB_URI` | Your Atlas connection string, including the intended database name |
| `GEMINI_API_KEY` | Your working Gemini API key |
| `GEMINI_MODEL` | `gemini-3.1-flash-lite` (verified with this project) |
| `CLIENT_ORIGIN` | Your exact Vercel production origin, e.g. `https://your-project.vercel.app` |
| `NODE_ENV` | `production` |
| `TRUST_PROXY` | `1` |
| `MOCK_AI` | `false` |

Leave `DNS_SERVERS` unset on Render. The `1.1.1.1` override in your local `.env` solves your local router's DNS problem; it is not needed by default in production. Do not copy your local `PORT=5000` setting: the app reads Render's assigned `PORT` and listens on `0.0.0.0`.

In Atlas **Network Access**, allow the outbound IP ranges shown for your Render service. Ensure the Atlas database user can read/write the database in your connection string.

If you do not yet know your Vercel URL, use the intended project origin temporarily, then replace it with the actual production origin after Vercel creates the project. A wrong origin does not affect the backend health check but will block browser API requests.

After Render deploys, visit `https://YOUR-API.onrender.com/api/health`. Expect `{"status":"ok"}`. Save your actual Render URL for the next step.

## 3. Deploy the frontend to Vercel

Import the same repository as a new Vercel project:

| Setting | Value |
| --- | --- |
| Root Directory | Repository root (`./`) |
| Framework Preset | Vite |
| Install Command | `npm ci` |
| Build Command | `npm run build` |
| Output Directory | `client/dist` |
| Node version | 24.x |

The root `vercel.json` declares these commands and the SPA rewrite, so refreshing `/create` or `/case/:id` serves the React app.

Before deploying, add **`VITE_API_URL=https://YOUR-API.onrender.com/api`** to the Vercel **Production** environment. Use your actual Render URL and include `/api`. The build rejects missing/invalid API URLs and localhost URLs on Vercel. Never add MongoDB credentials or the Gemini key to Vercel frontend variables.

Deploy, then set Render's `CLIENT_ORIGIN` to the exact Vercel production origin. Use only the scheme and hostname, without `/create` or other paths. A trailing slash is normalized automatically. Save the Render setting and allow its service to redeploy.

Vite embeds `VITE_API_URL` during the build. If you change it, **redeploy Vercel**. If you change `CLIENT_ORIGIN`, **redeploy/restart Render**. Use the stable production URL for testing; random Vercel preview URLs are deliberately not allowed by the production backend's CORS policy.

## 4. Verify the deployment

1. Check `/api/health` on Render.
2. Open the Vercel production URL and generate an Easy case.
3. Discover a clue, request a hint, and refresh; progress should persist.
4. Make an accusation and verify the result and score.
5. Refresh the result page directly to verify the SPA rewrite.
6. Repeat generation at Medium and Hard; inspect mobile layout.

Render's free service can sleep when idle. Open the health endpoint and let it wake before the first gameplay test. The client has a 60-second timeout; a cold start combined with long AI generation can exceed it.

## Troubleshooting

| Symptom | Check |
| --- | --- |
| “Can't reach the server” | Render health, `VITE_API_URL`, and exact `CLIENT_ORIGIN` match |
| Frontend calls localhost | Set Vercel's production `VITE_API_URL` and redeploy |
| MongoDB connection fails | Atlas network allow-list, database credentials, and URI |
| AI model unavailable | Set `GEMINI_MODEL=gemini-3.1-flash-lite` and restart Render |
| AI quota exceeded | Gemini quota/billing for the configured key |
| Page refresh returns 404 | Vercel Root Directory must be the repository root so it reads `vercel.json` |
| Build cannot find workspace/lockfile | Use repository root and commit root `package-lock.json` |

Hosting references: [Render monorepos](https://render.com/docs/monorepo-support), [Render Blueprint configuration](https://render.com/docs/blueprint-spec), [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite).

Status: configuration prepared; no hosting deployment has been performed by this setup task.
