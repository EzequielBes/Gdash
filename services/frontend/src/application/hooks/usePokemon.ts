import { useQuery } from '@tanstack/react-query';
import { apiClient } from '../../infrastructure/api/client';

export interface Pokemon {
  name: string;
  url: string;
}

export interface PokemonDetail {
  id: number;
  name: string;
  image: string;
  types: string[];
  height: number;
  weight: number;
  baseExperience: number;
}

export const usePokemonList = (page: number = 1, limit: number = 20) => {
  return useQuery({
    queryKey: ['pokemonList', page, limit],
    queryFn: async () => {
      const { data } = await apiClient.get('/pokemon/list', {
        params: { page, limit },
      });
      return data;
    },
  });
};

export const usePokemonDetail = (name: string) => {
  return useQuery({
    queryKey: ['pokemonDetail', name],
    queryFn: async () => {
      const { data } = await apiClient.get<PokemonDetail>('/pokemon/detail/:name', {
        params: { name },
      });
      return data;
    },
    enabled: !!name,
  });
};
