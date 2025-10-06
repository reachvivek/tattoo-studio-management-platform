# Redis Setup for Email Queue

The email queue system requires Redis to be running. Follow the instructions below for your operating system.

## Windows Setup

### Option 1: Using WSL2 (Recommended)

1. **Install WSL2** (if not already installed):
```bash
wsl --install
```

2. **Install Redis in WSL2**:
```bash
wsl
sudo apt update
sudo apt install redis-server
```

3. **Start Redis**:
```bash
sudo service redis-server start
```

4. **Verify Redis is running**:
```bash
redis-cli ping
# Should return: PONG
```

### Option 2: Using Docker

1. **Pull Redis image**:
```bash
docker pull redis:latest
```

2. **Run Redis container**:
```bash
docker run -d --name redis -p 6379:6379 redis:latest
```

3. **Verify Redis is running**:
```bash
docker exec -it redis redis-cli ping
# Should return: PONG
```

### Option 3: Memurai (Native Windows Redis)

1. Download Memurai from: https://www.memurai.com/get-memurai
2. Install and start the service
3. Redis will run on `localhost:6379` by default

## Linux/macOS Setup

### Ubuntu/Debian:
```bash
sudo apt update
sudo apt install redis-server
sudo systemctl start redis-server
sudo systemctl enable redis-server
```

### macOS (using Homebrew):
```bash
brew install redis
brew services start redis
```

## Verify Installation

After installing, verify Redis is working:

```bash
redis-cli ping
```

Expected output: `PONG`

## Configuration

The backend is configured to connect to Redis at:
- Host: `localhost` (configurable via `REDIS_HOST` in `.env`)
- Port: `6379` (configurable via `REDIS_PORT` in `.env`)

## Email Queue Configuration

Environment variables in `.env`:

```env
# Email Queue & Rate Limiting
REDIS_HOST=localhost
REDIS_PORT=6379
EMAIL_RATE_LIMIT_PER_HOUR=50
EMAIL_RATE_LIMIT_PER_DAY=500
EMAIL_DELAY_BETWEEN_SENDS=2000
```

### Rate Limits Explained:

- **EMAIL_RATE_LIMIT_PER_HOUR**: Maximum emails per hour (default: 50)
- **EMAIL_RATE_LIMIT_PER_DAY**: Maximum emails per day (default: 500)
- **EMAIL_DELAY_BETWEEN_SENDS**: Delay between each email in milliseconds (default: 2000ms = 2 seconds)

## Monitoring Queue

### View Queue Statistics:

```bash
# Login to get token
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"your_password"}'

# Get queue stats (replace TOKEN with actual JWT)
curl http://localhost:3000/api/queue/stats \
  -H "Authorization: Bearer TOKEN"
```

Expected response:
```json
{
  "success": true,
  "data": {
    "queue": {
      "waiting": 0,
      "active": 0,
      "completed": 15,
      "failed": 0,
      "delayed": 0
    },
    "rateLimits": {
      "hourly": "15/50",
      "daily": "15/500"
    }
  },
  "timestamp": "2025-10-06T..."
}
```

### Clean Up Old Jobs:

```bash
curl -X POST http://localhost:3000/api/queue/cleanup \
  -H "Authorization: Bearer TOKEN"
```

## How It Works

### Email Flow:

1. **User submits form** → Lead created in database
2. **Email queued** → Added to Bull queue with priority
3. **Rate limit check** → Verifies hourly/daily limits not exceeded
4. **Delay applied** → 2-second delay between emails to prevent spam detection
5. **Email sent** → Actual email delivery via Gmail SMTP
6. **Counter incremented** → Rate limit counters updated in Redis

### Priority System:

- **Priority 1** (Highest): Admin notification emails
- **Priority 2** (Normal): User confirmation emails

Lower numbers = higher priority. Admin gets notified first.

### Rate Limiting:

If rate limits are exceeded:
- Job fails and enters retry queue
- Uses exponential backoff (5s, 10s, 20s)
- After 3 attempts, job marked as failed
- Check logs for rate limit warnings

### Automatic Rescheduling:

When daily limit is reached:
- New jobs are automatically delayed until next day
- Existing jobs wait in queue
- Queue processing resumes at midnight

## Troubleshooting

### Redis Connection Error:

```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**: Start Redis server
```bash
# WSL2
sudo service redis-server start

# Docker
docker start redis

# macOS
brew services start redis
```

### Rate Limit Exceeded:

```
⏸️ Rate limit exceeded. Job will be retried
```

**Solution**:
- Wait for hourly reset (top of the hour)
- Or increase limits in `.env`:
  ```env
  EMAIL_RATE_LIMIT_PER_HOUR=100
  EMAIL_RATE_LIMIT_PER_DAY=1000
  ```

### Jobs Stuck in Queue:

**Check active jobs**:
```bash
redis-cli
> KEYS bull:email-queue:*
> GET bull:email-queue:active
```

**Clean stuck jobs**:
```bash
curl -X POST http://localhost:3000/api/queue/cleanup \
  -H "Authorization: Bearer TOKEN"
```

## Production Recommendations

1. **Use Redis Cloud** (recommended for production):
   - https://redis.com/cloud/
   - Update `.env` with cloud credentials:
     ```env
     REDIS_HOST=redis-xxxxx.cloud.redislabs.com
     REDIS_PORT=xxxxx
     ```

2. **Increase Rate Limits** carefully:
   - Gmail has a limit of ~500 emails/day for free accounts
   - Consider using dedicated email service (SendGrid, Mailgun)

3. **Monitor Queue Health**:
   - Set up alerts for failed jobs
   - Monitor rate limit usage
   - Track email delivery success rate

4. **Backup Strategy**:
   - Bull queue is ephemeral (jobs lost on crash)
   - Important emails should be retried
   - Consider enabling Redis persistence (RDB/AOF)
