'use client';

export default function DataDeletionPage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Data Deletion Instructions</h1>

        <div className="space-y-6 text-[#ccc]">
          <p className="text-lg">
            This page explains how to delete your data from Incrix Studios OS, including your Instagram connection
            and all associated information.
          </p>

          <section className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
            <h2 className="text-2xl font-semibold text-white mb-4">Quick Deletion</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">Option 1: Through Your Account</h3>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-2">
              <li>Log into your account at <a href="https://incrix-studios.vercel.app" className="text-indigo-400 hover:text-indigo-300">https://incrix-studios.vercel.app</a></li>
              <li>Click on your profile icon → <strong>Settings</strong></li>
              <li>Go to the <strong>Account</strong> tab</li>
              <li>Scroll to <strong>Danger Zone</strong></li>
              <li>Click <strong>"Delete Account"</strong></li>
              <li>Confirm deletion by typing your email address</li>
              <li>Click <strong>"Permanently Delete"</strong></li>
            </ol>

            <h3 className="text-xl font-semibold text-white mt-6 mb-2">Option 2: Email Request</h3>
            <p>Send an email to:</p>
            <div className="bg-[#111] border border-[#444] rounded-lg p-4 mt-2">
              <p><strong>To:</strong> privacy@incrixstudios.com</p>
              <p><strong>Subject:</strong> Data Deletion Request</p>
              <p className="mt-2"><strong>Include:</strong></p>
              <ul className="list-disc list-inside ml-4 mt-1">
                <li>Your registered email address</li>
                <li>Your account username (if known)</li>
                <li>Confirmation that you want all data deleted</li>
              </ul>
            </div>
            <p className="text-sm text-[#999] mt-2">
              We will process your request within <strong>3 business days</strong> and send you a confirmation email.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">What Data Will Be Deleted?</h2>
            <p className="mb-2">When you delete your account, the following data is permanently removed:</p>

            <div className="grid md:grid-cols-2 gap-4 mt-4">
              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Personal Information</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Name and email</li>
                  <li>Phone number</li>
                  <li>Password</li>
                  <li>Profile settings</li>
                  <li>Notification preferences</li>
                </ul>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Instagram Data</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Instagram account connection</li>
                  <li>Access tokens (encrypted)</li>
                  <li>Synced media and posts</li>
                  <li>Message automation rules</li>
                  <li>Analytics data</li>
                </ul>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Project Data</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>Created projects</li>
                  <li>Task assignments</li>
                  <li>Comments and mentions</li>
                  <li>Project history</li>
                  <li>File uploads (if any)</li>
                </ul>
              </div>

              <div className="bg-[#1a1a1a] border border-[#333] rounded-lg p-4">
                <h4 className="font-semibold text-white mb-2">Notifications</h4>
                <ul className="list-disc list-inside text-sm space-y-1">
                  <li>In-app notifications</li>
                  <li>Email notification logs</li>
                  <li>WhatsApp message logs</li>
                  <li>Notification preferences</li>
                </ul>
              </div>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Data Retention Timeline</h2>
            <div className="bg-[#1a1a1a] border border-[#333] rounded-xl p-6">
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <span className="text-indigo-400 font-bold">Day 0:</span>
                  <span>Account marked for deletion, access disabled</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-400 font-bold">Day 1-3:</span>
                  <span>Instagram connection revoked, access tokens deleted</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-400 font-bold">Day 7:</span>
                  <span>Personal information and project data deleted from active database</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-400 font-bold">Day 30:</span>
                  <span>All data permanently removed from backups</span>
                </li>
                <li className="flex items-start gap-3">
                  <span className="text-indigo-400 font-bold">After 30:</span>
                  <span>Confirmation email sent, data fully deleted</span>
                </li>
              </ul>
            </div>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Revoking Instagram Access Only</h2>
            <p className="mb-2">If you want to disconnect Instagram but keep your account:</p>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-2">
              <li>Log into your account</li>
              <li>Go to <strong>Settings → Integrations</strong></li>
              <li>Find <strong>Instagram</strong> and click <strong>"Disconnect"</strong></li>
            </ol>
            <p className="mt-4 text-sm text-[#999]">
              <strong>Note:</strong> This only removes the Instagram connection. Your account and project data remain active.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Revoking Access via Facebook</h2>
            <p className="mb-2">You can also revoke our app's access directly from Facebook:</p>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-2">
              <li>Go to <a href="https://www.facebook.com/settings?tab=business_tools" className="text-indigo-400 hover:text-indigo-300" target="_blank" rel="noopener noreferrer">Facebook Settings → Business Integrations</a></li>
              <li>Find <strong>"Incrix Studios OS"</strong></li>
              <li>Click <strong>"Remove"</strong></li>
              <li>Confirm removal</li>
            </ol>
            <p className="mt-4 text-sm text-[#999]">
              This immediately revokes our access to your Instagram data, but your Incrix Studios account remains active.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">What Data We Cannot Delete</h2>
            <p className="mb-2">Due to legal and operational requirements, we may retain:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Transaction logs:</strong> For fraud prevention (anonymized, 90 days)</li>
              <li><strong>Legal records:</strong> If required by law enforcement (until released)</li>
              <li><strong>Aggregated analytics:</strong> Anonymized, non-identifiable usage statistics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">Need Help?</h2>
            <p>If you encounter any issues or have questions about data deletion:</p>
            <ul className="list-none ml-4 mt-2 space-y-1">
              <li><strong>Email:</strong> privacy@incrixstudios.com</li>
              <li><strong>Support:</strong> support@incrixstudios.com</li>
              <li><strong>Response Time:</strong> Within 3 business days</li>
            </ul>
          </section>

          <hr className="border-[#333] my-8" />

          <div className="bg-indigo-500/10 border border-indigo-500/30 rounded-xl p-6">
            <h3 className="text-xl font-semibold text-white mb-2">Important Notice</h3>
            <p className="text-sm">
              Data deletion is <strong>permanent and irreversible</strong>. Before proceeding, consider:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 text-sm space-y-1">
              <li>Downloading a copy of your data (Settings → Export Data)</li>
              <li>Saving any important project information externally</li>
              <li>Informing team members if you manage shared projects</li>
            </ul>
            <p className="text-sm mt-3">
              Once deleted, we cannot recover your data. Please make sure this is what you want.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
