import { Injectable, Inject } from '@nestjs/common';
import { WeatherLogRepository } from '../../domain/repositories/weather-log.repository';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { WeatherLog } from 'src/domain/entities/weather-log.entity';

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

@Injectable()
export class ExportWeatherDataUseCase {
  constructor(
    @Inject(WeatherLogRepository)
    private readonly weatherLogRepository: WeatherLogRepository,
  ) {}

  async execute(format: ExportFormat): Promise<Buffer> {
    const { data: logs } = await this.weatherLogRepository.findAll({}); // Pass empty filter object

    if (!logs.length) {
      throw new Error('No data found to export');
    }

    if (format === ExportFormat.CSV) {
      return this.exportToCsv(logs);
    } else if (format === ExportFormat.XLSX) {
      return this.exportToXlsx(logs);
    } else {
      throw new Error('Unsupported format');
    }
  }

  private exportToCsv(data: WeatherLog[]): Buffer {
    const csv = Papa.unparse(data);
    return Buffer.from(csv, 'utf-8');
  }

  private exportToXlsx(data: WeatherLog[]): Buffer {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weather Data');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
