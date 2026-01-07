import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { MetricConfig } from '@/pages/AdminSettings';

interface ScoreRangeChartProps {
  metric: MetricConfig;
}

export function ScoreRangeChart({ metric }: ScoreRangeChartProps) {
  // Generate data points for the scoring curve
  const generateChartData = () => {
    const { min, ideal, max } = metric.thresholds;
    const points = [];
    
    // For metrics where lower is better (like response time)
    const isInverted = metric.id === 'responseTime';
    
    const range = isInverted ? min : max;
    const start = isInverted ? 0 : min;
    
    for (let i = 0; i <= 100; i += 5) {
      const value = start + (range - start) * (i / 100);
      let score = 0;
      
      if (isInverted) {
        // For response time: lower is better
        if (value <= ideal) {
          score = 100;
        } else if (value >= min) {
          score = 0;
        } else {
          score = 100 - ((value - ideal) / (min - ideal)) * 100;
        }
      } else {
        // For other metrics
        if (metric.id === 'speechRate') {
          const idealMin = 140;
          const idealMax = 180;
          if (value >= idealMin && value <= idealMax) {
            score = 100;
          } else if (value < min || value > max) {
            score = 0;
          } else if (value < idealMin) {
            score = ((value - min) / (idealMin - min)) * 100;
          } else {
            score = ((max - value) / (max - idealMax)) * 100;
          }
        } else {
          if (value < min) {
            score = 0;
          } else if (value >= ideal) {
            score = 100;
          } else {
            score = ((value - min) / (ideal - min)) * 100;
          }
        }
      }
      
      points.push({
        value: Math.round(value),
        score: Math.max(0, Math.min(100, Math.round(score))),
      });
    }
    
    return points;
  };

  const data = generateChartData();

  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(190, 100%, 50%)" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="hsl(190, 100%, 50%)" stopOpacity={0.1}/>
            </linearGradient>
          </defs>
          <XAxis 
            dataKey="value" 
            stroke="hsl(215, 20%, 55%)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'hsl(222, 30%, 20%)' }}
            label={{ 
              value: metric.unit, 
              position: 'insideBottomRight', 
              offset: -5,
              fill: 'hsl(215, 20%, 55%)',
              fontSize: 11
            }}
          />
          <YAxis 
            stroke="hsl(215, 20%, 55%)"
            fontSize={12}
            tickLine={false}
            axisLine={{ stroke: 'hsl(222, 30%, 20%)' }}
            domain={[0, 100]}
            label={{ 
              value: 'Score', 
              angle: -90, 
              position: 'insideLeft',
              fill: 'hsl(215, 20%, 55%)',
              fontSize: 11
            }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'hsl(222, 47%, 9%)',
              border: '1px solid hsl(222, 30%, 20%)',
              borderRadius: '8px',
              color: 'hsl(210, 40%, 98%)'
            }}
            labelFormatter={(value) => `${value} ${metric.unit}`}
            formatter={(value: number) => [`${value} points`, 'Score']}
          />
          <ReferenceLine 
            x={metric.thresholds.ideal} 
            stroke="hsl(150, 80%, 50%)" 
            strokeDasharray="3 3"
            label={{ 
              value: 'Ideal', 
              fill: 'hsl(150, 80%, 50%)',
              fontSize: 11
            }}
          />
          <Area
            type="monotone"
            dataKey="score"
            stroke="hsl(190, 100%, 50%)"
            strokeWidth={2}
            fillOpacity={1}
            fill="url(#scoreGradient)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
