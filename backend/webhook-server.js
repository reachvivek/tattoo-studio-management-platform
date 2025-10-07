const express = require('express');
const { exec } = require('child_process');
const crypto = require('crypto');

const app = express();
const PORT = 9000;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'your-secret-key-here';

app.use(express.json());

// GitHub webhook endpoint
app.post('/webhook/deploy', (req, res) => {
  const signature = req.headers['x-hub-signature-256'];
  const payload = JSON.stringify(req.body);

  // Verify GitHub signature (optional but recommended)
  if (WEBHOOK_SECRET && signature) {
    const hmac = crypto.createHmac('sha256', WEBHOOK_SECRET);
    const digest = 'sha256=' + hmac.update(payload).digest('hex');

    if (signature !== digest) {
      console.log('❌ Invalid signature');
      return res.status(401).send('Invalid signature');
    }
  }

  // Check if push to main branch
  if (req.body.ref === 'refs/heads/main') {
    console.log('✅ Push to main detected, starting deployment...');

    // Execute deployment script
    exec('bash /home/ubuntu/tattoo-studio-management-platform/backend/deploy.sh', (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Deployment error:', error);
        console.error('stderr:', stderr);
        return;
      }
      console.log('📝 Deployment output:', stdout);
    });

    res.status(200).send('Deployment started');
  } else {
    console.log('ℹ️ Push to non-main branch, ignoring');
    res.status(200).send('Not main branch, ignoring');
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'webhook-server' });
});

app.listen(PORT, () => {
  console.log(`🎣 Webhook server listening on port ${PORT}`);
  console.log(`📍 Webhook URL: http://your-ec2-ip:${PORT}/webhook/deploy`);
});
