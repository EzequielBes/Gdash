import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import LoginPage from '../LoginPage'
import { useAuth } from '@/application/hooks/useAuth'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { BrowserRouter as Router } from 'react-router-dom'

vi.mock('@/application/hooks/useAuth', () => ({
  useAuth: vi.fn(),
}))

const mockNavigate = vi.fn()
vi.mock('react-router-dom', () => ({
  ...vi.importActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}))

const renderLoginPage = (authProps: Partial<ReturnType<typeof useAuth>>) => {
  (useAuth as ReturnType<typeof vi.fn>).mockReturnValue({
    user: null,
    token: null,
    isLoading: false,
    error: null,
    login: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: false,
    ...authProps,
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
        <LoginPage />
      </Router>
    </QueryClientProvider>
  )
}

describe('LoginPage', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  it('should render login form', () => {
    renderLoginPage({})
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /login/i })).toBeInTheDocument()
  })

  it('should display validation errors for empty fields', async () => {
    renderLoginPage({})
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(screen.getByText(/invalid email address/i)).toBeInTheDocument()
      expect(screen.getByText(/password is required/i)).toBeInTheDocument()
    })
  })

  it('should call login on submit with valid credentials', async () => {
    const mockLogin = vi.fn().mockResolvedValue({ success: true })
    renderLoginPage({ login: mockLogin })

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@gdash.local' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({ email: 'admin@gdash.local', password: 'admin123' })
    })
    expect(mockNavigate).toHaveBeenCalledWith('/dashboard')
  })

  it('should display error message on login failure', async () => {
    const errorMessage = 'Login failed'
    const mockLogin = vi.fn().mockResolvedValue({ success: false, error: errorMessage })
    renderLoginPage({ login: mockLogin })

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'wrong@test.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'wrongpass' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalled()
    })
    expect(screen.getByText(errorMessage)).toBeInTheDocument()
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('should show loading state during login', async () => {
    const mockLogin = vi.fn().mockReturnValue(new Promise(() => {})) // Never resolves
    renderLoginPage({ login: mockLogin, isLoading: true })

    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'admin@gdash.local' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'admin123' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))

    expect(screen.getByRole('button', { name: /logging in\.\.\./i })).toBeDisabled()
  })
})
