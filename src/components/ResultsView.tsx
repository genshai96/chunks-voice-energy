import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ChevronDown, ChevronUp, Zap, Timer, Volume2, Gauge, Activity } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreDisplay } from './ScoreDisplay';
import { MetricCard } from './MetricCard';
import { AnalysisResult } from '@/lib/audioAnalysis';

interface ResultsViewProps {
  results: AnalysisResult;
  onRetry: () => void;
}

// Light bulb icon component with dynamic glow based on score
function EnergyLight({ score, icon: Icon }: { score: number; icon: React.ElementType }) {
  // Calculate glow intensity based on score
  const intensity = score / 100;
  const isLow = score < 40;
  const isMedium = score >= 40 && score < 70;
  const isHigh = score >= 70;

  // Color based on score
  const getColor = () => {
    if (isHigh) return 'hsl(150, 80%, 50%)'; // Green
    if (isMedium) return 'hsl(45, 100%, 60%)'; // Yellow
    return 'hsl(0, 84%, 60%)'; // Red
  };

  const color = getColor();

  return (
    <motion.div
      className="relative"
      animate={isLow ? {
        opacity: [0.4, 1, 0.4, 0.8, 0.4],
      } : {}}
      transition={isLow ? {
        duration: 1.5,
        repeat: Infinity,
        ease: "easeInOut"
      } : {}}
    >
      {/* Glow effect behind icon */}
      <motion.div
        className="absolute inset-0 rounded-full blur-md"
        style={{
          background: color,
          opacity: intensity * 0.6,
        }}
        animate={isHigh ? {
          scale: [1, 1.3, 1],
          opacity: [intensity * 0.4, intensity * 0.7, intensity * 0.4],
        } : {}}
        transition={isHigh ? {
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        } : {}}
      />
      
      {/* Icon with color */}
      <Icon 
        className="w-6 h-6 relative z-10"
        style={{
          color: color,
          filter: isHigh ? `drop-shadow(0 0 ${8 * intensity}px ${color})` : 'none',
        }}
      />
    </motion.div>
  );
}

export function ResultsView({ results, onRetry }: ResultsViewProps) {
  const [showDetails, setShowDetails] = useState(false);

  const metrics = [
    {
      title: 'Voice Power',
      titleVi: 'Công suất giọng nói',
      score: results.volume.score,
      tag: 'POWER',
      value: `Average: ${results.volume.averageDb.toFixed(1)} dB`,
      rawValue: results.volume.averageDb,
    },
    {
      title: 'Speech Tempo',
      titleVi: 'Nhịp độ nói',
      score: results.speechRate.score,
      tag: 'TEMPO',
      value: `${results.speechRate.wordsPerMinute} WPM`,
      rawValue: results.speechRate.wordsPerMinute,
    },
    {
      title: 'Energy Boost',
      titleVi: 'Tăng cường năng lượng',
      score: results.acceleration.score,
      tag: 'BOOST',
      value: results.acceleration.isAccelerating 
        ? `↑ Power: ${results.acceleration.segment1Volume}→${results.acceleration.segment2Volume}dB | Tempo: ${results.acceleration.segment1Rate}→${results.acceleration.segment2Rate}WPM`
        : `Power: ${results.acceleration.segment1Volume}→${results.acceleration.segment2Volume}dB | Tempo: ${results.acceleration.segment1Rate}→${results.acceleration.segment2Rate}WPM`,
      rawValue: results.acceleration.isAccelerating ? 1 : 0,
    },
    {
      title: 'Initial Spark',
      titleVi: 'Khởi động năng lượng',
      score: results.responseTime.score,
      tag: 'SPARK',
      value: `${results.responseTime.responseTimeMs}ms to first sound`,
      rawValue: results.responseTime.responseTimeMs,
    },
    {
      title: 'Energy Flow',
      titleVi: 'Dòng năng lượng',
      score: results.pauseManagement.score,
      tag: 'FLOW',
      value: results.pauseManagement.pauseCount === 0 
        ? 'Continuous flow - Perfect!' 
        : `${results.pauseManagement.pauseCount} breaks (max ${results.pauseManagement.maxPauseDuration}s)`,
      rawValue: results.pauseManagement.pauseCount,
    },
  ];

  // Summary data for quick view with light icons
  const summaryItems = [
    { icon: Volume2, label: 'Power', score: results.volume.score, value: `${results.volume.averageDb.toFixed(0)}dB` },
    { icon: Gauge, label: 'Tempo', score: results.speechRate.score, value: `${results.speechRate.wordsPerMinute}WPM` },
    { icon: Zap, label: 'Boost', score: results.acceleration.score, value: results.acceleration.isAccelerating ? '↑' : '→' },
    { icon: Timer, label: 'Spark', score: results.responseTime.score, value: `${results.responseTime.responseTimeMs}ms` },
    { icon: Activity, label: 'Flow', score: results.pauseManagement.score, value: results.pauseManagement.pauseCount === 0 ? '✓' : `${results.pauseManagement.pauseCount}` },
  ];

  return (
    <motion.div
      className="w-full max-w-md mx-auto px-4 pb-8"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      {/* Overall Score */}
      <ScoreDisplay 
        score={results.overallScore} 
        emotionalFeedback={results.emotionalFeedback} 
      />
      
      {/* Summary Section */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="glass-card p-4">
          <div className="grid grid-cols-5 gap-2">
            {summaryItems.map((item, index) => (
              <motion.div
                key={item.label}
                className="flex flex-col items-center text-center py-2"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.6 + index * 0.1 }}
              >
                <EnergyLight score={item.score} icon={item.icon} />
                <span className="text-lg font-bold text-foreground mt-1">
                  {item.score}
                </span>
                <span className="text-[10px] text-muted-foreground truncate w-full">
                  {item.value}
                </span>
              </motion.div>
            ))}
          </div>
          
          {/* Expand/Collapse Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="w-full mt-3 text-muted-foreground hover:text-foreground"
          >
            {showDetails ? (
              <>
                <ChevronUp className="w-4 h-4 mr-2" />
                Ẩn chi tiết
              </>
            ) : (
              <>
                <ChevronDown className="w-4 h-4 mr-2" />
                Xem chi tiết
              </>
            )}
          </Button>
        </div>
      </motion.div>

      {/* Detailed Metrics (Collapsible) */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 rounded-full gradient-primary" />
              Voice Energy Breakdown
            </h3>
            
            <div className="space-y-3">
              {metrics.map((metric, index) => (
                <MetricCard
                  key={metric.title}
                  {...metric}
                  index={index}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Retry button */}
      <motion.div
        className="mt-8 flex justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
      >
        <Button
          onClick={onRetry}
          size="lg"
          className="gradient-primary text-primary-foreground font-semibold px-8 energy-glow"
        >
          <RotateCcw className="w-5 h-5 mr-2" />
          Thử lại
        </Button>
      </motion.div>
    </motion.div>
  );
}
