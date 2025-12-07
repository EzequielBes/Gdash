import { Injectable, Inject, Logger } from '@nestjs/common';
import { WeatherLogRepository, WeatherLogFilters } from 'src/domain/repositories/weather-log.repository';
import * as Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { WeatherLog } from 'src/domain/entities/weather-log.entity';

export enum ExportFormat {
  CSV = 'csv',
  XLSX = 'xlsx',
}

@Injectable()
export class ExportService {
  private readonly logger = new Logger(ExportService.name);

  constructor(
    @Inject(WeatherLogRepository)
    private readonly weatherLogRepository: WeatherLogRepository,
  ) {}

  async exportData(format: ExportFormat, filters: WeatherLogFilters): Promise<Buffer> {
    this.logger.log(`Exporting data to ${format} with filters: ${JSON.stringify(filters)}`);

    if (format === ExportFormat.CSV) {
      return this.exportToCsv(filters);
    } else if (format === ExportFormat.XLSX) {
      return this.exportToXlsx(filters);
    } else {
      const errorMsg = `Unsupported format: ${format}`;
      this.logger.error(errorMsg);
      throw new Error(errorMsg);
    }
  }

  private async exportToCsv(filters: WeatherLogFilters): Promise<Buffer> {
    const { data: logs } = await this.weatherLogRepository.findAll(filters);

    if (!logs.length) {
      throw new Error('No data found for the given filters');
    }

    const csv = Papa.unparse(logs);
    return Buffer.from(csv, 'utf-8');
  }

  private async exportToXlsx(filters: WeatherLogFilters): Promise<Buffer> {
    const { data: logs } = await this.weatherLogRepository.findAll(filters);

    if (!logs.length) {
      return Buffer.from('');
    }

    const worksheet = XLSX.utils.json_to_sheet(logs);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Weather Data');
    return XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
  }
}
