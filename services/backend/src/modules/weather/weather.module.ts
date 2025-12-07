import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { WeatherController } from '../../presentation/controllers/weather.controller';
import { WeatherService } from '../../application/services/weather.service';
import { WeatherLogRepository } from '../../domain/repositories/weather-log.repository';
import { MongoWeatherLogRepository } from '../../infrastructure/database/repositories/mongo-weather-log.repository';
import { WeatherLog, WeatherLogSchema } from '../../infrastructure/database/schemas/weather-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: WeatherLog.name, schema: WeatherLogSchema }]),
  ],
  controllers: [WeatherController],
  providers: [
    WeatherService,
    MongoWeatherLogRepository,
    {
      provide: WeatherLogRepository,
      useClass: MongoWeatherLogRepository,
    },
  ],
  exports: [WeatherService, WeatherLogRepository],
})
export class WeatherModule {}