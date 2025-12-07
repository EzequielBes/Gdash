import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type WeatherLogDocument = WeatherLog & Document;

@Schema({ timestamps: true, collection: 'weather_logs' })
export class WeatherLog {
  @Prop({ required: true })
  latitude: number;

  @Prop({ required: true })
  longitude: number;

  @Prop({ required: true, index: true })
  timestamp: Date;

  @Prop({ required: true })
  temperature: number;

  @Prop()
  humidity: number;

  @Prop()
  pressure: number;

  @Prop({ required: true })
  windSpeed: number;

  @Prop({ required: true })
  weatherCode: number;

  @Prop()
  description: string;

  @Prop({ index: true })
  city: string;

  @Prop()
  rainProbability: number;
}

export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);
