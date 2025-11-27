import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { memo } from 'react'

function Header() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-800/50 glass backdrop-blur-xl">
      <div className="w-full px-6 py-6">
        <div className="flex justify-between items-center mb-4">
          <Link to="/" className="text-3xl font-bold gradient-text hover:opacity-80 transition-opacity cursor-pointer">
            PASS IT ON 🔗
          </Link>
          <div>
            <ConnectButton />
          </div>
        </div>

        {/* Navigation Menu */}
        <nav className="flex gap-6">
          <Link
            to="/"
            className={`text-sm font-medium transition-colors ${
              isActive('/')
                ? 'text-cyan-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create
          </Link>
          <Link
            to="/stats"
            className={`text-sm font-medium transition-colors ${
              isActive('/stats')
                ? 'text-cyan-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            The Chain
          </Link>
          <Link
            to="/explorer"
            className={`text-sm font-medium transition-colors ${
              isActive('/explorer')
                ? 'text-cyan-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Explorer
          </Link>
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'text-cyan-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Links
          </Link>
          <Link
            to="/about"
            className={`text-sm font-medium transition-colors ${
              isActive('/about')
                ? 'text-cyan-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            About
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default memo(Header);
