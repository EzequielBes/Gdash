import { apiClient } from './client';

export interface WeatherLog {
  id?: string;
  _id?: string;
  timestamp: string;
  latitude?: number;
  longitude?: number;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  pressure?: number;
  description?: string;
  city?: string;
  rainProbability?: number;
}

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

export interface WeatherInsights {
  id?: string;
  date: string;
  averageTemperature: number;
  maxTemperature: number;
  minTemperature: number;
  averageHumidity: number;
  temperatureTrend: TemperatureTrend;
  comfortScore?: number;
  dayClassification?: DayClassification;
  alerts?: string[];
  summary?: string;
  generatedAt?: string;
}

export interface CurrentWeather {
  weather: WeatherLog;
  source: string;
}

export const getWeatherLogs = async (page = 1, limit = 10): Promise<{ logs: WeatherLog[]; total: number; page: number, limit: number }> => {
  const { data } = await apiClient.get('/weather/logs', {
    params: { page, limit },
  });
  return {
    logs: data?.data || [],
    total: data?.total || 0,
    page: data?.page || page,
    limit: data?.limit || limit
  };
};

export const getCurrentWeather = async (city?: string, latitude?: number, longitude?: number): Promise<CurrentWeather> => {
  const params: any = {};
  if (city) params.city = city;
  if (latitude !== undefined && longitude !== undefined) {
    params.latitude = latitude;
    params.longitude = longitude;
  }
  
  const { data } = await apiClient.get<CurrentWeather>('/weather/current', { params });
  return data;
};

export const getWeatherInsights = async (city?: string): Promise<WeatherInsights> => {
  const params = city ? { city } : {};
  const { data } = await apiClient.get<WeatherInsights>('/weather/insights/today', { params });
  return data || {};
};

export const getWeatherLogsByCity = async (city: string, page = 1, limit = 10): Promise<{ logs: WeatherLog[]; total: number; page: number; limit: number; city: string }> => {
  const { data } = await apiClient.get(`/weather/logs/city/${city}`, {
    params: { page, limit },
  });
  return {
    logs: data?.data || [],
    total: data?.total || 0,
    page: data?.page || page,
    limit: data?.limit || limit,
    city
  };
};

export const createWeatherLog = async (logData: Omit<WeatherLog, 'id'>): Promise<WeatherLog> => {
  const { data } = await apiClient.post<WeatherLog>('/weather/logs', logData);
  return data;
};

export const exportWeatherData = async (format: 'csv' | 'xlsx'): Promise<Blob> => {
  const { data } = await apiClient.get(`/weather/export/${format}`, {
    responseType: 'blob',
  });
  return data;
};

export const deleteWeatherLog = async (id: string): Promise<void> => {
  await apiClient.delete(`/weather/logs/${id}`);
};
