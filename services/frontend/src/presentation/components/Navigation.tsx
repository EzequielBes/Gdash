import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/infrastructure/context/AuthContext'
import { Button } from '@/presentation/components/ui/button'

export default function Navigation() {
  const navigate = useNavigate()
  const location = useLocation()
  const { logout } = useAuth()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const isActive = (path: string) => {
    return location.pathname === path
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 hover:bg-gray-100'
  }

  return (
    <nav className="bg-white shadow">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-2xl font-bold text-blue-600 cursor-pointer" onClick={() => navigate('/dashboard')}>
              GDASH
            </h1>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/dashboard')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/dashboard')}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => navigate('/users')}
              className={`px-3 py-2 rounded-md text-sm font-medium transition ${isActive('/users')}`}
            >
              Users
            </button>

            <Button
              onClick={handleLogout}
              variant="destructive"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Logout
            </Button>
          </div>
        </div>
      </div>
    </nav>
  )
}
