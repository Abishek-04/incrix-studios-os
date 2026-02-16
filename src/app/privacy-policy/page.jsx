'use client';

export default function PrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Privacy Policy</h1>

        <div className="space-y-6 text-[#ccc]">
          <p className="text-sm text-[#999]">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Introduction</h2>
            <p>
              Welcome to Incrix Studios OS ("we," "our," or "us"). This Privacy Policy explains how we collect, use, disclose,
              and safeguard your information when you use our content management platform and connect your Instagram Business account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.1 Account Information</h3>
            <p>When you create an account, we collect:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Name and email address</li>
              <li>Phone number (optional, for WhatsApp notifications)</li>
              <li>Role and team information</li>
              <li>Password (encrypted and stored securely)</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.2 Instagram Data</h3>
            <p>When you connect your Instagram Business account, we access:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Profile Information:</strong> Username, profile picture, follower count</li>
              <li><strong>Media:</strong> Posts, captions, timestamps, engagement metrics</li>
              <li><strong>Messages:</strong> Direct messages for automation and response features</li>
              <li><strong>Comments:</strong> Comments on your posts for engagement tracking</li>
              <li><strong>Insights:</strong> Performance metrics and analytics</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">2.3 Usage Data</h3>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Project creation and management activities</li>
              <li>Task assignments and completions</li>
              <li>Comments and mentions within projects</li>
              <li>Notification preferences</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. How We Use Your Information</h2>
            <p>We use the collected information to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Provide Services:</strong> Display your Instagram content in our platform for content management</li>
              <li><strong>Automation:</strong> Send automated responses to Instagram messages and comments based on your rules</li>
              <li><strong>Analytics:</strong> Show performance metrics and insights for your content</li>
              <li><strong>Notifications:</strong> Send project updates, task assignments, and mentions via email or WhatsApp</li>
              <li><strong>Team Collaboration:</strong> Enable team members to collaborate on content projects</li>
              <li><strong>Sync Content:</strong> Keep your Instagram media synchronized with our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Data Storage and Security</h2>
            <p className="mb-2">We implement industry-standard security measures:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Encryption:</strong> Instagram access tokens are encrypted using AES-256 encryption</li>
              <li><strong>Secure Storage:</strong> Data is stored in MongoDB Atlas with encrypted connections</li>
              <li><strong>Access Control:</strong> Role-based access ensures team members only see relevant data</li>
              <li><strong>Password Protection:</strong> User passwords are hashed using bcrypt</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. Data Sharing and Disclosure</h2>
            <p className="mb-2">We do NOT sell your personal information. We may share data with:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Team Members:</strong> Project and task information shared within your organization</li>
              <li><strong>Service Providers:</strong> MongoDB (database), Vercel (hosting), Meta (Instagram API)</li>
              <li><strong>Legal Requirements:</strong> If required by law or to protect our rights</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Instagram Data Usage</h2>
            <p className="mb-2">We comply with Meta's Platform Terms and Instagram API Terms:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Instagram data is used solely within our platform for content management</li>
              <li>We do not share Instagram data with third parties for advertising or marketing</li>
              <li>You can revoke our access to your Instagram account at any time</li>
              <li>We automatically refresh access tokens to maintain connection (60-day refresh cycle)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Your Rights and Choices</h2>
            <p>You have the right to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Access:</strong> View all data we have collected about you</li>
              <li><strong>Update:</strong> Modify your account information and preferences</li>
              <li><strong>Delete:</strong> Request deletion of your account and all associated data</li>
              <li><strong>Revoke Access:</strong> Disconnect your Instagram account at any time</li>
              <li><strong>Opt-Out:</strong> Disable email or WhatsApp notifications</li>
              <li><strong>Export:</strong> Request a copy of your data in machine-readable format</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Data Retention</h2>
            <p>We retain your data:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Active Accounts:</strong> As long as your account is active</li>
              <li><strong>After Deletion:</strong> 30 days grace period, then permanently deleted</li>
              <li><strong>Instagram Data:</strong> Refreshed every 24 hours; old data deleted after sync</li>
              <li><strong>Notifications:</strong> Read notifications deleted after 30 days</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Cookies and Tracking</h2>
            <p>We use minimal tracking:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Authentication:</strong> Session cookies to keep you logged in</li>
              <li><strong>Preferences:</strong> LocalStorage for UI preferences (theme, view mode)</li>
              <li><strong>Analytics:</strong> We do not use third-party analytics or advertising cookies</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Children's Privacy</h2>
            <p>
              Our service is not intended for users under 18 years of age. We do not knowingly collect
              information from children. If you believe we have collected information from a child, please contact us immediately.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. International Data Transfers</h2>
            <p>
              Your data may be transferred to and processed in countries other than your own. We ensure
              appropriate safeguards are in place to protect your information in accordance with this Privacy Policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of material changes by
              posting the new policy on this page and updating the "Effective Date." Your continued use of the
              service after changes constitutes acceptance of the updated policy.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Contact Us</h2>
            <p>For questions about this Privacy Policy or to exercise your rights, contact us:</p>
            <ul className="list-none ml-4 mt-2 space-y-1">
              <li><strong>Email:</strong> privacy@incrixstudios.com</li>
              <li><strong>Website:</strong> <a href="https://incrix-studios.vercel.app" className="text-indigo-400 hover:text-indigo-300">https://incrix-studios.vercel.app</a></li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Data Deletion Instructions</h2>
            <p>To delete your data:</p>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-2">
              <li>Log into your account at <a href="https://incrix-studios.vercel.app" className="text-indigo-400 hover:text-indigo-300">https://incrix-studios.vercel.app</a></li>
              <li>Go to Settings → Account → Delete Account</li>
              <li>Confirm deletion</li>
              <li>Or email us at privacy@incrixstudios.com with subject "Data Deletion Request"</li>
            </ol>
            <p className="mt-2">
              All your data, including Instagram connection, projects, tasks, and personal information will be
              permanently deleted within 30 days. You can also visit our <a href="/data-deletion" className="text-indigo-400 hover:text-indigo-300">Data Deletion page</a> for more information.
            </p>
          </section>

          <hr className="border-[#333] my-8" />

          <p className="text-sm text-[#999]">
            By using Incrix Studios OS, you acknowledge that you have read and understood this Privacy Policy
            and agree to its terms.
          </p>
        </div>
      </div>
    </div>
  );
}
