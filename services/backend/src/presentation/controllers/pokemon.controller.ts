import { Controller, Get, Param, Query, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

interface PokemonListResponse {
  results: Array<{ name: string; url: string }>;
  next: string | null;
}

interface PokemonDetail {
  id: number;
  name: string;
  sprites: {
    front_default: string;
    other?: {
      'official-artwork'?: {
        front_default?: string;
      };
    };
  };
  types: Array<{ slot: number; type: { name: string } }>;
  stats: Array<{ base_stat: number; stat: { name: string } }>;
  height: number;
  weight: number;
  base_experience: number;
}

@Controller('api/pokemon')
export class PokemonController {
  private readonly POKEAPI_BASE = 'https://pokeapi.co/api/v2';
  private readonly REQUEST_TIMEOUT = 10000;

  @Get('list')
  async getPokemonList(@Query('page') page: number = 1, @Query('limit') limit: number = 20) {
    try {
      const validLimit = Math.min(Math.max(limit || 20, 1), 100);
      const validPage = Math.max(page || 1, 1);
      const offset = (validPage - 1) * validLimit;

      const response = await axios.get<PokemonListResponse>(
        `${this.POKEAPI_BASE}/pokemon?offset=${offset}&limit=${validLimit}`,
        { timeout: this.REQUEST_TIMEOUT },
      );

      const enrichedPokemon = response.data.results.map((p) => {
        const id = p.url.split('/').filter(Boolean).pop() || '0';
        return {
          name: p.name,
          url: p.url,
          id: parseInt(id),
          imageUrl: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`,
        };
      });

      return {
        pokemon: enrichedPokemon,
        page: validPage,
        limit: validLimit,
        hasMore: !!response.data.next,
        total: 1025,
      };
    } catch (err) {
      const error = err as AxiosError;
      console.error('Pokemon list error:', error.message);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to fetch Pokémon list from external API',
          error: 'External API Error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get(':name')
  async getPokemonDetail(@Param('name') name: string) {
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      throw new HttpException(
        { message: 'Invalid Pokémon name provided' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await axios.get<PokemonDetail>(
        `${this.POKEAPI_BASE}/pokemon/${name.toLowerCase().trim()}`,
        { timeout: this.REQUEST_TIMEOUT },
      );

      const officialArtwork =
        response.data.sprites?.other?.['official-artwork']?.front_default ||
        response.data.sprites?.front_default;

      return {
        id: response.data.id,
        name: response.data.name,
        image: officialArtwork || `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${response.data.id}.png`,
        types: response.data.types
          .sort((a, b) => a.slot - b.slot)
          .map((t) => t.type.name),
        stats: response.data.stats.map((s) => ({
          name: s.stat.name,
          value: s.base_stat,
        })),
        height: response.data.height,
        weight: response.data.weight,
        baseExperience: response.data.base_experience,
      };
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 404) {
        throw new HttpException(
          { message: `Pokémon "${name}" not found` },
          HttpStatus.NOT_FOUND,
        );
      }
      console.error('Pokemon detail error:', error.message);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to fetch Pokémon details from external API',
          error: 'External API Error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
