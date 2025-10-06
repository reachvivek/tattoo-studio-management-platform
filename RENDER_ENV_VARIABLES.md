# Render Environment Variables Setup

## 📋 Copy-Paste Ready for Render Dashboard

When setting up your backend service on Render, use **"Add from .env"** and paste this entire block:

```env
NODE_ENV=production
PORT=3000
API_PREFIX=/api

DB_HOST=dpg-d3hsrgbuibrs73b6jh3g-a
DB_PORT=5432
DB_USERNAME=bookink_user
DB_PASSWORD=w964vYSq6wSP0F386YjtUcfFVeAxiM6O
DB_DATABASE=bookink_db

CLOUDINARY_CLOUD_NAME=dazctlr75
CLOUDINARY_API_KEY=976292284874492
CLOUDINARY_API_SECRET=Hwc2SCm3a-saUbsZacIhipX7gyg
CLOUDINARY_FOLDER=bookink-tattoo-uploads

EMAIL_SERVICE=gmail
EMAIL_USER=noreply.bookink@gmail.com
EMAIL_PASSWORD=wuby hpmx uomh bhbi
EMAIL_FROM=BookInk <noreply.bookink@gmail.com>

EMAIL_RATE_LIMIT_PER_HOUR=50
EMAIL_RATE_LIMIT_PER_DAY=500
EMAIL_DELAY_BETWEEN_SENDS=2000

WHATSAPP_NUMBER=+491516439197
WHATSAPP_LINK=https://wa.me/message/KGMLPVB67JQBO1
WHATSAPP_AUTO_SEND=true

LOTTERY_ENABLED=false
DEFAULT_DISCOUNT=30

JWT_SECRET=bookink_production_secret_2025_xyz_random_string_change_this
CORS_ORIGIN=https://gratis-tattoo.vercel.app
```

## 🔒 Security Notes

- **JWT_SECRET**: Change to a random string before deploying
- **DB_PASSWORD**: Already configured with your database password
- **CORS_ORIGIN**: Set to Vercel frontend URL `https://gratis-tattoo.vercel.app`

## 📝 How to Add on Render

### Backend Service:

1. Go to your backend service in Render
2. Click **"Environment"** tab (left sidebar)
3. Click **"Add from .env"** button
4. Paste the entire block above
5. Click **"Save Changes"**

The service will automatically redeploy with new variables.

### Frontend URL Already Configured:

✅ Frontend is deployed on Vercel: `https://gratis-tattoo.vercel.app`
✅ CORS_ORIGIN is already set correctly in the environment variables above

If you deploy a new frontend or change the URL:

1. Backend service → Environment tab
2. Find `CORS_ORIGIN`
3. Update to your new frontend URL
4. Save changes (backend will auto-redeploy)

## ⚙️ Backend Service Settings

```
Name: bookink-backend
Region: Frankfurt (EU Central)
Branch: main
Root Directory: backend
Build Command: npm install && npm run build
Start Command: npm start
Instance Type: Free
```

## 🎯 After Deployment

Test backend health:
```
https://YOUR-BACKEND-URL.onrender.com/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-10-06T...",
  "uptime": 123
}
```
