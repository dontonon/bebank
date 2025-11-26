import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit'
import '@rainbow-me/rainbowkit/styles.css'

import { config } from './config/wagmi'
import Home from './pages/Home'
import Claim from './pages/Claim'
import PotatoLink from './pages/PotatoLink'
import About from './pages/About'
import Admin from './pages/Admin'
import Dashboard from './pages/Dashboard'
import Stats from './pages/Stats'
import ErrorBoundary from './components/ErrorBoundary'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
})

function App() {
  return (
    <ErrorBoundary>
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
                <Route path="/stats" element={<Stats />} />
                <Route path="/about" element={<About />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin" element={<Admin />} />
                {/* V2 routes with secrets */}
                <Route path="/claim/:giftId/:secret" element={<Claim />} />
                <Route path="/potato/:giftId/:secret" element={<PotatoLink />} />
                <Route path="/gift/:giftId/:secret" element={<PotatoLink />} />
                {/* Legacy routes without secrets (backwards compatibility for old links) */}
                <Route path="/claim/:giftId" element={<Claim />} />
                <Route path="/potato/:giftId" element={<PotatoLink />} />
                <Route path="/gift/:giftId" element={<PotatoLink />} />
              </Routes>
            </Router>
          </RainbowKitProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </ErrorBoundary>
  )
}

export default App
