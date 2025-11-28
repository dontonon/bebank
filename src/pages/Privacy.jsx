import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

export default function Privacy() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 ml-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-toxic to-purple bg-clip-text text-transparent">
              Privacy Policy
            </h1>
            <p className="text-gray-400 mb-8">Last Updated: November 28, 2025</p>

            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Introduction</h2>
                <p>
                  Pass It On ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how
                  we collect, use, and safeguard your information when you use our decentralized application.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Information We Collect</h2>

                <h3 className="text-xl font-semibold text-toxic mb-3">2.1 Blockchain Data</h3>
                <p className="mb-4">
                  All transactions on Pass It On are recorded on the Base blockchain, which is public and permanent. This includes:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4 mb-4">
                  <li>Your wallet address</li>
                  <li>Transaction amounts and timestamps</li>
                  <li>Smart contract interactions</li>
                  <li>Link creation and claim events</li>
                </ul>
                <p>
                  This data is not collected by us but is inherently public on the blockchain.
                </p>

                <h3 className="text-xl font-semibold text-toxic mb-3 mt-6">2.2 Local Storage</h3>
                <p className="mb-4">
                  We store certain data locally in your browser:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Link secrets for links you create or claim</li>
                  <li>Wallet connection preferences</li>
                  <li>User interface preferences</li>
                </ul>
                <p>
                  This data never leaves your device and is not transmitted to our servers.
                </p>

                <h3 className="text-xl font-semibold text-toxic mb-3 mt-6">2.3 Analytics</h3>
                <p className="mb-4">
                  We use privacy-focused analytics services (Plausible Analytics and Google Analytics) to understand how users interact with our Service:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Page views and navigation patterns</li>
                  <li>General geographic location (country/city level)</li>
                  <li>Device type and browser information</li>
                  <li>Referral sources</li>
                </ul>
                <p>
                  We do not collect personally identifiable information through analytics.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. How We Use Your Information</h2>
                <p className="mb-4">We use the collected information to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Provide and maintain the Service</li>
                  <li>Improve user experience and functionality</li>
                  <li>Analyze usage patterns and trends</li>
                  <li>Detect and prevent technical issues</li>
                  <li>Respond to user feedback and support requests</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Data We Do NOT Collect</h2>
                <p className="mb-4">We do not collect or have access to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Your wallet private keys or seed phrases</li>
                  <li>Passwords or authentication credentials</li>
                  <li>Personal identifying information (name, email, phone number)</li>
                  <li>Financial information beyond what's publicly visible on the blockchain</li>
                  <li>IP addresses (Plausible Analytics does not track IPs)</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. Third-Party Services</h2>

                <h3 className="text-xl font-semibold text-toxic mb-3">5.1 Wallet Providers</h3>
                <p className="mb-4">
                  We integrate with third-party wallet providers (e.g., MetaMask, WalletConnect).
                  Your interactions with these providers are governed by their respective privacy policies.
                </p>

                <h3 className="text-xl font-semibold text-toxic mb-3 mt-6">5.2 Blockchain Networks</h3>
                <p className="mb-4">
                  All transactions occur on the Base blockchain network. Data on the blockchain is public and permanent.
                </p>

                <h3 className="text-xl font-semibold text-toxic mb-3 mt-6">5.3 Analytics Services</h3>
                <p className="mb-4">
                  We use Plausible Analytics (privacy-focused, GDPR compliant) and Google Analytics.
                  Both services are configured to respect user privacy and do not use cookies for tracking.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Data Security</h2>
                <p>
                  Since we are a decentralized application, we do not store user data on centralized servers.
                  Your link secrets are stored locally in your browser and are your responsibility to protect.
                  We recommend using the Secret Recovery tool if you lose access to your secrets.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Your Rights and Choices</h2>
                <p className="mb-4">You have the right to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Clear your browser's local storage to delete locally stored data</li>
                  <li>Use browser extensions to block analytics tracking</li>
                  <li>Disconnect your wallet at any time</li>
                  <li>Stop using the Service</li>
                </ul>
                <p className="mt-4">
                  Note: Blockchain data is immutable and cannot be deleted.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Children's Privacy</h2>
                <p>
                  Our Service is not intended for users under the age of 18. We do not knowingly collect information from children.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. International Users</h2>
                <p>
                  Pass It On is accessible globally. By using the Service, you consent to the transfer and processing of your
                  information as described in this Privacy Policy, regardless of where you are located.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Changes to Privacy Policy</h2>
                <p>
                  We may update this Privacy Policy from time to time. The updated version will be indicated by an updated
                  "Last Updated" date. Continued use of the Service after changes constitutes acceptance of the updated policy.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Contact Us</h2>
                <p>
                  If you have questions about this Privacy Policy, please contact us through the feedback form on our website.
                </p>
              </section>

              <section className="bg-dark-card border border-gray-800 rounded-xl p-6 mt-8">
                <h3 className="text-xl font-semibold text-toxic mb-3">🔒 Privacy Summary</h3>
                <ul className="space-y-2">
                  <li>✅ No personal data collection</li>
                  <li>✅ No cookies for tracking</li>
                  <li>✅ No centralized data storage</li>
                  <li>✅ Privacy-focused analytics</li>
                  <li>✅ Local-only secret storage</li>
                  <li>⚠️ Blockchain data is public and permanent</li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
