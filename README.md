# Boast IQ — tracker frontend

The web client for the Boast IQ tracker, served at `app.boast-iq.com` via Cloudflare Pages. Talks to the FastAPI backend on Modal (`boastiq-tracker` app).

## Architecture

```
Browser (app.boast-iq.com / Cloudflare Pages)
     │
     ▼ HTTPS + WebSocket
FastAPI on Modal (boastiq-tracker-web.modal.run)
     │
     ▼
SAM2 + TrackNet on A100-80GB
```

## Before deploy — set the Modal URL

`index.html` has one configurable constant:

```js
const API = "https://YOUR_MODAL_WORKSPACE--boastiq-tracker-web.modal.run";
```

Find your workspace name:
```bash
modal config show
# look for: workspace: <your-workspace>
```

Or from the Modal dashboard URL after `modal.com/`. Replace `YOUR_MODAL_WORKSPACE` and commit.

## Deploy — Cloudflare Pages

### 1. Push to GitHub

```bash
cd /Users/kabeerahuja/Download/Coding/boast-iq-app
git init
git add .
git commit -m "Initial tracker frontend"
# Create empty repo at github.com/new (name: boast-iq-app)
git remote add origin https://github.com/KabeerAhuja/boast-iq-app.git
git branch -M main
git push -u origin main
```

### 2. Cloudflare Pages project

1. dash.cloudflare.com → Workers & Pages → Create application → Pages → Connect to Git
2. Select `boast-iq-app`
3. Build settings:
   - Framework preset: **None**
   - Build command: *blank*
   - Build output directory: *blank* (defaults to `/`)
4. Save and Deploy → ~30 sec → live at `boast-iq-app.pages.dev`

### 3. Custom subdomain — `app.boast-iq.com`

In the Pages project → Custom domains → Set up a custom domain:
- Enter `app.boast-iq.com`
- Cloudflare auto-adds the DNS CNAME because boast-iq.com is already on Cloudflare nameservers.
- SSL provisions in ~1 minute.

## CORS

The Modal FastAPI app already has `CORSMiddleware(allow_origins=["*"])` configured — no backend changes needed for cross-origin requests from `app.boast-iq.com`.

If you ever tighten CORS to a specific allowlist, add `https://app.boast-iq.com` (and `https://boast-iq.com` if you ever embed iframe-style).

## Local preview

```bash
cd /Users/kabeerahuja/Download/Coding/boast-iq-app
python3 -m http.server 8000
# open http://localhost:8000
```

Note: Firebase auth and the Modal backend both work cross-origin, so local preview hits the real production API. Use with care.
