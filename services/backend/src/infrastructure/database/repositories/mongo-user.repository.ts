import { Injectable, ConflictException, InternalServerErrorException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { UserDocument, User } from '../schemas/user.schema';
import { User as DomainUser } from '../../../domain/entities/user.entity';
import { UserRepository } from '../../../domain/repositories/user.repository';

@Injectable()
export class MongoUserRepository implements UserRepository {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  async create(user: Omit<DomainUser, 'id' | 'createdAt' | 'updatedAt'>): Promise<DomainUser> {
    try {
      const createdUser = new this.userModel(user);
      const saved = await createdUser.save();
      return this.mapToEntity(saved);
    } catch (error: any) {
      if (error.code === 11000) {
        throw new ConflictException('Email already exists');
      }
      throw new InternalServerErrorException('Failed to create user');
    }
  }

  async findAll(): Promise<DomainUser[]> {
    const users = await this.userModel.find().exec();
    return users.map(user => this.mapToEntity(user));
  }

  async findById(id: string): Promise<DomainUser | null> {
    const user = await this.userModel.findById(id).exec();
    return user ? this.mapToEntity(user) : null;
  }

  async findByEmail(email: string): Promise<DomainUser | null> {
    const user = await this.userModel.findOne({ email }).exec();
    return user ? this.mapToEntity(user) : null;
  }

  async update(id: string, user: Partial<DomainUser>): Promise<DomainUser | null> {
    const updatedUser = await this.userModel
      .findByIdAndUpdate(id, user, { new: true })
      .exec();
    return updatedUser ? this.mapToEntity(updatedUser) : null;
  }

  async delete(id: string): Promise<void> {
    await this.userModel.findByIdAndDelete(id).exec();
  }

  private mapToEntity(doc: UserDocument): DomainUser {
    return {
      id: doc._id.toString(),
      email: doc.email,
      name: doc.name,
      password: doc.password,
      role: doc.role,
      isActive: doc.isActive,
      createdAt: doc.createdAt,
      updatedAt: doc.updatedAt,
    };
  }
}

