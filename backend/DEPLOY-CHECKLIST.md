# 🚀 Quick Deployment Checklist

## Your EC2 Details
- **IP**: `43.204.32.0`
- **User**: `ec2-user`
- **Key**: `bizkit-production-key.pem`
- **Domain**: `bookink.duckdns.org`

---

## ✅ Step 1: Update DuckDNS IP (2 minutes)

1. Go to https://www.duckdns.org/domains
2. Find "bookink" domain
3. Change IP from `94.205.37.34` to `43.204.32.0`
4. Click "update ip"
5. Wait 1-2 minutes for DNS propagation

---

## ✅ Step 2: Configure EC2 Security Group (3 minutes)

1. Go to AWS Console → EC2 → Security Groups
2. Find your instance security group
3. Edit Inbound Rules → Add these:

| Type  | Port | Source    |
|-------|------|-----------|
| HTTP  | 80   | 0.0.0.0/0 |
| HTTPS | 443  | 0.0.0.0/0 |
| SSH   | 22   | My IP     |

4. Save rules

---

## ✅ Step 3: Upload Files (2 minutes)

Open PowerShell/Git Bash on your Windows machine:

```bash
cd "D:\Anonymous\Rico Tattoo Artist\Project\backend"

# Upload deployment script
scp -i C:\path\to\bizkit-production-key.pem deploy-amazon-linux.sh ec2-user@43.204.32.0:~

# Upload .env file
scp -i C:\path\to\bizkit-production-key.pem .env ec2-user@43.204.32.0:~
```

---

## ✅ Step 4: SSH into EC2 (1 minute)

```bash
ssh -i C:\path\to\bizkit-production-key.pem ec2-user@43.204.32.0
```

---

## ✅ Step 5: Run Deployment Script (10-15 minutes)

```bash
chmod +x deploy-amazon-linux.sh
./deploy-amazon-linux.sh
```

Wait for script to complete...

---

## ✅ Step 6: Setup Free HTTPS (3 minutes)

After deployment script completes:

```bash
sudo certbot --nginx -d bookink.duckdns.org
```

When prompted:
1. **Email**: `noreply.bookink@gmail.com`
2. **Agree to terms**: `Y`
3. **Share email**: `N`
4. **Redirect HTTP to HTTPS**: `2` (Yes)

---

## ✅ Step 7: Test Backend (1 minute)

```bash
# Test from EC2
curl https://bookink.duckdns.org/health

# Or from your browser
# https://bookink.duckdns.org/health
# https://bookink.duckdns.org/api/analytics/stats
```

---

## ✅ Step 8: Update Frontend (5 minutes)

1. Open `frontend/src/environments/environment.prod.ts`
2. Change `apiUrl` to:
```typescript
apiUrl: 'https://bookink.duckdns.org/api'
```
3. Build frontend:
```bash
cd frontend
ng build --configuration production
```
4. Deploy to Netlify/Vercel/GitHub Pages

---

## 🎉 Done!

Your backend is now live at:
- **API Base**: `https://bookink.duckdns.org`
- **Health Check**: `https://bookink.duckdns.org/health`
- **Analytics**: `https://bookink.duckdns.org/api/analytics/stats`
- **Login**: `https://bookink.duckdns.org/api/auth/login`

---

## 📊 Monitoring Commands

```bash
# SSH back in anytime
ssh -i bizkit-production-key.pem ec2-user@43.204.32.0

# Check backend status
pm2 status
pm2 logs bookink-backend
pm2 monit

# Restart if needed
pm2 restart bookink-backend

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 🔄 Future Updates

When you make code changes:

```bash
# SSH into EC2
ssh -i bizkit-production-key.pem ec2-user@43.204.32.0

# Update code
cd /var/www/bookink-backend
git pull origin main
cd Project/backend
npm install
npm run build
pm2 restart bookink-backend

# Done!
```

---

## 🆘 Troubleshooting

### Backend not responding
```bash
pm2 logs bookink-backend --lines 100
```

### Database error
```bash
sudo systemctl status postgresql
sudo -u postgres psql -d bizkit_db
```

### Nginx error
```bash
sudo nginx -t
sudo systemctl status nginx
```

### SSL not working
```bash
sudo certbot certificates
sudo certbot renew --force-renewal
```

---

## 💰 Monthly Cost

- Domain: FREE (DuckDNS)
- SSL: FREE (Let's Encrypt)
- EC2 t3.micro: ~$8-10/month

Total: **$8-10/month** 🎉

---

## Need Help?

1. Check PM2 logs: `pm2 logs bookink-backend`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
3. Contact support

---

**That's it! Follow these 8 steps and you're live in ~30 minutes!**
