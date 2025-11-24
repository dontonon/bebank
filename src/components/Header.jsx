import { Link, useLocation } from 'react-router-dom'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { memo } from 'react'

function Header() {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <header className="border-b border-gray-800 bg-dark-card">
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex justify-between items-center mb-4">
          <Link to="/" className="text-3xl font-bold gradient-text hover:opacity-80 transition-opacity cursor-pointer">
            HOT POTATO 🥔
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
                ? 'text-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            Create
          </Link>
          <Link
            to="/dashboard"
            className={`text-sm font-medium transition-colors ${
              isActive('/dashboard')
                ? 'text-orange-500'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            My Potatoes
          </Link>
          <Link
            to="/about"
            className={`text-sm font-medium transition-colors ${
              isActive('/about')
                ? 'text-orange-500'
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
