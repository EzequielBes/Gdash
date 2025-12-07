import { Injectable, Logger } from '@nestjs/common';
import { UsersService } from './users.service';

@Injectable()
export class SetupService {
  private readonly logger = new Logger(SetupService.name);

  constructor(private readonly usersService: UsersService) {}

  async createDefaultUser() {
    const email = process.env.DEFAULT_USER_EMAIL || 'admin@gdash.local';
    const password = process.env.DEFAULT_USER_PASSWORD || 'admin123';

    try {
      let existingUser;
      try {
        existingUser = await this.usersService.findByEmail(email);
      } catch (error: any) {
        if (error.status !== 404 && error.getStatus?.() !== 404) {
          throw error;
        }
      }

      if (existingUser) {
        this.logger.log('Usuário padrão já existe');
        return;
      }

      await this.usersService.createUser({
        email,
        password,
        name: 'Admin GDASH',
        role: 'admin',
      });

      this.logger.log(`✅ Usuário padrão criado: ${email}`);
    } catch (error) {
      this.logger.error('Erro ao criar usuário padrão:', error);
    }
  }
}
