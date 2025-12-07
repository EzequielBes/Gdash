import { renderHook, waitFor } from '@testing-library/react';
import { useUsers } from '../useUsers';
import { getUsers, createUser, updateUser, deleteUser } from '../../infrastructure/api/users';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserRole } from '../../../backend/src/domain/entities/user.entity';

jest.mock('../../infrastructure/api/users', () => ({
  getUsers: jest.fn(),
  createUser: jest.fn(),
  updateUser: jest.fn(),
  deleteUser: jest.fn(),
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
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useUsers', () => {
  const mockUser = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    createdAt: '2023-01-01T00:00:00Z',
    role: UserRole.USER,
    isActive: true,
  };

  beforeEach(() => {
    (getUsers as jest.Mock).mockClear();
    (createUser as jest.Mock).mockClear();
    (updateUser as jest.Mock).mockClear();
    (deleteUser as jest.Mock).mockClear();
  });

  it('should fetch users', async () => {
    (getUsers as jest.Mock).mockResolvedValue([mockUser]);

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.users).toEqual([mockUser]);
    expect(getUsers).toHaveBeenCalledTimes(1);
  });

  it('should create a user', async () => {
    const newUser = { email: 'new@example.com', password: 'password', name: 'New User' };
    const createdUser = { ...mockUser, id: '2', email: newUser.email, name: newUser.name };
    (createUser as jest.Mock).mockResolvedValue(createdUser);
    (getUsers as jest.Mock).mockResolvedValue([mockUser, createdUser]); // Simulate refetch

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    result.current.createUser(newUser);

    await waitFor(() => expect(result.current.users).toEqual([mockUser, createdUser]));

    expect(createUser).toHaveBeenCalledWith(newUser);
  });

  it('should update a user', async () => {
    const updatedName = 'Updated User Name';
    const updatedUser = { ...mockUser, name: updatedName };
    (updateUser as jest.Mock).mockResolvedValue(updatedUser);
    (getUsers as jest.Mock).mockResolvedValue([updatedUser]); // Simulate refetch

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    result.current.updateUser(mockUser.id, { name: updatedName });

    await waitFor(() => expect(result.current.users).toEqual([updatedUser]));

    expect(updateUser).toHaveBeenCalledWith(mockUser.id, { name: updatedName });
  });

  it('should delete a user', async () => {
    (deleteUser as jest.Mock).mockResolvedValue(undefined);
    (getUsers as jest.Mock).mockResolvedValue([]); // Simulate refetch

    const { result } = renderHook(() => useUsers(), { wrapper: createWrapper() });

    result.current.deleteUser(mockUser.id);

    await waitFor(() => expect(result.current.users).toEqual([]));

    expect(deleteUser).toHaveBeenCalledWith(mockUser.id);
  });
});
