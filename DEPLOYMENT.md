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

| Setting            | Value                                                                                                                                   |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------- |
| **Repository**     | Connect your GitHub repo                                                                                                                |
| **Root Directory** | _(leave blank — root of repo)_                                                                                                          |
| **Runtime**        | Node                                                                                                                                    |
| **Build Command**  | `npm install -g pnpm@9.1.0 && pnpm install --no-frozen-lockfile && pnpm run build --filter=@repo/shared && pnpm run build --filter=api` |
| **Start Command**  | `node apps/api/dist/server.js`                                                                                                          |
| **Node Version**   | Set env var `NODE_VERSION` = `20`                                                                                                       |

### Environment Variables (Render Dashboard)

```
NODE_ENV=production
PORT=10000
HOST=0.0.0.0
DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_NEON_HOST/neondb?sslmode=require
JWT_SECRET=<random 64-char string>
JWT_REFRESH_SECRET=<another random 64-char string>
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
```

> **Note:** Render automatically assigns a port via the `PORT` env var. Set it to `10000` (Render's default) or leave it unset and Render will provide it.

After deploying, your API URL will be something like:

```
https://chat-ly-api.onrender.com
```

---

## 2. Deploy the Web App on Vercel

### Import project on [vercel.com](https://vercel.com)

| Setting              | Value                    |
| -------------------- | ------------------------ |
| **Repository**       | Connect your GitHub repo |
| **Root Directory**   | `apps/web`               |
| **Framework Preset** | Next.js (auto-detected)  |
| **Node.js Version**  | 20.x                     |

The `vercel.json` in `apps/web/` already has the correct install and build commands for the monorepo.

### Environment Variables (Vercel Dashboard)

```
NEXT_PUBLIC_API_URL=https://chat-ly-api.onrender.com
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

| Environment    | Where to set it                          | Value                                                |
| -------------- | ---------------------------------------- | ---------------------------------------------------- |
| **Local dev**  | `apps/web/.env.local`                    | `http://localhost:5001`                              |
| **Production** | Vercel Dashboard → Environment Variables | `https://chat-ly-api.onrender.com` (your Render URL) |

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

- [ ] Render: API deployed, env vars set, health check passes at `/`
- [ ] Vercel: Web deployed, `NEXT_PUBLIC_API_URL` points to Render URL
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
