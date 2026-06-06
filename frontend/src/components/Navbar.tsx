import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { logout } from '../api/auth'

export default function Navbar() {
  const { user, setUser } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    setUser(null)
    navigate('/login')
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
      <Link to="/" className="text-lg font-semibold text-indigo-600 tracking-tight">
        ExcelCalcFlow
      </Link>
      {user && (
        <div className="flex items-center gap-5">
          <Link to="/upload" className="text-sm text-gray-600 hover:text-indigo-600 transition-colors">
            Upload
          </Link>
          <span className="text-sm text-gray-400">{user.email}</span>
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-600 transition-colors"
          >
            Logout
          </button>
        </div>
      )}
    </nav>
  )
}
