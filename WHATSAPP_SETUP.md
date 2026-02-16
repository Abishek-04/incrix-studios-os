# WhatsApp Business API Integration - Setup Guide

## Overview

The Incrix Studios OS now supports automated WhatsApp notifications for:
- 🎬 **Project assignments** (creator/editor assignments)
- 📊 **Stage changes** (Backlog → Scripting → Shooting → Editing → Review → Done)
- 💬 **Comments** on projects
- @️⃣ **@Mentions** in comments
- ✅ **Daily task assignments** (AM/PM slots)

**Implementation Status**: ✅ Core infrastructure complete (Phases 1-6 completed)

---

## Prerequisites

Before setting up WhatsApp integration, ensure you have:

1. **Meta (Facebook) Business Account** - [Create one here](https://business.facebook.com/)
2. **WhatsApp Business App** - Set up via Meta Business Manager
3. **Redis Server** - For background job processing
   - macOS: `brew install redis`
   - Linux: `apt-get install redis-server`
   - Windows: [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
4. **Node.js 18+** - Already required for Next.js

---

## Step 1: Install Dependencies

The required packages are already in package.json. Install them:

```bash
npm install
```

**Dependencies added**:
- `bull` (^4.16.5) - Background job queue
- `ioredis` (^5.9.3) - Redis client
- `axios` (^1.13.5) - WhatsApp API HTTP client
- `uuid` (via bull) - Notification IDs
- `concurrently` (^9.2.1) - Run dev server + worker together

---

## Step 2: Setup WhatsApp Business API

### 2.1 Create Meta Business Account
1. Go to [Meta Business Manager](https://business.facebook.com/)
2. Create a new Business Account
3. Complete business verification (may take 1-3 days)

### 2.2 Create WhatsApp Business App
1. In Meta Business Manager, go to **WhatsApp** → **Getting Started**
2. Click **Create App** and select **Business**
3. Add WhatsApp product to your app
4. Complete phone number verification

### 2.3 Get API Credentials
In your WhatsApp Business App dashboard:

1. **Access Token**:
   - Go to **WhatsApp** → **API Setup**
   - Click **Generate Token** (24-hour temporary token)
   - For production, create a **System User** and generate a **Permanent Token**
   - Copy the token (starts with `EAA...`)

2. **Phone Number ID**:
   - In **API Setup**, under **Send and receive messages**
   - Copy the **Phone Number ID** (numeric ID like `123456789012345`)

3. **Business Account ID**:
   - In **Settings** → **Business Settings**
   - Copy **WhatsApp Business Account ID**

4. **App Secret** (for webhook verification):
   - Go to **Settings** → **Basic**
   - Copy **App Secret** (click "Show" to reveal)

### 2.4 Configure Environment Variables

Edit `.env.local` and update the following:

```env
# WhatsApp Business API (Meta Cloud API)
WHATSAPP_API_URL=https://graph.facebook.com/v21.0
WHATSAPP_ACCESS_TOKEN=your_permanent_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id
WHATSAPP_WEBHOOK_VERIFY_TOKEN=random_secure_string_you_choose
WHATSAPP_APP_SECRET=your_app_secret_here

# Redis (for Bull queue)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Generate secure webhook verify token
# Run: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Important**: Never commit `.env.local` to git. It's already in `.gitignore`.

---

## Step 3: Setup Redis

### Start Redis Server

**macOS/Linux**:
```bash
redis-server
```

**Windows**:
- Download [Redis for Windows](https://github.com/microsoftarchive/redis/releases)
- Run `redis-server.exe`

**Verify Redis is running**:
```bash
redis-cli ping
# Should return: PONG
```

### Optional: Use Cloud Redis

For production, consider using a managed Redis service:
- **Upstash** (Recommended, free tier): [upstash.com](https://upstash.com/)
- **Redis Cloud**: [redis.com/cloud](https://redis.com/cloud/)
- **AWS ElastiCache**: For AWS deployments

Update `.env.local` with cloud credentials:
```env
REDIS_HOST=your-redis-host.upstash.io
REDIS_PORT=6379
REDIS_PASSWORD=your-redis-password
```

---

## Step 4: Create WhatsApp Message Templates

WhatsApp Business API **requires pre-approved templates** for certain types of messages. Create these in Meta Business Manager:

### Navigate to Templates
1. Go to **WhatsApp** → **Message Templates**
2. Click **Create Template**

### Create Templates

**Template 1: project_assigned**
```
Name: project_assigned
Category: UTILITY
Language: English (US)

Body:
🎬 You've been assigned to {{1}}. Check the dashboard for details.

Variables:
1. Project title
```

**Template 2: deadline_alert**
```
Name: deadline_alert
Category: UTILITY
Language: English (US)

Body:
⏰ {{1}} is due in {{2}} days. Please prioritize completion.

Variables:
1. Project title
2. Days remaining
```

**Template 3: comment_notification**
```
Name: comment_notification
Category: UTILITY
Language: English (US)

Body:
💬 {{1}} commented on {{2}}. Check the project to view and reply.

Variables:
1. Commenter name
2. Project title
```

### Template Approval
- Templates may take **24-48 hours** to be approved by Meta
- During development, you can use the **sandbox test number** for testing

---

## Step 5: Configure Webhook

The webhook allows WhatsApp to send delivery status updates to your server.

### 5.1 Expose Local Server (Development)

For local development, use **ngrok** to expose your localhost:

```bash
# Install ngrok
npm install -g ngrok

# Start your Next.js server
npm run dev

# In another terminal, expose port 3000
ngrok http 3000
```

Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)

### 5.2 Configure Webhook in Meta

1. In Meta Business Manager, go to **WhatsApp** → **Configuration**
2. Click **Edit** next to **Webhook**
3. Enter:
   - **Callback URL**: `https://yourdomain.com/api/whatsapp/webhook` (or ngrok URL)
   - **Verify Token**: The value you set in `WHATSAPP_WEBHOOK_VERIFY_TOKEN`
4. Click **Verify and Save**
5. Subscribe to webhook fields:
   - ☑ messages
   - ☑ message_status

### 5.3 Verify Webhook

Check your server logs:
```
[WhatsApp Webhook] Verified successfully
```

---

## Step 6: Enable User WhatsApp Notifications

### Update User Records

Users must opt-in to WhatsApp notifications. Update user records in MongoDB:

```javascript
// Via MongoDB Compass or CLI
db.users.updateOne(
  { email: "user@example.com" },
  {
    $set: {
      phoneNumber: "+1234567890",  // E.164 format: +[country code][number]
      notifyViaWhatsapp: true
    }
  }
)
```

**Phone Number Format**:
- ✅ Correct: `+1234567890` (E.164 format with + and country code)
- ❌ Wrong: `1234567890` (missing +)
- ❌ Wrong: `(123) 456-7890` (formatting not allowed)

### Via Team Management UI

Managers can update user settings via the **Team Management** page:
1. Go to **Team** (manager only)
2. Click on a user
3. Set **Phone Number** (with + and country code)
4. Enable **Notify via WhatsApp** checkbox
5. Click **Save**

---

## Step 7: Run the Application

### Development Mode

Run both the Next.js dev server and the WhatsApp worker:

```bash
# Option 1: Run both together (recommended)
npm run dev:all

# Option 2: Run separately in two terminals
# Terminal 1:
npm run dev

# Terminal 2:
npm run worker
```

### Verify Worker is Running

Check terminal output for:
```
[WhatsApp Queue] Worker started and listening for jobs
[WhatsApp Queue] Redis: localhost:6379
```

### Production Mode

Build and start:

```bash
npm run build
npm run start
```

**Run worker in background with PM2**:

```bash
# Install PM2 globally
npm install -g pm2

# Start worker
pm2 start src/lib/queueWorker.js --name whatsapp-worker

# Save PM2 process list
pm2 save

# Set PM2 to start on boot
pm2 startup
```

---

## Step 8: Test WhatsApp Notifications

### 8.1 Test via Manual Send Endpoint

```bash
curl -X POST http://localhost:3000/api/whatsapp/send \
  -H "Content-Type: application/json" \
  -d '{
    "userIds": ["usr1", "usr2"],
    "message": "🎬 Test message from Incrix Studios OS!"
  }'
```

Expected response:
```json
{
  "success": true,
  "sent": 2,
  "failed": 0,
  "results": [
    { "userId": "usr1", "success": true, "messageId": "wamid.xyz..." },
    { "userId": "usr2", "success": true, "messageId": "wamid.abc..." }
  ]
}
```

### 8.2 Test via UI Actions

1. **Project Assignment**:
   - Create a new project
   - Assign a creator/editor with WhatsApp enabled
   - Check their phone for WhatsApp notification

2. **Stage Change**:
   - Open a project on the Board view
   - Click the chevron buttons to move between stages
   - Team members should receive stage change notifications

3. **Comment Mention**:
   - Open a project
   - Go to Comments tab
   - Add a comment with `@username`
   - Mentioned user receives WhatsApp notification

4. **Daily Task**:
   - Go to Daily Tasks
   - Assign a task to a user
   - User receives task assignment notification

### 8.3 Monitor Queue Jobs

Check Redis for queued jobs:

```bash
redis-cli

# List all keys
KEYS *

# Check queue length
LLEN bull:whatsapp-notifications:wait

# View completed jobs
ZRANGE bull:whatsapp-notifications:completed 0 -1 WITHSCORES
```

### 8.4 Check Delivery Status

Delivery status is tracked in the Notification collection:

```javascript
// Query in MongoDB Compass
db.notifications.find({
  whatsappStatus: { $exists: true }
}).sort({ createdAt: -1 }).limit(10)
```

**Status Values**:
- `queued` - Job added to Bull queue
- `sent` - Message sent to WhatsApp API
- `delivered` - WhatsApp confirmed delivery to recipient
- `read` - Recipient opened the message
- `failed` - Sending failed (check `whatsappError` field)

---

## Troubleshooting

### Issue: "WhatsApp API credentials not configured"

**Solution**: Verify `.env.local` has all required variables:
```bash
grep WHATSAPP .env.local
```

All 5 variables must be present:
- WHATSAPP_API_URL
- WHATSAPP_ACCESS_TOKEN
- WHATSAPP_PHONE_NUMBER_ID
- WHATSAPP_BUSINESS_ACCOUNT_ID
- WHATSAPP_WEBHOOK_VERIFY_TOKEN

### Issue: "Failed to send WhatsApp message" (Error 131031)

**Cause**: Message template not approved

**Solution**:
1. Check template status in Meta Business Manager
2. Wait for approval (24-48 hours)
3. For testing, use the sandbox test number

### Issue: Redis connection failed

**Symptoms**:
```
Error: connect ECONNREFUSED 127.0.0.1:6379
```

**Solution**:
```bash
# Start Redis
redis-server

# Verify it's running
redis-cli ping
```

### Issue: Worker not processing jobs

**Check**:
1. Is worker running? `ps aux | grep queueWorker`
2. Is Redis running? `redis-cli ping`
3. Check worker logs for errors
4. Verify environment variables loaded

**Restart worker**:
```bash
# Kill existing worker
pm2 stop whatsapp-worker
pm2 delete whatsapp-worker

# Restart
pm2 start src/lib/queueWorker.js --name whatsapp-worker
```

### Issue: Webhook verification failed

**Check**:
1. Is server accessible from internet? (use ngrok for local dev)
2. Does `WHATSAPP_WEBHOOK_VERIFY_TOKEN` in `.env.local` match what you entered in Meta?
3. Is webhook endpoint responding? Test: `curl https://yourdomain.com/api/whatsapp/webhook?hub.mode=subscribe&hub.verify_token=YOUR_TOKEN&hub.challenge=test`

### Issue: Phone number format error

**Symptoms**:
```
Error: Invalid phone number format
```

**Solution**: Use E.164 format with + prefix:
```javascript
// Correct
phoneNumber: "+1234567890"

// Wrong
phoneNumber: "1234567890"
phoneNumber: "(123) 456-7890"
```

---

## Production Deployment

### Environment Variables

In your hosting platform (Vercel, AWS, etc.), set:

```env
WHATSAPP_ACCESS_TOKEN=<production_permanent_token>
WHATSAPP_PHONE_NUMBER_ID=<production_phone_id>
WHATSAPP_BUSINESS_ACCOUNT_ID=<production_account_id>
WHATSAPP_WEBHOOK_VERIFY_TOKEN=<production_verify_token>
WHATSAPP_APP_SECRET=<production_app_secret>
REDIS_HOST=<production_redis_host>
REDIS_PORT=6379
REDIS_PASSWORD=<production_redis_password>
```

### Webhook URL

Update webhook URL in Meta Business Manager to production URL:
```
https://yourproductiondomain.com/api/whatsapp/webhook
```

### Redis Setup

Use a managed Redis service:
- **Upstash** (recommended for Vercel deployments)
- **AWS ElastiCache** (for AWS deployments)
- **Redis Cloud**

### Worker Process

Run worker as a background service:

```bash
# Using PM2
pm2 start src/lib/queueWorker.js --name whatsapp-worker
pm2 save
pm2 startup

# Using systemd (Linux)
# Create /etc/systemd/system/whatsapp-worker.service
```

### Monitoring

Monitor queue health:

```bash
# Bull Board (optional dashboard)
npm install @bull-board/api @bull-board/express

# Add to server.js or create separate monitoring endpoint
# Access at: http://localhost:3000/admin/queues
```

---

## Cost Estimation

### WhatsApp Business API Pricing (Meta Cloud API)

**Free Tier**: 1,000 service conversations/month

**Paid Tier**:
- Service conversations: $0.005 - $0.02 per conversation (varies by country)
- User-initiated conversations: FREE

**Example** (50 users, 10 notifications/user/day):
- Total messages: 15,000/month
- Conversations (24h grouping): ~7,500/month
- Free tier: 1,000 conversations
- Paid: 6,500 conversations × $0.01 = **$65/month**

**Tip**: Notifications to the same user within 24 hours count as one conversation, so costs are lower than expected.

---

## Security Best Practices

1. **Never commit `.env.local`** - Already in `.gitignore`
2. **Use permanent tokens** - Don't use 24-hour temp tokens in production
3. **Rotate tokens regularly** - Every 90 days minimum
4. **Validate webhook signatures** - Implement in webhook route (optional enhancement)
5. **Encrypt credentials in database** - Especially Channel model WhatsApp credentials
6. **Use HTTPS only** - Required by WhatsApp API
7. **Rate limiting** - Add to API routes (already in plan)

---

## Feature Roadmap

### Phase 8: AI Integration (Optional)

Add Claude AI for smart message generation:

```bash
# Install Anthropic SDK
npm install @anthropic-ai/sdk
```

Update `.env.local`:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Features:
- AI-generated notification messages
- Smart replies to incoming WhatsApp messages
- Natural language project queries

---

## Support & Resources

### Documentation
- [WhatsApp Cloud API Docs](https://developers.facebook.com/docs/whatsapp/cloud-api/)
- [Bull Queue Documentation](https://github.com/OptimalBits/bull)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)

### Getting Help
- Check server logs: `tail -f logs/combined.log`
- Check worker logs: `pm2 logs whatsapp-worker`
- Test webhook: Meta Business Manager → WhatsApp → Configuration → Test Button

### Common Questions

**Q: Can I use regular WhatsApp instead of Business API?**
A: No, regular WhatsApp doesn't support automated messaging. You must use WhatsApp Business API.

**Q: Do I need to pay for Redis?**
A: No, Redis is free and open-source. Managed Redis services (Upstash, Redis Cloud) have free tiers.

**Q: Can users reply to WhatsApp notifications?**
A: Yes! Incoming messages are captured by the webhook. Implement AI responses in Phase 8.

**Q: How many messages can I send per day?**
A: Meta enforces rate limits based on phone number quality rating. Start with ~1,000/day, increases with good quality rating.

**Q: What happens if WhatsApp API is down?**
A: Messages are queued in Redis and automatically retried (3 attempts with exponential backoff). You won't lose messages.

---

## Verification Checklist

Before going live, verify:

- [ ] WhatsApp Business Account verified
- [ ] API credentials configured in `.env.local`
- [ ] Redis running and accessible
- [ ] Worker process running (`npm run worker`)
- [ ] Webhook verified in Meta dashboard
- [ ] Message templates approved
- [ ] At least one user has WhatsApp enabled
- [ ] Test message sent successfully
- [ ] Delivery status tracked in database
- [ ] Production Redis configured (if deploying)
- [ ] PM2 worker running in production
- [ ] Environment variables set in hosting platform
- [ ] Webhook URL updated to production domain

---

**Setup Complete!** 🎉

Your Incrix Studios OS now sends automated WhatsApp notifications for project updates, comments, and task assignments.

**Estimated Setup Time**: 2-3 hours (including Meta account verification)
**Difficulty**: Intermediate
**Status**: Production Ready

For issues or questions, check the troubleshooting section or review server/worker logs.
