import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WeatherLog } from 'src/domain/entities/weather-log.entity';
import { PaginatedWeatherLogs, WeatherLogFilters, WeatherLogRepository } from 'src/domain/repositories/weather-log.repository';
import { WeatherLog as WeatherLogSchema } from '../schemas/weather-log.schema';

export class MongooseWeatherLogRepository implements WeatherLogRepository {
    constructor(
        @InjectModel(WeatherLogSchema.name)
        private readonly weatherLogModel: Model<WeatherLogSchema>,
    ) {}

    async create(log: WeatherLog): Promise<WeatherLog> {
        const createdLog = new this.weatherLogModel(log);
        return createdLog.save();
    }

    async findAll(filters: WeatherLogFilters): Promise<PaginatedWeatherLogs> {
        const query: any = {};
        if (filters.startDate && filters.endDate) {
            query.createdAt = { $gte: filters.startDate, $lte: filters.endDate };
        }
        if (filters.location) {
            query.city = filters.location;
        }
        if (filters.city) {
            query.city = filters.city;
        }

        const page = filters.page ?? 1;
        const limit = filters.limit ?? 10;
        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.weatherLogModel.find(query).skip(skip).limit(limit).exec(),
            this.weatherLogModel.countDocuments(query).exec(),
        ]);

        return {
            data,
            total,
            page,
            limit,
        };
    }

    async findById(id: string): Promise<WeatherLog | null> {
        return this.weatherLogModel.findById(id).exec();
    }

    async findByDateRange(startDate: Date, endDate: Date): Promise<WeatherLog[]> {
        return this.weatherLogModel.find({
            date: { $gte: startDate, $lte: endDate },
        }).exec();
    }

    async delete(id: string): Promise<void> {
        await this.weatherLogModel.findByIdAndDelete(id).exec();
    }
}