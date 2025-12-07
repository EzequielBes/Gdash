import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from './users.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  async register(email: string, password: string, name: string) {
    try {
      const existingUser = await this.usersService.findByEmail(email);
      if (existingUser) {
        throw new ConflictException('Email já cadastrado');
      }
    } catch (error: any) {
      if (error.getStatus?.() !== 404) {
        throw error;
      }
    }

    const user = await this.usersService.createUser({
      email,
      name,
      password,
    } as any);

    return this.generateToken(user);
  }

  async login(email: string, password: string) {
    try {
      const user = await this.usersService.findByEmailForAuth(email);
      
      const isPasswordValid = await bcrypt.compare(password, user?.password || '');
      if (!isPasswordValid) {
        throw new UnauthorizedException('Credenciais inválidas');
      }

      return this.generateToken(user);
    } catch (error) {
      throw new UnauthorizedException('Credenciais inválidas');
    }
  }

  async validateUser(payload: any) {
    const user = await this.usersService.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Usuário não encontrado');
    }
    return user;
  }

  private generateToken(user: any) {
    const payload = { sub: user.id, email: user.email, role: user.role };
    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    };
  }
}
