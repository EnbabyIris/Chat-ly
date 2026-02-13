# Deployment Guide — Chat-ly

## Architecture

| Service                       | Platform | What it runs                     |
| ----------------------------- | -------- | -------------------------------- |
| **Web** (Next.js)             | Vercel   | Frontend + SSR                   |
| **API** (Express + Socket.IO) | Render   | REST API + WebSocket             |
| **Database**                  | Neon     | PostgreSQL (already provisioned) |

---

## 1. Deploy the API on Render

### Create a new **Web Service** on [render.com](https://render.com)

> **Why Web Service?** The API uses Express + Socket.IO, which needs to accept incoming HTTP and WebSocket connections. Only a Web Service (not Background Worker or Cron Job) exposes an external URL for this.

#### Step-by-step

1. Go to **Render Dashboard → New → Web Service**
2. Connect your GitHub repo (`itsaryanchauhan/Chat-ly`)
3. Fill in these settings:

| Setting            | Value                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| **Name**           | `chat-ly` (or whatever you want)                                                                                              |
| **Root Directory** | _(leave blank — root of repo)_                                                                                                |
| **Runtime**        | Node                                                                                                                          |
| **Build Command**  | `corepack enable && NODE_ENV=development pnpm install && pnpm --filter @repo/shared run build && pnpm --filter api run build` |
| **Start Command**  | `node apps/api/dist/server.js`                                                                                                |

#### Environment Variables (Render → Environment tab)

Add all of these:

```
NODE_VERSION=20
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_NEON_HOST/neondb?sslmode=require
JWT_SECRET=<random 64-char string>
JWT_REFRESH_SECRET=<another random 64-char string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

> **Node version:** Render doesn't have a UI dropdown for Node version. Instead, set the env var `NODE_VERSION=20` — Render reads this and uses Node 20.x for the build.

> **Port:** Render uses `PORT` to know which port your app listens on. `10000` is Render's default. The app reads this automatically.

Your API URL: **https://chat-ly.onrender.com**

---

## 2. Deploy the Web App on Vercel

### Step-by-step

1. Go to **Vercel Dashboard → Add New → Project**
2. Import your GitHub repo (`itsaryanchauhan/Chat-ly`)
3. Fill in these settings:

| Setting              | Value                   |
| -------------------- | ----------------------- |
| **Root Directory**   | `apps/web`              |
| **Framework Preset** | Next.js (auto-detected) |

> **Node version:** Vercel defaults to 20.x, which is correct. If you ever need to change it: **Settings → General → Node.js Version** dropdown.

The `vercel.json` inside `apps/web/` automatically handles the monorepo install and build — no need to manually set build commands.

### Environment Variables (Vercel → Settings → Environment Variables)

```
NEXT_PUBLIC_API_URL=https://chat-ly.onrender.com
NEXT_PUBLIC_GEMINI_API_KEY=YOUR_GEMINI_API_KEY
```

#### Optional — Cloudinary (for image uploads via CDN)

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
```

> If these are **not** set, image uploads still work — they are sent as data URLs directly through the chat. Cloudinary just gives you CDN-hosted URLs and image optimization.

#### How to get Cloudinary keys

1. Sign up at [cloudinary.com](https://cloudinary.com)
2. Go to **Settings → Upload**
3. Create an **Unsigned Upload Preset**
4. Your **Cloud Name** is on the Dashboard home page
5. Put the cloud name in `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`
6. Put the preset name in `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`

---

## 3. Changing localhost URLs for Production

The only URL you need to change is `NEXT_PUBLIC_API_URL`:

| Environment    | Where to set it                          | Value                                            |
| -------------- | ---------------------------------------- | ------------------------------------------------ |
| **Local dev**  | `apps/web/.env.local`                    | `http://localhost:5001`                          |
| **Production** | Vercel Dashboard → Environment Variables | `https://chat-ly.onrender.com` (your Render URL) |

The API server's CORS is configured to accept **all origins** (`origin: true`), so any Vercel deployment URL will work automatically.

---

## 4. Database (Neon)

Your Neon database is already set up. Just make sure the `DATABASE_URL` on Render matches your Neon connection string.

To push the schema to a fresh database:

```bash
cd apps/api
pnpm db:push
```

---

## 5. Quick Checklist

- [ ] Render: Web Service created, env vars set (including `NODE_VERSION=20`), health check passes at `/`
- [ ] Vercel: Project imported with root dir `apps/web`, `NEXT_PUBLIC_API_URL` points to `https://chat-ly.onrender.com`
- [ ] Test: Register → Login → Send message → See AI suggestions
- [ ] Optional: Add Cloudinary keys on Vercel for CDN image uploads

---

## Troubleshooting

| Issue                          | Fix                                                                                  |
| ------------------------------ | ------------------------------------------------------------------------------------ |
| **502 on Render**              | Check Render logs. Usually means `DATABASE_URL` or `JWT_SECRET` is missing.          |
| **CORS error in browser**      | Make sure `NEXT_PUBLIC_API_URL` uses `https://` (not `http://`).                     |
| **WebSocket won't connect**    | Render supports WebSockets by default. Ensure the client connects to the Render URL. |
| **AI suggestions not working** | Make sure `NEXT_PUBLIC_GEMINI_API_KEY` is set on Vercel.                             |
| **Images not uploading**       | Works without Cloudinary (data URL fallback). For large images, add Cloudinary keys. |
| **Build timeout / OOM**        | Make sure root `package.json` has `"build": "turbo run build"` (not `build.sh`).     |
