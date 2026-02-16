'use client';

export default function TermsOfServicePage() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">Terms of Service</h1>

        <div className="space-y-6 text-[#ccc]">
          <p className="text-sm text-[#999]">
            <strong>Effective Date:</strong> {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
          </p>

          <p className="text-lg">
            Please read these Terms of Service ("Terms") carefully before using Incrix Studios OS.
          </p>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">1. Acceptance of Terms</h2>
            <p>
              By accessing or using Incrix Studios OS ("Service"), you agree to be bound by these Terms.
              If you do not agree to these Terms, do not use the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">2. Description of Service</h2>
            <p>
              Incrix Studios OS is a content management platform designed for creative studios to manage video
              production workflows, team coordination, and social media content publishing. The Service includes:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Project and task management</li>
              <li>Team collaboration tools</li>
              <li>Instagram integration and automation</li>
              <li>Analytics and performance tracking</li>
              <li>Notification systems (email, WhatsApp)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">3. Account Registration</h2>
            <p className="mb-2">To use the Service, you must:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Be at least 18 years old</li>
              <li>Provide accurate and complete registration information</li>
              <li>Maintain the security of your account credentials</li>
              <li>Notify us immediately of any unauthorized access</li>
              <li>Be responsible for all activities under your account</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">4. Instagram Integration</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.1 Authorization</h3>
            <p>
              By connecting your Instagram Business account, you authorize us to access your Instagram data
              as permitted by Meta's Instagram Graph API.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.2 Compliance</h3>
            <p>You agree to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Use Instagram integration in compliance with Meta's Terms and Policies</li>
              <li>Not use the Service to violate Instagram Community Guidelines</li>
              <li>Maintain an active Instagram Business account</li>
              <li>Not share or transfer your Instagram access to others</li>
            </ul>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">4.3 Revocation</h3>
            <p>
              You may revoke our access to your Instagram account at any time through your Facebook settings
              or by disconnecting within the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">5. User Responsibilities</h2>
            <p className="mb-2">You agree NOT to:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Use the Service for any illegal or unauthorized purpose</li>
              <li>Violate any laws in your jurisdiction</li>
              <li>Infringe upon intellectual property rights of others</li>
              <li>Upload malicious code or viruses</li>
              <li>Attempt to gain unauthorized access to our systems</li>
              <li>Scrape or extract data from the Service</li>
              <li>Use the Service to spam, harass, or abuse others</li>
              <li>Share your account with others</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">6. Intellectual Property</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.1 Our Rights</h3>
            <p>
              The Service, including all software, design, text, graphics, and logos, is owned by Incrix Studios
              and protected by copyright, trademark, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.2 Your Content</h3>
            <p>
              You retain all rights to content you upload or create. By using the Service, you grant us a
              license to display, store, and process your content solely to provide the Service.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">6.3 Instagram Content</h3>
            <p>
              Instagram content displayed in the Service remains the property of you or the respective owners.
              We do not claim ownership of your Instagram data.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">7. Fees and Payment</h2>
            <p className="mb-2">
              <strong>Current Status:</strong> The Service is currently offered free of charge. We reserve the
              right to introduce fees in the future with 30 days' notice.
            </p>
            <p>
              If fees are introduced, you will have the option to accept the new terms or cancel your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">8. Third-Party Services</h2>
            <p className="mb-2">The Service integrates with third-party platforms:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li><strong>Meta/Instagram:</strong> Subject to Meta's Terms and Policies</li>
              <li><strong>MongoDB Atlas:</strong> Database hosting</li>
              <li><strong>Vercel:</strong> Application hosting</li>
            </ul>
            <p className="mt-2">
              We are not responsible for the availability, accuracy, or policies of third-party services.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">9. Data and Privacy</h2>
            <p>
              Your use of the Service is also governed by our <a href="/privacy-policy" className="text-indigo-400 hover:text-indigo-300">Privacy Policy</a>.
              Please review it to understand how we collect, use, and protect your information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">10. Service Availability</h2>
            <p className="mb-2">We strive to provide reliable service, but we do not guarantee:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>Uninterrupted or error-free operation</li>
              <li>Service will meet your specific requirements</li>
              <li>All bugs will be corrected immediately</li>
              <li>Data will be 100% secure from unauthorized access</li>
            </ul>
            <p className="mt-2">
              We reserve the right to modify, suspend, or discontinue the Service with or without notice.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">11. Limitation of Liability</h2>
            <p className="mb-2 font-semibold">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW:
            </p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>
                We are not liable for any indirect, incidental, special, consequential, or punitive damages
              </li>
              <li>
                We are not liable for loss of profits, data, or goodwill
              </li>
              <li>
                Our total liability shall not exceed $100 or the amount you paid us in the past 12 months
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">12. Indemnification</h2>
            <p>
              You agree to indemnify and hold harmless Incrix Studios from any claims, damages, or expenses
              arising from your use of the Service, violation of these Terms, or infringement of any rights
              of others.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">13. Termination</h2>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">13.1 By You</h3>
            <p>
              You may terminate your account at any time through Settings or by contacting us. Termination
              will result in deletion of your data as described in our <a href="/data-deletion" className="text-indigo-400 hover:text-indigo-300">Data Deletion Policy</a>.
            </p>

            <h3 className="text-xl font-semibold text-white mt-4 mb-2">13.2 By Us</h3>
            <p className="mb-2">We may suspend or terminate your account if:</p>
            <ul className="list-disc list-inside ml-4 mt-2 space-y-1">
              <li>You violate these Terms</li>
              <li>Your account is inactive for 12+ months</li>
              <li>We are required to do so by law</li>
              <li>Continued provision would cause us legal liability</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">14. Modifications to Terms</h2>
            <p>
              We reserve the right to modify these Terms at any time. We will notify you of material changes
              via email or in-app notification. Your continued use after changes constitutes acceptance of
              the modified Terms.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">15. Governing Law</h2>
            <p>
              These Terms shall be governed by and construed in accordance with the laws of [Your Jurisdiction],
              without regard to its conflict of law provisions.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">16. Dispute Resolution</h2>
            <p>
              Any disputes arising from these Terms or the Service shall be resolved through:
            </p>
            <ol className="list-decimal list-inside ml-4 mt-2 space-y-1">
              <li>Good faith negotiation between parties</li>
              <li>Mediation if negotiation fails</li>
              <li>Binding arbitration as a last resort</li>
            </ol>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-white mb-4">17. Contact Information</h2>
            <p>For questions about these Terms:</p>
            <ul className="list-none ml-4 mt-2 space-y-1">
              <li><strong>Email:</strong> legal@incrixstudios.com</li>
              <li><strong>Support:</strong> support@incrixstudios.com</li>
              <li><strong>Website:</strong> <a href="https://incrix-studios.vercel.app" className="text-indigo-400 hover:text-indigo-300">https://incrix-studios.vercel.app</a></li>
            </ul>
          </section>

          <hr className="border-[#333] my-8" />

          <p className="text-sm text-[#999]">
            By using Incrix Studios OS, you acknowledge that you have read, understood, and agree to be bound
            by these Terms of Service.
          </p>
        </div>
      </div>
    </div>
  );
}
