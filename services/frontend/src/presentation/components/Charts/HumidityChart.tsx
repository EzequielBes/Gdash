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
import { WeatherLog } from '@/infrastructure/api/weather';
import { format } from 'date-fns';

interface HumidityChartProps {
  data: WeatherLog[];
}

export function HumidityChart({ data }: HumidityChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-gray-500">
        No data available
      </div>
    );
  }

  const chartData = data
    .map((log) => {
      try {
        const humidity = typeof log.humidity === 'number' ? log.humidity : 0;
        return {
          name: format(new Date(log.timestamp), 'HH:mm'),
          timestamp: new Date(log.timestamp).getTime(),
          humidity: parseFloat(humidity.toFixed(1)),
        };
      } catch (err) {
        return null;
      }
    })
    .filter((item) => item !== null)
    .sort((a, b) => ((a as any)?.timestamp || 0) - ((b as any)?.timestamp || 0));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <defs>
          <linearGradient id="colorHumidity" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#06b6d4" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis 
          label={{ value: 'Humidity (%)', angle: -90, position: 'insideLeft', offset: 10 }} 
          stroke="#6b7280"
          domain={[0, 100]}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
          labelStyle={{ color: '#1f2937' }}
        />
        <Legend />
        <Area 
          type="monotone" 
          dataKey="humidity" 
          stroke="#06b6d4" 
          strokeWidth={2}
          fillOpacity={1} 
          fill="url(#colorHumidity)"
          name="Umidade"
          isAnimationActive={true}
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}
