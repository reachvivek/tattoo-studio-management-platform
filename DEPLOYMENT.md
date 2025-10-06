# AWS EC2 Deployment Guide - Backend Only

## Free Domain Options

### Option 1: DuckDNS (Recommended - Fastest)
- **Website**: https://www.duckdns.org/
- **Free subdomain**: `yourname.duckdns.org`
- **Setup time**: 2 minutes
- **Features**: Free, auto-renewal, easy setup
- **Steps**:
  1. Sign in with GitHub/Google
  2. Choose subdomain: e.g., `bookink-tattoo.duckdns.org`
  3. Point to your EC2 public IP
  4. Copy your token for auto-update

### Option 2: FreeDNS (Afraid.org)
- **Website**: https://freedns.afraid.org/
- **Free subdomains**: Multiple TLDs available
- **Examples**: `yourname.mooo.com`, `yourname.chickenkiller.com`

### Option 3: No-IP
- **Website**: https://www.noip.com/
- **Free subdomain**: `yourname.ddns.net`
- **Note**: Requires monthly confirmation email

## Prerequisites

1. **EC2 Instance Access**
   - SSH key pair
   - Security Group with ports: 22 (SSH), 80 (HTTP), 443 (HTTPS), 3000 (Node.js)
   - Ubuntu/Amazon Linux OS

2. **Domain/Subdomain** (Choose one from above)

3. **PostgreSQL Database** (Already configured in .env)

## Quick Deployment Steps

### Step 1: Connect to EC2
```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 2: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 22
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL 17
sudo apt install -y postgresql-15 postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install Certbot for Let's Encrypt
sudo apt install -y certbot python3-certbot-nginx

# Install PM2 for process management
sudo npm install -g pm2
```

### Step 3: Setup PostgreSQL
```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE bizkit_db;
CREATE USER postgres WITH PASSWORD 'newpassword';
GRANT ALL PRIVILEGES ON DATABASE bizkit_db TO postgres;
\q
```

### Step 4: Clone and Setup Backend
```bash
# Clone repository
cd /var/www
sudo git clone https://github.com/reachvivek/tattoo-studio-management-platform.git
sudo chown -R ubuntu:ubuntu tattoo-studio-management-platform
cd tattoo-studio-management-platform/Project/backend

# Install dependencies
npm install

# Copy and configure .env
cp .env.example .env  # Or upload your .env file
nano .env
```

### Step 5: Update .env for Production
```bash
NODE_ENV=production
PORT=3000
API_PREFIX=/api

# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=newpassword
DB_DATABASE=bizkit_db

# CORS - Update with your frontend domain
CORS_ORIGIN=https://your-frontend-domain.com

# JWT Secret - Change this!
JWT_SECRET=your_super_secret_production_key_change_this_now

# Email (Keep existing Gmail settings)
EMAIL_SERVICE=gmail
EMAIL_USER=noreply.bookink@gmail.com
EMAIL_PASSWORD=wuby hpmx uomh bhbi
EMAIL_FROM=BookInk <noreply.bookink@gmail.com>

# WhatsApp
WHATSAPP_NUMBER=+491516439197
WHATSAPP_LINK=https://wa.me/message/KGMLPVB67JQBO1
WHATSAPP_AUTO_SEND=true

# Cloudinary
CLOUDINARY_CLOUD_NAME=dazctlr75
CLOUDINARY_API_KEY=976292284874492
CLOUDINARY_API_SECRET=Hwc2SCm3a-saUbsZacIhipX7gyg
CLOUDINARY_FOLDER=bookink-tattoo-uploads
```

### Step 6: Build and Run Backend
```bash
# Build TypeScript
npm run build

# Test locally
node dist/index.js

# Press Ctrl+C to stop

# Start with PM2
pm2 start dist/index.js --name "bookink-backend"
pm2 save
pm2 startup
```

### Step 7: Configure Nginx Reverse Proxy
```bash
sudo nano /etc/nginx/sites-available/bookink-backend
```

