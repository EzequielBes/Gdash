import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { WeatherService } from '../../application/services/weather.service';
import { CreateWeatherLogDto } from '../dtos/create-weather-log.dto';
import { WeatherLogFiltersDto } from '../dtos/weather-filter.dto';
import { WeatherLogFilters } from '../../domain/repositories/weather-log.repository';

import * as XLSX from 'xlsx';

@Controller('api/weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Post('logs')
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createWeatherLogDto: CreateWeatherLogDto) {
    const windSpeed = createWeatherLogDto.windSpeed || createWeatherLogDto.wind_speed;
    const weatherCode = createWeatherLogDto.weatherCode || createWeatherLogDto.weather_code;
    const rainProbability = createWeatherLogDto.rainProbability || createWeatherLogDto.rain_probability;

    const logData = {
      ...createWeatherLogDto,
      windSpeed,
      weatherCode,
      rainProbability,
      timestamp: new Date(createWeatherLogDto.timestamp),
    };
    return this.weatherService.create(logData);
  }

  
  @Get('logs')
  async findAll(@Query() filters: WeatherLogFiltersDto) {
    const parsedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.weatherService.findAll(parsedFilters);
  }

  @Get('logs/city/:city')
  async findByCity(
    @Param('city') city: string,
    @Query() filters: WeatherLogFiltersDto,
    @Query('lat') lat?: string,
    @Query('lon') lon?: string,
  ) {
    let resolvedCity = city;
    
    // If lat/lon provided, we can skip name resolution or use it to verify
    // But for consistency, we might still want to resolve name if possible, 
    // or just use the provided name if we trust it.
    // The issue was resolveCity failing on complex names.
    
    // If we don't have lat/lon, try to resolve city to get them (and normalized name)
    if (!lat || !lon) {
      try {
        const coords = await this.weatherService.resolveCity(city);
        if (coords && coords.name) {
          resolvedCity = coords.name;
        }
      } catch (e) {
        console.warn(`Could not resolve city ${city}, using input value.`);
      }
    }

    const recentLogs = await this.weatherService.findAll({
      city: resolvedCity,
      limit: 1,
    });

    const latestLog = recentLogs.data && recentLogs.data.length > 0 ? recentLogs.data[0] : null;
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

    if (!latestLog || new Date(latestLog.timestamp) < oneHourAgo) {
      try {
        await this.weatherService.fetchAndStoreWeather(
          resolvedCity, 
          lat ? parseFloat(lat) : undefined, 
          lon ? parseFloat(lon) : undefined
        );
      } catch (e) {
        console.error(`Failed to fetch fresh data for ${resolvedCity}:`, e);
      }
    }

    const parsedFilters = {
      ...filters,
      city: resolvedCity, // Use resolved city for query
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };
    return this.weatherService.findAll(parsedFilters);
  }

  @Get('cities')
  async getCities() {
    const logs = await this.weatherService.getLogs();
    const cities = [...new Set(logs.map(log => log.city).filter(Boolean))];
    return { cities };
  }

  @Get('current')
  async getCurrentWeather(@Query('city') city?: string, @Query('latitude') latitude?: string, @Query('longitude') longitude?: string) {
    const logs = await this.weatherService.getLogs();
    let weather = logs[0];

    if (city && logs.length > 0) {
      const cityLog = logs.find(log => log.city?.toLowerCase() === city.toLowerCase());
      weather = cityLog || weather;
    }

    return { 
      weather: weather || null, 
      source: 'database' 
    };
  }

  
  @Get('logs/:id')
  async findOne(@Param('id') id: string) {
    return this.weatherService.findById(id);
  }

  
  @Delete('logs/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string) {
    return this.weatherService.delete(id);
  }

  @Get('insights/today')
  async getTodayInsights(@Query('city') city?: string, @Query('lat') lat?: string, @Query('lon') lon?: string) {
    let resolvedCity = city;
    if (city && (!lat || !lon)) {
      try {
        const coords = await this.weatherService.resolveCity(city);
        if (coords && coords.name) {
          resolvedCity = coords.name;
        }
      } catch (e) {
      }
    }
    return this.weatherService.getTodayInsights(resolvedCity, lat ? parseFloat(lat) : undefined, lon ? parseFloat(lon) : undefined);
  }

  @Get('forecast')
  async getForecast(@Query('city') city: string, @Query('lat') lat?: string, @Query('lon') lon?: string) {
    return this.weatherService.getForecast(city, lat ? parseFloat(lat) : undefined, lon ? parseFloat(lon) : undefined);
  }

  @Get('export/csv')
  async exportCsv(@Res() res: Response) {
    const logs = await this.weatherService.getLogs();
    const csv = [
      'Date,City,Temperature,Humidity,Condition',
      ...logs.map(log => 
        `${new Date(log.timestamp).toISOString()},${log.city},${log.temperature},${log.humidity},${log.description || ''}`
      )
    ].join('\n');

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', 'attachment; filename="weather_logs.csv"');
    res.send(csv);
  }

  @Get('export/xlsx')
  async exportXlsx(@Res() res: Response) {
    const logs = await this.weatherService.getLogs();
    const csv = [
      'Date,City,Temperature,Humidity,Condition',
      ...logs.map(log => 
        `${new Date(log.timestamp).toISOString()},${log.city},${log.temperature},${log.humidity},${log.description || ''}`
      )
    ].join('\n');

    res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.header('Content-Disposition', 'attachment; filename="weather_logs.csv"'); // Mantendo CSV por simplicidade sem lib extra instalada agora
    res.send(csv);
  }
}
