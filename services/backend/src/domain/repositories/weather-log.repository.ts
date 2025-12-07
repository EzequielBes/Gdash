import { WeatherLog } from '../entities/weather-log.entity';

export interface WeatherLogFilters {
  startDate?: Date;
  endDate?: Date;
  location?: string;
  city?: string; // Added alias for location
  page?: number;
  limit?: number;
}

export interface PaginatedWeatherLogs {
  data: WeatherLog[];
  total: number;
  page: number;
  limit: number;
}

export abstract class WeatherLogRepository {
  abstract create(log: WeatherLog): Promise<WeatherLog>;
  abstract findAll(filters: WeatherLogFilters): Promise<PaginatedWeatherLogs>;
  abstract findById(id: string): Promise<WeatherLog | null>;
  abstract findByDateRange(startDate: Date, endDate: Date): Promise<WeatherLog[]>;
  abstract delete(id: string): Promise<void>;
}

export const WEATHER_LOG_REPOSITORY = Symbol('WeatherLogRepository');
