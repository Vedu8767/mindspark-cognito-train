import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';
import type { ChartDataPoint } from '@/lib/patientDataService';

interface CognitiveChartProps {
  data?: ChartDataPoint[];
}

const CognitiveChart = ({ data }: CognitiveChartProps) => {
  const chartData = data && data.length > 0 ? data : [];

  if (chartData.length === 0) {
    return (
      <div className="glass-card p-6 animate-slide-up">
        <h3 className="text-lg font-semibold text-foreground">Cognitive Progress</h3>
        <p className="text-sm text-muted-foreground mb-4">Your cognitive domain scores over the past week</p>
        <div className="h-64 flex items-center justify-center text-muted-foreground">
          Play some games to see your progress chart!
        </div>
      </div>
    );
  }

  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Cognitive Progress</h3>
          <p className="text-sm text-muted-foreground">Your cognitive domain scores over the past week</p>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)',
                  color: 'hsl(var(--foreground))'
                }}
                labelStyle={{ color: 'hsl(var(--foreground))' }}
              />
              <Line type="monotone" dataKey="memory" stroke="hsl(200 70% 55%)" strokeWidth={3} dot={{ fill: 'hsl(200 70% 55%)', strokeWidth: 2, r: 4 }} name="Memory" />
              <Line type="monotone" dataKey="attention" stroke="hsl(35 75% 60%)" strokeWidth={3} dot={{ fill: 'hsl(35 75% 60%)', strokeWidth: 2, r: 4 }} name="Attention" />
              <Line type="monotone" dataKey="executive" stroke="hsl(270 60% 60%)" strokeWidth={3} dot={{ fill: 'hsl(270 60% 60%)', strokeWidth: 2, r: 4 }} name="Executive Function" />
              <Line type="monotone" dataKey="processing" stroke="hsl(145 65% 50%)" strokeWidth={3} dot={{ fill: 'hsl(145 65% 50%)', strokeWidth: 2, r: 4 }} name="Processing Speed" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cognitive-memory"></div>
            <span className="text-sm text-muted-foreground">Memory</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cognitive-attention"></div>
            <span className="text-sm text-muted-foreground">Attention</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cognitive-executive"></div>
            <span className="text-sm text-muted-foreground">Executive</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 rounded-full bg-cognitive-processing"></div>
            <span className="text-sm text-muted-foreground">Processing</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CognitiveChart;
