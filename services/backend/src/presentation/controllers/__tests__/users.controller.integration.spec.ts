import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { UsersModule } from '../../modules/users.module';
import { UserRepository } from '../../../domain/repositories/user.repository';
import { User, UserRole } from '../../../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { JwtAuthGuard } from 'src/infrastructure/auth/jwt.guard';
import { RolesGuard } from 'src/infrastructure/auth/roles.guard';
import { SetupService } from 'src/application/services/setup.service';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument } from 'src/infrastructure/database/schemas/user.schema';

const mockUserRepository = {
  create: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
  findByEmail: jest.fn(),
};

const mockSetupService = {
  onModuleInit: jest.fn(),
};

jest.mock('bcrypt', () => ({
  hash: jest.fn((password) => `${password}Hashed`),
  compare: jest.fn(() => true),
}));

describe('UsersController (e2e)', () => {
  let app: INestApplication;
  let userModel: Model<UserDocument>; // To interact with the actual test DB
  let userRepository: UserRepository;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        MongooseModule.forRoot('mongodb://localhost/testdb_users'), // Separate DB for users tests
        UsersModule,
      ],
    })
      .overrideProvider(UserRepository) // Override real repo with mock
      .useValue(mockUserRepository)
      .overrideProvider(SetupService) // Prevent default user creation in tests
      .useValue(mockSetupService)
      .overrideGuard(JwtAuthGuard) // Mock JwtAuthGuard
      .useValue({
        canActivate: (context: ExecutionContext) => {
          const req = context.switchToHttp().getRequest();
          req.user = {
            sub: 'adminId',
            email: 'admin@example.com',
            role: UserRole.ADMIN,
          };
          return true;
        },
      })
      .overrideGuard(RolesGuard) // Mock RolesGuard to allow all roles for now
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true }));
    await app.init();

    userModel = moduleFixture.get<Model<UserDocument>>('UserModel');
    userRepository = moduleFixture.get<UserRepository>(UserRepository);

    await userModel.deleteMany({});
  });

  afterAll(async () => {
    await userModel.deleteMany({}); // Clean up after tests
    await app.close();
  });

  const mockUserResult: Omit<User, 'password'> = {
    id: 'user1',
    email: 'user1@example.com',
    name: 'User One',
    role: UserRole.USER,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserWithPassword: User = {
    ...mockUserResult,
    password: 'passwordHashed',
  };

  describe('/users (POST)', () => {
    it('should create a user (as admin)', async () => {
      mockUserRepository.create.mockResolvedValue(mockUserWithPassword);
      (bcrypt.hash as jest.Mock).mockResolvedValue('hashedpassword123');

      const createUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        name: 'New User',
      };

      const response = await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', 'Bearer validtoken') // Guard mocked to allow
        .send(createUserDto)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          email: createUserDto.email,
          name: createUserDto.name,
          role: UserRole.USER,
          isActive: true,
        }),
      );
      expect(mockUserRepository.create).toHaveBeenCalledWith(
        expect.objectContaining({
          email: createUserDto.email,
          name: createUserDto.name,
        }),
      );
    });

    it('should return 400 for invalid input', async () => {
      await request(app.getHttpServer())
        .post('/api/users')
        .set('Authorization', 'Bearer validtoken')
        .send({ email: 'invalid', password: '123' })
        .expect(400);
    });
  });

  describe('/users (GET)', () => {
    it('should return all users', async () => {
      mockUserRepository.findAll.mockResolvedValue([mockUserWithPassword]);

      const response = await request(app.getHttpServer())
        .get('/api/users')
        .set('Authorization', 'Bearer validtoken')
        .expect(200);

      expect(response.body).toEqual([expect.objectContaining(mockUserResult)]);
      expect(mockUserRepository.findAll).toHaveBeenCalled();
    });
  });

  describe('/users/:id (GET)', () => {
    it('should return a user by ID', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUserWithPassword);

      const response = await request(app.getHttpServer())
        .get(`/api/users/${mockUserResult.id}`)
        .set('Authorization', 'Bearer validtoken')
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining(mockUserResult));
      expect(mockUserRepository.findById).toHaveBeenCalledWith(mockUserResult.id);
    });

    it('should return 404 if user not found', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .get('/api/users/nonexistent')
        .set('Authorization', 'Bearer validtoken')
        .expect(404);
    });
  });

  describe('/users/:id (PATCH)', () => {
    it('should update a user by ID', async () => {
      const updatedData = { name: 'Updated Name' };
      const updatedUser = { ...mockUserWithPassword, ...updatedData };
      mockUserRepository.update.mockResolvedValue(updatedUser);

      const response = await request(app.getHttpServer())
        .patch(`/api/users/${mockUserResult.id}`)
        .set('Authorization', 'Bearer validtoken')
        .send(updatedData)
        .expect(200);

      expect(response.body).toEqual(expect.objectContaining({ ...mockUserResult, ...updatedData }));
      expect(mockUserRepository.update).toHaveBeenCalledWith(mockUserResult.id, updatedData);
    });

    it('should return 404 if user not found for update', async () => {
      mockUserRepository.update.mockResolvedValue(null);

      await request(app.getHttpServer())
        .patch('/api/users/nonexistent')
        .set('Authorization', 'Bearer validtoken')
        .send({ name: 'Update' })
        .expect(404);
    });
  });

  describe('/users/:id (DELETE)', () => {
    it('should delete a user by ID (as admin)', async () => {
      mockUserRepository.findById.mockResolvedValue(mockUserWithPassword); // Ensure user exists before delete
      mockUserRepository.delete.mockResolvedValue(undefined);

      await request(app.getHttpServer())
        .delete(`/api/users/${mockUserResult.id}`)
        .set('Authorization', 'Bearer validtoken')
        .expect(204);

      expect(mockUserRepository.delete).toHaveBeenCalledWith(mockUserResult.id);
    });

    it('should return 404 if user not found for delete', async () => {
      mockUserRepository.findById.mockResolvedValue(null);

      await request(app.getHttpServer())
        .delete('/api/users/nonexistent')
        .set('Authorization', 'Bearer validtoken')
        .expect(404);
    });
  });
});
