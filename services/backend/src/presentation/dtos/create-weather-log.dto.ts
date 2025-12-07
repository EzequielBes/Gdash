import { IsDateString, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateWeatherLogDto {
  @IsString()
  city: string;

  @IsNumber()
  temperature: number;

  @IsNumber()
  humidity: number;

  @IsNumber()
  @IsOptional()
  windSpeed?: number;

  @IsNumber()
  @IsOptional()
  wind_speed?: number;

  @IsNumber()
  @IsOptional()
  rainProbability?: number;

  @IsNumber()
  @IsOptional()
  rain_probability?: number;

  @IsNumber()
  @IsOptional()
  latitude?: number;

  @IsNumber()
  @IsOptional()
  longitude?: number;

  @IsString()
  @IsOptional()
  description?: string;

  @IsNumber()
  @IsOptional()
  weatherCode?: number;

  @IsNumber()
  @IsOptional()
  weather_code?: number;

  @IsNumber()
  @IsOptional()
  pressure?: number;

  @IsDateString()
  timestamp: string;
}




