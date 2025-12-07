import { apiClient } from './client';
import { UserRole } from '../../domain/types'; // Import UserRole

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isActive: boolean;
  createdAt: string;
}

export const getUsers = async (): Promise<User[]> => {
  const { data } = await apiClient.get<User[]>('/users');
  return data;
};

export const getUser = async (id: string): Promise<User> => {
  const { data } = await apiClient.get<User>(`/users/${id}`);
  return data;
};

export const createUser = async (
  userData: Omit<User, 'id' | 'role' | 'isActive' | 'createdAt'> & { password: string }
): Promise<User> => {
  const { data } = await apiClient.post<User>('/users', userData);
  return data;
};

export const updateUser = async ({
  id,
  userData,
}: {
  id: string;
  userData: Partial<Omit<User, 'id' | 'role' | 'isActive' | 'createdAt'>>;
}): Promise<User> => {
  const { data } = await apiClient.patch<User>(`/users/${id}`, userData);
  return data;
};

export const deleteUser = async (id: string): Promise<void> => {
  await apiClient.delete(`/users/${id}`);
};
