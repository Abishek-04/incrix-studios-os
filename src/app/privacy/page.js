export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Privacy Policy</h1>
      <p className="text-[#888] text-sm mb-8">Last updated: March 24, 2026</p>

      <div className="space-y-6 text-[#ccc] text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">1. Information We Collect</h2>
          <p>When you connect your Instagram account, we collect your Instagram username, profile picture, account type, and an access token to interact with the Instagram API on your behalf. We also store media metadata (post IDs, captions, timestamps) to enable automation features.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">2. How We Use Your Information</h2>
          <p>We use your information solely to provide the automation services you configure, including replying to comments and sending direct messages on Instagram. We do not sell, share, or distribute your data to third parties.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">3. Data Storage</h2>
          <p>Your data is stored securely in our database. Access tokens are encrypted at rest. We retain your data only for as long as your account is connected. You may disconnect your account at any time to remove your data.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">4. Instagram API Usage</h2>
          <p>We access the Instagram Graph API using permissions you explicitly grant during the OAuth authorization flow. We only request the minimum permissions needed: reading your profile, managing comments, and managing messages.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">5. Data Deletion</h2>
          <p>You can request deletion of all your data by disconnecting your Instagram account from the platform or by contacting us. Upon disconnection, all stored tokens, media metadata, and automation rules associated with your account are permanently deleted.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">6. Contact</h2>
          <p>For any privacy concerns, contact us at <span className="text-indigo-400">privacy@incrix.com</span>.</p>
        </section>
      </div>
    </div>
  );
}
