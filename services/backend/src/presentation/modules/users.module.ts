import { Module, forwardRef } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from '../controllers/users.controller';
import { CreateUserUseCase } from '../../application/use-cases/create-user.use-case';
import { ListUsersUseCase } from '../../application/use-cases/list-users.use-case';
import { FindUserByIdUseCase } from '../../application/use-cases/find-user-by-id.use-case';
import { UpdateUserUseCase } from '../../application/use-cases/update-user.use-case';
import { DeleteUserUseCase } from '../../application/use-cases/delete-user.use-case';
import { UserRepository } from '../../domain/repositories/user.repository';
import { MongoUserRepository } from '../../infrastructure/database/repositories/mongo-user.repository';
import { User as UserSchemaClass, UserSchema } from '../../infrastructure/database/schemas/user.schema';
import { SetupService } from '../../application/services/setup.service';
import { ConfigService } from '@nestjs/config';
import { AuthModule } from './auth.module';
import { UsersService } from '../../application/services/users.service';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: UserSchemaClass.name, schema: UserSchema }]),
    forwardRef(() => AuthModule),
  ],
  controllers: [UsersController],
  providers: [
    UsersService,
    CreateUserUseCase,
    ListUsersUseCase,
    FindUserByIdUseCase,
    UpdateUserUseCase,
    DeleteUserUseCase,
    {
      provide: UserRepository,
      useClass: MongoUserRepository,
    },
    SetupService,
    ConfigService,
  ],
  exports: [UsersService, UserRepository, CreateUserUseCase, SetupService],
})
export class UsersModule {}