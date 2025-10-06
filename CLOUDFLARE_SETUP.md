# Cloudflare Deployment Guide - BookInk

## Architecture Overview

```
Frontend (Angular) → Cloudflare Pages
Backend (Node.js) → EC2/VPS + Cloudflare Tunnel
Database → PostgreSQL (on same VPS)
Images → Cloudinary CDN
```

---

## Part 1: Deploy Backend with Cloudflare Tunnel

### Step 1: Deploy Backend to EC2/VPS

```bash
# SSH into your server
ssh -i your-key.pem ubuntu@your-ec2-ip

# Clone and run deployment script
curl -fsSL https://raw.githubusercontent.com/reachvivek/tattoo-studio-management-platform/main/backend/deploy-ec2.sh | bash
```

### Step 2: Install Cloudflare Tunnel

```bash
# Download cloudflared
wget https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared-linux-amd64.deb

# Login to Cloudflare
cloudflared tunnel login
```

This will open a browser to authenticate with Cloudflare.

### Step 3: Create Tunnel

```bash
# Create a tunnel
cloudflared tunnel create bookink-backend

# This will output a Tunnel ID - save it!
# Example: Created tunnel bookink-backend with id abc123-def456-ghi789
```

### Step 4: Configure Tunnel

```bash
# Create config directory
sudo mkdir -p /etc/cloudflared

# Create tunnel config
sudo nano /etc/cloudflared/config.yml
```

**Paste this configuration:**

```yaml
tunnel: YOUR_TUNNEL_ID
credentials-file: /home/ubuntu/.cloudflared/YOUR_TUNNEL_ID.json

ingress:
  - hostname: api.your-domain.com
    service: http://localhost:3000
  - service: http_status:404
```

Replace:
- `YOUR_TUNNEL_ID` with the ID from step 3
- `api.your-domain.com` with your desired subdomain

### Step 5: Create DNS Record

```bash
# Route DNS to tunnel
cloudflared tunnel route dns bookink-backend api.your-domain.com
```

### Step 6: Start Tunnel as Service

```bash
# Install as system service
sudo cloudflared service install

# Start the tunnel
sudo systemctl start cloudflared
sudo systemctl enable cloudflared

# Check status
sudo systemctl status cloudflared
```

### Step 7: Verify

Your backend is now accessible at `https://api.your-domain.com` with:
- ✅ Free SSL/TLS
- ✅ DDoS protection
- ✅ Global CDN
- ✅ No exposed IP address

---

## Part 2: Deploy Frontend to Cloudflare Pages

### Step 1: Push to GitHub

Your frontend code should already be in the repo.

### Step 2: Connect to Cloudflare Pages

1. Go to https://dash.cloudflare.com/
2. Navigate to **Workers & Pages** → **Pages**
3. Click **Connect to Git**
4. Select your repository: `reachvivek/tattoo-studio-management-platform`

### Step 3: Configure Build Settings

**Framework preset:** Angular

**Build settings:**
```
Root directory: frontend
Build command: npm run build
Build output directory: dist/frontend/browser
```

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://api.your-domain.com/api
```

### Step 4: Deploy

Click **Save and Deploy**

Your frontend will be available at:
- `https://bookink.pages.dev` (Cloudflare default)
- `https://your-custom-domain.com` (after adding custom domain)

---

## Part 3: Custom Domain Setup

### For Backend (api.your-domain.com)

Already configured in Cloudflare Tunnel - DNS is automatic!

### For Frontend (your-domain.com)

1. Go to Cloudflare Pages → Your project → **Custom domains**
2. Click **Set up a custom domain**
3. Enter `your-domain.com` and `www.your-domain.com`
4. Cloudflare will automatically configure DNS

---

## Part 4: Update Frontend Environment

Update your Angular environment files to use the new backend URL:

**frontend/src/environments/environment.ts:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://api.your-domain.com/api',
  backendUrl: 'https://api.your-domain.com',
  // ... rest of config
};
```

**frontend/src/environments/environment.prod.ts:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://api.your-domain.com/api',
  backendUrl: 'https://api.your-domain.com',
  // ... rest of config
};
```

---

## Alternative: Railway (Simpler, $5/month)

If you prefer not to manage a server:

### Deploy to Railway

1. Go to https://railway.app
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repo
4. Railway auto-detects Node.js and deploys
5. Add PostgreSQL addon (free)
6. Set environment variables from `.env.production`
7. Get your Railway URL: `https://bookink-backend.railway.app`

Then deploy frontend to Cloudflare Pages pointing to Railway backend.

---

## Comparison

| Option | Cost | Complexity | Performance |
|--------|------|------------|-------------|
| **EC2 + Cloudflare Tunnel** | $3-10/mo | Medium | ⭐⭐⭐⭐⭐ |
| **Railway** | $5/mo | Easy | ⭐⭐⭐⭐ |
| **Render (current)** | Free tier | Easy | ⭐⭐⭐ |

**Recommendation:** Use Railway for simplicity, or EC2 + Cloudflare Tunnel for maximum performance and control.

---

## Summary

1. **Backend:** Deploy to Railway or EC2 with Cloudflare Tunnel
2. **Frontend:** Deploy to Cloudflare Pages
3. **Database:** PostgreSQL (included with Railway or self-hosted on EC2)
4. **Images:** Cloudinary (already configured)
5. **Email:** Gmail SMTP (already configured and working)

Your final URLs:
- Frontend: `https://gratis-tattoo.com` (Cloudflare Pages)
- Backend: `https://api.gratis-tattoo.com` (Railway or Cloudflare Tunnel)
- Admin: `https://gratis-tattoo.com/admin`

---

## Quick Start (Recommended)

### Option A: Railway (Fastest - 5 minutes)

```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Deploy
cd backend
railway init
railway up

# Add PostgreSQL
railway add postgresql

# Set environment variables (Railway dashboard)
# Get your Railway URL
```

### Option B: EC2 + Cloudflare (Most powerful)

```bash
# On your EC2
curl -fsSL https://raw.githubusercontent.com/reachvivek/tattoo-studio-management-platform/main/backend/deploy-ec2.sh | bash

# Install Cloudflare Tunnel (follow steps above)
```

Choose the option that fits your needs!
