import { Controller, Get, Query, Res } from '@nestjs/common';
import { Response } from 'express';
import { WeatherService } from '../../application/services/weather.service';
import * as json2csv from 'json2csv';

@Controller('api/weather/export')
export class ExportController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get('csv')
  async exportCSV(
    @Res() res: Response,
    @Query('city') city?: string,
    @Query('days') days: string = '7',
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const result = await this.weatherService.findAll({
      startDate,
      city,
      limit: 10000,
    });

    const data = result.data.map((log: any) => ({
      timestamp: new Date(log.timestamp).toLocaleString('pt-BR'),
      city: log.city,
      temperature: log.temperature,
      humidity: log.humidity,
      windSpeed: log.windSpeed,
      description: log.description || '',
    }));

    if (data.length === 0) {
      return res.status(400).json({ error: 'Nenhum dado para exportar' });
    }

    const csv = json2csv.parse(data, {
      fields: ['timestamp', 'city', 'temperature', 'humidity', 'windSpeed', 'description'],
    });

    res.header('Content-Type', 'text/csv');
    res.header('Content-Disposition', `attachment; filename="clima_${new Date().toISOString().split('T')[0]}.csv"`);
    res.send(csv);
  }

  @Get('json')
  async exportJSON(
    @Res() res: Response,
    @Query('city') city?: string,
    @Query('days') days: string = '7',
  ) {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(days));

    const result = await this.weatherService.findAll({
      startDate,
      city,
      limit: 10000,
    });

    res.header('Content-Type', 'application/json');
    res.header('Content-Disposition', `attachment; filename="clima_${new Date().toISOString().split('T')[0]}.json"`);
    res.json({
      exportDate: new Date().toISOString(),
      records: result.data.length,
      data: result.data,
    });
  }
}
