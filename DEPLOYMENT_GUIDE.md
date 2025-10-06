# Deployment Guide - Tattoo Studio Lead Generation Platform

## ✅ What Was Implemented

### 1. **Email Queue System**
- ✅ Simple in-memory queue (no Redis required)
- ✅ Rate limiting: 50 emails/hour, 500 emails/day
- ✅ Auto-queue for next day when limits exceeded
- ✅ 2-second delay between emails to prevent spam detection
- ✅ Automatic hourly and daily rate limit resets
- ✅ Queue monitoring endpoint: `GET /api/queue/stats`

### 2. **Cloud Image Storage (Cloudinary)**
- ✅ Automatic upload to Cloudinary in production
- ✅ Automatic fallback to local storage in development
- ✅ Image compression for files > 5MB
- ✅ Email attachments support both Cloudinary and local URLs
- ✅ CDN delivery for fast global access

### 3. **Email System Enhancements**
- ✅ Image attachments in both admin and user emails
- ✅ German language with English translation
- ✅ Removed 30% discount mention (user emails)
- ✅ Simple black/white design (spam-filter friendly)
- ✅ Comprehensive logging for debugging

### 4. **Production-Ready Features**
- ✅ Duplicate email submissions allowed
- ✅ Repeat customer tracking (submission numbers)
- ✅ Blob endpoint for image serving
- ✅ Production-grade error handling
- ✅ Database migration scripts
- ✅ No ephemeral storage issues

---

## 🚀 Deployment Instructions

### **Option 1: Render.com (Recommended)**

#### Backend Deployment

