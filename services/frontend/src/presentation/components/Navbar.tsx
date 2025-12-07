import { useNavigate } from 'react-router-dom';
import { Cloud, LogOut, Menu, X, Shield } from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '../../infrastructure/context/AuthContext';

export function Navbar() {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { label: '🌦️ Dashboard', href: '/dashboard' },
    { label: '🎮 Pokémon', href: '/pokemon' },
    { label: '⭐ Star Wars', href: '/swapi' },
    ...(user?.role === 'admin' ? [{ label: '👥 Usuários', href: '/users', icon: Shield }] : []),
  ];

  return (
    <nav className="h-16 bg-gradient-to-r from-blue-600 to-indigo-600 border-b-4 border-blue-700 shadow-lg sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 md:px-8 h-full flex items-center justify-between">
        <div 
          onClick={() => navigate('/dashboard')}
          className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition"
        >
          <div className="p-2 bg-white rounded-lg">
            <Cloud className="w-5 h-5 text-blue-600" />
          </div>
          <div className="hidden md:block">
            <p className="text-sm font-bold text-white">GDASH</p>
            <p className="text-xs text-blue-100">Monitoramento Climático</p>
          </div>
        </div>

        <div className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <button
              key={item.href}
              onClick={() => navigate(item.href)}
              className="px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 hover:bg-opacity-50 rounded-lg transition flex items-center gap-2"
            >
              {item.label}
              {item.icon && <item.icon className="w-4 h-4" />}
            </button>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-white bg-opacity-20 rounded-lg">
            <div className="w-2 h-2 bg-green-300 rounded-full"></div>
            <span className="text-sm text-white">{user?.email}</span>
          </div>
          <button
            onClick={handleLogout}
            className="p-2 text-white hover:bg-red-500 hover:bg-opacity-30 rounded-lg transition"
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden p-2 text-white hover:bg-blue-700 hover:bg-opacity-50 rounded-lg"
        >
          {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden bg-blue-700 border-t-4 border-blue-800">
          <div className="px-4 py-3 space-y-2">
            {navItems.map((item) => (
              <button
                key={item.href}
                onClick={() => {
                  navigate(item.href);
                  setIsOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 hover:bg-opacity-50 rounded-lg transition flex items-center gap-2"
              >
                {item.label}
                {item.icon && <item.icon className="w-4 h-4" />}
              </button>
            ))}
            <hr className="my-2 border-blue-600" />
            <div className="px-4 py-2 text-sm text-blue-100">
              {user?.email}
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left px-4 py-2 text-sm text-white hover:bg-red-500 hover:bg-opacity-30 rounded-lg transition flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
