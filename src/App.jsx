import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

import { config } from './config/wagmi'
import Home from './pages/Home'
import Claim from './pages/Claim'
import PotatoLink from './pages/PotatoLink'

const queryClient = new QueryClient()

function App() {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={darkTheme({
            accentColor: '#00FF88',
            accentColorForeground: '#0A0E27',
            borderRadius: 'large',
          })}
        >
          <Router>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/claim/:giftId" element={<Claim />} />
              <Route path="/potato/:giftId" element={<PotatoLink />} />
              {/* Legacy route for backwards compatibility */}
              <Route path="/gift/:giftId" element={<PotatoLink />} />
            </Routes>
          </Router>
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  )
}

export default App
