import { Injectable, Inject, NotFoundException } from '@nestjs/common';
import { UserRepository } from '../../domain/repositories/user.repository';
import { UpdateUserDto } from '../../presentation/dtos/update-user.dto';
import { User } from '../../domain/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from 'src/presentation/dtos/create-user.dto';

@Injectable()
export class UpdateUserUseCase {
  constructor(
    @Inject(UserRepository)
    private readonly userRepository: UserRepository,
  ) {}

  async execute(id: string, updateData: Partial<CreateUserDto>): Promise<User> {
    if (updateData.password) {
      updateData.password = await bcrypt.hash(updateData.password, 10);
    }
    return this.userRepository.update(id, updateData);
  }
}
