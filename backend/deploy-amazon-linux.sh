#!/bin/bash

# ========================================
# BookInk Backend Deployment to EC2
# Amazon Linux 2023
# Domain: bookink.duckdns.org
# IP: 43.204.32.0
# ========================================

set -e

echo "🚀 Starting deployment to Amazon Linux 2023..."

GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

DOMAIN="bookink.duckdns.org"
APP_DIR="/var/www/bookink-backend"
REPO_URL="https://github.com/reachvivek/tattoo-studio-management-platform.git"

echo -e "${GREEN}Step 1: Update system${NC}"
sudo dnf update -y

echo -e "${GREEN}Step 2: Install Node.js${NC}"
if ! command -v node &> /dev/null; then
    sudo dnf install -y nodejs
fi
echo "Node version: $(node --version)"
echo "NPM version: $(npm --version)"

echo -e "${GREEN}Step 3: Install PostgreSQL 15${NC}"
if ! command -v psql &> /dev/null; then
    sudo dnf install -y postgresql15 postgresql15-server
    sudo postgresql-setup --initdb
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
fi

echo -e "${GREEN}Step 4: Install Nginx${NC}"
if ! command -v nginx &> /dev/null; then
    sudo dnf install -y nginx
    sudo systemctl start nginx
    sudo systemctl enable nginx
fi

echo -e "${GREEN}Step 5: Install Certbot${NC}"
if ! command -v certbot &> /dev/null; then
    sudo dnf install -y python3 augeas-libs
    sudo python3 -m venv /opt/certbot/
    sudo /opt/certbot/bin/pip install --upgrade pip
    sudo /opt/certbot/bin/pip install certbot certbot-nginx
    sudo ln -sf /opt/certbot/bin/certbot /usr/bin/certbot
fi

echo -e "${GREEN}Step 6: Install PM2${NC}"
if ! command -v pm2 &> /dev/null; then
    sudo npm install -g pm2
fi

echo -e "${GREEN}Step 7: Setup PostgreSQL${NC}"
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = 'bizkit_db'" | grep -q 1 || sudo -u postgres psql -c "CREATE DATABASE bizkit_db;"
sudo -u postgres psql -c "ALTER USER postgres WITH PASSWORD 'newpassword';" 2>/dev/null || true
echo "✅ Database ready"

echo -e "${GREEN}Step 8: Clone/Update repository${NC}"
if [ -d "$APP_DIR" ]; then
    echo "Updating existing repository..."
    cd $APP_DIR
    sudo git pull origin main
else
    echo "Cloning repository..."
    sudo mkdir -p /var/www
    cd /var/www
    sudo git clone $REPO_URL bookink-backend
    sudo chown -R ec2-user:ec2-user $APP_DIR
fi

cd $APP_DIR/Project/backend

echo -e "${GREEN}Step 9: Install dependencies${NC}"
npm install

echo -e "${GREEN}Step 10: Build TypeScript${NC}"
npm run build

echo -e "${GREEN}Step 11: Check environment${NC}"
if [ ! -f .env ]; then
    echo -e "${YELLOW}WARNING: .env file not found!${NC}"
    echo "Please upload .env file from your local machine:"
    echo "scp -i bizkit-production-key.pem .env ec2-user@43.204.32.0:$APP_DIR/Project/backend/"
    exit 1
fi

echo -e "${GREEN}Step 12: Start with PM2${NC}"
pm2 delete bookink-backend 2>/dev/null || true
pm2 start dist/index.js --name bookink-backend
pm2 save
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ec2-user --hp /home/ec2-user

echo -e "${GREEN}Step 13: Configure Nginx${NC}"
sudo tee /etc/nginx/conf.d/bookink-backend.conf > /dev/null <<'EOF'
server {
    listen 80;
    server_name bookink.duckdns.org;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

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
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://localhost:3000/health;
        access_log off;
    }
}
EOF

sudo nginx -t
sudo systemctl reload nginx

echo -e "${GREEN}Step 14: Configure SELinux${NC}"
# Allow Nginx to proxy
sudo setsebool -P httpd_can_network_connect 1

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}✅ Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "🌐 Backend running at: http://$DOMAIN"
echo ""
echo "🔒 To enable HTTPS, run:"
echo "   sudo certbot --nginx -d $DOMAIN"
echo ""
echo "🧪 Test:"
echo "   curl http://$DOMAIN/health"
echo ""
echo "📊 Monitor:"
echo "   pm2 status"
echo "   pm2 logs bookink-backend"
echo ""
