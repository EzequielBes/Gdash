import { Test, TestingModule } from '@nestjs/testing';
import { WeatherService } from '../weather.service';
import { WeatherLogRepository } from '../../../domain/repositories/weather-log.repository';
import { CreateWeatherLogUseCase } from '../use-cases/create-weather-log.use-case';
import { ListWeatherLogsUseCase } from '../use-cases/list-weather-logs.use-case';
import { WeatherLog } from '../../../domain/entities/weather-log.entity';
import { NotFoundException } from '@nestjs/common';

const mockWeatherLogRepository = {
  findAll: jest.fn(),
  findById: jest.fn(),
  findByCity: jest.fn(),
  findByDateRange: jest.fn(),
  delete: jest.fn(),
};

const mockCreateWeatherLogUseCase = {
  execute: jest.fn(),
};

const mockListWeatherLogsUseCase = {
  execute: jest.fn(),
};

describe('WeatherService', () => {
  let service: WeatherService;
  let weatherLogRepository: WeatherLogRepository;
  let createWeatherLogUseCase: CreateWeatherLogUseCase;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WeatherService,
        { provide: WeatherLogRepository, useValue: mockWeatherLogRepository },
        {
          provide: CreateWeatherLogUseCase,
          useValue: mockCreateWeatherLogUseCase,
        },
        {
          provide: ListWeatherLogsUseCase,
          useValue: mockListWeatherLogsUseCase,
        },
      ],
    }).compile();

    service = module.get<WeatherService>(WeatherService);
    weatherLogRepository = module.get<WeatherLogRepository>(
      WeatherLogRepository,
    );
    createWeatherLogUseCase = module.get<CreateWeatherLogUseCase>(
      CreateWeatherLogUseCase,
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const mockWeatherLog: WeatherLog = {
    id: '1',
    timestamp: new Date(),
    latitude: 10,
    longitude: 20,
    temperature: 25,
    humidity: 80,
    windSpeed: 10,
    weatherCode: 100,
    city: 'TestCity',
  };

  describe('create', () => {
    it('should create a weather log', async () => {
      jest
        .spyOn(createWeatherLogUseCase, 'execute')
        .mockResolvedValue(mockWeatherLog);
      const result = await service.create(mockWeatherLog);
      expect(result).toEqual(mockWeatherLog);
      expect(createWeatherLogUseCase.execute).toHaveBeenCalledWith(
        mockWeatherLog,
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated weather logs', async () => {
      const filters = { page: 1, limit: 10 };
      const paginatedResult = { logs: [mockWeatherLog], total: 1 };
      jest
        .spyOn(weatherLogRepository, 'findAll')
        .mockResolvedValue(paginatedResult);
      const result = await service.findAll(filters);
      expect(result).toEqual(paginatedResult);
      expect(weatherLogRepository.findAll).toHaveBeenCalledWith(filters);
    });
  });

  describe('findById', () => {
    it('should find a weather log by id', async () => {
      jest
        .spyOn(weatherLogRepository, 'findById')
        .mockResolvedValue(mockWeatherLog);
      const result = await service.findById('1');
      expect(result).toEqual(mockWeatherLog);
      expect(weatherLogRepository.findById).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if weather log not found', async () => {
      jest.spyOn(weatherLogRepository, 'findById').mockResolvedValue(null);
      await expect(service.findById('99')).rejects.toThrow(NotFoundException);
    });
  });

  describe('findByCity', () => {
    it('should find weather logs by city', async () => {
      jest
        .spyOn(weatherLogRepository, 'findByCity')
        .mockResolvedValue([mockWeatherLog]);
      const result = await service.findByCity('TestCity');
      expect(result).toEqual([mockWeatherLog]);
      expect(weatherLogRepository.findByCity).toHaveBeenCalledWith('TestCity');
    });
  });

  describe('findByDateRange', () => {
    it('should find weather logs by date range', async () => {
      const startDate = new Date();
      const endDate = new Date();
      jest
        .spyOn(weatherLogRepository, 'findByDateRange')
        .mockResolvedValue([mockWeatherLog]);
      const result = await service.findByDateRange(startDate, endDate);
      expect(result).toEqual([mockWeatherLog]);
      expect(weatherLogRepository.findByDateRange).toHaveBeenCalledWith(
        startDate,
        endDate,
      );
    });
  });

  describe('delete', () => {
    it('should delete a weather log', async () => {
      jest.spyOn(weatherLogRepository, 'findById').mockResolvedValue(mockWeatherLog);
      jest.spyOn(weatherLogRepository, 'delete').mockResolvedValue(undefined);
      await service.delete('1');
      expect(weatherLogRepository.findById).toHaveBeenCalledWith('1');
      expect(weatherLogRepository.delete).toHaveBeenCalledWith('1');
    });

    it('should throw NotFoundException if weather log not found', async () => {
      jest.spyOn(weatherLogRepository, 'findById').mockResolvedValue(null);
      await expect(service.delete('99')).rejects.toThrow(NotFoundException);
    });
  });
});