Add this configuration (Replace `your-domain.duckdns.org`):
```nginx
server {
    listen 80;
    server_name your-domain.duckdns.org;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Enable the site:
```bash
sudo ln -s /etc/nginx/sites-available/bookink-backend /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Setup Free HTTPS with Let's Encrypt
```bash
# Run Certbot (Replace with your domain)
sudo certbot --nginx -d your-domain.duckdns.org

# Follow prompts:
# - Enter email
# - Agree to terms
# - Choose redirect HTTP to HTTPS (option 2)

# Certbot will auto-configure Nginx for HTTPS!
```

### Step 9: Setup Auto-Renewal
```bash
# Test renewal
sudo certbot renew --dry-run

# Auto-renewal is already configured via cron
```

### Step 10: Configure EC2 Security Group
1. Go to AWS Console → EC2 → Security Groups
2. Select your instance's security group
3. Add Inbound Rules:
   - Port 80 (HTTP) - Source: 0.0.0.0/0
   - Port 443 (HTTPS) - Source: 0.0.0.0/0
   - Port 22 (SSH) - Source: Your IP only

### Step 11: Update Frontend .env
Update your frontend environment to point to the new backend:

```typescript
// frontend/src/environments/environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://your-domain.duckdns.org/api'
};
```

## Testing

1. **Test HTTP**: `http://your-domain.duckdns.org/health`
2. **Test HTTPS**: `https://your-domain.duckdns.org/health`
3. **Test API**: `https://your-domain.duckdns.org/api/analytics/stats`

## Useful PM2 Commands

```bash
pm2 list                 # List all processes
pm2 logs bookink-backend # View logs
pm2 restart bookink-backend
pm2 stop bookink-backend
pm2 delete bookink-backend
pm2 monit               # Monitor CPU/Memory
```

## Database Migration

Run the SQL schema to create tables:
```bash
psql -U postgres -d bizkit_db -f /path/to/schema.sql
```

Or connect and run manually:
```bash
sudo -u postgres psql bizkit_db
```

## Quick Deployment Script

Create `deploy.sh` in backend folder:
```bash
#!/bin/bash
cd /var/www/tattoo-studio-management-platform/Project/backend
git pull origin main
npm install
npm run build
pm2 restart bookink-backend
echo "✅ Deployment complete!"
```

Run with:
```bash
chmod +x deploy.sh
./deploy.sh
```

## Troubleshooting

### Check Backend Status
```bash
pm2 status
pm2 logs bookink-backend --lines 50
```

### Check Nginx Status
```bash
sudo systemctl status nginx
sudo nginx -t
sudo tail -f /var/log/nginx/error.log
```

### Check SSL Certificate
```bash
sudo certbot certificates
```

### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U postgres -d bizkit_db -h localhost
```

### Port Already in Use
```bash
# Find process using port 3000
sudo lsof -i :3000
sudo kill -9 <PID>
```

## Cost Breakdown

- ✅ **Domain**: FREE (DuckDNS)
- ✅ **SSL Certificate**: FREE (Let's Encrypt)
- ⚠️ **EC2 Instance**: ~$10-15/month (t3.small)
- ⚠️ **Data Transfer**: First 100GB free/month

## Recommended EC2 Instance Type

- **t3.small**: 2 vCPU, 2GB RAM (~$15/month)
- **t3.micro**: 2 vCPU, 1GB RAM (~$7.5/month) - Might be tight

## Security Recommendations

1. **Change default passwords** in .env
2. **Use AWS Secrets Manager** for production secrets
3. **Enable CloudWatch** for monitoring
4. **Setup backups** for PostgreSQL
5. **Configure fail2ban** to prevent brute force attacks
6. **Restrict SSH** to your IP only

## Frontend Deployment

Since frontend is Angular static files, you can:
1. **GitHub Pages** (Free)
2. **Netlify** (Free)
3. **Vercel** (Free)
4. **AWS S3 + CloudFront** ($1-3/month)

Just build and deploy:
```bash
cd frontend
ng build --configuration production
# Upload dist/ folder to hosting
```

## Next Steps

1. Choose a subdomain from DuckDNS (fastest)
2. SSH into your EC2 instance
3. Follow steps 2-8 above
4. Update frontend environment with new backend URL
5. Test everything!

Need help? Check the logs with `pm2 logs bookink-backend`
