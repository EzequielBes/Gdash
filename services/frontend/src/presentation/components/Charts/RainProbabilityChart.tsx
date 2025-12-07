import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { WeatherLog } from '@/infrastructure/api/weather';
import { format } from 'date-fns';

interface RainProbabilityChartProps {
  data: WeatherLog[];
}

export function RainProbabilityChart({ data }: RainProbabilityChartProps) {
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
        const rainProb = typeof log.rainProbability === 'number' ? log.rainProbability : 0;
        return {
          name: format(new Date(log.timestamp), 'HH:mm'),
          timestamp: new Date(log.timestamp).getTime(),
          rainProbability: parseFloat(rainProb.toFixed(1)),
        };
      } catch (err) {
        return null;
      }
    })
    .filter((item) => item !== null)
    .sort((a, b) => ((a as any)?.timestamp || 0) - ((b as any)?.timestamp || 0));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
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
          label={{ value: 'Rain Prob. (%)', angle: -90, position: 'insideLeft', offset: 10 }} 
          stroke="#6b7280"
          domain={[0, 100]}
        />
        <Tooltip 
          contentStyle={{ backgroundColor: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '8px' }}
          labelStyle={{ color: '#1f2937' }}
          cursor={{ fill: 'rgba(59, 130, 246, 0.1)' }}
        />
        <Legend />
        <Bar 
          dataKey="rainProbability" 
          fill="#3b82f6" 
          radius={[8, 8, 0, 0]}
          name="Probabilidade de Chuva (IA)"
          isAnimationActive={true}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
