# OpenClaw Dashboard

A self-hosted web dashboard for [OpenClaw](https://github.com/openclaw) — monitor your AI agent, chat with it, track token usage, manage tasks, and browse memory files.

<!-- ![screenshot](docs/screenshot.png) -->

## Features

- **Home Dashboard** — gateway status, heartbeat, cron jobs, database health at a glance
- **Chat Interface** — talk to your OpenClaw agent via the gateway WebSocket protocol
- **Kanban Tasks** — drag-and-drop task board your agent can work from automatically
- **Usage Analytics** — token spend, cost breakdowns, model comparisons over time
- **Session Viewer** — browse raw JSONL session logs from your agent
- **Memory Browser** — read and search your agent's markdown memory files
- **Light / Dark Mode** — automatic theme toggle
- **PIN Authentication** — simple PIN-based login to protect your dashboard
- **PWA Support** — installable on iOS and Android as a home-screen app

## Prerequisites

- **Node.js 18+**
- **OpenClaw** installed and running (gateway on port 18789)

---

## Quick Start

### Option A: Let your agent do it

Paste this into your OpenClaw agent:

> Install the OpenClaw Dashboard. Clone https://github.com/MarcosV6/openclaw-dashboard.git into ~/.openclaw/workspace/dashboard. Create the usage.db database at ~/.openclaw/workspace/data/usage.db with the schema from the README if it doesn't already exist. Create .env.local from .env.example — find my gateway auth token from ~/.openclaw/openclaw.json (under gateway.auth.token) and fill it in for both NEXT_PUBLIC_OPENCLAW_TOKEN and OPENCLAW_AUTH_TOKEN. Set DASHBOARD_PIN to a random 4-digit number and tell me what it is. Leave all paths as defaults. Then run npm install, npm run build, and npm start. Tell me the URL when it's running.

### Option B: Manual setup

```bash
git clone https://github.com/MarcosV6/openclaw-dashboard.git
cd openclaw-dashboard
cp .env.example .env.local
# Edit .env.local with your paths and tokens
npm install
npm run build
npm start
```

The dashboard will be available at `http://localhost:3000`.

---

## Agent Task Board

The Tasks page is a kanban board your OpenClaw agent can pick up work from, update progress, and mark tasks as done — all through the REST API.

### Teach your agent the task board

Paste this into your OpenClaw agent so it learns how to use the board:

> I have a task board on my dashboard at http://localhost:3000. Here's how to use it:
>
> **Authentication:**
> ```
> curl -s -c /tmp/dash-cookie.txt http://localhost:3000/api/auth -X POST -H 'Content-Type: application/json' -d '{"pin":"YOUR_PIN"}'
> ```
>
> **Check for tasks:**
> ```
> curl -s -b /tmp/dash-cookie.txt http://localhost:3000/api/tasks
> ```
>
> **When you find a task with status "todo":**
> 1. Move it to "inProgress" with a PUT request (send the full task object with status changed)
> 2. Do the work described in the task description
> 3. When finished, send another PUT changing status to "done"
>
> **PUT format:**
> ```
> curl -s -b /tmp/dash-cookie.txt http://localhost:3000/api/tasks -X PUT -H 'Content-Type: application/json' -d '{"id":"TASK_ID","title":"TASK_TITLE","description":"TASK_DESC","priority":"TASK_PRIORITY","status":"NEW_STATUS"}'
> ```
>
> Always execute the curl commands — don't just describe what you would do. Show me the output of each one. When I ask you to "check the board" or "work on tasks", this is what I mean. Save this to your memory so you remember it across sessions.

Replace `YOUR_PIN` with whatever you set as `DASHBOARD_PIN` in `.env.local`.

Once your agent knows this, create tasks on the board with detailed descriptions (the agent reads the description field as its instructions), then tell it to "check the board" whenever you want it to pick up work.

### Automatic task worker (cron job)

Want your agent to check the board and work on tasks automatically without you having to ask? Set up a cron job.

**Option A: Let your agent set it up**

Paste this into your OpenClaw agent:

> Add a new cron job to ~/.openclaw/cron/jobs.json called "Task Board Worker". It should run every 2 hours in my timezone. The job should check my dashboard task board at http://localhost:3000/api/tasks for any tasks with status "todo". If there are none, stop. If there is one, pick the highest priority task, move it to "inProgress" with a PUT request, do the work described in the task description, then move it to "done" with another PUT. It needs to authenticate first with my dashboard PIN. Use the same PIN from my .env.local file. Only work on one task per run. Set the timeout to 600 seconds. After editing jobs.json, restart the gateway so the new job takes effect.

**Option B: Manual setup**

Add this entry to the `jobs` array in `~/.openclaw/cron/jobs.json`:

```json
{
  "id": "task-board-worker",
  "agentId": "main",
  "name": "Task Board Worker",
  "enabled": true,
  "createdAtMs": 1771135200000,
  "updatedAtMs": 1771135200000,
  "schedule": {
    "kind": "cron",
    "expr": "0 */2 * * *",
    "tz": "America/New_York"
  },
  "sessionTarget": "isolated",
  "wakeMode": "now",
  "payload": {
    "kind": "agentTurn",
    "message": "Check the dashboard task board for work. First authenticate: curl -s -c /tmp/dash-cookie.txt http://localhost:3000/api/auth -X POST -H 'Content-Type: application/json' -d '{\"pin\":\"YOUR_PIN\"}'. Then fetch tasks: curl -s -b /tmp/dash-cookie.txt http://localhost:3000/api/tasks. Look for tasks with status \"todo\". If there are none, just reply \"No tasks on the board\" and stop. If there is a todo task, pick the highest priority one and: 1) Move it to inProgress with a PUT request. 2) Do the work described in the task description. 3) Move it to done with another PUT. Only work on ONE task per run. Always actually execute the curl commands and show output.",
    "timeoutSeconds": 600
  },
  "delivery": {
    "mode": "none"
  },
  "state": {}
}
```

**Things to customize:**

| Field | What to change |
|-------|---------------|
| `YOUR_PIN` | Your `DASHBOARD_PIN` from `.env.local` |
| `tz` | Your timezone (e.g. `America/Chicago`, `Europe/London`, `Asia/Tokyo`) |
| `expr` | Schedule — `0 */2 * * *` = every 2h, `0 * * * *` = every 1h, `*/30 * * * *` = every 30min |
| `timeoutSeconds` | Max time per run — increase for longer tasks |

> **Note:** The cron job does not specify a model, so it will use your agent's default model. If you want the task worker to use a specific model (e.g. a smarter model for complex tasks, or a cheaper model to save costs), add a `"model"` field inside the `"payload"` object:
> ```json
> "payload": {
>   "kind": "agentTurn",
>   "message": "...",
>   "timeoutSeconds": 600,
>   "model": "openrouter/anthropic/claude-sonnet-4.5"
> }
> ```
> Use whatever model your OpenClaw setup has access to.

After editing `jobs.json`, restart your OpenClaw gateway for the new job to take effect.

### Tasks API reference

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks |
| `GET` | `/api/tasks?completed=true` | List completed task history |
| `POST` | `/api/tasks` | Create a task (`{id, title, description, priority, status}`) |
| `PUT` | `/api/tasks` | Update a task (send full task object with new values) |
| `DELETE` | `/api/tasks` | Delete a task (`{id}`) |

Task statuses: `todo`, `inProgress`, `done`

---

## Connecting to OpenClaw

The dashboard reads data directly from your OpenClaw installation. If you installed OpenClaw with default settings, most paths are auto-detected under `~/.openclaw/` and you only need to configure your gateway auth token.

### 1. Find your gateway auth token

The chat feature connects to the OpenClaw gateway via WebSocket. To authenticate, you need the token from your OpenClaw config:

```bash
cat ~/.openclaw/openclaw.json | grep -A2 '"auth"'
```

Look for the `gateway.auth.token` value and set it in `.env.local`:

```
NEXT_PUBLIC_OPENCLAW_TOKEN=your-token-here
OPENCLAW_AUTH_TOKEN=your-token-here
```

> Both variables use the same token. `NEXT_PUBLIC_` is for the browser-side WebSocket connection, `OPENCLAW_AUTH_TOKEN` is for server-side API calls.

### 2. Verify your gateway is running

The dashboard expects the OpenClaw gateway on port 18789:

```bash
curl -s http://127.0.0.1:18789/health
```

If this doesn't respond, make sure the gateway is running (`openclaw gateway start` or check your OpenClaw setup).

### 3. Set up the database

The dashboard reads from a SQLite database for usage analytics, tasks, and health checks. OpenClaw doesn't create this database automatically — you need to initialize it:

```bash
mkdir -p ~/.openclaw/workspace/data

sqlite3 ~/.openclaw/workspace/data/usage.db <<'SQL'
CREATE TABLE IF NOT EXISTS usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp INTEGER NOT NULL,
    session_id TEXT,
    model_used TEXT NOT NULL,
    tokens_in INTEGER NOT NULL DEFAULT 0,
    tokens_out INTEGER NOT NULL DEFAULT 0,
    cost_estimate REAL NOT NULL DEFAULT 0.0,
    task_type TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_timestamp ON usage(timestamp);
CREATE INDEX IF NOT EXISTS idx_model ON usage(model_used);
CREATE INDEX IF NOT EXISTS idx_session ON usage(session_id);

CREATE TABLE IF NOT EXISTS health_checks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    check_time DATETIME DEFAULT CURRENT_TIMESTAMP,
    status TEXT NOT NULL,
    message TEXT,
    record_count INTEGER
);

CREATE TABLE IF NOT EXISTS tasks (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    status TEXT NOT NULL DEFAULT 'todo',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);

CREATE TABLE IF NOT EXISTS completed_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    task_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    priority TEXT NOT NULL DEFAULT 'medium',
    completed_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
SQL
```

If the database already exists (e.g. from an OpenClaw usage tracker or cron job), you're all set — just make sure `DATABASE_PATH` points to it.

### 4. Check your paths

If you used a non-default OpenClaw installation path, update these in `.env.local`:

| Variable | What it points to | How to find it |
|----------|-------------------|----------------|
| `DATABASE_PATH` | Usage SQLite database | `find ~/.openclaw -name "usage.db"` |
| `OPENCLAW_WORKSPACE` | Workspace directory (memory, docs, tasks) | `ls ~/.openclaw/workspace/` |
| `OPENCLAW_SESSIONS` | Agent session JSONL logs | `ls ~/.openclaw/agents/main/sessions/` |

If all your paths are under `~/.openclaw/` with the default layout, you don't need to set any of these — the dashboard auto-detects them.

---

## Environment Variables

Copy `.env.example` to `.env.local` and configure:

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_PATH` | Path to your OpenClaw `usage.db` file | `~/.openclaw/workspace/data/usage.db` |
| `OPENCLAW_WORKSPACE` | Path to your OpenClaw workspace directory | `~/.openclaw/workspace` |
| `OPENCLAW_SESSIONS` | Path to your agent's session JSONL files | `~/.openclaw/agents/main/sessions` |
| `NEXT_PUBLIC_GATEWAY_URL` | WebSocket URL for the OpenClaw gateway | `ws://127.0.0.1:18789` |
| `NEXT_PUBLIC_OPENCLAW_TOKEN` | Gateway auth token (see above) | — |
| `OPENCLAW_AUTH_TOKEN` | Server-side gateway auth token (same token) | — |
| `DASHBOARD_PIN` | PIN code for dashboard login | `0000` |
| `NEXT_PUBLIC_TAILSCALE_GATEWAY` | (Optional) Tailscale WebSocket URL for remote access | — |

## Production Setup with PM2

The included `ecosystem.config.js` runs the dashboard as a PM2 process:

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
```

Logs are written to `~/.openclaw/logs/dashboard.log`.

## Remote Access via Tailscale

To access the dashboard from your phone or other devices:

1. Install [Tailscale](https://tailscale.com) on the machine running the dashboard and on your devices
2. Set `NEXT_PUBLIC_TAILSCALE_GATEWAY` in `.env.local` to your machine's Tailscale WebSocket URL:
   ```
   NEXT_PUBLIC_TAILSCALE_GATEWAY=wss://your-machine.tailnet-name.ts.net
   ```
3. Use [Tailscale Serve](https://tailscale.com/kb/1242/tailscale-serve) to expose port 3000 over HTTPS:
   ```bash
   tailscale serve https / http://localhost:3000
   ```
4. Access the dashboard at `https://your-machine.tailnet-name.ts.net`

## PWA — Add to Home Screen

1. Open the dashboard URL in Safari (iOS) or Chrome (Android)
2. Tap **Share** > **Add to Home Screen**
3. The dashboard will launch as a full-screen app with its own icon

## Development

```bash
npm run dev
```

Runs the Next.js dev server on `http://localhost:3000` with hot reload.

## License

MIT
