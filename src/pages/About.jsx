import { Link } from 'react-router-dom';
import Header from '../components/Header';
import Sidebar from '../components/Sidebar';

function About() {
  return (
    <div className="min-h-screen bg-dark">
      <Header />

      <div className="flex">
        <main className="flex-1 px-4 py-8 pb-20">
          <div className="max-w-3xl mx-auto">
            <h1 className="text-4xl font-bold gradient-text mb-8">About Hot Potato 🥔</h1>

            <div className="space-y-8">
              {/* What is Hot Potato */}
              <section className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">What is Hot Potato?</h2>
                <p className="text-gray-300 leading-relaxed">
                  Hot Potato is a viral, on-chain gifting game built on Base. It's like a chain letter,
                  but with real cryptocurrency! Send crypto to a friend, but there's a catch - they can
                  only claim it by passing on a potato of their own to someone else. This creates an
                  endless chain of giving that spreads across the network.
                </p>
              </section>

              {/* How It Works */}
              <section className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">How It Works</h2>
                <div className="space-y-4">
                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center font-bold">
                      1
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Create a Hot Potato</h3>
                      <p className="text-gray-300">
                        Choose any supported token (ETH, USDC, DAI, WETH, cbETH), enter an amount,
                        and create your potato. Your crypto is locked in the smart contract.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center font-bold">
                      2
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Share the Link</h3>
                      <p className="text-gray-300">
                        Get a unique shareable link to your potato. Send it to a friend via any
                        messaging app, social media, or even embed it in a QR code.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center font-bold">
                      3
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">They Must Pass It On</h3>
                      <p className="text-gray-300">
                        Your friend can't just claim the potato - they must create their own potato
                        first and share it with someone else. This is the core mechanic that keeps
                        the chain going!
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center font-bold">
                      4
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">Claim Your Reward</h3>
                      <p className="text-gray-300">
                        Once they've created and shared their potato, they can claim yours. The crypto
                        is instantly transferred from the contract to their wallet.
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-pink-500 flex items-center justify-center font-bold">
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
                      All potatoes are secured by a smart contract deployed on Base. Your crypto is
                      locked until someone claims it by passing on their own potato. No one can access
                      it without fulfilling the requirement.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">🎯 One Claim Per Potato</h3>
                    <p className="text-gray-300">
                      Each potato can only be claimed once. The first person to create and pass on
                      their own potato gets to claim it. Once claimed, the potato is marked as complete.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">💰 Any Amount, Any Token</h3>
                    <p className="text-gray-300">
                      You can create a potato with any amount of supported tokens. Send $5 USDC,
                      0.001 ETH, or any value you choose. The recipient must pass on *a* potato
                      (any amount, any token) to claim yours.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">📈 Viral Growth</h3>
                    <p className="text-gray-300">
                      The requirement to pass it on creates exponential growth. One potato becomes
                      two, two becomes four, four becomes eight, and so on. This is how generosity
                      spreads across the network.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-white mb-2">⛓️ Built on Base</h3>
                    <p className="text-gray-300">
                      Hot Potato runs on Base, an Ethereum Layer 2 network. This means fast transactions
                      and low fees, making it practical to send potatoes of any size.
                    </p>
                  </div>
                </div>
              </section>

              {/* Why Hot Potato */}
              <section className="glass-card p-6">
                <h2 className="text-2xl font-bold text-white mb-4">Why Hot Potato?</h2>
                <p className="text-gray-300 leading-relaxed mb-4">
                  Hot Potato transforms crypto gifting into a social game. Instead of just sending
                  money, you're inviting someone to participate in a growing network of generosity.
                  It's perfect for:
                </p>
                <ul className="list-disc list-inside space-y-2 text-gray-300">
                  <li>Introducing friends to crypto in a fun, engaging way</li>
                  <li>Creating viral marketing campaigns with built-in incentives</li>
                  <li>Community building and reward distribution</li>
                  <li>Making gifting more interactive and memorable</li>
                  <li>Spreading the word about Base and Layer 2 solutions</li>
                </ul>
              </section>

              {/* Get Started */}
              <section className="glass-card p-6 bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20">
                <h2 className="text-2xl font-bold text-white mb-4">Ready to Play?</h2>
                <p className="text-gray-300 mb-6">
                  Create your first Hot Potato and start the chain! Connect your wallet and pick
                  any token to get started.
                </p>
                <Link
                  to="/"
                  className="inline-block px-6 py-3 bg-gradient-to-r from-orange-500 to-pink-500 text-white font-bold rounded-lg hover:opacity-90 transition-opacity"
                >
                  Create a Hot Potato 🥔
                </Link>
              </section>
            </div>
          </div>
        </main>

        <Sidebar />
      </div>
    </div>
  );
}

export default About;
