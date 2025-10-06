# Quick EC2 Deployment Guide

## Your Setup
- **Domain**: `bookink.duckdns.org`
- **EC2 Public IP**: `43.204.32.0`
- **EC2 Region**: ap-south-1 (Mumbai)
- **Instance**: t3.micro (Amazon Linux 2023)
- **Key Pair**: bizkit-production-key.pem
- **DuckDNS Token**: `509bc271-88e9-4ed4-906b-472e97b8644d`

## IMPORTANT: Update DuckDNS IP First!
Go to https://www.duckdns.org/domains and update:
- **bookink** → Change IP to: `43.204.32.0`
- Click "update ip" button

## Prerequisites Checklist
- [ ] Update DuckDNS IP to 43.204.32.0
- [ ] SSH key: bizkit-production-key.pem
- [ ] EC2 Security Group ports open: 22, 80, 443

## Option 1: Automated Deployment (Recommended)

### Step 1: Upload files to EC2
```bash
# From your local machine (Windows PowerShell or Git Bash)
scp -i bizkit-production-key.pem deploy-to-ec2.sh ec2-user@43.204.32.0:~
scp -i bizkit-production-key.pem .env ec2-user@43.204.32.0:~
```

### Step 2: SSH into EC2
```bash
ssh -i bizkit-production-key.pem ec2-user@43.204.32.0
```

### Step 3: Run deployment script
```bash
chmod +x deploy-to-ec2.sh
./deploy-to-ec2.sh
```

### Step 4: Setup SSL (After script completes)
```bash
sudo certbot --nginx -d bookink.duckdns.org
```

**Done! Your API is live at:** `https://bookink.duckdns.org`

---

## Option 2: Manual Step-by-Step

### 1. SSH to EC2
```bash
ssh -i bizkit-production-key.pem ec2-user@43.204.32.0
```

### 2. Install Node.js 22 (Amazon Linux 2023)
```bash
# Amazon Linux uses yum/dnf
sudo dnf install -y nodejs
node --version  # Should show v22.x (AL2023 has Node.js 22 by default)

# If not, install from NodeSource
curl -fsSL https://rpm.nodesource.com/setup_22.x | sudo bash -
sudo dnf install -y nodejs
```

### 3. Install Dependencies
```bash
sudo dnf update -y
sudo dnf install -y postgresql15 postgresql15-server nginx
sudo npm install -g pm2

# Install Certbot
sudo dnf install -y python3 augeas-libs
sudo python3 -m venv /opt/certbot/
sudo /opt/certbot/bin/pip install --upgrade pip
sudo /opt/certbot/bin/pip install certbot certbot-nginx
sudo ln -s /opt/certbot/bin/certbot /usr/bin/certbot
```

### 4. Setup Database
```bash
# Initialize PostgreSQL (Amazon Linux 2023)
sudo postgresql-setup --initdb
sudo systemctl start postgresql
sudo systemctl enable postgresql

# Create database
sudo -u postgres psql
```
```sql
CREATE DATABASE bizkit_db;
ALTER USER postgres WITH PASSWORD 'newpassword';
\q
```

### 5. Clone Repository
```bash
cd /var/www
sudo git clone https://github.com/reachvivek/tattoo-studio-management-platform.git bookink-backend
sudo chown -R ec2-user:ec2-user bookink-backend
cd bookink-backend/Project/backend
```

### 6. Setup Environment
```bash
# Upload your .env file or create it
nano .env
```

**Important .env changes for production:**
```bash
NODE_ENV=production
CORS_ORIGIN=https://your-frontend-domain.com
DB_HOST=localhost
```

### 7. Build & Start
```bash
npm install
npm run build
pm2 start dist/index.js --name bookink-backend
pm2 save
pm2 startup
```

### 8. Configure Nginx
```bash
sudo nano /etc/nginx/sites-available/bookink-backend
```

Paste this:
```nginx
server {
    listen 80;
    server_name bookink.duckdns.org;

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

Enable it:
```bash
sudo ln -s /etc/nginx/sites-available/bookink-backend /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
```

### 9. Setup Free HTTPS
```bash
sudo certbot --nginx -d bookink.duckdns.org
```

Follow prompts:
1. Enter email: `noreply.bookink@gmail.com`
2. Agree to terms: `Y`
3. Redirect HTTP to HTTPS: `2` (Yes)

**Done!** 🎉

---

## Testing

### Test HTTP (before SSL)
```bash
curl http://bookink.duckdns.org/health
curl http://bookink.duckdns.org/api/analytics/stats
```

### Test HTTPS (after SSL)
```bash
curl https://bookink.duckdns.org/health
curl https://bookink.duckdns.org/api/analytics/stats
```

### Test from browser
- Health: `https://bookink.duckdns.org/health`
- Stats: `https://bookink.duckdns.org/api/analytics/stats`

---

## Update Frontend

Update `frontend/src/environments/environment.prod.ts`:
```typescript
export const environment = {
  production: true,
  apiUrl: 'https://bookink.duckdns.org/api'
};
```

---

## Useful Commands

```bash
# Check backend status
pm2 status
pm2 logs bookink-backend --lines 50
pm2 monit

# Restart backend
pm2 restart bookink-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Check SSL certificate
sudo certbot certificates

# Renew SSL (auto-renewed, but test with)
sudo certbot renew --dry-run
```

---

## EC2 Security Group Setup

Go to AWS Console → EC2 → Security Groups → Your Instance

**Inbound Rules:**
| Type  | Port | Source    | Description |
|-------|------|-----------|-------------|
| SSH   | 22   | My IP     | SSH access  |
| HTTP  | 80   | 0.0.0.0/0 | HTTP        |
| HTTPS | 443  | 0.0.0.0/0 | HTTPS       |
| Custom| 3000 | 127.0.0.1 | Node.js (local only) |

---

## Future Updates

Create `update.sh` script on EC2:
```bash
#!/bin/bash
cd /var/www/bookink-backend
git pull origin main
cd Project/backend
npm install
npm run build
pm2 restart bookink-backend
echo "✅ Updated!"
```

Run with:
```bash
chmod +x update.sh
./update.sh
```

---

## Troubleshooting

### Backend not starting
```bash
pm2 logs bookink-backend --lines 100
```

### Database connection error
```bash
sudo systemctl status postgresql
psql -U postgres -d bizkit_db -h localhost
```

### Nginx error
```bash
sudo nginx -t
sudo systemctl status nginx
```

### SSL certificate error
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

### Port already in use
```bash
sudo lsof -i :3000
sudo kill -9 <PID>
pm2 restart bookink-backend
```

---

## Costs

- ✅ **Domain**: FREE (DuckDNS)
- ✅ **SSL**: FREE (Let's Encrypt)
- 💰 **EC2**: ~$10-15/month (depends on instance type)

---

## Need Help?

Check logs:
```bash
pm2 logs bookink-backend
sudo tail -f /var/log/nginx/error.log
```

Contact support or check GitHub issues.
