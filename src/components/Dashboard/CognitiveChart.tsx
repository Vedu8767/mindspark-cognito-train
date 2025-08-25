import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const data = [
  { date: '1 week ago', memory: 65, attention: 72, executive: 58, processing: 70 },
  { date: '6 days ago', memory: 68, attention: 75, executive: 62, processing: 73 },
  { date: '5 days ago', memory: 70, attention: 78, executive: 65, processing: 75 },
  { date: '4 days ago', memory: 73, attention: 80, executive: 68, processing: 78 },
  { date: '3 days ago', memory: 75, attention: 82, executive: 70, processing: 80 },
  { date: '2 days ago', memory: 78, attention: 85, executive: 73, processing: 82 },
  { date: 'Yesterday', memory: 80, attention: 87, executive: 75, processing: 85 },
  { date: 'Today', memory: 82, attention: 89, executive: 78, processing: 87 },
];

const CognitiveChart = () => {
  return (
    <div className="glass-card p-6 animate-slide-up">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-foreground">Cognitive Progress</h3>
          <p className="text-sm text-muted-foreground">Your cognitive domain scores over the past week</p>
        </div>
        
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
              />
              <YAxis 
                stroke="#64748b"
                fontSize={12}
                tickLine={false}
                axisLine={false}
                domain={[0, 100]}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  boxShadow: '0 4px 20px -4px rgba(0, 0, 0, 0.1)'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="memory" 
                stroke="hsl(200 70% 55%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(200 70% 55%)', strokeWidth: 2, r: 4 }}
                name="Memory"
              />
              <Line 
                type="monotone" 
                dataKey="attention" 
                stroke="hsl(35 75% 60%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(35 75% 60%)', strokeWidth: 2, r: 4 }}
                name="Attention"
              />
              <Line 
                type="monotone" 
                dataKey="executive" 
                stroke="hsl(270 60% 60%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(270 60% 60%)', strokeWidth: 2, r: 4 }}
                name="Executive Function"
              />
              <Line 
                type="monotone" 
                dataKey="processing" 
                stroke="hsl(145 65% 50%)" 
                strokeWidth={3}
                dot={{ fill: 'hsl(145 65% 50%)', strokeWidth: 2, r: 4 }}
                name="Processing Speed"
              />
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