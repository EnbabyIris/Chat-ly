# Chat-ly 💬

**Real-time chat application with modern UI, status stories, and AI-powered suggestions.**

> Built with Next.js 16, Express, Socket.IO, and PostgreSQL in a Turborepo monorepo.

## 🎯 What is Chat-ly?

Chat-ly is a full-featured real-time messaging platform featuring instant messaging, status stories (similar to WhatsApp), AI-powered message suggestions, online presence tracking, and notification systems.

## ✨ Key Features

- 💬 **Real-time Messaging**: Instant chat powered by Socket.IO
- 📸 **Status Stories**: Share image/text statuses visible to all users
- 🤖 **AI Suggestions**: Smart reply suggestions powered by Google Gemini
- 🟢 **Online Presence**: Real-time online/offline status tracking
- 🔔 **Notifications**: In-app and browser notifications for new messages
- 👤 **User Profiles**: Customizable profiles with avatar support
- 🔐 **Authentication**: Secure JWT-based auth with refresh tokens
- 📱 **Responsive Design**: Clean, modern UI built with TailwindCSS 4

## 🛠️ Built With

- **Frontend**: Next.js 16 (Turbopack) + React 18 + TypeScript
- **Backend**: Express 4 + Socket.IO + Drizzle ORM
- **Database**: PostgreSQL (Neon)
- **AI**: Google Gemini API
- **Styling**: TailwindCSS 4 + Framer Motion
- **Monorepo**: Turborepo + pnpm workspaces

## 🚀 Getting Started

1. **Clone and install**

   ```bash
   git clone https://github.com/itsaryanchauhan/Chat-ly.git
   cd Chat-ly
   pnpm install
   ```

2. **Set up environment variables**

   ```bash
   # apps/api/.env
   DATABASE_URL=your_postgres_connection_string
   JWT_SECRET=your_jwt_secret
   JWT_REFRESH_SECRET=your_refresh_secret

   # apps/web/.env.local
   NEXT_PUBLIC_API_URL=http://localhost:5001
   NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key
   ```

3. **Run the app**

   ```bash
   pnpm dev
   ```

4. **Open browser**
   - Web: `http://localhost:3000`
   - API: `http://localhost:5001`

## 📁 Project Structure

```
Chat-ly/
├── apps/
│   ├── api/          # Express backend + Socket.IO
│   ├── web/          # Next.js frontend
│   └── docs/         # Documentation site
├── packages/
│   ├── shared/       # Shared types, validations, constants
│   ├── ui/           # Shared UI components
│   └── ...           # ESLint & TypeScript configs
```

## 👤 Author

Created by **Aryan Chauhan** ([@itsaryanchauhan](https://github.com/itsaryanchauhan))

## 📞 Get in Touch

Have questions or suggestions? Open an issue on the [GitHub repository](https://github.com/itsaryanchauhan/Chat-ly).

---

**Made with ❤️ for better conversations**
