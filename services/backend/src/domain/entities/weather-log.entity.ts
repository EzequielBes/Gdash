export class WeatherLog {
  id?: string;
  city: string;
  temperature: number;
  humidity: number;
  windSpeed?: number;
  description?: string;
  createdAt: Date;
  timestamp?: Date;
  rainProbability?: number;
  latitude?: number;
  longitude?: number;
  pressure?: number;
  weatherCode?: number;
}
