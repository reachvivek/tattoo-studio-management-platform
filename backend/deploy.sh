#!/bin/bash
# Backend Deployment Script for EC2
# This script pulls the latest changes and restarts PM2

echo "🚀 Starting deployment..."

# Change to backend directory
cd /home/ubuntu/tattoo-studio-management-platform/backend || exit 1

# Pull latest changes from main branch
echo "📥 Pulling latest changes from GitHub..."
git pull origin main

# Install dependencies if package.json changed
echo "📦 Installing dependencies..."
npm install --production

# Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# Restart PM2
echo "♻️  Restarting PM2..."
pm2 restart bookink-backend || pm2 start npm --name "bookink-backend" -- start

echo "✅ Deployment completed successfully!"
echo "📊 PM2 Status:"
pm2 status bookink-backend
