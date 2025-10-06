#!/bin/bash

# ========================================
# BookInk Backend Deployment to EC2
# Domain: bookink.duckdns.org
# ========================================

set -e  # Exit on any error

echo "🚀 Starting deployment to EC2..."

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="bookink.duckdns.org"
APP_DIR="/var/www/bookink-backend"
REPO_URL="https://github.com/reachvivek/tattoo-studio-management-platform.git"

echo -e "${GREEN}Step 1: Update system packages${NC}"
sudo apt update && sudo apt upgrade -y

echo -e "${GREEN}Step 2: Install Node.js 22 LTS${NC}"
if ! command -v node &> /dev/null; then
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
fi
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo -e "${GREEN}Step 3: Install PostgreSQL${NC}"
if ! command -v psql &> /dev/null; then
    sudo apt install -y postgresql postgresql-contrib
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo -e "${GREEN}Step 4: Install Nginx${NC}"
if ! command -v nginx &> /dev/null; then
    sudo apt install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

echo -e "${GREEN}Step 5: Install Certbot for SSL${NC}"
if ! command -v certbot &> /dev/null; then
    sudo apt install -y certbot python3-certbot-nginx
fi

echo -e "${GREEN}Step 6: Install PM2${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

echo -e "${GREEN}Step 7: Setup PostgreSQL database${NC}"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'bizkit_db'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE bizkit_db;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'newpassword';"
echo "✅ Database ready"

echo -e "${GREEN}Step 8: Clone/Update repository${NC}"
if [ -d "$APP_DIR" ]; then
    echo "Updating existing repository..."
    cd $APP_DIR
    git pull origin main
else
    echo "Cloning repository..."
    sudo mkdir -p /var/www
    cd /var/www
    sudo git clone $REPO_URL bookink-backend
    sudo chown -R $USER:$USER $APP_DIR
    cd $APP_DIR/Project/backend
fi

cd $APP_DIR/Project/backend

echo -e "${GREEN}Step 9: Install dependencies${NC}"
npm install --production

echo -e "${GREEN}Step 10: Build TypeScript${NC}"
npm run build

echo -e "${GREEN}Step 11: Configure environment${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}WARNING: .env file not found. Please create it manually.${NC}"
    echo "Copy .env from your local machine or create it now."
    exit 1
fi

echo -e "${GREEN}Step 12: Stop existing PM2 process (if any)${NC}"
pm2 delete bookink-backend 2>/dev/null || true

echo -e "${GREEN}Step 13: Start application with PM2${NC}"
pm2 start dist/index.js --name bookink-backend
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME

echo -e "${GREEN}Step 14: Configure Nginx${NC}"
sudo tee /etc/nginx/sites-available/bookink-backend > /dev/null <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    # Proxy settings
    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

# Enable site
sudo ln -sf /etc/nginx/sites-available/bookink-backend /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test and reload Nginx
sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}Step 15: Configure SSL with Let's Encrypt${NC}"
echo -e "${YELLOW}Please run this command manually to setup SSL:${NC}"
echo ""
echo "sudo certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email noreply.bookink@gmail.com --redirect"
echo ""
echo -e "${YELLOW}Or run interactively:${NC}"
echo "sudo certbot --nginx -d $DOMAIN"
echo ""

echo -e "${GREEN}Step 16: Open firewall ports${NC}"
if command -v ufw &> /dev/null; then
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    sudo ufw allow 22/tcp
    sudo ufw --force enable
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🌐 Your backend is running at:"
echo "   HTTP:  http://$DOMAIN"
echo "   After SSL: https://$DOMAIN"
echo ""
echo "📊 Useful commands:"
echo "   pm2 status                    # Check status"
echo "   pm2 logs bookink-backend      # View logs"
echo "   pm2 restart bookink-backend   # Restart app"
echo "   pm2 monit                     # Monitor resources"
echo ""
echo "🔒 To enable HTTPS, run:"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "🧪 Test endpoints:"
echo "   curl http://$DOMAIN/health"
echo "   curl http://$DOMAIN/api/analytics/stats"
echo ""
