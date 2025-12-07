export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export class User {
  id: string;
  email: string;
  name: string;
  password?: string;
  role: UserRole;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date;
}
