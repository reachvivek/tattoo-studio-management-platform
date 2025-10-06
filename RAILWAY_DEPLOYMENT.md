# Railway Deployment Guide - BookInk Backend

## Why Railway?
- ✅ Easiest Node.js deployment
- ✅ Built-in PostgreSQL (free $5 credit/month)
- ✅ Auto-deploys from GitHub
- ✅ Free SSL/HTTPS
- ✅ No server management needed
- ✅ Better than Render (faster, more reliable)

---

## Step 1: Sign Up for Railway

1. Go to https://railway.app
2. Click "Login" → Sign in with GitHub
3. Authorize Railway to access your repos

---

## Step 2: Create New Project

1. Click **"New Project"**
2. Select **"Deploy from GitHub repo"**
3. Choose `reachvivek/tattoo-studio-management-platform`
4. Railway will detect it's a Node.js app

---

## Step 3: Configure Root Directory

1. In your project, click **"Settings"**
2. Find **"Root Directory"**
3. Set to: `backend`
4. Click **"Save"**

---

## Step 4: Add PostgreSQL Database

1. Click **"+ New"** in your project
2. Select **"Database"** → **"Add PostgreSQL"**
3. Railway creates the database automatically
4. Connection details are auto-configured via environment variables

---

## Step 5: Configure Environment Variables

1. Click on your **backend service** (not the database)
2. Go to **"Variables"** tab
3. Click **"+ New Variable"** and add these:

```env
# Node Config
NODE_ENV=production
PORT=3000
API_PREFIX=/api

# Database (Railway auto-provides these, but you can override)
# DATABASE_URL is automatically set by Railway when you add PostgreSQL
# But we use individual vars, so add these:
DB_HOST=${{Postgres.PGHOST}}
DB_PORT=${{Postgres.PGPORT}}
DB_USERNAME=${{Postgres.PGUSER}}
DB_PASSWORD=${{Postgres.PGPASSWORD}}
DB_DATABASE=${{Postgres.PGDATABASE}}

# Cloudinary
CLOUDINARY_CLOUD_NAME=dazctlr75
CLOUDINARY_API_KEY=976292284874492
CLOUDINARY_API_SECRET=Hwc2SCm3a-saUbsZacIhipX7gyg
CLOUDINARY_FOLDER=bookink-tattoo-uploads

# Gmail SMTP
EMAIL_SERVICE=gmail
EMAIL_USER=noreply.bookink@gmail.com
EMAIL_PASSWORD=wuby hpmx uomh bhbi
EMAIL_FROM=BookInk <noreply.bookink@gmail.com>

# Email Queue
EMAIL_RATE_LIMIT_PER_HOUR=50
EMAIL_RATE_LIMIT_PER_DAY=500
EMAIL_DELAY_BETWEEN_SENDS=2000

# WhatsApp
WHATSAPP_NUMBER=+491516439197
WHATSAPP_LINK=https://wa.me/message/KGMLPVB67JQBO1
WHATSAPP_AUTO_SEND=true

# Lottery
LOTTERY_ENABLED=false
DEFAULT_DISCOUNT=30

# Security
JWT_SECRET=bookink_production_secret_2025_xyz_random_string_change_this
CORS_ORIGIN=https://gratis-tattoo.vercel.app
```

**Note:** Railway automatically provides database connection variables when you add PostgreSQL. The `${{Postgres.PGHOST}}` syntax references the database service variables.

---

## Step 6: Deploy

1. Railway automatically deploys when you push to GitHub
2. Click **"Deploy"** to trigger manual deploy
3. Watch the build logs for any errors

---

## Step 7: Get Your Railway URL

1. Go to **"Settings"**
2. Under **"Domains"**, click **"Generate Domain"**
3. Railway gives you a URL like: `https://bookink-backend-production.up.railway.app`
4. **Copy this URL** - you'll need it for frontend

---

## Step 8: Test Your Backend

