import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../infrastructure/api/client';

export interface SwapiCharacter {
  name: string;
  url: string;
}

export interface SwapiCharacterDetail {
  name: string;
  height: string;
  mass: string;
  hairColor: string;
  skinColor: string;
  eyeColor: string;
  birthYear: string;
  gender: string;
  homeworld: string;
  filmsCount: number;
  speciesCount: number;
}

export interface SwapiPlanet {
  name: string;
  url: string;
}

export interface SwapiPlanetDetail {
  name: string;
  climate: string;
  gravity: string;
  terrain: string;
  diameter: string;
  population: string;
  residents: number;
  films: number;
}

export const useSwapiCharacters = (page: number = 1) => {
  return useQuery({
    queryKey: ['swapiCharacters', page],
    queryFn: async () => {
      const { data } = await apiClient.get('/swapi/characters', {
        params: { page },
      });
      return data;
    },
  });
};

export const useSwapiCharacterDetail = (id: string) => {
  return useQuery({
    queryKey: ['swapiCharacterDetail', id],
    queryFn: async () => {
      const { data } = await apiClient.get<SwapiCharacterDetail>('/swapi/characters/:id', {
        params: { id },
      });
      return data;
    },
    enabled: !!id,
  });
};

export const useSwapiPlanets = (page: number = 1) => {
  return useQuery({
    queryKey: ['swapiPlanets', page],
    queryFn: async () => {
      const { data } = await apiClient.get('/swapi/planets', {
        params: { page },
      });
      return data;
    },
  });
};

export const useSwapiPlanetDetail = (id: string) => {
  return useQuery({
    queryKey: ['swapiPlanetDetail', id],
    queryFn: async () => {
      const { data } = await apiClient.get<SwapiPlanetDetail>('/swapi/planets/:id', {
        params: { id },
      });
      return data;
    },
    enabled: !!id,
  });
};
