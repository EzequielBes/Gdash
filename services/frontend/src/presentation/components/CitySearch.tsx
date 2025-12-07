import { useState, useEffect, useRef } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';

interface CityData {
  name: string;
  lat: number;
  lon: number;
}

interface CitySearchProps {
  onCitySelect: (city: CityData) => void;
}

export function CitySearch({ onCitySelect }: CitySearchProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<CityData[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearch = async (value: string) => {
    setQuery(value);
    if (value.length < 3) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      // Using Open-Meteo Geocoding API directly from frontend as it's public and free
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(value)}&count=5&language=pt&format=json`
      );
      const data = await response.json();
      
      if (data.results) {
        const cities = data.results.map((item: any) => ({
          name: `${item.name}${item.admin1 ? `, ${item.admin1}` : ''}${item.country_code ? ` - ${item.country_code}` : ''}`,
          lat: item.latitude,
          lon: item.longitude
        }));
        setSuggestions(cities);
        setShowSuggestions(true);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (city: CityData) => {
    setQuery(city.name);
    onCitySelect(city);
    setShowSuggestions(false);
  };

  const handleGeolocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocalização não suportada pelo seu navegador');
      return;
    }

    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          // Reverse geocoding using Nominatim (OpenStreetMap)
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${position.coords.latitude}&lon=${position.coords.longitude}`
          );
          const data = await response.json();
          
          const address = data.address;
          const cityName = address.city || address.town || address.village || address.municipality || address.county;
          const state = address.state || address.region;
          const country = address.country_code?.toUpperCase();
          
          const formattedName = [cityName, state, country].filter(Boolean).join(', ');
          
          if (formattedName) {
            const cityData = {
              name: formattedName,
              lat: position.coords.latitude,
              lon: position.coords.longitude
            };
            setQuery(formattedName);
            onCitySelect(cityData);
          } else {
            alert('Não foi possível identificar a cidade nesta localização.');
          }
        } catch (error) {
          console.error('Error getting location:', error);
          alert('Erro ao obter nome da cidade');
        } finally {
          setLoading(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setLoading(false);
        let msg = 'Erro ao obter localização.';
        if (error.code === 1) msg = 'Permissão de localização negada.';
        else if (error.code === 2) msg = 'Localização indisponível.';
        else if (error.code === 3) msg = 'Tempo limite esgotado.';
        alert(msg);
      }
    );
  };

  const handleManualSearch = async () => {
    if (!query) return;
    
    // If we have suggestions, pick the first one
    if (suggestions.length > 0) {
      handleSelect(suggestions[0]);
      return;
    }

    // If no suggestions, try to fetch and pick first
    setLoading(true);
    try {
      const response = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}&count=1&language=pt&format=json`
      );
      const data = await response.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        const city = {
          name: `${item.name}${item.admin1 ? `, ${item.admin1}` : ''}${item.country_code ? ` - ${item.country_code}` : ''}`,
          lat: item.latitude,
          lon: item.longitude
        };
        handleSelect(city);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleManualSearch();
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full max-w-md">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Buscar cidade ou estado..."
            className="pl-9"
            onFocus={() => query.length >= 3 && setShowSuggestions(true)}
          />
          {loading && (
            <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
          )}
        </div>
        <Button 
          onClick={handleManualSearch}
          disabled={loading || !query}
        >
          Pesquisar
        </Button>
        <Button 
          variant="outline" 
          size="icon" 
          onClick={handleGeolocation}
          title="Usar minha localização"
        >
          <MapPin className="w-4 h-4" />
        </Button>
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white dark:bg-slate-950 rounded-md border shadow-lg max-h-60 overflow-auto">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              className="w-full text-left px-4 py-2 text-sm hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              onClick={() => handleSelect(suggestion)}
            >
              {suggestion.name}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
