import { render, screen } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SignUpPage from '../SignUpPage'
import { useAuth } from '@/application/hooks/useAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router } from 'react-router-dom'

vi.mock('@/application/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

vi.mock('@/infrastructure/api/auth', () => ({
  authAPI: {
    register: vi.fn(),
  },
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const renderSignUpPage = () => {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
  })

  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  })

  return render(
    <QueryClientProvider client={queryClient}>
      <Router>
        <SignUpPage />
      </Router>
    </QueryClientProvider>
  )
}

describe('SignUpPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should render sign up form', () => {
    renderSignUpPage()
    expect(screen.getByText(/Create Account/i)).toBeTruthy()
    expect(screen.getByLabelText(/Full Name/i)).toBeTruthy()
    expect(screen.getByLabelText(/email/i)).toBeTruthy()
    expect(screen.getByLabelText(/password/i)).toBeTruthy()
  })

  it('should have sign in link', () => {
    renderSignUpPage()
    const signInLink = screen.getByRole('link', { name: /sign in/i })
    expect(signInLink).toBeTruthy()
  })

  it('should display password requirements', () => {
    renderSignUpPage()
    expect(screen.getByText(/Password Requirements/i)).toBeTruthy()
  })
})
