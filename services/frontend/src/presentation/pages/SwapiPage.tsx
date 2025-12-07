import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Search, Users, Zap, Compass, Rocket, Globe, Film, Car, Star } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface StarWarsCharacter {
  url: string;
  name: string;
  height?: string;
  mass?: string;
  hair_color?: string;
  skin_color?: string;
  eye_color?: string;
  birth_year?: string;
  gender?: string;
  homeworld?: string;
  homeworld_name?: string;
  films?: string[];
  film_titles?: string[];
  species?: string[];
  species_names?: string[];
  vehicles?: string[];
  vehicle_names?: string[];
  starships?: string[];
  starship_names?: string[];
}

interface StarWarsPlanet {
  url: string;
  name: string;
  diameter?: string;
  population?: string;
  climate?: string;
  terrain?: string;
  residents?: string[];
  resident_names?: string[];
}

interface StarWarsShip {
  url: string;
  name: string;
  model?: string;
  manufacturer?: string;
  length?: string;
  crew?: string;
  passengers?: string;
  hyperdrive_rating?: string;
  starship_class?: string;
  films?: string[];
  film_titles?: string[];
  cost_in_credits?: string;
}

export function SwapiPage() {
  const [view, setView] = useState<'characters' | 'planets' | 'ships'>('characters');
  const [characters, setCharacters] = useState<StarWarsCharacter[]>([]);
  const [planets, setPlanets] = useState<StarWarsPlanet[]>([]);
  const [ships, setShips] = useState<StarWarsShip[]>([]);
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredItems, setFilteredItems] = useState<any[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      navigate('/login');
      return;
    }
    loadData();
  }, [navigate, view]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000);
      
      let url = '';
      let stateSetter: any;

      if (view === 'characters') {
        url = 'https://swapi.dev/api/people?page=1';
        stateSetter = setCharacters;
      } else if (view === 'planets') {
        url = 'https://swapi.dev/api/planets?page=1';
        stateSetter = setPlanets;
      } else {
        url = 'https://swapi.dev/api/starships?page=1';
        stateSetter = setShips;
      }

      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!res.ok) throw new Error('Erro ao carregar');
      const data = await res.json();
      const items = data.results || [];
      stateSetter(items);
      setFilteredItems(items);
      setSelectedItem(null);
    } catch (err: any) {
      setError(err.name === 'AbortError' ? 'Conexão expirou' : 'Erro ao conectar com Star Wars API');
    } finally {
      setLoading(false);
    }
  };

  const searchItems = (query: string) => {
    setSearchQuery(query);
    const list = view === 'characters' ? characters : view === 'planets' ? planets : ships;
    if (!query.trim()) {
      setFilteredItems(list);
      return;
    }
    setFilteredItems(list.filter(item => item.name.toLowerCase().includes(query.toLowerCase())));
  };

  const fetchName = async (url: string, key: string = 'name') => {
    try {
        if (!url) return 'Desconhecido';
        // Check if it's a secure URL, if not replace http with https to avoid mixed content if deployed
        const secureUrl = url.replace('http://', 'https://');
        const r = await fetch(secureUrl);
        const d = await r.json();
        return d[key] || d.title || 'Desconhecido';
    } catch { return 'Erro ao carregar'; }
  };

  const loadDetails = async (item: any) => {
    setDetailsLoading(true);
    setError(null);
    try {
      // Use cached data if available in the list, but we need to fetch fresh details for relations
      // Actually, let's just fetch the item fresh to be sure
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000);
      
      const secureUrl = item.url.replace('http://', 'https://');
      const res = await fetch(secureUrl, { signal: controller.signal });
      
      if (!res.ok) throw new Error('Não encontrado');
      const data = await res.json();

      // Enrich data
      const enrichedData = { ...data };

      const promises = [];

      // Fetch Homeworld
      if (data.homeworld) {
        promises.push(fetchName(data.homeworld).then(name => enrichedData.homeworld_name = name));
      }

      // Fetch Films
      if (data.films && data.films.length > 0) {
        promises.push(Promise.all(data.films.map((url: string) => fetchName(url, 'title')))
          .then(titles => enrichedData.film_titles = titles));
      }

      // Fetch Species
      if (data.species && data.species.length > 0) {
        promises.push(Promise.all(data.species.map((url: string) => fetchName(url)))
          .then(names => enrichedData.species_names = names));
      }

      // Fetch Vehicles
      if (data.vehicles && data.vehicles.length > 0) {
        promises.push(Promise.all(data.vehicles.map((url: string) => fetchName(url)))
          .then(names => enrichedData.vehicle_names = names));
      }

      // Fetch Starships
      if (data.starships && data.starships.length > 0) {
        promises.push(Promise.all(data.starships.map((url: string) => fetchName(url)))
          .then(names => enrichedData.starship_names = names));
      }
      
      // Fetch Residents (for planets) - Limit to 5
      if (data.residents && data.residents.length > 0) {
          const residentsToFetch = data.residents.slice(0, 5);
          promises.push(Promise.all(residentsToFetch.map((url: string) => fetchName(url)))
            .then(names => enrichedData.resident_names = names));
      }

      await Promise.all(promises);
      clearTimeout(timeoutId);
      setSelectedItem(enrichedData);
    } catch (err: any) {
      console.error(err);
      setError('Erro ao carregar detalhes completos. Algumas informações podem estar faltando.');
      // Set basic item if enrichment fails
      setSelectedItem(item);
    } finally {
      setDetailsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-gray-100 p-6 font-sans bg-[url('https://www.transparenttextures.com/patterns/stardust.png')]">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-yellow-500/30 pb-6">
          <h1 className="text-5xl font-bold text-[#ffe81f] tracking-widest uppercase drop-shadow-[0_0_10px_rgba(255,232,31,0.5)]">
            Star Wars DB
          </h1>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-2 bg-transparent border border-[#ffe81f] text-[#ffe81f] rounded hover:bg-[#ffe81f] hover:text-black transition duration-300 font-bold uppercase tracking-wider"
          >
            Voltar
          </button>
        </div>

        <div className="flex gap-4 mb-8 justify-center">
          {[
            { id: 'characters', label: 'Personagens', icon: Users },
            { id: 'planets', label: 'Planetas', icon: Globe },
            { id: 'ships', label: 'Naves', icon: Rocket }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setView(tab.id as any)}
              className={`flex items-center gap-2 px-8 py-3 rounded-full font-bold uppercase tracking-wider transition duration-300 ${
                view === tab.id
                  ? 'bg-[#ffe81f] text-black shadow-[0_0_15px_rgba(255,232,31,0.6)] transform scale-105'
                  : 'bg-gray-900 text-gray-400 border border-gray-700 hover:border-[#ffe81f] hover:text-[#ffe81f]'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="relative mb-8 max-w-2xl mx-auto">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[#ffe81f]" />
          <input
            type="text"
            placeholder={`Buscar ${view === 'characters' ? 'personagem' : view === 'planets' ? 'planeta' : 'nave'}...`}
            value={searchQuery}
            onChange={(e) => searchItems(e.target.value)}
            className="w-full pl-12 pr-4 py-4 bg-gray-900 border border-gray-700 rounded-xl text-white placeholder-gray-500 focus:ring-2 focus:ring-[#ffe81f] focus:border-transparent outline-none transition-all shadow-inner"
          />
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-900/30 border border-red-500/50 rounded-lg flex items-center gap-3 text-red-200">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* List Section */}
          <div className="lg:col-span-4">
            <div className="bg-gray-900/80 backdrop-blur-sm rounded-xl border border-gray-800 overflow-hidden h-[600px] flex flex-col">
              <div className="p-4 border-b border-gray-800 bg-gray-900">
                <h2 className="text-xl font-bold text-[#ffe81f] flex items-center gap-2 uppercase tracking-wide">
                  <Compass className="w-5 h-5" />
                  Resultados
                </h2>
              </div>
              
              <div className="overflow-y-auto flex-1 p-2 space-y-2 custom-scrollbar">
                {loading && filteredItems.length === 0 ? (
                  <div className="flex justify-center py-12">
                    <Loader2 className="w-10 h-10 animate-spin text-[#ffe81f]" />
                  </div>
                ) : filteredItems.length === 0 ? (
                  <p className="text-gray-500 text-center py-12">Nenhum registro encontrado na galáxia.</p>
                ) : (
                  filteredItems.map((item) => (
                    <button
                      key={item.url}
                      onClick={() => loadDetails(item)}
                      className={`w-full text-left p-4 rounded-lg transition-all duration-200 border-l-4 ${
                        selectedItem?.url === item.url
                          ? 'bg-gray-800 border-[#ffe81f] text-[#ffe81f] shadow-lg'
                          : 'bg-transparent border-transparent text-gray-300 hover:bg-gray-800 hover:border-gray-600'
                      }`}
                    >
                      <div className="font-bold text-lg">{item.name}</div>
                      <div className="text-xs text-gray-500 uppercase tracking-wider mt-1">
                        {view === 'characters' ? 'Personagem' : view === 'planets' ? 'Planeta' : 'Nave'}
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Details Section */}
          <div className="lg:col-span-8">
            {detailsLoading ? (
              <div className="flex flex-col justify-center items-center h-[600px] bg-gray-900/50 rounded-xl border border-gray-800 backdrop-blur-sm">
                <Loader2 className="w-16 h-16 animate-spin text-[#ffe81f] mb-4" />
                <p className="text-[#ffe81f] animate-pulse">Carregando dados da Holonet...</p>
              </div>
            ) : selectedItem ? (
              <div className="bg-gray-900/90 backdrop-blur-md rounded-xl border border-gray-700 overflow-hidden shadow-2xl min-h-[600px]">
                {/* Header */}
                <div className="bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 p-8 border-b border-gray-700 relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <Star className="w-32 h-32 text-[#ffe81f]" />
                  </div>
                  <h1 className="text-4xl font-bold text-[#ffe81f] mb-2 relative z-10">{selectedItem.name}</h1>
                  <div className="flex gap-3 relative z-10">
                    {selectedItem.birth_year && (
                      <span className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 uppercase tracking-wider">
                        Nasc: {selectedItem.birth_year}
                      </span>
                    )}
                    {selectedItem.gender && (
                      <span className="px-3 py-1 bg-gray-800 border border-gray-600 rounded text-xs text-gray-300 uppercase tracking-wider">
                        {selectedItem.gender}
                      </span>
                    )}
                  </div>
                </div>

                <div className="p-8 space-y-8">
                  {/* Main Stats Grid */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {view === 'characters' && (
                      <>
                        <StatBox label="Altura" value={selectedItem.height ? `${selectedItem.height} cm` : 'N/A'} />
                        <StatBox label="Peso" value={selectedItem.mass ? `${selectedItem.mass} kg` : 'N/A'} />
                        <StatBox label="Cor dos Olhos" value={selectedItem.eye_color} />
                        <StatBox label="Planeta Natal" value={selectedItem.homeworld_name || 'Carregando...'} highlight />
                      </>
                    )}
                    {view === 'planets' && (
                      <>
                        <StatBox label="Clima" value={selectedItem.climate} />
                        <StatBox label="Terreno" value={selectedItem.terrain} />
                        <StatBox label="Diâmetro" value={selectedItem.diameter} />
                        <StatBox label="População" value={selectedItem.population} highlight />
                      </>
                    )}
                    {view === 'ships' && (
                      <>
                        <StatBox label="Modelo" value={selectedItem.model} />
                        <StatBox label="Classe" value={selectedItem.starship_class} />
                        <StatBox label="Custo" value={selectedItem.cost_in_credits} highlight />
                        <StatBox label="Hyperdrive" value={selectedItem.hyperdrive_rating} />
                      </>
                    )}
                  </div>

                  {/* Detailed Lists */}
                  <div className="space-y-6">
                    {/* Films */}
                    {selectedItem.film_titles && selectedItem.film_titles.length > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-[#ffe81f] font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                          <Film className="w-4 h-4" /> Aparições em Filmes
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.film_titles.map((film: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm border border-gray-600">
                              {film}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Vehicles & Starships */}
                    {(selectedItem.vehicle_names?.length > 0 || selectedItem.starship_names?.length > 0) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {selectedItem.vehicle_names?.length > 0 && (
                          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-[#ffe81f] font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                              <Car className="w-4 h-4" /> Veículos
                            </h3>
                            <ul className="space-y-2">
                              {selectedItem.vehicle_names.map((v: string, idx: number) => (
                                <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                                  <span className="w-1 h-1 bg-[#ffe81f] rounded-full"></span>
                                  {v}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                        
                        {selectedItem.starship_names?.length > 0 && (
                          <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                            <h3 className="text-[#ffe81f] font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                              <Rocket className="w-4 h-4" /> Naves Espaciais
                            </h3>
                            <ul className="space-y-2">
                              {selectedItem.starship_names.map((s: string, idx: number) => (
                                <li key={idx} className="text-gray-300 text-sm flex items-center gap-2">
                                  <span className="w-1 h-1 bg-[#ffe81f] rounded-full"></span>
                                  {s}
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Residents (for planets) */}
                    {selectedItem.resident_names?.length > 0 && (
                      <div className="bg-gray-800/50 rounded-lg p-6 border border-gray-700">
                        <h3 className="text-[#ffe81f] font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
                          <Users className="w-4 h-4" /> Residentes Notáveis
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {selectedItem.resident_names.map((r: string, idx: number) => (
                            <span key={idx} className="px-3 py-1 bg-gray-700 text-gray-200 rounded-full text-sm border border-gray-600">
                              {r}
                            </span>
                          ))}
                          {selectedItem.residents.length > 5 && (
                            <span className="px-3 py-1 bg-gray-900 text-gray-400 rounded-full text-sm border border-gray-700">
                              +{selectedItem.residents.length - 5} outros
                            </span>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-[600px] bg-gray-900/30 rounded-xl border border-gray-800 border-dashed">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center mb-4 border border-gray-700">
                  <Zap className="w-10 h-10 text-gray-600" />
                </div>
                <p className="text-gray-400 text-lg">Selecione um item para ver os detalhes na Holonet</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value, highlight = false }: { label: string, value: string | undefined, highlight?: boolean }) {
  if (!value || value === 'unknown' || value === 'n/a') return null;
  
  return (
    <div className={`p-4 rounded-lg border ${highlight ? 'bg-[#ffe81f]/10 border-[#ffe81f]/30' : 'bg-gray-800 border-gray-700'}`}>
      <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">{label}</p>
      <p className={`font-bold truncate ${highlight ? 'text-[#ffe81f]' : 'text-white'}`}>
        {value}
      </p>
    </div>
  );
}
