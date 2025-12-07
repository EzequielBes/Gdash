import { useEffect, useState, useRef } from 'react';
import { Loader2, AlertCircle, Search, ChevronDown, X, Ruler, Zap, BarChart3 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PokemonListEntry {
  name: string;
  url: string;
}

interface PokemonType {
  slot: number;
  type: { name: string };
}

interface PokemonStat {
  base_stat: number;
  stat: { name: string };
}

interface PokemonDetail {
  id: number;
  name: string;
  sprites: any;
  types: PokemonType[];
  stats: PokemonStat[];
  height: number;
  weight: number;
  abilities: Array<{ ability: { name: string }; is_hidden: boolean }>;
}

const typeColors: Record<string, string> = {
  normal: 'bg-neutral-400',
  fire: 'bg-orange-500',
  water: 'bg-blue-500',
  grass: 'bg-green-500',
  electric: 'bg-yellow-400',
  ice: 'bg-cyan-400',
  fighting: 'bg-red-600',
  poison: 'bg-purple-500',
  ground: 'bg-amber-600',
  flying: 'bg-indigo-400',
  psychic: 'bg-pink-500',
  bug: 'bg-lime-500',
  rock: 'bg-stone-500',
  ghost: 'bg-violet-600',
  dragon: 'bg-indigo-600',
  dark: 'bg-slate-700',
  steel: 'bg-slate-400',
  fairy: 'bg-rose-400',
};

const typeGradients: Record<string, string> = {
  normal: 'from-neutral-400 to-neutral-600',
  fire: 'from-orange-500 to-red-600',
  water: 'from-blue-500 to-blue-700',
  grass: 'from-green-500 to-emerald-700',
  electric: 'from-yellow-400 to-amber-500',
  ice: 'from-cyan-400 to-blue-500',
  fighting: 'from-red-600 to-red-800',
  poison: 'from-purple-500 to-purple-700',
  ground: 'from-amber-600 to-yellow-700',
  flying: 'from-indigo-400 to-indigo-600',
  psychic: 'from-pink-500 to-rose-600',
  bug: 'from-lime-500 to-green-600',
  rock: 'from-stone-500 to-stone-700',
  ghost: 'from-violet-600 to-purple-800',
  dragon: 'from-indigo-600 to-violet-800',
  dark: 'from-slate-700 to-slate-900',
  steel: 'from-slate-400 to-slate-600',
  fairy: 'from-rose-400 to-pink-600',
};

export function PokemonPageFixed() {
  const [allPokemon, setAllPokemon] = useState<PokemonListEntry[]>([]);
  const [filteredList, setFilteredList] = useState<PokemonListEntry[]>([]);
  const [displayedList, setDisplayedList] = useState<PokemonListEntry[]>([]);
  const [selectedPokemon, setSelectedPokemon] = useState<PokemonDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pokemonDetails, setPokemonDetails] = useState<Record<string, PokemonDetail>>({});
  
  const navigate = useNavigate();
  const loadedRef = useRef(false);
  const ITEMS_PER_PAGE = 24;

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }

    if (!loadedRef.current) {
      loadedRef.current = true;
      loadInitialPokemon();
    }
  }, [navigate]);

  useEffect(() => {
    if (displayedList.length > 0) {
      fetchDetailsForVisibleItems();
    }
  }, [displayedList]);

  const fetchDetailsForVisibleItems = async () => {
    try {
      const itemsToFetch = displayedList.filter(p => !pokemonDetails[p.name]);
      
      if (itemsToFetch.length === 0) {
        return;
      }

      const responses = await Promise.all(
        itemsToFetch.map(p => fetch(p.url).then(res => res.json()))
      );

      setPokemonDetails(prev => {
        const next = { ...prev };
        responses.forEach((data: PokemonDetail) => {
          next[data.name] = data;
        });
        return next;
      });
    } catch (error) {
      console.error("Error fetching details", error);
    }
  };

  const getPokemonId = (url: string) => {
    const parts = url.split('/').filter(Boolean);
    return parts[parts.length - 1];
  };

  const loadInitialPokemon = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('https://pokeapi.co/api/v2/pokemon?limit=2000&offset=0');
      if (!res.ok) throw new Error('Erro ao carregar lista de Pokémon');
      const data = await res.json();
      
      const results = data.results || [];
      setAllPokemon(results);
      setFilteredList(results);
      setDisplayedList(results.slice(0, ITEMS_PER_PAGE));
    } catch (err: any) {
      setError('Erro ao conectar com a PokéAPI');
    } finally {
      setLoading(false);
    }
  };

  const searchPokemon = (name: string) => {
    setSearchQuery(name);
    const query = name.toLowerCase().trim();
    
    if (!query) {
      setFilteredList(allPokemon);
      setDisplayedList(allPokemon.slice(0, ITEMS_PER_PAGE));
      setPage(1);
      return;
    }

    const filtered = allPokemon.filter((p) => p.name.toLowerCase().includes(query));
    setFilteredList(filtered);
    setDisplayedList(filtered.slice(0, ITEMS_PER_PAGE));
    setPage(1);
  };

  const loadMore = () => {
    const nextPage = page + 1;
    const nextItems = filteredList.slice(0, nextPage * ITEMS_PER_PAGE);
    setDisplayedList(nextItems);
    setPage(nextPage);
  };

  const loadPokemonDetails = async (pokemon: PokemonListEntry) => {
    if (pokemonDetails[pokemon.name]) {
      setSelectedPokemon(pokemonDetails[pokemon.name]);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res = await fetch(pokemon.url);
      if (!res.ok) throw new Error('Erro ao carregar detalhes');
      const data = await res.json();
      setSelectedPokemon(data);
    } catch {
      setError('Erro ao carregar detalhes do Pokémon');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              Pokédex
            </h1>
            <p className="text-gray-500 mt-1">Explore a coleção completa</p>
          </div>
          
          <div className="relative w-full md:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-gray-400" />
            </div>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => searchPokemon(e.target.value)}
              placeholder="Buscar Pokémon..."
              className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl leading-5 bg-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all shadow-sm"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <span className="text-xs text-gray-400 bg-gray-100 px-2 py-1 rounded-md">
                {filteredList.length}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {loading && allPokemon.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
            <p className="text-gray-500 font-medium">Carregando Pokédex...</p>
          </div>
        )}

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
          {displayedList.map((pokemon, idx) => {
            const id = getPokemonId(pokemon.url);
            const details = pokemonDetails[pokemon.name];
            const mainType = details?.types[0]?.type.name || 'normal';
            const gradient = typeGradients[mainType] || typeGradients.normal;
            const imageUrl = details?.sprites?.other?.['official-artwork']?.front_default || 
                           `https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/other/official-artwork/${id}.png`;

            return (
              <button
                key={`${pokemon.name}-${idx}`}
                onClick={() => loadPokemonDetails(pokemon)}
                className="group relative flex flex-col bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 hover:-translate-y-1"
              >
                <div className="relative aspect-square p-4 flex items-center justify-center bg-gray-50 group-hover:bg-gray-100 transition-colors">
                  <div className="absolute top-2 right-2 text-xs font-bold text-gray-300">
                    #{id.padStart(3, '0')}
                  </div>
                  
                  <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 transition-opacity duration-300 bg-gradient-to-br ${gradient}`} />
                  
                  <img
                    src={imageUrl}
                    alt={pokemon.name}
                    className="w-3/4 h-3/4 object-contain z-10 drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                    loading="lazy"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = `https://raw.githubusercontent.com/PokeAPI/sprites/master/pokemon/${id}.png`;
                    }}
                  />
                </div>
                
                <div className="p-3 text-center">
                  <h3 className="text-sm font-bold text-gray-800 capitalize mb-1 truncate">
                    {pokemon.name}
                  </h3>
                  
                  <div className="flex justify-center gap-1 h-1.5">
                    {details ? (
                      details.types.map((t) => (
                        <div 
                          key={t.slot} 
                          className={`w-1.5 h-1.5 rounded-full ${typeColors[t.type.name] || typeColors.normal}`}
                          title={t.type.name}
                        />
                      ))
                    ) : (
                      <div className="w-10 h-1.5 bg-gray-100 rounded-full animate-pulse" />
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {filteredList.length === 0 && !loading && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
              <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900">Nenhum Pokémon encontrado</h3>
            <p className="text-gray-500 mt-1">Tente buscar por outro nome.</p>
          </div>
        )}

        {displayedList.length < filteredList.length && (
          <div className="mt-12 text-center">
            <button
              onClick={loadMore}
              className="px-8 py-3 bg-white text-gray-900 font-semibold rounded-full shadow-md hover:shadow-lg border border-gray-200 hover:bg-gray-50 transition-all flex items-center gap-2 mx-auto"
            >
              Carregar Mais
              <ChevronDown className="w-4 h-4" />
            </button>
            <p className="mt-4 text-sm text-gray-400">
              Exibindo {displayedList.length} de {filteredList.length} pokémons
            </p>
          </div>
        )}

        
        {selectedPokemon && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div 
              className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto relative animate-in zoom-in-95 duration-200"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={() => setSelectedPokemon(null)}
                className="absolute top-4 right-4 p-2 bg-white rounded-full shadow-lg text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-all z-50 border border-gray-100"
              >
                <X className="w-6 h-6" />
              </button>

              <div className="grid grid-cols-1 md:grid-cols-2">
                
                <div className={`relative h-64 md:h-auto bg-gradient-to-br ${typeGradients[selectedPokemon.types[0]?.type.name || 'normal']} p-8 flex flex-col items-center justify-center text-white`}>
                  <div className="absolute top-6 left-6">
                    <h2 className="text-4xl font-black capitalize tracking-tight">{selectedPokemon.name}</h2>
                    <div className="flex gap-2 mt-2">
                      {selectedPokemon.types.map((t) => (
                        <span key={t.slot} className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-sm font-bold uppercase tracking-wide">
                          {t.type.name}
                        </span>
                      ))}
                    </div>
                  </div>
                  
                  <div className="absolute top-6 right-16 text-white/30 font-black text-6xl">
                    #{selectedPokemon.id.toString().padStart(3, '0')}
                  </div>

                  <img
                    src={selectedPokemon.sprites?.other?.['official-artwork']?.front_default || selectedPokemon.sprites?.front_default}
                    alt={selectedPokemon.name}
                    className="w-64 h-64 md:w-80 md:h-80 object-contain drop-shadow-2xl z-10 mt-12 md:mt-0"
                  />
                </div>

                
                <div className="p-8 bg-white">
                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Ruler className="w-5 h-5 text-gray-400" />
                      Características
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-sm text-gray-500 mb-1">Altura</p>
                        <p className="text-xl font-bold text-gray-900">{(selectedPokemon.height * 0.1).toFixed(1)} m</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-2xl">
                        <p className="text-sm text-gray-500 mb-1">Peso</p>
                        <p className="text-xl font-bold text-gray-900">{(selectedPokemon.weight * 0.1).toFixed(1)} kg</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-gray-400" />
                      Estatísticas Base
                    </h3>
                    <div className="space-y-3">
                      {selectedPokemon.stats.map((stat) => (
                        <div key={stat.stat.name}>
                          <div className="flex justify-between text-sm mb-1">
                            <span className="font-medium text-gray-600 capitalize">{stat.stat.name.replace('-', ' ')}</span>
                            <span className="font-bold text-gray-900">{stat.base_stat}</span>
                          </div>
                          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div 
                              className={`h-full rounded-full ${typeColors[selectedPokemon.types[0]?.type.name || 'normal']}`}
                              style={{ width: `${Math.min(stat.base_stat, 150) / 1.5}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Zap className="w-5 h-5 text-gray-400" />
                      Habilidades
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedPokemon.abilities.map((ability, idx) => (
                        <span 
                          key={idx}
                          className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl text-sm font-semibold border border-blue-100"
                        >
                          {ability.ability.name.replace('-', ' ')}
                          {ability.is_hidden && <span className="ml-1 text-xs opacity-60">(Oculta)</span>}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
