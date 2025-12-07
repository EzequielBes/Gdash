import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './presentation/modules/auth.module';
import { UsersModule } from './presentation/modules/users.module';
import { WeatherModule } from './presentation/modules/weather.module';
import { PokemonController } from './presentation/controllers/pokemon.controller';
import { SwapiController } from './presentation/controllers/swapi.controller';
import { SetupService } from './application/services/setup.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    ScheduleModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (config: ConfigService) => ({
        uri: config.get<string>('DATABASE_URL'),
      }),
      inject: [ConfigService],
    }),
    AuthModule,
    UsersModule,
    WeatherModule,
  ],
  controllers: [AppController, PokemonController, SwapiController],
  providers: [AppService, SetupService],
})
export class AppModule {
  constructor(private readonly setupService: SetupService) {}

  async onModuleInit() {
    await this.setupService.createDefaultUser();
  }
}
