import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { MetricConfig } from '@/pages/AdminSettings';

interface MetricConfigCardProps {
  metric: MetricConfig;
  isSelected: boolean;
  onClick: () => void;
  onWeightChange: (weight: number) => void;
}

export function MetricConfigCard({ 
  metric, 
  isSelected, 
  onClick, 
  onWeightChange 
}: MetricConfigCardProps) {
  return (
    <motion.div
      className={`glass-card p-4 cursor-pointer transition-all duration-200 ${
        isSelected 
          ? 'ring-2 ring-primary border-primary/50' 
          : 'hover:border-primary/30'
      }`}
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="flex items-center gap-3 mb-3">
        <div className={`p-2 rounded-lg bg-${metric.tagColor}/20 text-${metric.tagColor}`}>
          {metric.icon}
        </div>
        <div className="flex-1">
          <h3 className="font-medium text-foreground text-sm">{metric.name}</h3>
          <p className="text-xs text-muted-foreground">{metric.nameVi}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-xs font-medium bg-${metric.tagColor}/20 text-${metric.tagColor}`}>
          {metric.tag}
        </span>
      </div>

      <div className="space-y-2" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">Weight</span>
          <span className="text-sm font-bold text-primary">{metric.weight}%</span>
        </div>
        <Slider
          value={[metric.weight]}
          onValueChange={([v]) => onWeightChange(v)}
          min={0}
          max={50}
          step={5}
          className="w-full"
        />
      </div>
    </motion.div>
  );
}
