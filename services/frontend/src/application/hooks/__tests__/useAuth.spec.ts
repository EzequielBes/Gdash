import { renderHook, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from '../useAuth.tsx';
import { authAPI } from '../../infrastructure/api/auth';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter as Router } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import { UserRole } from '../../../backend/src/domain/entities/user.entity';


const localStorageMock = (function () {
  let store: { [key: string]: string } = {};
  return {
    getItem: jest.fn((key: string) => store[key] || null),
    setItem: jest.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: jest.fn((key: string) => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
  };
})();
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

jest.mock('../../infrastructure/api/auth', () => ({
  authAPI: {
    login: jest.fn(),
    logout: jest.fn(),
    getCurrentUser: jest.fn(),
  },
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function ({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <Router>
          <AuthProvider>{children}</AuthProvider>
        </Router>
      </QueryClientProvider>
    );
  };
};

describe('useAuth', () => {
  const mockUser = { id: '1', email: 'test@example.com', name: 'Test', role: UserRole.USER };
  const mockToken = 'mock-jwt-token';

  beforeEach(() => {
    localStorageMock.clear();
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    localStorageMock.removeItem.mockClear();
    (authAPI.login as jest.Mock).mockClear();
    (authAPI.logout as jest.Mock).mockClear();
    (authAPI.getCurrentUser as jest.Mock).mockClear();
  });

  it('should return initial loading state and then resolve isAuthenticated to false if no token', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    expect(result.current.isAuthenticated).toBe(false);

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should initialize with token and user from localStorage if available', async () => {
    localStorageMock.setItem('access_token', mockToken);
    localStorageMock.setItem('user', JSON.stringify(mockUser));
    (authAPI.getCurrentUser as jest.Mock).mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);
    expect(authAPI.getCurrentUser).not.toHaveBeenCalled(); // Should use stored user
  });

  it('should fetch user data if token exists but user data is missing', async () => {
    localStorageMock.setItem('access_token', mockToken);
    (authAPI.getCurrentUser as jest.Mock).mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    expect(result.current.isLoading).toBe(true);
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.isAuthenticated).toBe(true);
    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);
    expect(authAPI.getCurrentUser).toHaveBeenCalled();
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  it('should handle login successfully', async () => {
    (authAPI.login as jest.Mock).mockResolvedValue({
      data: { access_token: mockToken, user: mockUser },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      const loginResult = await result.current.login({ email: 'a@a.com', password: 'password' });
      expect(loginResult.success).toBe(true);
    });

    expect(result.current.token).toBe(mockToken);
    expect(result.current.user).toEqual(mockUser);
    expect(result.current.isAuthenticated).toBe(true);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('access_token', mockToken);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('user', JSON.stringify(mockUser));
  });

  it('should handle login failure', async () => {
    const errorMessage = 'Invalid credentials';
    (authAPI.login as jest.Mock).mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await act(async () => {
      const loginResult = await result.current.login({ email: 'a@a.com', password: 'password' });
      expect(loginResult.success).toBe(false);
      expect(loginResult.error).toBe(errorMessage);
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.error).toBe(errorMessage);
  });

  it('should handle logout successfully', async () => {
    localStorageMock.setItem('access_token', mockToken);
    localStorageMock.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isAuthenticated).toBe(true));

    await act(async () => {
      result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.user).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('access_token');
    expect(localStorageMock.removeItem).toHaveBeenCalledWith('user');
    expect(authAPI.logout).toHaveBeenCalled();
  });
});
