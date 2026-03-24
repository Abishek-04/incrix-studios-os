export default function TermsPage() {
  return (
    <div className="min-h-screen bg-black text-white p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Terms of Service</h1>
      <p className="text-[#888] text-sm mb-8">Last updated: March 24, 2026</p>

      <div className="space-y-6 text-[#ccc] text-sm leading-relaxed">
        <section>
          <h2 className="text-lg font-semibold text-white mb-2">1. Acceptance of Terms</h2>
          <p>By accessing and using Incrix Studios, you agree to be bound by these Terms of Service. If you do not agree, do not use the platform.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">2. Description of Service</h2>
          <p>Incrix Studios is an internal content management and social media automation platform. It provides project management, team collaboration, and Instagram automation features for authorized team members.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">3. Account Responsibilities</h2>
          <p>You are responsible for maintaining the security of your account credentials. You must not share your login information with unauthorized individuals. You are responsible for all actions taken under your account.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">4. Instagram Integration</h2>
          <p>By connecting your Instagram account, you authorize the platform to access your Instagram data and perform actions on your behalf, including replying to comments and sending direct messages based on automation rules you configure. You are responsible for the content of automated messages.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">5. Prohibited Use</h2>
          <p>You may not use the platform to send spam, harass users, or violate Instagram&apos;s Terms of Service or Community Guidelines. Automation rules must comply with all applicable platform policies.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">6. Limitation of Liability</h2>
          <p>The platform is provided &quot;as is&quot; without warranties of any kind. We are not liable for any damages arising from the use of automated messaging features, including account restrictions imposed by Instagram.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">7. Changes to Terms</h2>
          <p>We reserve the right to modify these terms at any time. Continued use of the platform after changes constitutes acceptance of the updated terms.</p>
        </section>

        <section>
          <h2 className="text-lg font-semibold text-white mb-2">8. Contact</h2>
          <p>For questions about these terms, contact us at <span className="text-indigo-400">legal@incrix.com</span>.</p>
        </section>
      </div>
    </div>
  );
}
