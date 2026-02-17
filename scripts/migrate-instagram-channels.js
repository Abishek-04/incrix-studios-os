/**
 * Migration Script: Update existing Instagram channels for Facebook Login flow
 *
 * This script marks existing Instagram channels as needing reconnection because:
 * - Old tokens are Instagram User Tokens (from Instagram Login)
 * - New flow uses Facebook Login which provides Page Access Tokens
 * - Instagram User Tokens cannot be used for the messaging API
 * - Users must re-authenticate through the new Facebook Login flow
 *
 * Usage: node scripts/migrate-instagram-channels.js
 */

import 'dotenv/config';
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is required');
  process.exit(1);
}

async function migrate() {
  try {
    console.log('Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('Connected.');

    const Channel = mongoose.connection.collection('channels');

    // Find all Instagram channels that don't have the new fbPageAccessToken field
    const instagramChannels = await Channel.find({
      platform: 'instagram',
      fbPageAccessToken: { $exists: false },
    }).toArray();

    console.log(`Found ${instagramChannels.length} Instagram channel(s) to migrate.`);

    if (instagramChannels.length === 0) {
      console.log('No channels need migration. Exiting.');
      await mongoose.disconnect();
      return;
    }

    for (const channel of instagramChannels) {
      console.log(`\nMigrating channel: ${channel.id} (@${channel.igUsername})`);

      // Mark as requiring reconnection
      await Channel.updateOne(
        { _id: channel._id },
        {
          $set: {
            connectionStatus: 'requires_reconnect',
          },
          $unset: {
            // Clear the old Instagram User Token (wrong token type for messaging)
            accessToken: '',
          },
        }
      );

      console.log(`  - Marked as requires_reconnect`);
      console.log(`  - Cleared old Instagram User Token`);
    }

    console.log(`\nMigration complete. ${instagramChannels.length} channel(s) updated.`);
    console.log('Users will need to reconnect their Instagram accounts through the new Facebook Login flow.');

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB.');
  } catch (error) {
    console.error('Migration failed:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
}

migrate();
