import { motion } from 'framer-motion';
import { Volume2, Zap, TrendingUp, Clock, Pause } from 'lucide-react';

interface MetricCardProps {
  title: string;
  titleVi: string;
  score: number;
  tag: string;
  value?: string;
  index: number;
  rawValue?: number;
}

const tagColors: Record<string, string> = {
  ENERGY: 'bg-tag-energy/20 text-tag-energy border-tag-energy/30',
  FLUENCY: 'bg-tag-fluency/20 text-tag-fluency border-tag-fluency/30',
  DYNAMICS: 'bg-tag-dynamics/20 text-tag-dynamics border-tag-dynamics/30',
  READINESS: 'bg-tag-readiness/20 text-tag-readiness border-tag-readiness/30',
  FLUIDITY: 'bg-tag-fluidity/20 text-tag-fluidity border-tag-fluidity/30',
};

const tagIcons: Record<string, React.ReactNode> = {
  ENERGY: <Volume2 className="w-5 h-5" />,
  FLUENCY: <Zap className="w-5 h-5" />,
  DYNAMICS: <TrendingUp className="w-5 h-5" />,
  READINESS: <Clock className="w-5 h-5" />,
  FLUIDITY: <Pause className="w-5 h-5" />,
};

function getScoreColor(score: number): string {
  if (score >= 71) return 'from-energy-green to-primary';
  if (score >= 41) return 'from-energy-yellow to-energy-green';
  return 'from-energy-red to-energy-yellow';
}

// Performance labels based on metric type and value
function getPerformanceLabel(tag: string, score: number, rawValue?: number): { label: string; color: string } {
  if (tag === 'ENERGY') {
    if (score >= 80) return { label: '🔊 Loud & Clear', color: 'text-energy-green' };
    if (score >= 50) return { label: '🔉 Moderate', color: 'text-energy-yellow' };
    return { label: '🔈 Too Quiet', color: 'text-energy-red' };
  }
  
  if (tag === 'FLUENCY') {
    if (rawValue !== undefined) {
      if (rawValue >= 140 && rawValue <= 180) return { label: '✨ Perfect Pace', color: 'text-energy-green' };
      if (rawValue < 140) return { label: '🐢 Too Slow', color: 'text-energy-yellow' };
      return { label: '🐇 Too Fast', color: 'text-energy-yellow' };
    }
    if (score >= 80) return { label: '✨ Perfect Pace', color: 'text-energy-green' };
    return { label: '⚡ Adjust Speed', color: 'text-energy-yellow' };
  }
  
  if (tag === 'DYNAMICS') {
    if (score >= 70) return { label: '🚀 Dynamic', color: 'text-energy-green' };
    if (score >= 40) return { label: '📊 Moderate', color: 'text-energy-yellow' };
    return { label: '📉 Flat', color: 'text-energy-red' };
  }
  
  if (tag === 'READINESS') {
    if (score >= 80) return { label: '⚡ Quick Start', color: 'text-energy-green' };
    if (score >= 50) return { label: '⏱️ Moderate', color: 'text-energy-yellow' };
    return { label: '🐌 Slow Start', color: 'text-energy-red' };
  }
  
  if (tag === 'FLUIDITY') {
    if (score >= 80) return { label: '🌊 Smooth Flow', color: 'text-energy-green' };
    if (score >= 50) return { label: '💧 Decent', color: 'text-energy-yellow' };
    if (score === 0) return { label: '⏸️ Long Pause', color: 'text-energy-red' };
    return { label: '💦 Choppy', color: 'text-energy-red' };
  }
  
  return { label: '', color: '' };
}

export function MetricCard({ title, titleVi, score, tag, value, index, rawValue }: MetricCardProps) {
  const performanceLabel = getPerformanceLabel(tag, score, rawValue);
  
  return (
    <motion.div
      className="glass-card p-4"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.1 * index, duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${tagColors[tag]}`}>
            {tagIcons[tag]}
          </div>
          <div>
            <h3 className="font-medium text-foreground">{title}</h3>
            <p className="text-xs text-muted-foreground">{titleVi}</p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-2xl font-bold text-foreground">{score}</span>
          <span className="text-sm text-muted-foreground">/100</span>
        </div>
      </div>
      
      {/* Performance Tag */}
      {performanceLabel.label && (
        <div className="mb-2">
          <span className={`text-sm font-medium ${performanceLabel.color}`}>
            {performanceLabel.label}
          </span>
        </div>
      )}
      
      {value && (
        <p className="text-xs text-muted-foreground mb-2">{value}</p>
      )}
      
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${getScoreColor(score)}`}
          initial={{ width: 0 }}
          animate={{ width: `${score}%` }}
          transition={{ delay: 0.2 + 0.1 * index, duration: 0.8, ease: "easeOut" }}
        />
      </div>
      
      <div className="mt-2 flex justify-between items-center">
        <span className={`text-xs px-2 py-1 rounded-full border ${tagColors[tag]}`}>
          {tag}
        </span>
      </div>
    </motion.div>
  );
}
