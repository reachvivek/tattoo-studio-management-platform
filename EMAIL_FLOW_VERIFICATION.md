# Email Flow Verification

## ✅ Configuration Confirmed

### Email Settings (from .env):
- **Sender**: `noreply.bookink@gmail.com`
- **Admin Email**: `bookinktermine@gmail.com`
- **Service**: Gmail SMTP

## 📧 What Happens When Form is Submitted

### 1. User Fills Form
User enters:
- Name
- Email
- WhatsApp number
- Tattoo description
- Reference images (optional)

### 2. Backend Creates Lead
[lead.service.ts:82-89](backend/services/lead.service.ts#L82-L89)

```typescript
// Send email notifications (async, don't wait for them)
Promise.all([
  emailService.sendAdminNotification(lead),  // Email to admin
  emailService.sendUserConfirmation(lead)    // Email to user
]);
```

### 3. Two Emails Are Sent

#### Email #1: Admin Notification
**To**: `bookinktermine@gmail.com`
**Subject**: `New Tattoo Request from {name}`
**Contains**:
- Lead's name, email, phone
- Tattoo description
- Discount percentage (30%)
- Reference images count
- Campaign tracking (UTM parameters)
- Quick action buttons (Reply, WhatsApp)

#### Email #2: User Confirmation
**To**: User's email (from form)
**Subject**: `Your Tattoo Request - 30% Discount Confirmed`
**Contains**:
- Personalized greeting with user's name
- 30% discount badge
- "What Happens Next" section
- Request summary
- Contact buttons
- Important note about saving email

## 🧪 Testing Steps

### Step 1: Fill Out the Form
1. Go to: `http://localhost:4200`
2. Fill out the form:
   - Name: `Test User`
   - Email: `YOUR_EMAIL@gmail.com` (use your real email)
   - WhatsApp: `+49 1234567890`
   - Description: `Test tattoo description for email verification`
   - Images: (optional)
3. Click Submit

### Step 2: Watch Backend Console
You should see:
```
📧 Sending admin notification for Lead #X...
From: BookInk <noreply.bookink@gmail.com>
To: bookinktermine@gmail.com
Subject: New Tattoo Request from Test User
✅ Admin notification email sent successfully!

📧 Sending user confirmation to YOUR_EMAIL@gmail.com...
From: BookInk <noreply.bookink@gmail.com>
To: YOUR_EMAIL@gmail.com
Subject: Your Tattoo Request - 30% Discount Confirmed
✅ User confirmation email sent successfully!
```

### Step 3: Check Inboxes

**Admin Inbox** (`bookinktermine@gmail.com`):
- Should receive "New Tattoo Request from Test User"
- Check Spam folder if not in inbox

**User Inbox** (your email):
- Should receive "Your Tattoo Request - 30% Discount Confirmed"
- Check Spam folder if not in inbox

## 🔍 What to Look For

### Success Indicators:
✅ Both emails show in console logs
✅ `Message ID` is present in logs
✅ `Accepted: [ 'email@example.com' ]` in logs
✅ `Rejected: []` in logs
✅ Emails arrive within 1-2 minutes

### Failure Indicators:
❌ `Failed to send admin notification` in logs
❌ `Failed to send user confirmation` in logs
❌ Error codes like `EAUTH`, `ETIMEDOUT`, `EENVELOPE`
❌ Emails not arriving after 5 minutes

## 🎯 Expected Result

After submitting the form, you should receive:

**2 emails total**:
1. **Admin** gets: Professional notification with lead details
2. **User** gets: Confirmation with discount info and next steps

Both emails sent **automatically** and **asynchronously** (don't block lead creation).

## ⚠️ Important Notes

### Async Email Sending
- Emails are sent asynchronously (don't wait)
- Lead is created even if emails fail
- Errors are logged but don't stop the process

### Gmail Limits
- **500 emails per day** for Gmail accounts
- **100 emails per hour** (approximately)
- If limit reached, emails will fail

### Spam Folder
If emails go to spam:
1. Mark as "Not Spam"
2. Add sender to contacts
3. Set up email filters

### Production Considerations
For production, consider:
- Using a dedicated email service (SendGrid, Mailgun)
- Setting up SPF/DKIM records
- Monitoring email delivery rates
- Implementing email queue for retry logic

## 🐛 Troubleshooting

### If Admin Email Doesn't Arrive:
1. Check console for errors
2. Verify `bookinktermine@gmail.com` is correct
3. Check spam folder
4. Test with `/api/email-test/send`

### If User Email Doesn't Arrive:
1. Check console for errors
2. Verify user entered correct email
3. Check user's spam folder
4. Ensure email format is valid

### If Both Fail:
1. Check SMTP connection: `curl http://localhost:3000/api/email-test/verify`
2. Check Gmail App Password is correct
3. Review full error logs in console
4. Test with simplified email first

## 📊 Monitoring

### Key Logs to Watch:
```bash
# Email initialization
grep "Email Service Initialization" backend_logs.txt

# Successful sends
grep "email sent successfully" backend_logs.txt

# Failures
grep "Failed to send" backend_logs.txt

# Connection issues
grep "EAUTH\|ETIMEDOUT\|EENVELOPE" backend_logs.txt
```

### Database Verification:
Even if emails fail, lead should be created:
```sql
SELECT id, name, email, created_at
FROM leads
ORDER BY created_at DESC
LIMIT 1;
```

## ✨ Success Checklist

After testing, verify:
- [ ] Form submits successfully
- [ ] Lead appears in CRM dashboard
- [ ] Admin receives notification email
- [ ] User receives confirmation email
- [ ] Console shows "email sent successfully" (2x)
- [ ] No errors in console logs
- [ ] Emails contain correct information
- [ ] Links in emails work (WhatsApp, email reply)

---

**Ready to test!** 🚀

Submit the form and watch the magic happen. Both you and the admin should receive beautifully formatted emails within 1-2 minutes.
