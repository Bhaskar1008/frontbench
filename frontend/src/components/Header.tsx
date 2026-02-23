import { Link } from 'react-router-dom'
import { TrendingUp } from 'lucide-react'

export default function Header() {
  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="flex items-center space-x-3 group">
            <div className="bg-gradient-to-br from-blue-500 to-purple-600 p-2 rounded-lg group-hover:scale-110 transition-transform">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Frontbench
            </span>
          </Link>
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className="text-white/80 hover:text-white transition-colors font-medium"
            >
              Home
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
