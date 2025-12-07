import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type WeatherLogDocument = HydratedDocument<WeatherLog>;

@Schema()
export class WeatherLog {
  @Prop({ required: true })
  city: string;

  @Prop({ required: true })
  temperature: number;

  @Prop({ required: true })
  humidity: number;

  @Prop({ required: true })
  windSpeed: number;

  @Prop()
  description: string;

  @Prop({ default: Date.now })
  createdAt: Date;
}

export const WeatherLogSchema = SchemaFactory.createForClass(WeatherLog);