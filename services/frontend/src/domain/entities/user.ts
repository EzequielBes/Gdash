export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole | string;
  isActive?: boolean;
  createdAt?: string;
}
