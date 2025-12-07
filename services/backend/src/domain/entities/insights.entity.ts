export enum TemperatureTrend {
  RISING = 'rising',
  STABLE = 'stable',
  FALLING = 'falling',
}

export enum DayClassification {
  COLD = 'cold',
  HOT = 'hot',
  PLEASANT = 'pleasant',
  RAINY = 'rainy',
}

export interface Alert {
  type: string;
  message: string;
}

export class Insights {
  id?: string;
  _id?: string;
  date: Date;
  averageTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  averageHumidity: number;
  temperatureTrend: TemperatureTrend;
  comfortScore?: number;
  dayClassification?: DayClassification;
  alerts?: Alert[];
  summary?: string;
  generatedAt?: Date;
}
