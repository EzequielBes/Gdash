import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from './presentation/pages/LoginPage';
import { SwapiPage } from './presentation/pages/SwapiPage';
import UsersManagementPage from './presentation/pages/UsersManagementPage';
import SignUpPage from './presentation/pages/SignUpPage';
import { Navbar } from './presentation/components/Navbar';
import { useAuth } from './infrastructure/context/AuthContext';
import { PokemonPageFixed } from './presentation/pages/PokemonPageFixed';
import { DashboardPageFixed } from './presentation/pages/DashboardPageFixed';
import { Toaster } from 'sonner';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-gray-700 text-lg font-medium">Carregando...</div>
      </div>
    );
  }
  
  return isAuthenticated ? (
    <>{children}</>
  ) : (
    <Navigate to="/login" replace />
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignUpPage />} />
      
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Navbar />
            <DashboardPageFixed />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/pokemon"
        element={
          <ProtectedRoute>
            <Navbar />
            <PokemonPageFixed/>
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/swapi"
        element={
          <ProtectedRoute>
            <Navbar />
            <SwapiPage />
          </ProtectedRoute>
        }
      />
      
      <Route
        path="/users"
        element={
          <ProtectedRoute>
            <Navbar />
            <UsersManagementPage />
          </ProtectedRoute>
        }
      />
      
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <BrowserRouter>
      <AppRoutes />
      <Toaster />
    </BrowserRouter>
  );
}

