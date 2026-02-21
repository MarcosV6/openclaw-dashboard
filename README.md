# OpenClaw Dashboard

A personal AI dashboard built on top of [OpenClaw](https://github.com/openclaw/openclaw) — track usage, manage tasks, and control your AI assistant from a clean web interface.

## Screenshots

![Dashboard Overview](public/screenshots/Screenshot%202026-02-20%20at%207.24.36%E2%80%AFPM.png)

![Task Board](public/screenshots/Screenshot%202026-02-20%20at%207.25.06%E2%80%AFPM.png)

## Features

- 📊 **Token Usage Analytics** — Track AI model usage and costs over time
- ✅ **Kanban Task Board** — Create tasks and let your AI agent pick them up and work on them automatically
- 💬 **Chat Interface** — Talk to your AI assistant directly from the dashboard
- 🌙 **Automated Briefings** — Morning content briefings, evening wind-downs, all handled by cron jobs
- 📁 **Research Library** — Browse all research reports saved by your AI agent
- 📱 **PWA Ready** — Works on mobile and desktop

## Setup

### Prerequisites
- [OpenClaw](https://github.com/openclaw/openclaw) installed and running
- Node.js 18+

### Installation

```bash
git clone https://github.com/MarcosV6/openclaw-dashboard
cd openclaw-dashboard
npm install
npm run dev
```

Then open [http://localhost:3000](http://localhost:3000) in your browser.

### PIN Authentication
The dashboard is protected by a PIN. Default PIN: `1337`

To change it, update the pin value in the API auth route.

## Stack

- **Framework:** Next.js 14 (App Router)
- **Styling:** Tailwind CSS
- **Database:** SQLite (shared with OpenClaw)
- **Runtime:** Node.js

## Roadmap

- [ ] Native mobile app (Android/iOS)
- [ ] Real-time notifications
- [ ] Enhanced usage analytics
- [ ] Multi-agent support

## Contributing

PRs welcome! Drop a ⭐ if you find this useful.

## License

MIT