1. **Create New Web Service**
   - Go to [render.com/dashboard](https://dashboard.render.com/)
   - Click **New** → **Web Service**
   - Connect your GitHub repository: `reachvivek/tattoo-studio-management-platform`
   - Select `backend` folder as root directory

2. **Configure Build Settings**
   - **Name**: `bookink-backend`
   - **Environment**: `Node`
   - **Region**: `Frankfurt` (EU) or `Oregon` (US)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

3. **Add Environment Variables**

   ```env
   # Server
   NODE_ENV=production
   PORT=3000
   API_PREFIX=/api

   # Database (Render PostgreSQL)
   DB_HOST=your-postgres-instance.render.com
   DB_PORT=5432
   DB_USERNAME=your_db_user
   DB_PASSWORD=your_db_password
   DB_DATABASE=your_database_name

   # Cloudinary (REQUIRED for production)
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   CLOUDINARY_FOLDER=bookink-tattoo-uploads

   # Email (Gmail SMTP)
   EMAIL_SERVICE=gmail
   EMAIL_USER=noreply.bookink@gmail.com
   EMAIL_PASSWORD=your_app_password
   EMAIL_FROM=BookInk <noreply.bookink@gmail.com>

   # Email Queue & Rate Limiting
   EMAIL_RATE_LIMIT_PER_HOUR=50
   EMAIL_RATE_LIMIT_PER_DAY=500
   EMAIL_DELAY_BETWEEN_SENDS=2000

   # WhatsApp
   WHATSAPP_NUMBER=+491516439197
   WHATSAPP_LINK=https://wa.me/message/KGMLPVB67JQBO1
   WHATSAPP_AUTO_SEND=true

   # Lottery System
   LOTTERY_ENABLED=false
   DEFAULT_DISCOUNT=30

   # Security
   JWT_SECRET=change_this_to_random_secure_string_in_production
   CORS_ORIGIN=https://your-frontend-domain.onrender.com
   ```

4. **Create PostgreSQL Database**
   - In Render dashboard, click **New** → **PostgreSQL**
   - Name: `bookink-database`
   - Region: Same as backend (Frankfurt or Oregon)
   - Plan: **Free tier** (sufficient for most apps)
   - Copy connection details to backend environment variables

5. **Deploy**
   - Click **Create Web Service**
   - Render will automatically build and deploy
   - Wait 5-10 minutes for first deployment

#### Frontend Deployment

1. **Create Static Site**
   - In Render dashboard, click **New** → **Static Site**
   - Connect same GitHub repository
   - Select `frontend` folder

2. **Configure Build Settings**
   - **Name**: `bookink-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist/browser`

3. **Add Environment Variable**
   ```env
   BACKEND_URL=https://bookink-backend.onrender.com
   ```

4. **Update Backend CORS**
   - After frontend deploys, copy the URL (e.g., `https://bookink-frontend.onrender.com`)
   - Update backend environment variable:
     ```env
     CORS_ORIGIN=https://bookink-frontend.onrender.com
     ```

5. **Deploy**
   - Click **Create Static Site**
   - Render will build and deploy Angular app

---

### **Option 2: Heroku**

#### Backend

```bash
# Login to Heroku
heroku login

# Create app
heroku create bookink-backend

# Add PostgreSQL
heroku addons:create heroku-postgresql:essential-0

# Set environment variables
heroku config:set NODE_ENV=production
heroku config:set CLOUDINARY_CLOUD_NAME=your_cloud_name
heroku config:set CLOUDINARY_API_KEY=your_api_key
heroku config:set CLOUDINARY_API_SECRET=your_api_secret
# ... (add all other env vars)

# Deploy
git subtree push --prefix backend heroku main
```

#### Frontend

```bash
# Create app
heroku create bookink-frontend --buildpack heroku/nodejs

# Set backend URL
heroku config:set BACKEND_URL=https://bookink-backend.herokuapp.com

# Deploy
git subtree push --prefix frontend heroku main
```

---

## 📝 Cloudinary Setup (REQUIRED for Production)

### Step 1: Create Free Account

1. Go to [cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Sign up (no credit card required)
3. Choose **Free plan** (25 GB storage + bandwidth)

### Step 2: Get Credentials

After signup, dashboard shows:
- **Cloud Name**: `dxxxxxxxx`
- **API Key**: `123456789012345`
- **API Secret**: `aBcDeFgHiJkLmNoPqRsTuVwXyZ`

### Step 3: Add to Environment Variables

In Render/Heroku dashboard, add:

```env
CLOUDINARY_CLOUD_NAME=dxxxxxxxx
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ
CLOUDINARY_FOLDER=bookink-tattoo-uploads
```

**See [backend/CLOUDINARY_SETUP.md](backend/CLOUDINARY_SETUP.md) for detailed instructions.**

---

## 🗄️ Database Setup

### Run Migration (One-Time)

After deploying backend, run migration to allow duplicate email submissions:

```bash
# SSH into Render shell (or use Heroku CLI)
npm run migrate

# Or manually:
psql $DATABASE_URL -f schemas/migration_allow_duplicate_emails.sql
```

This adds:
- `submission_number` column (tracks repeat submissions)
- `is_repeat_customer` flag
- Auto-increment trigger

**See [backend/schemas/MIGRATION_INSTRUCTIONS.md](backend/schemas/MIGRATION_INSTRUCTIONS.md) for details.**

---

## 📧 Email Configuration

### Gmail App Password

1. Go to [Google Account Settings](https://myaccount.google.com/security)
2. Enable **2-Step Verification**
3. Go to **App Passwords**
4. Generate password for "Mail"
5. Copy 16-character password
6. Add to environment variables:
   ```env
   EMAIL_USER=noreply.bookink@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### Email Queue Limits

Default limits (adjust based on your needs):

```env
EMAIL_RATE_LIMIT_PER_HOUR=50    # Gmail safe limit
EMAIL_RATE_LIMIT_PER_DAY=500    # Gmail free tier limit
EMAIL_DELAY_BETWEEN_SENDS=2000  # 2 seconds between emails
```

**For higher limits, consider:**
- Gmail Business (2000 emails/day)
- SendGrid (100 emails/day free, 40k emails/month paid)
- Mailgun (5000 emails/month free)

---

## 🔍 Monitoring & Testing

### Queue Statistics

```bash
# Get auth token
curl -X POST https://your-backend.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Check queue stats
curl https://your-backend.onrender.com/api/queue/stats \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

Response:
```json
{
  "success": true,
  "data": {
    "queue": {
      "pending": 0,
      "processing": false
    },
    "rateLimits": {
      "hourly": "15/50 (resets 3:00 PM)",
      "daily": "15/500 (resets 12:00 AM)"
    }
  }
}
```

### Test Email Sending

```bash
# Verify email connection
curl https://your-backend.onrender.com/api/email-test/verify

# Send test email
curl -X POST https://your-backend.onrender.com/api/email-test/send \
  -H "Content-Type: application/json" \
  -d '{"to":"your.email@gmail.com"}'
```

### Test Image Upload

```bash
# Upload image
curl -X POST https://your-backend.onrender.com/api/upload \
  -F "files=@test-image.jpg"

# Check Cloudinary Media Library
# Go to cloudinary.com/console → Media Library → bookink-tattoo-uploads
```

---

## 🛠️ Troubleshooting

### Images Not Uploading

**Symptom**: Error "Cloudinary credentials not found"

**Solution**:
1. Check all 3 Cloudinary env vars are set
2. Restart backend service
3. Check logs for "✅ Cloudinary configured"

### Emails Not Sending

**Symptom**: Emails queued but not delivered

**Solutions**:
1. Check Gmail app password is correct (no spaces)
2. Verify rate limits not exceeded: `GET /api/queue/stats`
3. Check logs for SMTP errors
4. Ensure Gmail allows "less secure apps" or use App Password

### Database Connection Failed

**Symptom**: 500 errors on all endpoints

**Solutions**:
1. Verify PostgreSQL instance is running (Render dashboard)
2. Check `DB_HOST`, `DB_USERNAME`, `DB_PASSWORD` are correct
3. Run migration: `npm run migrate`
4. Test connection: `psql $DATABASE_URL -c "SELECT 1;"`

### Rate Limits Hit

**Symptom**: "Rate limit exceeded" in logs

**Solutions**:
1. Check current usage: `GET /api/queue/stats`
2. Increase limits in environment variables
3. Wait for hourly/daily reset
4. Upgrade to paid email service

---

## 💰 Cost Breakdown (Free Tier)

| Service | Free Tier | Sufficient For |
|---------|-----------|----------------|
| **Render.com** (Backend) | 750 hours/month | ✅ 24/7 uptime |
| **Render.com** (Frontend) | 100 GB bandwidth | ✅ Thousands of visits |
| **Render.com** (PostgreSQL) | 256 MB RAM, 1 GB storage | ✅ Hundreds of leads |
| **Cloudinary** | 25 GB storage + bandwidth | ✅ Hundreds of images/month |
| **Gmail** | 500 emails/day | ✅ Most small businesses |

**Total monthly cost**: **$0** (free tier sufficient for most tattoo studios)

---

## 📊 Repository Structure

```
tattoo-studio-management-platform/
├── backend/
│   ├── config/
│   │   └── cloudinary.config.ts          # Cloudinary setup
│   ├── controllers/
│   │   ├── upload.controller.ts          # Image upload (Cloudinary + local)
│   │   ├── email-test.controller.ts      # Email testing endpoints
│   │   ├── image.controller.ts           # Blob endpoint for images
│   │   └── queue-monitor.controller.ts   # Queue stats
│   ├── services/
│   │   ├── email.service.ts              # Email sending
│   │   └── simple-email-queue.service.ts # Queue + rate limiting
│   ├── schemas/
│   │   ├── database.sql                  # Full schema
│   │   └── migration_allow_duplicate_emails.sql # Migration
│   ├── CLOUDINARY_SETUP.md               # Cloudinary guide
│   └── .env                              # Environment variables
├── frontend/
│   ├── src/
│   │   ├── app/
│   │   └── environments/
│   └── package.json
├── DEPLOYMENT_GUIDE.md                   # This file
└── README.md
```

---

## 🎉 Success Checklist

- [ ] Backend deployed on Render/Heroku
- [ ] Frontend deployed on Render/Heroku
- [ ] PostgreSQL database created and migrated
- [ ] Cloudinary account created and configured
- [ ] Gmail app password generated
- [ ] Test email sending works
- [ ] Test image upload to Cloudinary works
- [ ] Queue monitoring endpoint accessible
- [ ] CRM dashboard accessible with admin login
- [ ] Lead form submission works end-to-end

---

## 📞 Support

If you encounter issues:

1. **Check logs**: Render dashboard → Service → Logs
2. **Check queue stats**: `GET /api/queue/stats`
3. **Test email config**: `GET /api/email-test/verify`
4. **Review guides**:
   - [CLOUDINARY_SETUP.md](backend/CLOUDINARY_SETUP.md)
   - [MIGRATION_INSTRUCTIONS.md](backend/schemas/MIGRATION_INSTRUCTIONS.md)

---

## 🚀 Next Steps

After deployment:

1. **Test thoroughly**:
   - Submit test lead from form
   - Verify emails arrive (check spam)
   - Verify images uploaded to Cloudinary
   - Check CRM dashboard shows lead correctly

2. **Monitor usage**:
   - Cloudinary dashboard (storage usage)
   - Render metrics (CPU, memory)
   - Email queue stats

3. **Optional upgrades**:
   - Custom domain (Render: $0.50/month)
   - SSL certificate (automatic with custom domain)
   - Dedicated email service (SendGrid, Mailgun)
   - Upgrade PostgreSQL (for thousands of leads)

**Your tattoo lead generation platform is now production-ready! 🎨✨**
