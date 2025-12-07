import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { User, UserRole } from '../../domain/entities/user.entity';
import { CreateUserUseCase } from '../use-cases/create-user.use-case';
import { ListUsersUseCase } from '../use-cases/list-users.use-case';
import { FindUserByIdUseCase } from '../use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../use-cases/delete-user.use-case';
import { CreateUserDto } from 'src/presentation/dtos/create-user.dto';

@Injectable()
export class UsersService {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
    private readonly createUserUseCase: CreateUserUseCase,
    private readonly listUsersUseCase: ListUsersUseCase,
    private readonly findUserByIdUseCase: FindUserByIdUseCase,
    private readonly updateUserUseCase: UpdateUserUseCase,
    private readonly deleteUserUseCase: DeleteUserUseCase,
  ) {}

  async create(user: Omit<User, 'id'>): Promise<User> {
    const createUserDto: CreateUserDto = {
      email: user.email,
      name: user.name,
      password: user.password,
      role: user.role,
    };
    return this.createUserUseCase.execute(createUserDto);
  }

  async findAll(): Promise<Omit<User, 'password'>[]> {
    return this.listUsersUseCase.execute();
  }

  async findById(id: string): Promise<Omit<User, 'password'> | null> {
    return this.findUserByIdUseCase.execute(id);
  }

  async findByEmail(email: string): Promise<Omit<User, 'password'> | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    const { password, ...result } = user;
    return result;
  }

  async findByEmailForAuth(email: string): Promise<User | null> {
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundException('User not found.');
    }
    return user;
  }

  async update(id: string, data: Partial<Omit<User, 'id'>>): Promise<Omit<User, 'password'> | null> {
    return this.updateUserUseCase.execute(id, data);
  }

  async delete(id: string): Promise<void> {
    return this.deleteUserUseCase.execute(id);
  }

  async createUser(user: any): Promise<User> {
    return this.create(user);
  }

  async createDefaultUser(): Promise<void> {
    const defaultEmail = process.env.DEFAULT_USER_EMAIL || 'admin@gdash.local';
    const existingUser = await this.userRepository.findByEmail(defaultEmail);

    if (!existingUser) {
      const user: CreateUserDto = {
        email: defaultEmail,
        name: 'Admin',
        password: process.env.DEFAULT_USER_PASSWORD || 'admin123',
        role: UserRole.ADMIN,
      };
      await this.createUserUseCase.execute(user);
    }
  }
}
