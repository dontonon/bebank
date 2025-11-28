import Header from '../components/Header'
import Sidebar from '../components/Sidebar'

export default function Terms() {
  return (
    <div className="min-h-screen bg-dark text-white">
      <Header />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 p-8 ml-20">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-toxic to-purple bg-clip-text text-transparent">
              Terms of Service
            </h1>
            <p className="text-gray-400 mb-8">Last Updated: November 28, 2025</p>

            <div className="space-y-8 text-gray-300">
              <section>
                <h2 className="text-2xl font-bold text-white mb-4">1. Acceptance of Terms</h2>
                <p>
                  By accessing and using Pass It On ("the Service"), you accept and agree to be bound by the terms and provision of this agreement.
                  If you do not agree to these Terms of Service, please do not use the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">2. Description of Service</h2>
                <p>
                  Pass It On is a decentralized application (dApp) that enables users to create and claim crypto links on the Base blockchain.
                  The Service allows users to create links containing cryptocurrency that can be passed on to others, creating chains of value transfer.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">3. No Warranty</h2>
                <p className="mb-4">
                  THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT ANY WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                </p>
                <p>
                  We do not guarantee that the Service will be uninterrupted, timely, secure, or error-free.
                  Your use of the Service is at your sole risk.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">4. Financial Risks</h2>
                <p className="mb-4">
                  Using cryptocurrency and blockchain technology involves substantial risk. You acknowledge and agree that:
                </p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Cryptocurrency transactions are irreversible</li>
                  <li>The value of cryptocurrency can be volatile</li>
                  <li>You are responsible for the security of your wallet and private keys</li>
                  <li>Lost or compromised wallet credentials cannot be recovered</li>
                  <li>Smart contract vulnerabilities may exist</li>
                  <li>You may lose all funds sent through the Service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">5. User Responsibilities</h2>
                <p className="mb-4">You are responsible for:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Maintaining the confidentiality of link secrets</li>
                  <li>Ensuring you have the legal right to transfer any cryptocurrency</li>
                  <li>Complying with all applicable laws and regulations</li>
                  <li>Any tax implications of your transactions</li>
                  <li>Verifying recipient addresses and link details before sharing</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">6. Prohibited Uses</h2>
                <p className="mb-4">You may not use the Service to:</p>
                <ul className="list-disc list-inside space-y-2 ml-4">
                  <li>Engage in any illegal activity</li>
                  <li>Violate any applicable laws or regulations</li>
                  <li>Launder money or finance illegal activities</li>
                  <li>Defraud or attempt to defraud other users</li>
                  <li>Interfere with or disrupt the Service</li>
                  <li>Attempt to gain unauthorized access to the Service or smart contracts</li>
                </ul>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">7. Limitation of Liability</h2>
                <p>
                  TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL,
                  CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY,
                  OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR USE OF THE SERVICE.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">8. Smart Contract Risks</h2>
                <p>
                  The Service relies on smart contracts deployed on the Base blockchain. We are not responsible for any bugs,
                  vulnerabilities, or failures in the smart contract code. You acknowledge that smart contracts are immutable
                  and cannot be modified after deployment.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">9. No Refunds</h2>
                <p>
                  All transactions on the blockchain are final and irreversible. We cannot process refunds for any transactions
                  made through the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">10. Modifications to Service</h2>
                <p>
                  We reserve the right to modify or discontinue the Service at any time without notice.
                  We shall not be liable to you or any third party for any modification, suspension, or discontinuance of the Service.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">11. Governing Law</h2>
                <p>
                  These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which you reside,
                  without regard to its conflict of law provisions.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">12. Changes to Terms</h2>
                <p>
                  We reserve the right to update these Terms at any time. Continued use of the Service after changes
                  constitutes acceptance of the modified Terms.
                </p>
              </section>

              <section>
                <h2 className="text-2xl font-bold text-white mb-4">13. Contact</h2>
                <p>
                  If you have any questions about these Terms, please contact us through the feedback form on our website.
                </p>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
