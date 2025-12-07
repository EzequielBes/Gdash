export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
}

export interface User {
  id: string
  email: string
  name: string
  role: UserRole
  isActive: boolean
  createdAt: string
}

export interface WeatherLog {
  id: string
  timestamp: string
  latitude: number
  longitude: number
  temperature: number
  humidity: number
  windSpeed: number
  weatherCode: number
  pressure?: number
  description?: string
  city?: string
}

export interface WeatherInsight {
  summary: string;
  averageTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  trend: 'stable' | 'rising' | 'falling';
}
