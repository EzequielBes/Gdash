import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { User } from 'src/domain/entities/user.entity';
import { AuthService } from 'src/application/services/auth.service';
import { jwtConstants } from './constants';

export interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private configService: ConfigService,
    private authService: AuthService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtConstants.secret,
    });
    this.logger.log('JwtStrategy initialized with hardcoded secret');
  }

  async validate(payload: any) {
    this.logger.log(`Validating payload: ${JSON.stringify(payload)}`);
    try {
      const user = await this.authService.validateUser(payload);
      if (!user) {
        this.logger.warn(`User not found for payload: ${JSON.stringify(payload)}`);
        throw new UnauthorizedException();
      }
      return user;
    } catch (error) {
      this.logger.error(`Validation failed: ${error.message}`);
      throw error;
    }
  }
}
