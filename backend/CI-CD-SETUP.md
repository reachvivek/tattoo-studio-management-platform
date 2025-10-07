# CI/CD Setup for Backend on AWS EC2

This guide will help you set up automated deployment for the backend when you push to GitHub.

## 📋 Prerequisites

- AWS EC2 instance running Ubuntu
- Node.js and npm installed
- PM2 installed globally
- Git configured on EC2
- Repository cloned on EC2

## 🚀 Setup Instructions

### 1. Install PM2 Globally (if not already installed)

```bash
sudo npm install -g pm2
pm2 startup  # Follow the instructions to enable PM2 on system boot
```

### 2. Clone Repository on EC2

```bash
cd /home/ubuntu
git clone https://github.com/reachvivek/tattoo-studio-management-platform.git
cd tattoo-studio-management-platform/backend
```

### 3. Create logs directory

```bash
mkdir -p logs
```

### 4. Make deployment script executable

```bash
chmod +x deploy.sh
```

### 5. Setup Environment Variables

```bash
# Copy your .env file to the backend directory
cp /path/to/your/.env .env

# Or create it manually with all required variables
nano .env
```

### 6. Initial Build and Start

```bash
npm install
npm run build
pm2 start ecosystem.config.js
pm2 save
```

### 7. Start Webhook Server

```bash
# Set webhook secret (optional but recommended)
export WEBHOOK_SECRET="your-secret-key-here"

# Start webhook server with PM2
pm2 start webhook-server.js --name "webhook-server"
pm2 save
```

### 8. Configure GitHub Webhook

1. Go to your GitHub repository: https://github.com/reachvivek/tattoo-studio-management-platform
2. Navigate to **Settings** → **Webhooks** → **Add webhook**
3. Configure:
   - **Payload URL**: `http://YOUR_EC2_PUBLIC_IP:9000/webhook/deploy`
   - **Content type**: `application/json`
   - **Secret**: `your-secret-key-here` (same as WEBHOOK_SECRET)
   - **Events**: Just the push event
   - **Active**: ✓ Checked

4. Click **Add webhook**

### 9. Update Security Group (AWS Console)

Allow inbound traffic on port 9000:
- Type: Custom TCP
- Port: 9000
- Source: GitHub webhook IPs or 0.0.0.0/0 (for testing)

### 10. Test the Setup

```bash
# Check PM2 status
pm2 status

# View logs
pm2 logs bookink-backend
pm2 logs webhook-server

# Test webhook endpoint
curl http://localhost:9000/health
```

## 🔄 How It Works

1. You push code to the `main` branch on GitHub
2. GitHub sends a webhook to your EC2 instance
3. Webhook server receives the notification
4. Deployment script runs:
   - Pulls latest code
   - Installs dependencies
   - Builds TypeScript
   - Restarts PM2
5. Backend is updated with zero downtime!

## 📊 Monitoring

```bash
# View PM2 status
pm2 status

# View backend logs
pm2 logs bookink-backend --lines 100

# View webhook server logs
pm2 logs webhook-server --lines 100

# Monitor CPU/Memory
pm2 monit
```

## 🔧 Manual Deployment

If you need to deploy manually:

```bash
cd /home/ubuntu/tattoo-studio-management-platform/backend
bash deploy.sh
```

## 🛠️ Troubleshooting

### Webhook not triggering

```bash
# Check webhook server is running
pm2 status webhook-server

# Check webhook logs
pm2 logs webhook-server

# Test webhook endpoint
curl http://localhost:9000/health
```

### Deployment fails

```bash
# Check deploy script logs
pm2 logs bookink-backend

# Run deployment manually to see errors
bash deploy.sh
```

### PM2 issues

```bash
# Restart everything
pm2 restart all

# Delete and recreate
pm2 delete all
pm2 start ecosystem.config.js
pm2 start webhook-server.js --name "webhook-server"
pm2 save
```

## 📝 Notes

- The webhook server runs on port 9000 by default
- Backend runs on port 3001 (or as configured in .env)
- Logs are stored in `backend/logs/` directory
- PM2 saves process list for auto-restart on reboot

## 🔐 Security Recommendations

1. Use a strong WEBHOOK_SECRET
2. Restrict port 9000 to GitHub webhook IPs only
3. Use SSL/TLS (setup nginx reverse proxy with Let's Encrypt)
4. Keep dependencies updated
5. Monitor logs regularly

## 🎯 Quick Commands Reference

```bash
# Start all services
pm2 start ecosystem.config.js
pm2 start webhook-server.js --name "webhook-server"
pm2 save

# Restart backend only
pm2 restart bookink-backend

# View logs
pm2 logs bookink-backend --lines 50

# Manual deployment
bash deploy.sh

# Check status
pm2 status
pm2 monit
```

---

**Your CI/CD is ready! 🚀 Push to main branch and watch the magic happen!**
