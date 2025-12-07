import { Test, TestingModule } from '@nestjs/testing';
import { InsightsService } from '../insights.service';
import { WeatherLogRepository } from '../../../domain/repositories/weather-log.repository';
import { InsightsRepository } from '../../../domain/repositories/insights.repository';
import { WeatherLog } from '../../../domain/entities/weather-log.entity';
import { Insights, TemperatureTrend, DayClassification } from '../../../domain/entities/insights.entity';

const mockWeatherLogRepository = {
  findByDateRange: jest.fn(),
};

const mockInsightsRepository = {
  findByDate: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
};

describe('InsightsService', () => {
  let service: InsightsService;
  let weatherLogRepository: WeatherLogRepository;
  let insightsRepository: InsightsRepository;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        InsightsService,
        { provide: WeatherLogRepository, useValue: mockWeatherLogRepository },
        { provide: InsightsRepository, useValue: mockInsightsRepository },
      ],
    }).compile();

    service = module.get<InsightsService>(InsightsService);
    weatherLogRepository = module.get<WeatherLogRepository>(WeatherLogRepository);
    insightsRepository = module.get<InsightsRepository>(InsightsRepository);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockWeatherLogs: WeatherLog[] = [
    {
      id: '1', timestamp: new Date('2025-01-01T10:00:00Z'), latitude: 1, longitude: 1, temperature: 20, humidity: 70, windSpeed: 5, weatherCode: 1, city: 'CityA', rainProbability: 10,
    },
    {
      id: '2', timestamp: new Date('2025-01-01T11:00:00Z'), latitude: 1, longitude: 1, temperature: 22, humidity: 75, windSpeed: 6, weatherCode: 1, city: 'CityA', rainProbability: 20,
    },
    {
      id: '3', timestamp: new Date('2025-01-01T12:00:00Z'), latitude: 1, longitude: 1, temperature: 25, humidity: 65, windSpeed: 7, weatherCode: 1, city: 'CityA', rainProbability: 30,
    },
  ];

  describe('generateInsights', () => {
    it('should generate insights for a given date range', async () => {
      const startDate = new Date('2025-01-01T00:00:00Z');
      const endDate = new Date('2025-01-01T23:59:59Z');
      jest.spyOn(weatherLogRepository, 'findByDateRange').mockResolvedValue(mockWeatherLogs);
      jest.spyOn(insightsRepository, 'findByDate').mockResolvedValue(null);
      jest.spyOn(insightsRepository, 'create').mockImplementation(async (insights) => ({ ...insights, id: 'insight1' }));

      const insights = await service.generateInsights(startDate, endDate);

      expect(weatherLogRepository.findByDateRange).toHaveBeenCalledWith(startDate, endDate);
      expect(insights).toBeDefined();
      expect(insights.averageTemperature).toBeCloseTo(22.33);
      expect(insights.maxTemperature).toBe(25);
      expect(insights.minTemperature).toBe(20);
      expect(insights.averageHumidity).toBeCloseTo(70);
      expect(insights.temperatureTrend).toBe(TemperatureTrend.RISING);
      expect(insights.comfortScore).toBeDefined();
      expect(insights.dayClassification).toBe(DayClassification.PLEASANT);
      expect(insights.alerts).toEqual([]);
      expect(insights.summary).toBeDefined();
      expect(insightsRepository.create).toHaveBeenCalled();
    });

    it('should return null if no weather logs are found', async () => {
      const startDate = new Date();
      const endDate = new Date();
      jest.spyOn(weatherLogRepository, 'findByDateRange').mockResolvedValue([]);
      const insights = await service.generateInsights(startDate, endDate);
      expect(insights).toBeNull();
    });

    it('should update existing insights if found', async () => {
        const startDate = new Date('2025-01-01T00:00:00Z');
        const endDate = new Date('2025-01-01T23:59:59Z');
        const existingInsight: Insights = {
            id: 'existing1',
            date: startDate,
            averageTemperature: 20,
            maxTemperature: 20,
            minTemperature: 20,
            averageHumidity: 70,
            temperatureTrend: TemperatureTrend.STABLE,
        };
        jest.spyOn(weatherLogRepository, 'findByDateRange').mockResolvedValue(mockWeatherLogs);
        jest.spyOn(insightsRepository, 'findByDate').mockResolvedValue(existingInsight);
        jest.spyOn(insightsRepository, 'update').mockImplementation(async (id, insights) => ({ ...insights, id }));

        const insights = await service.generateInsights(startDate, endDate);

        expect(insightsRepository.findByDate).toHaveBeenCalledWith(startDate);
        expect(insightsRepository.update).toHaveBeenCalledWith(existingInsight.id, expect.any(Object));
        expect(insights.averageTemperature).toBeCloseTo(22.33);
    });
  });

  describe('getComfortScore', () => {
    it('should calculate comfort score', () => {
      const score = service.getComfortScore(22, 60, 0);
      expect(score).toBe(100);
      const score2 = service.getComfortScore(30, 80, 20);
      expect(score2).toBeLessThan(100);
      expect(score2).toBeGreaterThanOrEqual(0);
    });
  });

  describe('getTrend', () => {
    it('should detect rising trend', () => {
      const temperatures = [10, 12, 15, 18, 20];
      expect(service.getTrend(temperatures)).toBe(TemperatureTrend.RISING);
    });

    it('should detect falling trend', () => {
      const temperatures = [20, 18, 15, 12, 10];
      expect(service.getTrend(temperatures)).toBe(TemperatureTrend.FALLING);
    });

    it('should detect stable trend', () => {
      const temperatures = [15, 16, 15, 16, 15];
      expect(service.getTrend(temperatures)).toBe(TemperatureTrend.STABLE);
    });

    it('should handle single temperature as stable', () => {
      const temperatures = [15];
      expect(service.getTrend(temperatures)).toBe(TemperatureTrend.STABLE);
    });
  });

  describe('generateAlerts', () => {
    it('should generate rain alert', () => {
      const logsWithRain: WeatherLog[] = [
        { ...mockWeatherLogs[0], rainProbability: 80 },
      ];
      const alerts = service.generateAlerts(logsWithRain);
      expect(alerts).toEqual([{ type: 'rain', message: 'Alta probabilidade de chuva.' }]);
    });

    it('should generate heat alert', () => {
      const logsWithHeat: WeatherLog[] = [
        { ...mockWeatherLogs[0], temperature: 36 },
      ];
      const alerts = service.generateAlerts(logsWithHeat);
      expect(alerts).toEqual([{ type: 'heat', message: 'Calor extremo esperado.' }]);
    });

    it('should generate cold alert', () => {
      const logsWithCold: WeatherLog[] = [
        { ...mockWeatherLogs[0], temperature: -5 },
      ];
      const alerts = service.generateAlerts(logsWithCold);
      expect(alerts).toEqual([{ type: 'cold', message: 'Baixas temperaturas, risco de geada.' }]);
    });

    it('should generate wind alert', () => {
      const logsWithWind: WeatherLog[] = [
        { ...mockWeatherLogs[0], windSpeed: 60 },
      ];
      const alerts = service.generateAlerts(logsWithWind);
      expect(alerts).toEqual([{ type: 'wind', message: 'Ventos fortes esperados.' }]);
    });

    it('should generate multiple alerts', () => {
      const logs: WeatherLog[] = [
        { ...mockWeatherLogs[0], temperature: 36, rainProbability: 80 },
      ];
      const alerts = service.generateAlerts(logs);
      expect(alerts).toEqual([
        { type: 'rain', message: 'Alta probabilidade de chuva.' },
        { type: 'heat', message: 'Calor extremo esperado.' },
      ]);
    });
  });

  describe('classifyDay', () => {
    it('should classify as rainy', () => {
      expect(service.classifyDay(20, 70, 60)).toBe(DayClassification.RAINY);
    });

    it('should classify as hot', () => {
      expect(service.classifyDay(35, 50, 10)).toBe(DayClassification.HOT);
    });

    it('should classify as cold', () => {
      expect(service.classifyDay(5, 50, 10)).toBe(DayClassification.COLD);
    });

    it('should classify as pleasant', () => {
      expect(service.classifyDay(20, 50, 10)).toBe(DayClassification.PLEASANT);
    });
  });

  describe('generateSummary', () => {
    it('should generate a summary', () => {
      const insight: Insights = {
        date: new Date('2025-01-01'),
        averageTemperature: 22.33,
        maxTemperature: 25,
        minTemperature: 20,
        averageHumidity: 70,
        temperatureTrend: TemperatureTrend.RISING,
        comfortScore: 80,
        dayClassification: DayClassification.PLEASANT,
        alerts: [{ type: 'info', message: 'Some alert' }],
      };
      const summary = service.generateSummary(insight);
      expect(summary).toContain('22.3°C');
      expect(summary).toContain('80%.');
      expect(summary).toContain('tendência de aumento');
      expect(summary).toContain('80');
      expect(summary).toContain('agradável');
      expect(summary).toContain('Alertas: Some alert');
    });
  });
});
