'use client';

export default function FacebookPrivacyPolicyPage() {
  return (
    <div className="min-h-screen bg-white text-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2">Privacy Policy</h1>
          <p className="text-xl text-gray-600">Incrix Studios OS - Facebook Integration</p>
          <p className="text-sm text-gray-500 mt-2">
            Last Updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="prose prose-lg max-w-none space-y-8">
          {/* Introduction 1 */}
          <section className="bg-blue-50 border-l-4 border-blue-500 p-6 rounded-r-lg">
            <h2 className="text-2xl font-bold text-gray-900 mt-0">Introduction</h2>
            <p className="text-gray-700">
              This Privacy Policy describes how <strong>Incrix Studios OS</strong> ("we," "our," or "us")
              collects, uses, and protects data when you connect your <strong>Facebook</strong> and
              <strong> Instagram Business accounts</strong> to our content management platform.
            </p>
            <p className="text-gray-700">
              By connecting your account, you acknowledge and agree to the data practices described in this policy.
            </p>
          </section>

          {/* What Data We Collect */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">What Data We Collect from Facebook/Instagram</h2>

            <div className="bg-gray-50 p-6 rounded-lg mt-4">
              <h3 className="text-xl font-semibold text-gray-900 mb-3">Instagram Business Data</h3>
              <p className="text-gray-700 mb-3">When you connect your Instagram Business account, we collect:</p>

              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-white p-4 rounded border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">📸 Profile & Media</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Instagram username</li>
                    <li>• Profile picture</li>
                    <li>• Biography</li>
                    <li>• Media posts (photos/videos)</li>
                    <li>• Post captions and hashtags</li>
                    <li>• Media timestamps</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">📊 Engagement Metrics</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Post likes and comments</li>
                    <li>• Follower count</li>
                    <li>• Reach and impressions</li>
                    <li>• Engagement rates</li>
                    <li>• Story views</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">💬 Messages</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Direct messages (DMs)</li>
                    <li>• Message threads</li>
                    <li>• Sender information</li>
                    <li>• Message timestamps</li>
                  </ul>
                </div>

                <div className="bg-white p-4 rounded border border-gray-200">
                  <h4 className="font-semibold text-gray-900 mb-2">💭 Comments</h4>
                  <ul className="text-sm text-gray-700 space-y-1">
                    <li>• Comments on your posts</li>
                    <li>• Commenter usernames</li>
                    <li>• Comment text</li>
                    <li>• Comment timestamps</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mt-4">
              <p className="text-sm text-gray-700">
                <strong>⚠️ Important:</strong> We only access data that you explicitly authorize through Facebook's
                permission dialog. You control which permissions to grant.
              </p>
            </div>
          </section>

          {/* Permissions We Request */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">Permissions We Request</h2>
            <p className="text-gray-700">Our app requests the following Facebook/Instagram permissions:</p>

            <div className="bg-white border border-gray-200 rounded-lg overflow-hidden mt-4">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Permission</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Why We Need It</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">instagram_basic</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Access your profile information and media</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">instagram_manage_comments</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Read and respond to comments on your posts</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">instagram_manage_messages</td>
                    <td className="px-4 py-3 text-sm text-gray-700">Send and receive Instagram direct messages</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">pages_show_list</td>
                    <td className="px-4 py-3 text-sm text-gray-700">View your Facebook Pages connected to Instagram</td>
                  </tr>
                  <tr>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">pages_read_engagement</td>
                    <td className="px-4 py-3 text-sm text-gray-700">View post engagement metrics and insights</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </section>

          {/* How We Use Your Data */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">How We Use Your Instagram Data</h2>
            <p className="text-gray-700 mb-4">We use the collected data exclusively for these purposes:</p>

            <div className="space-y-4">
              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center text-2xl">
                  📊
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Content Management</h3>
                  <p className="text-gray-700 text-sm">
                    Display your Instagram posts within our platform to help you manage and track content production.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-2xl">
                  📈
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Analytics & Insights</h3>
                  <p className="text-gray-700 text-sm">
                    Show performance metrics (views, likes, engagement) to help you understand content effectiveness.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-2xl">
                  🤖
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Message Automation</h3>
                  <p className="text-gray-700 text-sm">
                    Send automated responses to Instagram DMs and comments based on rules you configure.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center text-2xl">
                  🔄
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Content Syncing</h3>
                  <p className="text-gray-700 text-sm">
                    Keep your Instagram media synchronized with our platform for unified content management.
                  </p>
                </div>
              </div>

              <div className="flex gap-4 items-start">
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center text-2xl">
                  👥
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Team Collaboration</h3>
                  <p className="text-gray-700 text-sm">
                    Allow your team members to view and manage content projects collaboratively.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Data Storage */}
          <section className="bg-gray-50 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mt-0">How We Store Your Data</h2>
            <div className="space-y-3 text-gray-700">
              <p>
                <strong>🔒 Security:</strong> Instagram access tokens are encrypted using AES-256 encryption before storage.
              </p>
              <p>
                <strong>💾 Database:</strong> Data is stored securely in MongoDB Atlas with encrypted connections.
              </p>
              <p>
                <strong>🔄 Sync Frequency:</strong> Instagram data is synchronized every 24 hours to keep content up-to-date.
              </p>
              <p>
                <strong>⏰ Retention:</strong> Data is retained as long as your account is active. After disconnection,
                Instagram data is deleted within 30 days.
              </p>
            </div>
          </section>

          {/* Data Sharing */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">Data Sharing</h2>
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg">
              <p className="text-gray-800 font-semibold">🚫 We DO NOT:</p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Sell your Instagram data to third parties</li>
                <li>Use your data for advertising or marketing purposes</li>
                <li>Share your data with competitors</li>
                <li>Publicly display your private messages</li>
              </ul>
            </div>

            <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg mt-4">
              <p className="text-gray-800 font-semibold">✅ We DO:</p>
              <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                <li>Share data with your authorized team members within the platform</li>
                <li>Use service providers (MongoDB, Vercel) for hosting and infrastructure</li>
                <li>Comply with legal requirements if mandated by law</li>
              </ul>
            </div>
          </section>

          {/* Your Rights */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">Your Rights & Control</h2>
            <p className="text-gray-700 mb-4">You have complete control over your data:</p>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-semibold text-gray-900 mb-2">🔓 Revoke Access Anytime</h3>
                <p className="text-sm text-gray-700">
                  You can disconnect your Instagram account at any time through:
                </p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• Our app settings</li>
                  <li>• <a href="https://www.facebook.com/settings?tab=business_tools" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Facebook Business Settings</a></li>
                </ul>
              </div>

              <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                <h3 className="font-semibold text-gray-900 mb-2">🗑️ Delete Your Data</h3>
                <p className="text-sm text-gray-700">
                  Request complete data deletion by:
                </p>
                <ul className="text-sm text-gray-700 mt-2 space-y-1">
                  <li>• Visiting our <a href="https://incrix-studios.vercel.app/data-deletion" className="text-green-600 underline">Data Deletion page</a></li>
                  <li>• Emailing privacy@incrixstudios.com</li>
                </ul>
              </div>

              <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                <h3 className="font-semibold text-gray-900 mb-2">📥 Export Your Data</h3>
                <p className="text-sm text-gray-700">
                  Download a copy of all your data in machine-readable format through Settings → Export Data.
                </p>
              </div>

              <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
                <h3 className="font-semibold text-gray-900 mb-2">✏️ Update Preferences</h3>
                <p className="text-sm text-gray-700">
                  Modify notification settings, team access, and automation rules at any time through your account settings.
                </p>
              </div>
            </div>
          </section>

          {/* Data Deletion Instructions */}
          <section className="bg-blue-50 border-2 border-blue-300 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mt-0">Data Deletion Instructions</h2>
            <p className="text-gray-700 mb-4">
              To request deletion of your Instagram data from our platform:
            </p>

            <div className="bg-white p-4 rounded-lg border border-blue-200">
              <h3 className="font-semibold text-gray-900 mb-3">Method 1: Through Our App</h3>
              <ol className="list-decimal list-inside text-gray-700 space-y-2">
                <li>Log into <a href="https://incrix-studios.vercel.app" className="text-blue-600 underline">Incrix Studios OS</a></li>
                <li>Go to <strong>Settings → Integrations</strong></li>
                <li>Click <strong>"Disconnect Instagram"</strong></li>
                <li>Or go to <strong>Settings → Account → Delete Account</strong> to remove everything</li>
              </ol>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-200 mt-3">
              <h3 className="font-semibold text-gray-900 mb-3">Method 2: Email Request</h3>
              <p className="text-gray-700 text-sm">
                Send an email to <strong>privacy@incrixstudios.com</strong> with:
              </p>
              <ul className="list-disc list-inside text-gray-700 text-sm mt-2 space-y-1">
                <li>Subject: "Instagram Data Deletion Request"</li>
                <li>Your registered email address</li>
                <li>Your Instagram username (if known)</li>
              </ul>
              <p className="text-gray-700 text-sm mt-2">
                We will process requests within <strong>3 business days</strong> and confirm deletion via email.
              </p>
            </div>

            <div className="bg-white p-4 rounded-lg border border-blue-200 mt-3">
              <h3 className="font-semibold text-gray-900 mb-3">Method 3: Facebook Settings</h3>
              <p className="text-gray-700 text-sm">
                Visit <a href="https://www.facebook.com/settings?tab=business_tools" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Facebook Business Integrations</a> → Find "Incrix Studios OS" → Click "Remove"
              </p>
            </div>

            <p className="text-sm text-gray-600 mt-4">
              <strong>Timeline:</strong> All Instagram data will be permanently deleted within 30 days of your request.
            </p>
          </section>

          {/* Compliance */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">Compliance with Meta Policies</h2>
            <p className="text-gray-700">
              Our app complies with:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li><a href="https://www.facebook.com/legal/terms" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Facebook Platform Terms</a></li>
              <li><a href="https://developers.facebook.com/docs/instagram-api" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Instagram Graph API Terms</a></li>
              <li><a href="https://help.instagram.com/581066165581870" className="text-blue-600 underline" target="_blank" rel="noopener noreferrer">Instagram Community Guidelines</a></li>
              <li>GDPR (General Data Protection Regulation)</li>
              <li>CCPA (California Consumer Privacy Act)</li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-gray-100 p-6 rounded-lg">
            <h2 className="text-2xl font-bold text-gray-900 mt-0">Contact Us</h2>
            <p className="text-gray-700 mb-4">
              For questions about this privacy policy or your Instagram data:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-700"><strong>Privacy Inquiries:</strong></p>
                <p className="text-sm text-blue-600">privacy@incrixstudios.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-700"><strong>General Support:</strong></p>
                <p className="text-sm text-blue-600">support@incrixstudios.com</p>
              </div>
              <div>
                <p className="text-sm text-gray-700"><strong>Website:</strong></p>
                <p className="text-sm text-blue-600">
                  <a href="https://incrix-studios.vercel.app" className="underline">incrix-studios.vercel.app</a>
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-700"><strong>Response Time:</strong></p>
                <p className="text-sm text-gray-600">Within 3 business days</p>
              </div>
            </div>
          </section>

          {/* Changes */}
          <section>
            <h2 className="text-2xl font-bold text-gray-900">Changes to This Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy to reflect changes in our practices or legal requirements.
              Material changes will be communicated via:
            </p>
            <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
              <li>Email notification to your registered email</li>
              <li>In-app notification upon next login</li>
              <li>Updated "Last Updated" date at the top of this page</li>
            </ul>
            <p className="text-gray-700 mt-3">
              Your continued use after changes indicates acceptance of the updated policy.
            </p>
          </section>

          {/* Acknowledgment */}
          <section className="bg-blue-600 text-white p-6 rounded-lg">
            <h2 className="text-2xl font-bold mt-0">Acknowledgment</h2>
            <p>
              By connecting your Facebook/Instagram account to Incrix Studios OS, you acknowledge that you have
              read, understood, and agree to this Privacy Policy.
            </p>
            <p className="mt-3 text-sm">
              If you do not agree with this policy, please do not connect your account or discontinue use immediately.
            </p>
          </section>
        </div>

        {/* Footer */}
        <div className="mt-12 pt-8 border-t border-gray-300 text-center text-sm text-gray-600">
          <p>© {new Date().getFullYear()} Incrix Studios. All rights reserved.</p>
          <div className="mt-2 space-x-4">
            <a href="/privacy-policy" className="text-blue-600 hover:underline">General Privacy Policy</a>
            <span>•</span>
            <a href="/terms" className="text-blue-600 hover:underline">Terms of Service</a>
            <span>•</span>
            <a href="/data-deletion" className="text-blue-600 hover:underline">Data Deletion</a>
          </div>
        </div>
      </div>
    </div>
  );
}
