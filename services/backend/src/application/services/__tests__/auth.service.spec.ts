import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../auth.service';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { JwtService } from '@nestjs/jwt';
import { CreateUserUseCase } from '../../use-cases/create-user.use-case';
import * as bcrypt from 'bcrypt';
import { User, UserRole } from '../../../domain/entities/user.entity';
import { UnauthorizedException, ConflictException } from '@nestjs/common';

const mockUserRepository = {
  findByEmail: jest.fn(),
  findById: jest.fn(),
};

const mockJwtService = {
  signAsync: jest.fn(),
};

const mockCreateUserUseCase = {
  execute: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let userRepository: UserRepository;
  let jwtService: JwtService;
  let createUserUseCase: CreateUserUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepository },
        { provide: JwtService, useValue: mockJwtService },
        { provide: CreateUserUseCase, useValue: mockCreateUserUseCase },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    jwtService = module.get<JwtService>(JwtService);
    createUserUseCase = module.get<CreateUserUseCase>(CreateUserUseCase);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('login', () => {
    const credentials = { email: 'test@example.com', password: 'password' };
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      isActive: true,
      role: UserRole.USER,
    };

    beforeEach(() => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(mockUser);
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(true);
      jest.spyOn(jwtService, 'signAsync').mockResolvedValue('jwt_token');
    });

    it('should return an accessToken and user on successful login', async () => {
      const result = await service.login(credentials);
      expect(result.accessToken).toBe('jwt_token');
      expect(result.user).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(credentials.email);
      expect(bcrypt.compare).toHaveBeenCalledWith(credentials.password, mockUser.password);
      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: mockUser.id, email: mockUser.email });
    });

    it('should throw UnauthorizedException for invalid credentials', async () => {
      jest.spyOn(bcrypt, 'compare').mockResolvedValue(false);
      await expect(service.login(credentials)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      await expect(service.login(credentials)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue({ ...mockUser, isActive: false });
      await expect(service.login(credentials)).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('register', () => {
    const registerDto = { email: 'new@example.com', password: 'newPassword', name: 'New User' };
    const registeredUser: Omit<User, 'password'> = {
      id: '2',
      email: 'new@example.com',
      name: 'New User',
      isActive: true,
      role: UserRole.USER,
    };

    beforeEach(() => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue(null);
      jest.spyOn(createUserUseCase, 'execute').mockResolvedValue(registeredUser);
    });

    it('should register a new user', async () => {
      const result = await service.register(registerDto);
      expect(result).toEqual({
        id: registeredUser.id,
        email: registeredUser.email,
        name: registeredUser.name,
        role: registeredUser.role,
      });
      expect(userRepository.findByEmail).toHaveBeenCalledWith(registerDto.email);
      expect(createUserUseCase.execute).toHaveBeenCalledWith(registerDto);
    });

    it('should throw ConflictException if user already exists', async () => {
      jest.spyOn(userRepository, 'findByEmail').mockResolvedValue({ ...registeredUser, password: 'abc' });
      await expect(service.register(registerDto)).rejects.toThrow(ConflictException);
    });
  });

  describe('validateUser', () => {
    const payload = { sub: '1', email: 'test@example.com' };
    const mockUser: User = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test User',
      isActive: true,
      role: UserRole.USER,
    };

    beforeEach(() => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(mockUser);
    });

    it('should return a partial user if valid', async () => {
      const result = await service.validateUser(payload);
      expect(result).toEqual({
        id: mockUser.id,
        email: mockUser.email,
        name: mockUser.name,
        role: mockUser.role,
        isActive: mockUser.isActive,
      });
      expect(userRepository.findById).toHaveBeenCalledWith(payload.sub);
    });

    it('should throw UnauthorizedException if user not found', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue(null);
      await expect(service.validateUser(payload)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if user is inactive', async () => {
      jest.spyOn(userRepository, 'findById').mockResolvedValue({ ...mockUser, isActive: false });
      await expect(service.validateUser(payload)).rejects.toThrow(UnauthorizedException);
    });
  });
});
