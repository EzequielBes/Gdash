import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../infrastructure/context/AuthContext';
import { TemperatureChart } from '../components/Charts/TemperatureChart';
import { HumidityChart } from '../components/Charts/HumidityChart';
import { ForecastRainChart } from '../components/Charts/ForecastRainChart';
import { RefreshCw, Wind, Droplets, Thermometer, Download, AlertCircle, MapPin, Cloud, Calendar, ArrowDown, ArrowUp, ChevronDown, ChevronUp } from 'lucide-react';
import { apiClient } from '../../infrastructure/api/client';
import { CitySearch } from '../components/CitySearch';

interface WeatherLog {
  _id?: string;
  timestamp: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  weatherCode: number;
  pressure: number;
  rainProbability: number;
  description: string;
  city: string;
}

interface Insights {
  averageTemperature?: number;
  maxTemperature?: number;
  minTemperature?: number;
  averageHumidity?: number;
  maxWindSpeed?: number;
  rainChance?: number;
  logCount?: number;
  temperatureTrend?: string;
  comfortScore?: number;
  summary?: string;
  alerts?: string[];
  rainForecast?: string;
}

interface DailyWeather {
  date: string;
  minTemp: number;
  maxTemp: number;
  avgHumidity: number;
  maxWind: number;
  rainProb: number;
  condition: string;
  logs: WeatherLog[];
}

interface CityData {
  name: string;
  lat: number;
  lon: number;
}

