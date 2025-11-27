import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function About() {
  return (
    <div className="min-h-screen bg-dark flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-8 pb-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold gradient-text mb-8">About Pass It On 🔗</h1>

            <div className="space-y-8">
              {/* What is Pass It On */}
              <section className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">What is Pass It On?</h2>
                <p className="text-gray-300 leading-relaxed">
                  Pass It On is a viral, on-chain gifting game built on Base. It's like a chain letter,
                  but with real cryptocurrency! Send crypto to a friend, but there's a catch - they can
                  only claim it by passing on their own link to someone else. This creates an
                  endless chain of giving that spreads across the network.
                </p>
              </section>

              {/* How It Works */}
              <section className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Create Your Link</h3>
                      <p className="text-gray-300">
                        Choose any supported token (ETH, USDC, DAI, WETH, cbETH), enter an amount,
                        and create your link in the chain. Your crypto is locked in the smart contract.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Share the Link</h3>
                      <p className="text-gray-300">
                        Get a unique shareable link. Send it to a friend via any
                        messaging app, social media, or even embed it in a QR code.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">They Must Pass It On</h3>
                      <p className="text-gray-300">
                        Your friend can't just claim it - they must create their own link
                        first and share it with someone else. This is the core mechanic that keeps
                        the chain growing!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Claim Your Reward</h3>
                      <p className="text-gray-300">
                        Once they've created and shared their link, they can claim yours. The crypto
                        is instantly transferred from the contract to their wallet.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-cyan-500 to-purple-500 flex items-center justify-center font-bold">
                      5
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">The Chain Continues</h3>
                      <p className="text-gray-300">
                        The person they shared with must now pass it on to claim, and so on, creating
                        an exponentially growing network of giving.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* The Mechanics */}
              <section className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">The Mechanics</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">🔒 Smart Contract Security</h3>
                    <p className="text-gray-300">
                      All links are secured by a smart contract deployed on Base with multiple security features:
                    </p>
                    <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1 ml-4">
                      <li>Reentrancy protection prevents double-claims</li>
                      <li>Secret URLs make links unpredictable and impossible to snipe</li>
                      <li>Each link can only be claimed once</li>
                      <li>Smart contract wallet support for Coinbase Wallet, Safe, etc.</li>
                    </ul>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">🎯 One Claim Per Link</h3>
                    <p className="text-gray-300">
                      Each link can only be claimed once. The first person to create and pass on
                      their own link gets to claim it. Once claimed, the link is marked as complete.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">💰 Any Amount, Any Token</h3>
                    <p className="text-gray-300">
                      You can create a link with any amount of supported tokens (ETH, USDC, DAI, WETH, cbETH).
                      Send $5 USDC, 0.001 ETH, or any value you choose. The recipient must pass on *a* link
                      (any amount, any token) to claim yours.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">💸 Protocol Fee</h3>
                    <p className="text-gray-300">
                      A 1% protocol fee is deducted from each claim. Recipients receive 99%
                      of the value, and 1% goes to the treasury to support development and operations.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">📈 Viral Growth</h3>
                    <p className="text-gray-300">
                      The requirement to pass it on creates exponential growth. One link becomes
                      two, two becomes four, four becomes eight, and so on. This is how generosity
                      spreads across the network.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">⛓️ Built on Base</h3>
                    <p className="text-gray-300">
                      Pass It On is built on Base, Coinbase's L2 network. This means fast transactions,
                      low fees, and seamless integration with Coinbase Wallet and other popular wallets.
                    </p>
                  </div>
                </div>
              </section>

              {/* Why Play */}
              <section className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Why Join the Chain?</h2>
                <div className="space-y-3">
                  <div className="flex gap-3">
                    <div className="text-2xl">🎁</div>
                    <div>
                      <p className="text-gray-300">
                        <strong className="text-white">Mystery & Surprise</strong> - You never know how much
                        you'll receive until you've already committed to passing it on. The anticipation is part of the fun!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-2xl">🤝</div>
                    <div>
                      <p className="text-gray-300">
                        <strong className="text-white">Pay It Forward</strong> - It's generosity with
                        a twist. You're not just receiving - you're actively participating in a growing
                        network of giving.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-2xl">⚡</div>
                    <div>
                      <p className="text-gray-300">
                        <strong className="text-white">Instant & Trustless</strong> - No intermediaries,
                        no waiting. Smart contracts ensure everything happens exactly as promised.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-2xl">🌐</div>
                    <div>
                      <p className="text-gray-300">
                        <strong className="text-white">Truly Social</strong> - Share links with friends,
                        family, or complete strangers. Watch the chain grow across the network.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-3">
                    <div className="text-2xl">💎</div>
                    <div>
                      <p className="text-gray-300">
                        <strong className="text-white">Real Value</strong> - This isn't points or fake tokens.
                        It's actual cryptocurrency that you can use, save, or pass on again.
                      </p>
                    </div>
                  </div>
                </div>
              </section>

              {/* FAQ */}
              <section className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">FAQ</h2>
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Can I claim my own link?</h3>
                    <p className="text-gray-300">
                      No! You can't claim a link you created. You need to share it with someone else.
                      This prevents self-dealing and keeps the chain growing.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">What if no one claims my link?</h3>
                    <p className="text-gray-300">
                      Your crypto remains locked in the smart contract until someone claims it. There's no time limit.
                      You can always share the link with someone new or create a different one.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Is this safe?</h3>
                    <p className="text-gray-300">
                      Yes! The smart contract has been tested and includes security features like reentrancy protection.
                      Your funds are only released when the conditions are met (someone passes on a link and claims yours).
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">Can someone steal my link?</h3>
                    <p className="text-gray-300">
                      The secret URL prevents anyone from finding your link by scanning the blockchain. Only people
                      you share the link with can claim it.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">What tokens are supported?</h3>
                    <p className="text-gray-300">
                      Currently: ETH (native), USDC, DAI, WETH, and cbETH on Base network.
                    </p>
                  </div>
                </div>
              </section>

              {/* Call to Action */}
              <section className="glass-card p-8 text-center bg-gradient-to-r from-toxic/20 to-purple/20 border-toxic/30">
                <h2 className="text-3xl font-bold text-white mb-4">Ready to Start the Chain?</h2>
                <p className="text-gray-300 mb-6">
                  Create your first link and become part of the growing network.
                </p>
                <Link
                  to="/"
                  className="inline-block bg-gradient-to-r from-toxic to-purple text-dark px-8 py-4 rounded-xl font-bold text-lg hover:shadow-lg hover:shadow-toxic/30 transition-all"
                >
                  Pass It On ✨
                </Link>
              </section>
            </div>
          </div>
      </main>

      {/* Bottom Bar */}
      <Sidebar isBottomBar={true} />
    </div>
  );
}

export default About;
