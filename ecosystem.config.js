module.exports = {
  apps: [
    {
      name: 'openclaw-dashboard',
      cwd: process.env.HOME + '/.openclaw/workspace/dashboard',
      script: 'node_modules/.bin/next',
      args: 'start',
      env: {
        NODE_ENV: 'production',
        PORT: 3000,
      },
      instances: 1,
      autorestart: true,
      max_restarts: 10,
      restart_delay: 5000,
      watch: false,
      log_file: process.env.HOME + '/.openclaw/logs/dashboard.log',
      error_file: process.env.HOME + '/.openclaw/logs/dashboard-error.log',
      merge_logs: true,
      time: true,
    },
  ],
};
