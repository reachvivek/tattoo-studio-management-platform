# Email Service Testing & Debugging Guide

## Overview

The email service sends two types of emails:
1. **Admin Notification** - Sent to `bookinktermine@gmail.com` when a new lead submits
2. **User Confirmation** - Sent to the user who submitted the form

## Email Configuration (.env)

```env
EMAIL_SERVICE=gmail
EMAIL_USER=noreply.bookink@gmail.com
EMAIL_PASSWORD=wuby hpmx uomh bhbi
EMAIL_FROM=BookInk <noreply.bookink@gmail.com>
```

**Important**: The `EMAIL_PASSWORD` is a Gmail App Password (not the regular Gmail password)

---

## Testing Endpoints

### 1. Check Email Configuration

**Endpoint**: `GET /api/email-test/config`

```bash
curl http://localhost:3000/api/email-test/config
```

**Response**:
```json
{
  "success": true,
  "config": {
    "user": "noreply.bookink@gmail.com",
    "from": "BookInk <noreply.bookink@gmail.com>",
    "service": "gmail",
    "passwordSet": true,
    "passwordLength": 19
  }
}
```

### 2. Verify Email Connection

**Endpoint**: `GET /api/email-test/verify`

Tests SMTP connection to Gmail servers.

```bash
curl http://localhost:3000/api/email-test/verify
```

**Success Response**:
```json
{
  "success": true,
  "message": "Email connection verified successfully",
  "config": {
    "user": "noreply.bookink@gmail.com",
    "from": "BookInk <noreply.bookink@gmail.com>",
    "service": "gmail"
  }
}
```

**Failure Response**:
```json
{
  "success": false,
  "error": "Email connection verification failed - check console logs"
}
```

### 3. Send Test Email

**Endpoint**: `POST /api/email-test/send`

Sends a test email to verify the entire email pipeline.

```bash
curl -X POST http://localhost:3000/api/email-test/send \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"your-email@example.com\"}"
```

**Response**:
```json
{
  "success": true,
  "message": "Test email sent to your-email@example.com - check your inbox!"
}
```

---

## Enhanced Logging

The email service now includes comprehensive logging:

### On Initialization:
```
📧 ========================================
   Email Service Initialization
========================================
EMAIL_USER: noreply.bookink@gmail.com
EMAIL_FROM: BookInk <noreply.bookink@gmail.com>
EMAIL_PASSWORD exists: true
EMAIL_PASSWORD length: 19
EMAIL_SERVICE: gmail
✅ Email transporter created
========================================
```

### On Email Send:
```
📧 Sending admin notification for Lead #6...
From: BookInk <noreply.bookink@gmail.com>
To: bookinktermine@gmail.com
Subject: New Tattoo Request from Vivek
✅ Admin notification email sent successfully!
Message ID: <abc123@gmail.com>
Response: 250 2.0.0 OK
Accepted: [ 'bookinktermine@gmail.com' ]
Rejected: []
```

### On Error:
```
❌ Failed to send admin notification:
Error message: Invalid login: 535-5.7.8 Username and Password not accepted
Error code: EAUTH
Error response: 535-5.7.8 Username and Password not accepted
Error command: AUTH PLAIN
Full error: [Error object]
```

---

## Common Issues & Solutions

### Issue 1: "Invalid login" or EAUTH Error

**Cause**: Gmail App Password is incorrect or not set up

**Solution**:
1. Go to Google Account settings: https://myaccount.google.com/security
2. Enable 2-Step Verification
3. Generate App Password:
   - Search for "App passwords"
   - Select "Mail" and your device
   - Copy the 16-character password
4. Update `.env`:
   ```env
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx  # Spaces are removed automatically
   ```

### Issue 2: Emails Not Sending (No Error)

**Cause**: Emails are sent asynchronously and errors are caught silently

**Check**:
1. Look for console logs:
   ```
   Failed to send admin notification: [error]
   Failed to send user confirmation: [error]
   ```
2. The lead is still created even if emails fail

### Issue 3: "Connection Timeout"

**Cause**: Firewall or network blocking Gmail SMTP

**Solution**:
1. Check firewall allows port 587 (SMTP)
2. Try different network
3. Check antivirus/security software

### Issue 4: Emails Go to Spam

