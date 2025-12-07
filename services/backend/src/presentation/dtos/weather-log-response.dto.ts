import { WeatherLog } from 'src/domain/entities/weather-log.entity';

export class WeatherLogResponseDto implements Partial<WeatherLog> {
  id?: string;
  timestamp?: Date;
  latitude?: number;
  longitude?: number;
  temperature?: number;
  humidity?: number;
  windSpeed?: number;
  weatherCode?: number;
  pressure?: number;
  description?: string;
  city?: string;
  rainProbability?: number;
  createdAt?: Date;
  updatedAt?: Date;
}
