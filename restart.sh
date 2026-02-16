#!/bin/bash

# Restart Script for Incrix Studios OS
# This script stops all running instances and restarts the application

echo "🛑 Stopping all Node.js instances..."

# Kill any running dev servers
pkill -f "node server.js" 2>/dev/null
pkill -f "next dev" 2>/dev/null
pkill -f "next-server" 2>/dev/null

# Kill any queue workers
pkill -f "queueWorker.js" 2>/dev/null
pkill -f "instagramAutomationWorker.js" 2>/dev/null
pkill -f "instagramMediaSyncWorker.js" 2>/dev/null

echo "✅ All instances stopped"
echo ""
echo "🧹 Cleaning up..."

# Clean Next.js cache (optional - uncomment if needed)
# rm -rf .next

echo "✅ Cleanup complete"
echo ""
echo "🚀 Starting application..."
echo ""

# Start the development server
npm run dev