Open your Railway URL in browser:
```
https://your-app.railway.app/health
```

Should return:
```json
{
  "status": "healthy",
  "timestamp": "..."
}
```

Test login:
```bash
curl -X POST https://your-app.railway.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Tattoopasswort123!"}'
```

---

## Step 9: Update Frontend Environment

### Update Vercel Environment Variables

1. Go to Vercel Dashboard → Your Project → Settings → Environment Variables
2. Update or add:
   ```
   NEXT_PUBLIC_API_URL=https://your-app.railway.app/api
   ```
3. Redeploy frontend

### Or Update Angular Environment Files (then push to trigger Vercel rebuild)

**frontend/src/environments/environment.ts:**
```typescript
export const environment = {
  production: false,
  apiUrl: 'https://your-app.railway.app/api',
  backendUrl: 'https://your-app.railway.app',
  // ... rest
};
```

**frontend/src/environments/environment.prod.ts:**
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://your-app.railway.app/api',
  backendUrl: 'https://your-app.railway.app',
  // ... rest
};
```

---

## Step 10: Monitor Logs

View real-time logs:
1. Click on your backend service
2. Go to **"Deployments"** tab
3. Click on latest deployment
4. Click **"View Logs"**

You'll now see detailed email logs like:
```
📧 [EMAIL] Attempting to send admin notification for Lead #1
📧 [EMAIL] From: BookInk <noreply.bookink@gmail.com>
📧 [EMAIL] To: bookinktermine@gmail.com
📧 [EMAIL] Subject: Neue Anfrage: John Doe - BookInk
✅ [EMAIL] Admin email sent successfully for Lead #1
```

---

## Troubleshooting

### Build Fails
Check **Root Directory** is set to `backend`

### Database Connection Fails
Make sure PostgreSQL service is added and started

### Email Timeouts
Check Railway logs for detailed error messages:
```
❌ [EMAIL] Failed to send admin email for Lead #1
❌ [EMAIL] Error Message: Connection timeout
❌ [EMAIL] Error Code: ETIMEDOUT
```

This usually means:
- Gmail app password is wrong
- Gmail is blocking Railway's IP (solution: use SendGrid or AWS SES)

### Port Already in Use
Railway uses PORT environment variable automatically - don't hardcode port 3000

---

## Automatic Deployments

Railway auto-deploys whenever you push to `main` branch:

```bash
git add .
git commit -m "Update backend"
git push origin main
```

Railway will:
1. Pull latest code
2. Run `npm install`
3. Run `npm run build`
4. Start with `node dist/index.js`

---

## Custom Domain (Optional)

1. In Railway, go to **Settings** → **Domains**
2. Click **"Custom Domain"**
3. Enter your domain: `api.your-domain.com`
4. Add CNAME record in your DNS:
   ```
   CNAME api your-app.up.railway.app
   ```

---

## Costs

- **Free $5 credit per month**
- After that: ~$0.000463 per minute (~$20/month for 24/7)
- **Much cheaper than AWS and easier than Render**

---

## Quick Start (5 Minutes)

```bash
# 1. Sign up: https://railway.app
# 2. New Project → Deploy from GitHub
# 3. Select your repo
# 4. Set Root Directory: backend
# 5. Add PostgreSQL database
# 6. Copy environment variables from above
# 7. Get your Railway URL
# 8. Update Vercel frontend URL
# 9. Done! 🎉
```

Your backend is now live with:
- ✅ Auto-scaling
- ✅ Free SSL
- ✅ PostgreSQL database
- ✅ Auto-deploys from GitHub
- ✅ Detailed email logs for debugging

---

## Need Help?

Check Railway logs for detailed email debugging:
- All email attempts are logged
- Full error messages with codes
- SMTP connection details
- Success/failure status

If Gmail keeps timing out, consider switching to:
- **SendGrid** (100 emails/day free)
- **AWS SES** (very reliable, 62,000 emails/month free)
- **Resend** (100 emails/day free, modern API)