export function DashboardPageFixed() {
  const { user, logout } = useAuth();
  const [logs, setLogs] = useState<WeatherLog[]>([]);
  const [dailyWeather, setDailyWeather] = useState<DailyWeather[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [forecast, setForecast] = useState<any>(null);
  const [selectedCity, setSelectedCity] = useState<CityData>({ name: 'São Paulo', lat: -23.5505, lon: -46.6333 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [expandedDay, setExpandedDay] = useState<string | null>(null);

  useEffect(() => {
    // Auto-detect location on first load
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          try {
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
              setSelectedCity({
                name: formattedName,
                lat: position.coords.latitude,
                lon: position.coords.longitude
              });
            }
          } catch (e) {
            console.error('Auto-location failed', e);
          }
        },
        () => console.log('Location permission denied')
      );
    }
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setCurrentDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const processDailyWeather = (logs: WeatherLog[]) => {
    const grouped: Record<string, WeatherLog[]> = {};
    
    logs.forEach(log => {
      const date = new Date(log.timestamp).toLocaleDateString('pt-BR');
      if (!grouped[date]) grouped[date] = [];
      grouped[date].push(log);
    });

    const daily: DailyWeather[] = Object.keys(grouped).map(date => {
      const dayLogs = grouped[date];
      const temps = dayLogs.map(l => l.temperature);
      const humidities = dayLogs.map(l => l.humidity);
      const winds = dayLogs.map(l => l.windSpeed);
      const rains = dayLogs.map(l => l.rainProbability);
      
      // Find most frequent condition
      const conditions = dayLogs.map(l => l.description);
      const condition = conditions.sort((a,b) =>
        conditions.filter(v => v===a).length - conditions.filter(v => v===b).length
      ).pop() || 'Desconhecido';

      return {
        date,
        minTemp: Math.min(...temps),
        maxTemp: Math.max(...temps),
        avgHumidity: humidities.reduce((a,b) => a+b, 0) / humidities.length,
        maxWind: Math.max(...winds),
        rainProb: Math.max(...rains),
        condition,
        logs: dayLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      };
    });

    // Sort by date descending (newest first) and take last 5 days
    const sortedDaily = daily.sort((a, b) => {
      const dateA = a.logs[0] ? new Date(a.logs[0].timestamp).getTime() : 0;
      const dateB = b.logs[0] ? new Date(b.logs[0].timestamp).getTime() : 0;
      return dateB - dateA;
    });

    setDailyWeather(sortedDaily.slice(0, 5)); 
  };

  const fetchData = useCallback(async (cityData: CityData) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      
      const [logsRes, insightsRes, forecastRes] = await Promise.allSettled([
        apiClient.get(`/weather/logs/city/${encodeURIComponent(cityData.name)}`, { 
          params: { 
            page: 1, 
            limit: 120, // 5 days * 24 hours = 120
            lat: cityData.lat,
            lon: cityData.lon
          }, 
          headers 
        }),
        apiClient.get('/weather/insights/today', { params: { city: cityData.name, lat: cityData.lat, lon: cityData.lon }, headers }),
        apiClient.get('/weather/forecast', { params: { city: cityData.name, lat: cityData.lat, lon: cityData.lon }, headers })
      ]);

      if (logsRes.status === 'fulfilled') {
        const responseData = logsRes.value.data;
        const fetchedLogs = responseData?.data || responseData?.logs || [];
        setLogs(fetchedLogs);
        processDailyWeather(fetchedLogs);
      } else {
        setLogs([]);
        setDailyWeather([]);
      }

      if (insightsRes.status === 'fulfilled') {
        setInsights(insightsRes.value.data || null);
      } else {
        setInsights(null);
      }

      if (forecastRes.status === 'fulfilled') {
        setForecast(forecastRes.value.data);
      } else {
        setForecast(null);
      }

      setError('');
    } catch (err: any) {
      setError('Erro ao carregar dados climáticos');
      console.error('Fetch error:', err?.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData(selectedCity);
    const interval = setInterval(() => fetchData(selectedCity), 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [selectedCity, fetchData]);

  const handleExport = async (format: 'csv' | 'xlsx') => {
    try {
      const token = localStorage.getItem('token');
      const response = await apiClient.get(`/weather/export/${format}`, {
        params: { city: selectedCity.name },
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob',
      });
      
      const url = window.URL.createObjectURL(response.data);
      const a = document.createElement('a');
      a.href = url;
      a.download = `clima-${selectedCity.name}-${new Date().toISOString().split('T')[0]}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch {
      setError('Erro ao exportar dados');
    }
  };

  const toggleDay = (date: string) => {
    if (expandedDay === date) {
      setExpandedDay(null);
    } else {
      setExpandedDay(date);
    }
  };

  if (loading && logs.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="text-center">
          <div className="animate-spin mb-4">
            <RefreshCw className="w-12 h-12 text-blue-600 mx-auto" />
          </div>
          <p className="text-slate-600 font-medium">Carregando dados climáticos...</p>
        </div>
      </div>
    );
  }

  const currentTemp = logs.length > 0 ? logs[0].temperature : insights?.averageTemperature;
  const currentCondition = logs.length > 0 ? logs[0].description : 'Dados indisponíveis';
  const isHot = (currentTemp || 0) > 25;

  return (
    <div className="min-h-screen bg-slate-50 pb-12">
      
      <div className={`relative overflow-hidden transition-colors duration-1000 ${isHot ? 'bg-gradient-to-br from-orange-400 to-red-600' : 'bg-gradient-to-br from-blue-500 to-indigo-700'} text-white pb-24`}>
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
        
        <div className="max-w-7xl mx-auto px-6 pt-8 relative z-10">
          <div className="flex justify-between items-center mb-12">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
                <Cloud className="w-6 h-6 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight">GDASH Weather</span>
            </div>
            
            <div className="flex items-center gap-4">
              <span className="text-sm font-medium bg-white/10 px-4 py-2 rounded-full backdrop-blur-md">
                {user?.name || 'Visitante'}
              </span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-full text-sm font-medium transition backdrop-blur-md"
              >
                Sair
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="flex items-center gap-2 text-white/80 mb-2 font-medium">
                <MapPin className="w-5 h-5" />
                {selectedCity.name}
              </div>
              <h1 className="text-8xl font-black tracking-tighter mb-2">
                {currentTemp !== undefined ? currentTemp.toFixed(0) + '°' : '--'}
              </h1>
              <p className="text-2xl font-medium opacity-90 mb-8 capitalize">
                {currentCondition}
              </p>
              
              <div className="flex gap-6 text-sm font-medium">
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md">
                  <ArrowUp className="w-4 h-4" />
                  Máx: {insights?.maxTemperature?.toFixed(0)}°
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md">
                  <ArrowDown className="w-4 h-4" />
                  Mín: {insights?.minTemperature?.toFixed(0)}°
                </div>
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-lg backdrop-blur-md">
                  <Wind className="w-4 h-4" />
                  Vento: {insights?.maxWindSpeed?.toFixed(0)} km/h
                </div>
              </div>
            </div>

            <div className="bg-white/10 backdrop-blur-md rounded-3xl p-8 border border-white/10">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <h3 className="text-xl font-bold mb-1">Insights de Hoje</h3>
                  <p className="text-sm opacity-70">{currentDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
                </div>
                <div className="p-2 bg-white/20 rounded-full">
                  <Cloud className="w-6 h-6" />
                </div>
              </div>
              
              <p className="text-lg leading-relaxed mb-6 font-medium">
                {insights?.summary || "Coletando dados para análise..."}
              </p>

              {insights?.rainForecast && (
                <div className="mb-6 p-4 bg-indigo-500/20 border border-indigo-500/30 rounded-xl">
                  <div className="flex items-center gap-2 mb-1 text-indigo-200 font-bold text-sm uppercase tracking-wider">
                    <Cloud className="w-4 h-4" />
                    Previsão de Chuva (Próximas Horas)
                  </div>
                  <p className="text-white font-medium">
                    {insights.rainForecast}
                  </p>
                </div>
              )}

              {insights?.alerts && insights.alerts.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {insights.alerts.map((alert, idx) => (
                    <span key={idx} className="px-3 py-1 bg-yellow-400/20 text-yellow-100 border border-yellow-400/30 rounded-full text-sm font-semibold">
                      ⚠️ {alert}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      
      <div className="max-w-7xl mx-auto px-6 -mt-12 relative z-20">
        
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-8 flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex gap-4 w-full md:w-auto flex-1">
            <CitySearch 
              onCitySelect={(cityData) => setSelectedCity(cityData)} 
            />
          </div>

          <div className="flex gap-3 w-full md:w-auto justify-end">
            <button
              onClick={() => fetchData(selectedCity)}
              className="p-3 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors"
              title="Atualizar"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <div className="h-12 w-px bg-slate-200 mx-2 hidden md:block" />
            <button
              onClick={() => handleExport('csv')}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2 font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
            <button
              onClick={() => handleExport('xlsx')}
              className="px-4 py-2 bg-slate-800 text-white rounded-xl hover:bg-slate-700 transition-colors flex items-center gap-2 font-medium text-sm"
            >
              <Download className="w-4 h-4" />
              XLSX
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-8 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 rounded-r-xl flex items-center gap-3 shadow-sm">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="font-medium">{error}</span>
          </div>
        )}

        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-100 text-orange-600 rounded-lg">
                <Thermometer className="w-5 h-5" />
              </div>
              <span className="text-slate-500 text-sm font-medium">Média Térmica</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{insights?.averageTemperature?.toFixed(1) || '-'}°</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-blue-100 text-blue-600 rounded-lg">
                <Droplets className="w-5 h-5" />
              </div>
              <span className="text-slate-500 text-sm font-medium">Umidade Média</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{insights?.averageHumidity?.toFixed(0) || '-'}%</p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-teal-100 text-teal-600 rounded-lg">
                <Wind className="w-5 h-5" />
              </div>
              <span className="text-slate-500 text-sm font-medium">Vento Máx</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{insights?.maxWindSpeed?.toFixed(1) || '-'} <span className="text-sm font-normal text-slate-400">km/h</span></p>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
                <Cloud className="w-5 h-5" />
              </div>
              <span className="text-slate-500 text-sm font-medium">Chuva</span>
            </div>
            <p className="text-3xl font-bold text-slate-800">{insights?.rainChance?.toFixed(0) || '-'}%</p>
          </div>
        </div>

        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-orange-500" />
              Variação de Temperatura
            </h3>
            <div className="h-64">
              {logs.length > 0 ? <TemperatureChart data={logs} /> : <div className="h-full flex items-center justify-center text-slate-400">Sem dados</div>}
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
              <Droplets className="w-5 h-5 text-blue-500" />
              Umidade Relativa
            </h3>
            <div className="h-64">
              {logs.length > 0 ? <HumidityChart data={logs} /> : <div className="h-full flex items-center justify-center text-slate-400">Sem dados</div>}
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 mb-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            <Cloud className="w-5 h-5 text-indigo-500" />
            Probabilidade de Chuva (Previsão 24h)
          </h3>
          <div className="h-64">
            {forecast ? <ForecastRainChart data={forecast} /> : <div className="h-full flex items-center justify-center text-slate-400">Carregando previsão...</div>}
          </div>
        </div>

        
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="p-6 border-b border-slate-100 flex justify-between items-center">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-slate-500" />
              Histórico (Últimos 5 dias)
            </h3>
          </div>
          
          <div className="divide-y divide-slate-100">
            {dailyWeather.length > 0 ? (
              dailyWeather.map((day, idx) => (
                <div key={idx} className="transition-colors">
                  <div 
                    className="p-6 flex items-center justify-between hover:bg-slate-50 cursor-pointer"
                    onClick={() => toggleDay(day.date)}
                  >
                    <div className="flex items-center gap-4 w-1/4">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
                        <Calendar className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{day.date}</p>
                        <p className="text-sm text-slate-500 capitalize">{day.condition}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-8">
                      <div className="flex items-center gap-2" title="Temperatura Mín/Máx">
                        <ArrowDown className="w-4 h-4 text-blue-500" />
                        <span className="font-bold text-slate-700">{day.minTemp.toFixed(0)}°</span>
                        <div className="w-16 h-1 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-blue-500 to-orange-500" 
                            style={{ 
                              width: `${Math.min(100, Math.max(0, ((day.maxTemp - day.minTemp) / 20) * 100))}%`,
                              marginLeft: `${Math.min(100, Math.max(0, ((day.minTemp) / 40) * 100))}%` 
                            }} 
                          />
                        </div>
                        <span className="font-bold text-slate-700">{day.maxTemp.toFixed(0)}°</span>
                        <ArrowUp className="w-4 h-4 text-orange-500" />
                      </div>

                      <div className="flex items-center gap-2 w-24" title="Umidade Média">
                        <Droplets className="w-4 h-4 text-blue-400" />
                        <span className="text-sm font-medium text-slate-600">{day.avgHumidity.toFixed(0)}%</span>
                      </div>

                      <div className="flex items-center gap-2 w-24" title="Probabilidade de Chuva">
                        <Cloud className="w-4 h-4 text-indigo-400" />
                        <span className="text-sm font-medium text-slate-600">{day.rainProb.toFixed(0)}%</span>
                      </div>

                      {expandedDay === day.date ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
                    </div>
                  </div>

                  {expandedDay === day.date && (
                    <div className="bg-slate-50 p-6 border-t border-slate-100">
                      <h4 className="text-sm font-bold text-slate-600 mb-4 uppercase tracking-wider">Detalhes Horários</h4>
                      <div className="overflow-x-auto">
                        <table className="w-full">
                          <thead>
                            <tr className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                              <th className="pb-3">Horário</th>
                              <th className="pb-3">Temp</th>
                              <th className="pb-3">Umidade</th>
                              <th className="pb-3">Vento</th>
                              <th className="pb-3">Pressão</th>
                              <th className="pb-3">Chuva</th>
                              <th className="pb-3">Condição</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-200">
                            {day.logs.map((log, logIdx) => (
                              <tr key={logIdx} className="text-sm text-slate-700">
                                <td className="py-3 font-medium">
                                  {new Date(log.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="py-3 font-bold">{log.temperature.toFixed(1)}°C</td>
                                <td className="py-3">{log.humidity}%</td>
                                <td className="py-3">{log.windSpeed} km/h</td>
                                <td className="py-3">{log.pressure} hPa</td>
                                <td className="py-3">{log.rainProbability}%</td>
                                <td className="py-3 capitalize">{log.description}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-12 text-center text-slate-400">
                Nenhum dado disponível para o período.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
