import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  getWeatherLogs,
  getWeatherInsights,
  getCurrentWeather,
  getWeatherLogsByCity,
  WeatherInsights,
  CurrentWeather,
} from '../../infrastructure/api/weather';
import { useState, useCallback, useMemo } from 'react';

const LOGS_PER_PAGE = 10;

export const useWeather = () => {
  const [selectedCity, setSelectedCity] = useState<string | undefined>();
  const [userLocation, setUserLocation] = useState<{ lat: number; lon: number } | undefined>();
  const [page, setPage] = useState(1);
  const queryClient = useQueryClient();

  const logsQuery = useQuery({
    queryKey: ['weatherLogs', selectedCity, page],
    queryFn: async () => {
      try {
        if (selectedCity) {
          return await getWeatherLogsByCity(selectedCity, page, LOGS_PER_PAGE);
        }
        return await getWeatherLogs(page, LOGS_PER_PAGE);
      } catch (err) {
        console.error('Error fetching logs:', err);
        throw err;
      }
    },
    placeholderData: (previousData) => previousData,
  });

  const insightsQuery = useQuery<WeatherInsights, Error>({
    queryKey: ['weatherInsights', selectedCity],
    queryFn: async () => {
      try {
        const result = await getWeatherInsights(selectedCity);
        return result || {};
      } catch (err) {
        console.error('Error fetching insights:', err);
        throw err;
      }
    },
  });

  const currentWeatherQuery = useQuery<CurrentWeather, Error>({
    queryKey: ['currentWeather', selectedCity, userLocation],
    queryFn: async () => {
      try {
        return await getCurrentWeather(
          selectedCity,
          userLocation?.lat,
          userLocation?.lon
        );
      } catch (err) {
        console.error('Error fetching current weather:', err);
        throw err;
      }
    },
  });

  const getGeolocation = useCallback(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserLocation({
            lat: position.coords.latitude,
            lon: position.coords.longitude,
          });
          queryClient.invalidateQueries({ queryKey: ['currentWeather'] });
        },
        (error) => {
          console.error('Geolocation error:', error);
        }
      );
    }
  }, [queryClient]);

  const selectCity = useCallback((city: string) => {
    setSelectedCity(city);
    setPage(1); // Reset page when city changes
    setUserLocation(undefined);
    queryClient.invalidateQueries({ queryKey: ['weatherLogs'] });
    queryClient.invalidateQueries({ queryKey: ['weatherInsights'] });
    queryClient.invalidateQueries({ queryKey: ['currentWeather'] });
  }, [queryClient]);

  const totalPages = useMemo(() => {
    return Math.ceil((logsQuery.data?.total || 0) / LOGS_PER_PAGE);
  }, [logsQuery.data?.total]);

  return {
    logs: logsQuery.data?.logs || [],
    insights: insightsQuery.data,
    currentWeather: currentWeatherQuery.data?.weather,
    isLoading: logsQuery.isLoading || currentWeatherQuery.isLoading,
    isFetchingLogs: logsQuery.isFetching,
    error: logsQuery.error,
    isLoadingInsights: insightsQuery.isLoading,
    errorInsights: insightsQuery.error,
    selectedCity,
    selectCity,
    getGeolocation,
    userLocation,
    page,
    setPage,
    totalPages,
  };
};
