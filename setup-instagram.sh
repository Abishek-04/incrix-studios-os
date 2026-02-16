#!/bin/bash

# Instagram DM Automation Setup Script
# This script helps you set up the Instagram automation feature

echo "🚀 Instagram DM Automation Setup"
echo "=================================="
echo ""

# Check if Redis is installed
echo "📦 Checking Redis installation..."
if command -v redis-cli &> /dev/null; then
    echo "✅ Redis is installed"

    # Check if Redis is running
    if redis-cli ping &> /dev/null; then
        echo "✅ Redis is running"
    else
        echo "⚠️  Redis is installed but not running"
        echo "Starting Redis..."

        # Try to start Redis based on OS
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            if command -v brew &> /dev/null; then
                brew services start redis
                echo "✅ Redis started via Homebrew"
            fi
        elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
            # Linux
            sudo systemctl start redis
            echo "✅ Redis started via systemctl"
        fi
    fi
else
    echo "❌ Redis is not installed"
    echo ""
    echo "Redis is required for Instagram automation queues."
    echo "Install it with:"
    echo ""
    if [[ "$OSTYPE" == "darwin"* ]]; then
        echo "  brew install redis"
        echo "  brew services start redis"
    elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
        echo "  sudo apt-get install redis-server"
        echo "  sudo systemctl start redis"
    fi
    echo ""
    read -p "Press Enter to continue or Ctrl+C to exit..."
fi

echo ""
echo "🔐 Generating Encryption Key..."
ENCRYPTION_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))" 2>/dev/null)

if [ $? -eq 0 ]; then
    echo "✅ Generated encryption key: $ENCRYPTION_KEY"
    echo ""
    echo "Add this to your .env file:"
    echo "ENCRYPTION_KEY=$ENCRYPTION_KEY"
else
    echo "⚠️  Could not generate encryption key (Node.js might not be available)"
fi

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Create a Facebook App at https://developers.facebook.com"
echo "   - Add Instagram and Messenger products"
echo "   - Get your App ID and App Secret"
echo ""
echo "2. Update your .env file with:"
echo "   INSTAGRAM_APP_ID=your_app_id_here"
echo "   INSTAGRAM_APP_SECRET=your_app_secret_here"
echo "   INSTAGRAM_OAUTH_REDIRECT_URI=http://localhost:3005/api/instagram/auth/callback"
echo "   INSTAGRAM_WEBHOOK_VERIFY_TOKEN=your_custom_token_here"
echo "   ENCRYPTION_KEY=$ENCRYPTION_KEY"
echo ""
echo "3. Configure OAuth redirect URI in Facebook App:"
echo "   http://localhost:3005/api/instagram/auth/callback"
echo ""
echo "4. Set up webhooks (use ngrok for local testing):"
echo "   ngrok http 3005"
echo "   Then use: https://your-ngrok-url.ngrok.io/api/webhooks/instagram"
echo ""
echo "5. Restart the application:"
echo "   npm run restart"
echo ""
echo "📖 For detailed instructions, see: INSTAGRAM_SETUP.md"
echo ""
echo "✨ Setup guide complete!"
