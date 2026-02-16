# Instagram DM Automation Setup Guide

## Prerequisites

1. **Instagram Business Account** (not a personal account)
2. **Facebook Page** linked to your Instagram Business Account
3. **Meta Developer Account** at https://developers.facebook.com

---

## Step 1: Create a Facebook App

1. Go to https://developers.facebook.com
2. Click **"My Apps"** → **"Create App"**
3. Select **"Business"** as the app type
4. Fill in:
   - **App Name**: Your app name (e.g., "Incrix Studios OS")
   - **Contact Email**: Your email
   - **Business Portfolio**: Create or select one
5. Click **"Create App"**

---

## Step 2: Configure App Settings

### Add Products

1. In your app dashboard, click **"Add Products"**
2. Add these products:
   - **Instagram** (click "Set Up")
   - **Messenger** (for DM functionality)

### Get App Credentials

1. Go to **Settings** → **Basic**
2. Copy your:
   - **App ID** → Use as `INSTAGRAM_APP_ID`
   - **App Secret** → Use as `INSTAGRAM_APP_SECRET`
3. Update your `.env` file with these values

### Configure OAuth Redirect URIs

1. Still in **Settings** → **Basic**
2. Scroll to **"App Domains"**
3. Add: `localhost` (for development)
4. Under **"Website"**, add: `http://localhost:3005`
5. Scroll to **"Client OAuth Settings"**
6. Add **Valid OAuth Redirect URIs**:
   ```
   http://localhost:3005/api/instagram/auth/callback
   ```
7. Click **"Save Changes"**

---

## Step 3: Configure Instagram Product & Permissions

### Add Instagram Permissions

1. Go to **App Dashboard** → **Use Cases**
2. Click **"Customize"** or **"Add"**
3. Select **"Instagram Business Messaging"** use case
4. Enable these permissions:
   - ✅ `instagram_business_basic` - Read Instagram business account info
   - ✅ `instagram_business_manage_messages` - Send and receive DMs
   - ✅ `instagram_business_manage_comments` - Read and reply to comments
   - ✅ `pages_show_list` - List connected Facebook Pages
   - ✅ `pages_read_engagement` - Read Page engagement data
   - ✅ `business_management` - Manage business assets

### Important Notes:

- **For Development/Testing**: These permissions work immediately for:
  - App admins
  - App developers
  - App testers (add in **Roles** section)

- **For Production**: You'll need to submit for App Review to use these permissions with public users

### Add Test Users (Optional)

1. Go to **Roles** → **Roles**
2. Add **Instagram Testers**:
   - Click **"Add Instagram Testers"**
   - Enter Instagram username
   - User must accept the invite in their Instagram settings

---

## Step 4: Set Up Webhooks

### Configure Webhook

1. Go to **Products** → **Webhooks**
2. Click **"Create Subscription"** for **Instagram**
3. Enter:
   - **Callback URL**: `https://yourdomain.com/api/webhooks/instagram`
     - For local testing, use **ngrok**:
       ```bash
       ngrok http 3005
       ```
       Then use the ngrok URL: `https://your-ngrok-url.ngrok.io/api/webhooks/instagram`
   - **Verify Token**: Create a random string (e.g., `my_verify_token_123`)
     - Use this as `INSTAGRAM_WEBHOOK_VERIFY_TOKEN` in `.env`
4. Click **"Verify and Save"**

### Subscribe to Events

After verification, subscribe to these fields:
- ✅ **comments**
- ✅ **messages**
- ✅ **messaging_postbacks**

---

## Step 5: Update Environment Variables

Update your `.env` file with real values:

```env
# Instagram / Facebook API Configuration
INSTAGRAM_APP_ID=1234567890123456                    # Your Facebook App ID
INSTAGRAM_APP_SECRET=abcdef1234567890abcdef123456    # Your Facebook App Secret
INSTAGRAM_OAUTH_REDIRECT_URI=http://localhost:3005/api/instagram/auth/callback
INSTAGRAM_WEBHOOK_VERIFY_TOKEN=my_verify_token_123   # Your custom verify token

# Encryption key (generate a secure 32-character random string)
ENCRYPTION_KEY=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

# Redis Configuration (required for Bull queues)
REDIS_HOST=localhost
REDIS_PORT=6379
```

