#!/bin/bash
# AWS EC2 Deployment Script - BookInk Backend
# Run this script on your EC2 instance

set -e  # Exit on error

echo "=========================================="
echo "   BookInk Backend - EC2 Deployment"
echo "=========================================="

# 1. Update system
echo "📦 Updating system packages..."
sudo apt update && sudo apt upgrade -y

# 2. Install Node.js 22
echo "📦 Installing Node.js 22 LTS..."
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version
npm --version

# 3. Install PostgreSQL 17
echo "📦 Installing PostgreSQL..."
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql

# 4. Install PM2
echo "📦 Installing PM2..."
sudo npm install -g pm2

# 5. Setup PostgreSQL database
echo "🗄️  Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE DATABASE bookink_db;
CREATE USER bookink_user WITH PASSWORD 'BookInk2025SecurePassword!';
GRANT ALL PRIVILEGES ON DATABASE bookink_db TO bookink_user;
ALTER DATABASE bookink_db OWNER TO bookink_user;
\q
EOF

# 6. Clone repository
echo "📂 Cloning repository..."
cd /home/ubuntu
rm -rf tattoo-studio-management-platform
git clone https://github.com/reachvivek/tattoo-studio-management-platform.git
cd tattoo-studio-management-platform/backend

# 7. Install dependencies
echo "📦 Installing npm packages..."
npm install

# 8. Create .env file
echo "📝 Creating environment file..."
cat > .env <<'ENVEOF'
NODE_ENV=production
PORT=3000
API_PREFIX=/api

# Local PostgreSQL
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=bookink_user
DB_PASSWORD=BookInk2025SecurePassword!
DB_DATABASE=bookink_db

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
ENVEOF

# 9. Build TypeScript
echo "🔨 Building TypeScript..."
npm run build

# 10. Stop existing PM2 process
echo "🛑 Stopping existing PM2 processes..."
pm2 stop bookink-backend || true
pm2 delete bookink-backend || true

# 11. Start with PM2
echo "🚀 Starting backend with PM2..."
pm2 start dist/index.js --name bookink-backend

# 12. Save PM2 config
echo "💾 Saving PM2 configuration..."
pm2 save
pm2 startup | tail -n 1 | bash

# 13. Install and configure Nginx
echo "🌐 Installing Nginx..."
sudo apt install -y nginx

# 14. Create Nginx config
echo "📝 Creating Nginx configuration..."
sudo tee /etc/nginx/sites-available/bookink > /dev/null <<'NGINXEOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 10M;

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
NGINXEOF

# 15. Enable Nginx site
echo "✅ Enabling Nginx site..."
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/bookink /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
sudo systemctl enable nginx

# 16. Show status
echo ""
echo "=========================================="
echo "   ✅ Deployment Complete!"
echo "=========================================="
echo ""
echo "📊 Backend Status:"
pm2 status
echo ""
echo "🌐 Your backend is running at:"
echo "   http://$(curl -s ifconfig.me)"
echo ""
echo "📝 Useful Commands:"
echo "   pm2 logs bookink-backend  - View logs"
echo "   pm2 restart bookink-backend - Restart"
echo "   pm2 status - Check status"
echo ""
echo "🔐 Admin Credentials:"
echo "   Username: admin"
echo "   Email: bookinktermine@gmail.com"
echo "   Password: Tattoopasswort123!"
echo ""
echo "⚠️  Next Steps:"
echo "1. Configure EC2 Security Group to allow ports 80, 443"
echo "2. Update Vercel frontend environment:"
echo "   NEXT_PUBLIC_API_URL=http://$(curl -s ifconfig.me)/api"
echo ""
echo "=========================================="
