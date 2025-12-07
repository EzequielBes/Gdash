import { Test, TestingModule } from '@nestjs/testing';
import { UsersService } from '../users.service';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { CreateUserUseCase } from '../use-cases/create-user.use-case';
import { ListUsersUseCase } from '../use-cases/list-users.use-case';
import { FindUserByIdUseCase } from '../use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../use-cases/delete-user.use-case';
import { User, UserRole } from '../../../domain/entities/user.entity';
import { NotFoundException } from '@nestjs/common';

const mockUserRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockCreateUserUseCase = {
  execute: jest.fn(),
};
const mockListUsersUseCase = {
  execute: jest.fn(),
};
const mockFindUserByIdUseCase = {
  execute: jest.fn(),
};
const mockUpdateUserUseCase = {
  execute: jest.fn(),
};
const mockDeleteUserUseCase = {
  execute: jest.fn(),
};

describe('UsersService', () => {
  let service: UsersService;
  let userRepository: UserRepository;
  let createUserUseCase: CreateUserUseCase;
  let listUsersUseCase: ListUsersUseCase;
  let findUserByIdUseCase: FindUserByIdUseCase;
  let updateUserUseCase: UpdateUserUseCase;
  let deleteUserUseCase: DeleteUserUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: CreateUserUseCase, useValue: mockCreateUserUseCase },
        { provide: ListUsersUseCase, useValue: mockListUsersUseCase },
        { provide: FindUserByIdUseCase, useValue: mockFindUserByIdUseCase },
        { provide: UpdateUserUseCase, useValue: mockUpdateUserUseCase },
        { provide: DeleteUserUseCase, useValue: mockDeleteUserUseCase },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<UserRepository>(UserRepository);
    createUserUseCase = module.get<CreateUserUseCase>(CreateUserUseCase);
    listUsersUseCase = module.get<ListUsersUseCase>(ListUsersUseCase);
    findUserByIdUseCase = module.get<FindUserByIdUseCase>(FindUserByIdUseCase);
    updateUserUseCase = module.get<UpdateUserUseCase>(UpdateUserUseCase);
    deleteUserUseCase = module.get<DeleteUserUseCase>(DeleteUserUseCase);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockUserResult: Omit<User, 'password'> = {
    id: '1',
    email: 'test@example.com',
    name: 'Test User',
    isActive: true,
    role: UserRole.USER,
  };

  describe('create', () => {
    it('should create a user', async () => {
      jest.spyOn(createUserUseCase, 'execute').mockResolvedValue(mockUserResult);
      const result = await service.create({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      });
      expect(result).toEqual(mockUserResult);
      expect(createUserUseCase.execute).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password',
        name: 'Test User',
      });
    });
  });

  describe('findAll', () => {
    it('should return an array of users', async () => {
      jest.spyOn(listUsersUseCase, 'execute').mockResolvedValue([mockUserResult]);
      const result = await service.findAll();
      expect(result).toEqual([mockUserResult]);
      expect(listUsersUseCase.execute).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    it('should find a user by id', async () => {
      jest.spyOn(findUserByIdUseCase, 'execute').mockResolvedValue(mockUserResult);
      const result = await service.findById('1');
      expect(result).toEqual(mockUserResult);
      expect(findUserByIdUseCase.execute).toHaveBeenCalledWith('1');
    });

    it('should return null if user not found', async () => {
      jest.spyOn(findUserByIdUseCase, 'execute').mockResolvedValue(null);
      const result = await service.findById('99');
      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    const mockUserWithPassword: User = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      isActive: true,
      role: UserRole.USER,
    };

    it('should find a user by email', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUserWithPassword);
      const result = await service.findByEmail('test@example.com');
      expect(result).toEqual(mockUserResult);
      expect(userRepository.findByEmail).toHaveBeenCalledWith('test@example.com');
    });

    it('should throw NotFoundException if user not found', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      await expect(service.findByEmail('notfound@example.com')).rejects.toThrow(NotFoundException);
    });
  });

  describe('update', () => {
    it('should update a user', async () => {
      const updatedUserResult = { ...mockUserResult, name: 'Updated User' };
      jest.spyOn(updateUserUseCase, 'execute').mockResolvedValue(updatedUserResult);
      const result = await service.update('1', { name: 'Updated User' });
      expect(result).toEqual(updatedUserResult);
      expect(updateUserUseCase.execute).toHaveBeenCalledWith('1', { name: 'Updated User' });
    });
  });

  describe('delete', () => {
    it('should delete a user', async () => {
      jest.spyOn(deleteUserUseCase, 'execute').mockResolvedValue(undefined);
      await service.delete('1');
      expect(deleteUserUseCase.execute).toHaveBeenCalledWith('1');
    });
  });
});
