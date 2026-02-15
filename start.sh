#!/bin/bash

echo "🚀 Starting OpenClaw Dashboard..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    echo ""
fi

# Check if database exists
if [ ! -f "$HOME/.openclaw/workspace/data/usage.db" ]; then
    echo "⚠️  Warning: Database not found at $HOME/.openclaw/workspace/data/usage.db"
    echo "   Make sure OpenClaw is installed and has generated a usage database."
    echo ""
fi

# Get Tailscale IP
TAILSCALE_IP=$(tailscale ip -4 2>/dev/null)
if [ -n "$TAILSCALE_IP" ]; then
    echo "🌐 Dashboard will be accessible at:"
    echo "   Local:     http://localhost:3000"
    echo "   Tailscale: http://$TAILSCALE_IP:3000"
else
    echo "🌐 Dashboard will be accessible at:"
    echo "   Local: http://localhost:3000"
    echo "   ⚠️  Tailscale IP not detected - make sure Tailscale is running"
fi

echo ""
echo "📱 To add to your phone, open the URL above in Safari and tap 'Add to Home Screen'"
echo ""

# Start the development server
npm run dev