**Solution**:
1. Add `noreply.bookink@gmail.com` to contacts
2. Check SPF/DKIM records (for production)
3. Warm up the email account by sending gradually

---

## Testing Flow

### Step 1: Check Configuration
```bash
curl http://localhost:3000/api/email-test/config
```
✅ Verify `passwordSet: true` and `user` is correct

### Step 2: Verify Connection
```bash
curl http://localhost:3000/api/email-test/verify
```
✅ Should return `success: true`

### Step 3: Send Test Email
```bash
curl -X POST http://localhost:3000/api/email-test/send \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"YOUR_EMAIL@gmail.com\"}"
```
✅ Check your inbox for test email

### Step 4: Test Real Flow
1. Submit lead form on frontend
2. Check console logs for:
   ```
   📧 Sending admin notification for Lead #X...
   📧 Sending user confirmation to user@example.com...
   ```
3. Check both inboxes (admin and user)

---

## Production Checklist

- [ ] Gmail App Password generated and set in .env
- [ ] Test emails sent successfully
- [ ] Admin receives notifications
- [ ] Users receive confirmations
- [ ] Emails not going to spam
- [ ] Error handling in place (emails fail gracefully)
- [ ] Logging enabled for debugging
- [ ] Rate limiting considered (Gmail has limits)

---

## Email Templates

### Admin Notification
- **To**: `bookinktermine@gmail.com`
- **Subject**: `New Tattoo Request from {name}`
- **Contains**:
  - Lead name, email, phone
  - Tattoo description
  - Discount percentage
  - Reference images count
  - Campaign source (UTM)
  - Quick action buttons

### User Confirmation
- **To**: User's email
- **Subject**: `Your Tattoo Request - {discount}% Discount Confirmed`
- **Contains**:
  - Personalized greeting
  - Discount badge
  - What happens next
  - Request summary
  - Contact buttons
  - Important note about discount

---

## Monitoring

### Backend Logs to Watch:
```bash
# Email initialization
grep "Email Service Initialization" logs

# Email sent
grep "email sent successfully" logs

# Email failures
grep "Failed to send" logs
```

### Database Check:
Emails don't affect lead creation. Check if lead was created:
```sql
SELECT id, name, email, created_at FROM leads ORDER BY created_at DESC LIMIT 5;
```

---

## Advanced Debugging

### Enable Nodemailer Debug Mode
Already enabled in code:
```typescript
this.transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: { ... },
  debug: true,    // Shows SMTP commands
  logger: true    // Shows connection info
});
```

### Test with curl:
```bash
# Test SMTP connection manually
telnet smtp.gmail.com 587
# Should connect
```

### Check Gmail Account:
1. Login to `noreply.bookink@gmail.com`
2. Check "Sent" folder
3. Check for bounce notifications
4. Check security alerts

---

## Troubleshooting Decision Tree

```
Email not sending?
├─ Check logs for errors
│  ├─ "EAUTH" → Fix App Password
│  ├─ "ETIMEDOUT" → Check network/firewall
│  └─ "EENVELOPE" → Check email addresses
│
├─ No errors in logs?
│  ├─ Check if emails are async → They fail silently
│  └─ Add more logging to lead.service.ts
│
└─ Connection works but not sending?
   ├─ Check Gmail quota (500/day)
   └─ Check if account is suspended
```

---

## Quick Test Script

Create `test-email.sh`:
```bash
#!/bin/bash

echo "1. Checking configuration..."
curl -s http://localhost:3000/api/email-test/config | jq

echo "\n2. Verifying connection..."
curl -s http://localhost:3000/api/email-test/verify | jq

echo "\n3. Sending test email..."
curl -s -X POST http://localhost:3000/api/email-test/send \
  -H "Content-Type: application/json" \
  -d "{\"to\":\"your-email@example.com\"}" | jq
```

Run:
```bash
chmod +x test-email.sh
./test-email.sh
```

---

## Support

If emails still don't work after following this guide:

1. **Check Console Logs**: Look for detailed error messages
2. **Test Email Service**: Use test endpoints to isolate issue
3. **Verify Gmail Settings**: Ensure 2FA and App Password are correct
4. **Check Network**: Try different network/disable VPN
5. **Review Code**: Check `email.service.ts` for any custom changes

For Gmail-specific issues: https://support.google.com/mail/answer/7126229
