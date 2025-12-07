import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

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

class Alert {
  type: string;
  message: string;
}

@Schema({ _id: false })
class AlertSchemaClass {
  @Prop({ required: true })
  type: string;

  @Prop({ required: true })
  message: string;
}

const AlertSchema = SchemaFactory.createForClass(AlertSchemaClass);

@Schema({ timestamps: true, versionKey: false })
export class InsightsDocument extends Document {
  _id: Types.ObjectId;

  @Prop({ required: true })
  date: Date;

  @Prop({ required: true })
  averageTemperature: number;

  @Prop({ required: true })
  maxTemperature: number;

  @Prop({ required: true })
  minTemperature: number;

  @Prop({ required: true })
  averageHumidity: number;

  @Prop({ type: String, enum: TemperatureTrend, required: true })
  temperatureTrend: TemperatureTrend;

  @Prop({ required: true, min: 0, max: 100 })
  comfortScore: number;

  @Prop({ type: String, enum: DayClassification, required: true })
  dayClassification: DayClassification;

  @Prop({ type: [AlertSchema], default: [] })
  alerts: Alert[];

  @Prop()
  summary: string;

  @Prop({ default: Date.now })
  generatedAt: Date;

  createdAt: Date;
  updatedAt: Date;
}

export const InsightsSchema = SchemaFactory.createForClass(InsightsDocument);
InsightsSchema.index({ date: -1 });
