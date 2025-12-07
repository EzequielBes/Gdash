import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { InsightsRepository } from 'src/domain/repositories/insights.repository';
import { InsightsDocument } from '../schemas/insights.schema';
import { Insights, TemperatureTrend, DayClassification, Alert } from 'src/domain/entities/insights.entity';

@Injectable()
export class MongoInsightsRepository extends InsightsRepository {
  private readonly logger = new Logger(MongoInsightsRepository.name);

  constructor(
    @InjectModel(InsightsDocument.name)
    private readonly insightsModel: Model<InsightsDocument>,
  ) {
    super();
  }

  async create(insights: Insights): Promise<Insights> {
    try {
      const newInsights = new this.insightsModel(insights);
      const saved = await newInsights.save();
      this.logger.log(`Insights created for date: ${saved.date}`);
      return this.toDomainEntity(saved);
    } catch (error) {
      this.logger.error('Error creating insights:', error.stack);
      throw error;
    }
  }

  async findByDate(date: Date): Promise<Insights | null> {
    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const insights = await this.insightsModel.findOne({
      date: {
        $gte: startOfDay,
        $lte: endOfDay,
      },
    }).exec();
    return insights ? this.toDomainEntity(insights) : null;
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Insights[]> {
    const insights = await this.insightsModel.find({
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ date: -1 }).exec();
    return insights.map(i => this.toDomainEntity(i));
  }

  async update(id: string, insights: Partial<Insights>): Promise<Insights> {
    const updated = await this.insightsModel.findByIdAndUpdate(id, insights, { new: true }).exec();
    return updated ? this.toDomainEntity(updated) : null;
  }

  async delete(id: string): Promise<void> {
    await this.insightsModel.findByIdAndDelete(id).exec();
  }

  private toDomainEntity(doc: InsightsDocument): Insights {
    return {
      id: doc._id.toString(),
      date: doc.date,
      averageTemperature: doc.averageTemperature,
      maxTemperature: doc.maxTemperature,
      minTemperature: doc.minTemperature,
      averageHumidity: doc.averageHumidity,
      temperatureTrend: doc.temperatureTrend as TemperatureTrend,
      comfortScore: doc.comfortScore,
      dayClassification: doc.dayClassification as DayClassification,
      alerts: doc.alerts as Alert[],
      summary: doc.summary,
      generatedAt: doc.generatedAt,
    };
  }
}
