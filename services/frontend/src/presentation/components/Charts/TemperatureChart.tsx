import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { WeatherLog } from '@/infrastructure/api/weather';
import { format } from 'date-fns';

interface TemperatureChartProps {
  data: WeatherLog[];
}

export function TemperatureChart({ data }: TemperatureChartProps) {
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
        const temp = typeof log.temperature === 'number' ? log.temperature : 0;
        return {
          name: format(new Date(log.timestamp), 'HH:mm'),
          timestamp: new Date(log.timestamp).getTime(),
          temperature: parseFloat(temp.toFixed(1)),
        };
      } catch (err) {
        return null;
      }
    })
    .filter((item) => item !== null)
    .sort((a, b) => ((a as any)?.timestamp || 0) - ((b as any)?.timestamp || 0));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{
          top: 5,
          right: 30,
          left: 0,
          bottom: 5,
        }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
        <XAxis dataKey="name" stroke="#6b7280" />
        <YAxis 
          label={{ value: 'Temp (°C)', angle: -90, position: 'insideLeft', offset: 10 }} 
          stroke="#6b7280"
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
          labelStyle={{ color: '#1f2937' }}
        />
        <Legend />
        <Line 
          type="monotone" 
          dataKey="temperature" 
          stroke="#3b82f6" 
          strokeWidth={2}
          dot={{ fill: '#3b82f6', r: 4 }}
          activeDot={{ r: 6 }}
          name="Temperatura"
          isAnimationActive={true}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