### Generate Encryption Key

Run this command to generate a secure encryption key:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Copy the output and use it as `ENCRYPTION_KEY`.

---

## Step 6: Install and Start Redis

Instagram automation uses Bull queues which require Redis.

### macOS (using Homebrew)

```bash
brew install redis
brew services start redis
```

### Linux

```bash
sudo apt-get install redis-server
sudo systemctl start redis
sudo systemctl enable redis
```

### Docker

```bash
docker run -d -p 6379:6379 redis:latest
```

### Verify Redis

```bash
redis-cli ping
# Should return: PONG
```

---

## Step 7: App Review (For Production)

For testing, you can use **Development Mode**. For production:

1. Go to **App Review** → **Permissions and Features**
2. Request these permissions:
   - `instagram_basic`
   - `instagram_manage_comments`
   - `instagram_manage_messages`
   - `pages_show_list`
   - `pages_manage_metadata`
   - `pages_messaging`
   - `pages_read_engagement`
3. Submit for review with use case documentation

---

## Step 8: Link Instagram Business Account

1. Go to your **Facebook Page Settings**
2. Click **"Instagram"** in the left sidebar
3. Click **"Connect Account"** and follow the prompts
4. Ensure you're linking an **Instagram Business** or **Creator** account (not personal)

---

## Step 9: Test the Integration

1. **Restart your application**:
   ```bash
   npm run restart
   ```

2. **Navigate to** http://localhost:3005/instagram

3. **Click "Connect Instagram"**

4. **Authorize the app** when prompted by Facebook

5. **Verify** your Instagram account appears in the Accounts tab

---

## Troubleshooting

### "Instagram API not configured" error

- Check that `INSTAGRAM_APP_ID` is set in `.env`
- Restart the server after updating `.env`

### OAuth redirect fails

- Verify the redirect URI in Meta app matches exactly:
  ```
  http://localhost:3005/api/instagram/auth/callback
  ```
- Check that the port matches (default: 3005)

### "Invalid OAuth Redirect URI" error

- Add the redirect URI to **both**:
  1. App Settings → Basic → Client OAuth Settings
  2. Products → Instagram → Basic Display → Valid OAuth Redirect URIs

### Webhooks not receiving events

- Use ngrok for local testing: `ngrok http 3005`
- Update webhook URL in Meta app with ngrok URL
- Ensure webhook verify token matches `.env` value
- Check that you've subscribed to the `comments` field

### Redis connection errors

- Verify Redis is running: `redis-cli ping`
- Check `REDIS_HOST` and `REDIS_PORT` in `.env`
- For Mac: `brew services restart redis`

### Token encryption errors

- Ensure `ENCRYPTION_KEY` is exactly 32 characters (64 hex digits)
- Generate new key: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`

---

## Development vs Production

### Development Mode

- Use `http://localhost:3005` for all URLs
- Use ngrok for webhook testing
- App can be in Development Mode in Meta dashboard

### Production Mode

- Use your actual domain: `https://yourdomain.com`
- Update all redirect URIs and webhook URLs
- Complete App Review for Instagram permissions
- Set `NODE_ENV=production`

---

## Quick Start Commands

```bash
# 1. Install Redis
brew install redis
brew services start redis

# 2. Generate encryption key
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# 3. Update .env with your credentials

# 4. Restart application
npm run restart

# 5. For local webhook testing
ngrok http 3005
```

---

## Need Help?

- **Meta Developer Docs**: https://developers.facebook.com/docs/instagram-platform
- **Instagram Messaging API**: https://developers.facebook.com/docs/messenger-platform/instagram
- **Webhooks Guide**: https://developers.facebook.com/docs/graph-api/webhooks

---

## Security Notes

- **Never commit `.env` file** to version control
- **Keep App Secret secure** - it's like a password
- **Use strong encryption key** - generate randomly
- **Enable 2FA** on your Meta Developer account
- **Review app permissions** regularly
- **Monitor API usage** in Meta dashboard

---

## Next Steps After Setup

1. ✅ Connect Instagram account
2. ✅ Sync media from Instagram
3. ✅ Create automation rules with keyword triggers
4. ✅ Set up DM templates with variables
5. ✅ Configure deduplication and rate limits
6. ✅ Monitor analytics dashboard
