# Cloudinary Setup Guide

The application supports **automatic cloud image storage** using Cloudinary for production deployments (Render, Heroku, etc.). It also falls back to local storage for development.

## Why Cloudinary?

When deploying to platforms like **Render.com**, local file storage is **ephemeral** and gets deleted on every deployment or server restart. Cloudinary solves this by providing:

- ✅ **Free Tier**: 25 GB storage + bandwidth (generous for most apps)
- ✅ **Automatic CDN**: Global image delivery
- ✅ **Auto-optimization**: Automatic format conversion (WebP, AVIF)
- ✅ **Transformations**: Built-in image resizing and optimization
- ✅ **Email Attachments**: Direct URL support in emails

## Free Tier Limits

Cloudinary's free tier includes:
- **25 credits/month** (1 credit = 1000 transformations OR 1GB storage OR 1GB bandwidth)
- **Unlimited transformations**
- **Global CDN delivery**
- **No time limit** (free forever)

For a tattoo lead capture app with ~100-200 submissions/month, this is more than enough.

---

## Setup Instructions

### Step 1: Create Cloudinary Account

1. Go to [https://cloudinary.com/users/register_free](https://cloudinary.com/users/register_free)
2. Sign up with email or Google account
3. Choose the **Free plan** (no credit card required)

### Step 2: Get API Credentials

After signing up, you'll see your dashboard with:

- **Cloud Name**: `dxxxxxxxx` (example)
- **API Key**: `123456789012345` (example)
- **API Secret**: `aBcDeFgHiJkLmNoPqRsTuVwXyZ` (example)

### Step 3: Configure Backend

Update your `.env` file:

```env
# Cloudinary (Cloud Image Storage)
CLOUDINARY_CLOUD_NAME=your_cloud_name_here
CLOUDINARY_API_KEY=your_api_key_here
CLOUDINARY_API_SECRET=your_api_secret_here
CLOUDINARY_FOLDER=bookink-tattoo-uploads
```

**Example with real values:**

```env
# Cloudinary (Cloud Image Storage)
CLOUDINARY_CLOUD_NAME=dzk8xmpl3
CLOUDINARY_API_KEY=123456789012345
CLOUDINARY_API_SECRET=aBcDeFgHiJkLmNoPqRsTuVwXyZ
CLOUDINARY_FOLDER=bookink-tattoo-uploads
```

### Step 4: Restart Backend

```bash
npm run dev
```

You should see:
```
✅ Cloudinary configured: your_cloud_name
```

If credentials are missing, you'll see:
```
⚠️  Cloudinary is not configured. Using local file storage.
```

---

## How It Works

### Development (Local Storage)

If Cloudinary is **NOT configured**:
- Images saved to `./uploads` folder
- Served via `/api/images/:filename` endpoint
- Works perfectly for local development

### Production (Cloudinary)

If Cloudinary **IS configured**:
- Images uploaded directly to Cloudinary
- Returns Cloudinary CDN URL: `https://res.cloudinary.com/dzk8xmpl3/...`
- Local file deleted after successful upload
- Email attachments use Cloudinary URLs

### Automatic Fallback

If Cloudinary upload fails:
- Automatically falls back to local storage
- Logs warning but continues working
- No disruption to user experience

---

## Testing Image Upload

### Test with cURL:

```bash
# Create a test image first
echo "Test image" > test.jpg

# Upload via API
curl -X POST http://localhost:3000/api/upload \
  -F "files=@test.jpg"
```

**Expected response (Cloudinary enabled):**

```json
{
  "success": true,
  "message": "Dateien erfolgreich hochgeladen",
  "data": {
    "urls": [
      "https://res.cloudinary.com/dzk8xmpl3/image/upload/v1234567890/bookink-tattoo-uploads/abc123.jpg"
    ]
  }
}
```

**Expected response (Local storage):**

```json
{
  "success": true,
  "message": "Dateien erfolgreich hochgeladen",
  "data": {
    "urls": [
      "/api/images/1234567890-abc123.jpg"
    ]
  }
}
```

---

## Image Compression

The backend automatically compresses large images:

- **Threshold**: 5 MB
- **Max dimensions**: 2000x2000 pixels (maintains aspect ratio)
- **Quality**: 85% JPEG
- **Before Cloudinary**: Compressed locally first, then uploaded
- **Result**: Faster uploads, lower storage costs

---

## Email Attachments

Images are automatically attached to emails:

### Cloudinary URLs

```javascript
// Email attachment configuration
{
  filename: 'tattoo-reference.jpg',
  path: 'https://res.cloudinary.com/dzk8xmpl3/...'
}
```

Nodemailer automatically downloads from Cloudinary URL and attaches to email.

### Local Files

```javascript
// Email attachment configuration
{
  filename: 'tattoo-reference.jpg',
  path: '/full/path/to/uploads/1234567890-abc123.jpg'
}
```

---

## Deployment on Render.com

### Environment Variables

In your Render dashboard, add these environment variables:

1. Go to your service → **Environment** tab
2. Add:
   - `CLOUDINARY_CLOUD_NAME` = `your_cloud_name`
   - `CLOUDINARY_API_KEY` = `your_api_key`
   - `CLOUDINARY_API_SECRET` = `your_api_secret`
   - `CLOUDINARY_FOLDER` = `bookink-tattoo-uploads`

### Build Settings

- **Build Command**: `npm install && npm run build`
- **Start Command**: `npm start`

That's it! Render will automatically use Cloudinary for all image uploads.

---

## Monitoring Usage

### Check Cloudinary Dashboard

1. Go to [https://cloudinary.com/console](https://cloudinary.com/console)
2. View:
   - **Storage used** (GB)
   - **Bandwidth used** (GB)
   - **Transformations** (count)
   - **Credits remaining** (out of 25)

### View Uploaded Images

1. Go to **Media Library** in Cloudinary dashboard
2. Navigate to `bookink-tattoo-uploads` folder
3. See all uploaded tattoo reference images

### Delete Old Images

You can manually delete images from the Media Library to free up storage.

---

## Alternative: AWS S3

If you prefer AWS S3 instead of Cloudinary:

### Pros:
- More control over infrastructure
- Can be cheaper at very high scale
- Integrates with AWS ecosystem

### Cons:
- Requires credit card even for free tier
- More complex setup (IAM roles, bucket policies)
- No automatic image optimization
- No built-in CDN (need CloudFront)

### Free Tier:
- 5 GB storage
- 20,000 GET requests
- 2,000 PUT requests
- **Expires after 12 months**

For this project, **Cloudinary is recommended** due to simpler setup and better free tier.

---

## Troubleshooting

### Error: "Cloudinary credentials not found"

**Cause**: Environment variables not set

**Solution**: Check `.env` file has all 3 credentials:
```bash
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### Error: "Invalid API key"

**Cause**: Wrong credentials or typo

**Solution**:
1. Go to Cloudinary dashboard
2. Copy credentials exactly (no extra spaces)
3. Paste into `.env`
4. Restart backend

### Images not showing in emails

**Cause**: Nodemailer can't download from Cloudinary

**Solution**: Check email service logs for attachment errors. Cloudinary URLs should be publicly accessible (no authentication required for images).

### Running out of credits

**Cause**: Too many transformations or bandwidth usage

**Solutions**:
1. Reduce image quality in upload controller
2. Implement client-side compression before upload
3. Delete old unused images from Media Library
4. Upgrade to paid plan ($0.75/credit)

---

## Cost Optimization Tips

1. **Compress before upload**: Already implemented in `upload.controller.ts`
2. **Delete old images**: Clean up images from leads older than 6 months
3. **Use lazy loading**: Frontend loads images on-demand
4. **Auto-format**: Cloudinary auto-converts to WebP (smaller size)
5. **Responsive images**: Request specific sizes instead of full resolution

With these optimizations, the free tier should handle **hundreds of leads per month** without issues.
