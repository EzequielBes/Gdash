import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { format } from 'date-fns';

interface ForecastData {
  hourly: {
    time: string[];
    precipitation_probability: number[];
  };
}

interface ForecastRainChartProps {
  data: ForecastData | null;
}

export function ForecastRainChart({ data }: ForecastRainChartProps) {
  if (!data || !data.hourly || !data.hourly.time) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        Carregando previsão...
      </div>
    );
  }

  // Find the index of the current hour to start showing forecast from now
  const now = new Date();
  const currentHourIndex = data.hourly.time.findIndex(t => new Date(t).getTime() >= now.getTime() - 3600000);
  const startIndex = currentHourIndex !== -1 ? currentHourIndex : 0;

  // Process next 24 hours from now
  const chartData = data.hourly.time.slice(startIndex, startIndex + 24).map((time, index) => {
    return {
      name: format(new Date(time), 'HH:mm'),
      rainProbability: data.hourly.precipitation_probability[startIndex + index],
    };
  });

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{
          top: 10,
          right: 30,
          left: 0,
          bottom: 0,
        }}
      >
        <defs>
          <linearGradient id="colorRain" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
        <XAxis dataKey="name" stroke="#94a3b8" tick={{fontSize: 12}} tickLine={false} axisLine={false} />
        <YAxis 
          stroke="#94a3b8"
          domain={[0, 100]}
          tick={{fontSize: 12}}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
          cursor={{ stroke: '#6366f1', strokeWidth: 1, strokeDasharray: '5 5' }}
        />
        <Legend wrapperStyle={{ paddingTop: '10px' }} />
        <Area 
          type="monotone" 
          dataKey="rainProbability" 
          stroke="#6366f1" 
          strokeWidth={3}
          fillOpacity={1} 
          fill="url(#colorRain)" 
          name="Previsão de Chuva (Próx. 24h)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
