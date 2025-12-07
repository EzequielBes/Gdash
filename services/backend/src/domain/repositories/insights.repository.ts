import { Insights } from '../entities/insights.entity';

export abstract class InsightsRepository {
  abstract create(insights: Insights): Promise<Insights>;
  abstract findByDate(date: Date): Promise<Insights | null>;
  abstract findByDateRange(startDate: Date, endDate: Date): Promise<Insights[]>;
  abstract update(id: string, insights: Partial<Insights>): Promise<Insights>;
  abstract delete(id: string): Promise<void>;
}
