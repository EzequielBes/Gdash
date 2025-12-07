import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WeatherLogRepository, WeatherLogFilters, PaginatedWeatherLogs } from '../../../domain/repositories/weather-log.repository';
import { WeatherLog as WeatherLogSchemaClass, WeatherLogDocument } from '../schemas/weather-log.schema';
import { WeatherLog } from '../../../domain/entities/weather-log.entity';

@Injectable()
export class MongoWeatherLogRepository implements WeatherLogRepository {
  constructor(
    @InjectModel(WeatherLogSchemaClass.name)
    private readonly weatherLogModel: Model<WeatherLogDocument>,
  ) {}

  async create(log: WeatherLog): Promise<WeatherLog> {
    const createdLog = new this.weatherLogModel(log);
    const saved = await createdLog.save();
    return this.mapToEntity(saved);
  }

  async findAll(filters: WeatherLogFilters): Promise<PaginatedWeatherLogs> {
    const query: any = {};

    if (filters.city) {
      query.city = { $regex: `^${filters.city}$`, $options: 'i' };
    }

    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) query.timestamp.$gte = filters.startDate;
      if (filters.endDate) query.timestamp.$lte = filters.endDate;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 10;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.weatherLogModel.find(query).sort({ timestamp: -1 }).skip(skip).limit(limit).exec(),
      this.weatherLogModel.countDocuments(query).exec(),
    ]);

    return {
      data: data.map(this.mapToEntity),
      total,
      page,
      limit,
    };
  }

  async findById(id: string): Promise<WeatherLog | null> {
    const log = await this.weatherLogModel.findById(id).exec();
    return log ? this.mapToEntity(log) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<WeatherLog[]> {
    const logs = await this.weatherLogModel.find({
      timestamp: { $gte: startDate, $lte: endDate },
    }).exec();
    return logs.map(this.mapToEntity);
  }

  async delete(id: string): Promise<void> {
    await this.weatherLogModel.findByIdAndDelete(id).exec();
  }

  private mapToEntity(doc: WeatherLogDocument): WeatherLog {
    return {
      id: doc._id.toString(),
      latitude: doc.latitude,
      longitude: doc.longitude,
      timestamp: doc.timestamp,
      temperature: doc.temperature,
      humidity: doc.humidity,
      windSpeed: doc.windSpeed,
      description: doc.description,
      city: doc.city,
      rainProbability: doc.rainProbability,
      createdAt: (doc as any).createdAt
    };
  }
}
