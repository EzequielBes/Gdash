import { renderHook, waitFor } from '@testing-library/react';
import { useWeather } from '../useWeather';
import { getWeatherLogs, getWeatherInsights, createWeatherLog, exportWeatherData, deleteWeatherLog } from '../../infrastructure/api/weather';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { WeatherLog, WeatherInsights, TemperatureTrend, DayClassification } from '../../infrastructure/api/weather';

jest.mock('../../infrastructure/api/weather', () => ({
  getWeatherLogs: jest.fn(),
  getWeatherInsights: jest.fn(),
  createWeatherLog: jest.fn(),
exportWeatherData: jest.fn(),
  deleteWeatherLog: jest.fn(),
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });
  return function ({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  };
};

describe('useWeather', () => {
  const mockWeatherLog: WeatherLog = {
    id: '1',
    timestamp: '2023-01-01T00:00:00Z',
    latitude: 10,
    longitude: 20,
    temperature: 25,
    humidity: 80,
    windSpeed: 10,
    weatherCode: 100,
  };

  const mockWeatherInsights: WeatherInsights = {
    date: '2023-01-01T00:00:00Z',
    averageTemperature: 25,
    maxTemperature: 30,
    minTemperature: 20,
    averageHumidity: 70,
    temperatureTrend: TemperatureTrend.STABLE,
    comfortScore: 80,
    dayClassification: DayClassification.PLEASANT,
    alerts: [],
    summary: 'Mock summary',
  };

  beforeEach(() => {
    (getWeatherLogs as jest.Mock).mockClear();
    (getWeatherInsights as jest.Mock).mockClear();
    (createWeatherLog as jest.Mock).mockClear();
    (exportWeatherData as jest.Mock).mockClear();
    (deleteWeatherLog as jest.Mock).mockClear();
  });

  it('should fetch weather logs', async () => {
    (getWeatherLogs as jest.Mock).mockResolvedValue([mockWeatherLog]);

    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.logs).toEqual([mockWeatherLog]);
    expect(getWeatherLogs).toHaveBeenCalledTimes(1);
  });

  it('should fetch weather insights', async () => {
    (getWeatherInsights as jest.Mock).mockResolvedValue(mockWeatherInsights);

    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });

    await waitFor(() => expect(result.current.isLoadingInsights).toBe(false));

    expect(result.current.insights).toEqual(mockWeatherInsights);
    expect(getWeatherInsights).toHaveBeenCalledTimes(1);
  });

  it('should create a weather log', async () => {
    const newLog = { ...mockWeatherLog, id: undefined };
    const createdLog = { ...mockWeatherLog, id: '2' };
    (createWeatherLog as jest.Mock).mockResolvedValue(createdLog);
    (getWeatherLogs as jest.Mock).mockResolvedValue([mockWeatherLog, createdLog]); // Simulate refetch

    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });

    result.current.createLog(newLog);

    await waitFor(() => expect(createWeatherLog).toHaveBeenCalledWith(newLog));
  });

  it('should export weather data', async () => {
    const mockBlob = new Blob(['csv data'], { type: 'text/csv' });
    (exportWeatherData as jest.Mock).mockResolvedValue(mockBlob);

    const createObjectURLSpy = jest.spyOn(window.URL, 'createObjectURL').mockReturnValue('blob:mock-url');
    const appendChildSpy = jest.spyOn(document.body, 'appendChild');
    const removeChildSpy = jest.spyOn(document.body, 'removeChild');

    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });

    result.current.exportData({ format: 'csv' });

    await waitFor(() => expect(exportWeatherData).toHaveBeenCalledWith('csv'));
    expect(createObjectURLSpy).toHaveBeenCalledWith(mockBlob);
    expect(appendChildSpy).toHaveBeenCalled();
    expect(removeChildSpy).toHaveBeenCalled();
  });

  it('should delete a weather log', async () => {
    (deleteWeatherLog as jest.Mock).mockResolvedValue(undefined);
    (getWeatherLogs as jest.Mock).mockResolvedValue([]); // Simulate refetch

    const { result } = renderHook(() => useWeather(), { wrapper: createWrapper() });

    result.current.deleteLog('1');

    await waitFor(() => expect(deleteWeatherLog).toHaveBeenCalledWith('1'));
  });
});
