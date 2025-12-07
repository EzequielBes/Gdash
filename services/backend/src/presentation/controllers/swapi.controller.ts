import { Controller, Get, Query, HttpException, HttpStatus } from '@nestjs/common';
import axios, { AxiosError } from 'axios';

interface SwapiListResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{
    name: string;
    url: string;
    [key: string]: any;
  }>;
}

interface SwapiCharacter {
  name: string;
  height: string;
  mass: string;
  hair_color: string;
  skin_color: string;
  eye_color: string;
  birth_year: string;
  gender: string;
  homeworld: string;
  films: string[];
  species: string[];
}

interface SwapiPlanet {
  name: string;
  climate: string;
  gravity: string;
  terrain: string;
  diameter: string;
  population: string;
  residents: string[];
  films: string[];
}

@Controller('api/swapi')
export class SwapiController {
  private readonly SWAPI_BASE = 'https://swapi.dev/api';
  private readonly REQUEST_TIMEOUT = 10000;

  private getImageUrl(type: 'character' | 'planet', name: string): string {
    if (type === 'character') {
      const sanitizedName = name.toLowerCase().replace(/\s+/g, '-');
      return `https://starwars-visualguide.com/assets/img/characters/${sanitizedName}.jpg`;
    }
    const sanitizedName = name.toLowerCase().replace(/\s+/g, '-');
    return `https://starwars-visualguide.com/assets/img/planets/${sanitizedName}.jpg`;
  }

  @Get('characters')
  async getCharacters(@Query('page') page: number = 1) {
    try {
      const validPage = Math.max(page || 1, 1);
      const response = await axios.get<SwapiListResponse>(
        `${this.SWAPI_BASE}/people/?page=${validPage}`,
        { timeout: this.REQUEST_TIMEOUT },
      );

      return {
        characters: response.data.results.map((c) => ({
          name: c.name,
          url: c.url,
          birthYear: c.birth_year,
          gender: c.gender,
          height: c.height,
          mass: c.mass,
          imageUrl: this.getImageUrl('character', c.name),
        })),
        page: validPage,
        hasMore: !!response.data.next,
        total: response.data.count,
      };
    } catch (err) {
      const error = err as AxiosError;
      console.error('Swapi characters error:', error.message);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to fetch characters from Star Wars API',
          error: 'External API Error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get('characters/:id')
  async getCharacterDetail(@Query('id') id: string) {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new HttpException(
        { message: 'Invalid character ID provided' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await axios.get<SwapiCharacter>(
        `${this.SWAPI_BASE}/people/${id.trim()}/`,
        { timeout: this.REQUEST_TIMEOUT },
      );

      return {
        name: response.data.name,
        height: response.data.height,
        mass: response.data.mass,
        hairColor: response.data.hair_color,
        skinColor: response.data.skin_color,
        eyeColor: response.data.eye_color,
        birthYear: response.data.birth_year,
        gender: response.data.gender,
        homeworld: response.data.homeworld,
        filmsCount: response.data.films.length,
        speciesCount: response.data.species.length,
        imageUrl: this.getImageUrl('character', response.data.name),
      };
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 404) {
        throw new HttpException(
          { message: `Character with ID "${id}" not found` },
          HttpStatus.NOT_FOUND,
        );
      }
      console.error('Swapi character detail error:', error.message);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to fetch character details from Star Wars API',
          error: 'External API Error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get('planets')
  async getPlanets(@Query('page') page: number = 1) {
    try {
      const validPage = Math.max(page || 1, 1);
      const response = await axios.get<SwapiListResponse>(
        `${this.SWAPI_BASE}/planets/?page=${validPage}`,
        { timeout: this.REQUEST_TIMEOUT },
      );

      return {
        planets: response.data.results.map((p) => ({
          name: p.name,
          url: p.url,
          climate: p.climate,
          terrain: p.terrain,
          population: p.population,
          imageUrl: this.getImageUrl('planet', p.name),
        })),
        page: validPage,
        hasMore: !!response.data.next,
        total: response.data.count,
      };
    } catch (err) {
      const error = err as AxiosError;
      console.error('Swapi planets error:', error.message);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to fetch planets from Star Wars API',
          error: 'External API Error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }

  @Get('planets/:id')
  async getPlanetDetail(@Query('id') id: string) {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      throw new HttpException(
        { message: 'Invalid planet ID provided' },
        HttpStatus.BAD_REQUEST,
      );
    }

    try {
      const response = await axios.get<SwapiPlanet>(
        `${this.SWAPI_BASE}/planets/${id.trim()}/`,
        { timeout: this.REQUEST_TIMEOUT },
      );

      return {
        name: response.data.name,
        climate: response.data.climate,
        gravity: response.data.gravity,
        terrain: response.data.terrain,
        diameter: response.data.diameter,
        population: response.data.population,
        residents: response.data.residents.length,
        films: response.data.films.length,
        imageUrl: this.getImageUrl('planet', response.data.name),
      };
    } catch (err) {
      const error = err as AxiosError;
      if (error.response?.status === 404) {
        throw new HttpException(
          { message: `Planet with ID "${id}" not found` },
          HttpStatus.NOT_FOUND,
        );
      }
      console.error('Swapi planet detail error:', error.message);
      throw new HttpException(
        {
          statusCode: HttpStatus.BAD_GATEWAY,
          message: 'Failed to fetch planet details from Star Wars API',
          error: 'External API Error',
        },
        HttpStatus.BAD_GATEWAY,
      );
    }
  }
}
