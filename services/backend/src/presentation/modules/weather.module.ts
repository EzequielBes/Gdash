import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from '@nestjs/config';
import { WeatherController } from '../../presentation/controllers/weather.controller';
import { InsightsController } from '../../presentation/controllers/insights.controller';
import { ExportController } from '../../presentation/controllers/export.controller';
import { WeatherService } from '../../application/services/weather.service';
import { WeatherCollectorService } from '../../application/services/weather-collector.service';
import { AIInsightsService } from '../../application/services/ai-insights.service';
import { InsightsService } from '../../application/services/insights.service';
import { MongoWeatherLogRepository } from '../../infrastructure/database/repositories/mongo-weather-log.repository';
import { WeatherLogRepository } from '../../domain/repositories/weather-log.repository';
import { MongoInsightsRepository } from '../../infrastructure/database/repositories/mongo-insights.repository';
import { InsightsRepository } from '../../domain/repositories/insights.repository';
import { WeatherLog as WeatherLogSchemaClass, WeatherLogSchema } from '../../infrastructure/database/schemas/weather-log.schema';
import { InsightsDocument as InsightsSchemaClass, InsightsSchema } from '../../infrastructure/database/schemas/insights.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: WeatherLogSchemaClass.name, schema: WeatherLogSchema },
      { name: InsightsSchemaClass.name, schema: InsightsSchema },
    ]),
    ConfigModule,
  ],
  controllers: [WeatherController, InsightsController, ExportController],
  providers: [
    WeatherService,
    WeatherCollectorService,
    AIInsightsService,
    InsightsService,
    MongoWeatherLogRepository,
    MongoInsightsRepository,
    {
      provide: WeatherLogRepository,
      useClass: MongoWeatherLogRepository,
    },
    {
      provide: InsightsRepository,
      useClass: MongoInsightsRepository,
    },
  ],
  exports: [WeatherService, WeatherLogRepository, AIInsightsService, WeatherCollectorService, InsightsService],
})
export class WeatherModule {}
