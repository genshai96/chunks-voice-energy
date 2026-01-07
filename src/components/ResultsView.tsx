import { motion } from 'framer-motion';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScoreDisplay } from './ScoreDisplay';
import { MetricCard } from './MetricCard';
import { AnalysisResult } from '@/lib/audioAnalysis';

interface ResultsViewProps {
  results: AnalysisResult;
  onRetry: () => void;
}

export function ResultsView({ results, onRetry }: ResultsViewProps) {
  const metrics = [
    {
      title: 'Volume Level',
      titleVi: 'Độ lớn âm thanh',
      score: results.volume.score,
      tag: results.volume.tag,
      value: `Average: ${results.volume.averageDb.toFixed(1)} dB`,
      rawValue: results.volume.averageDb,
    },
    {
      title: 'Speech Rate',
      titleVi: 'Tốc độ nói',
      score: results.speechRate.score,
      tag: results.speechRate.tag,
      value: `${results.speechRate.wordsPerMinute} WPM`,
      rawValue: results.speechRate.wordsPerMinute,
    },
    {
      title: 'Acceleration',
      titleVi: 'Tăng tốc & âm lượng',
      score: results.acceleration.score,
      tag: results.acceleration.tag,
      value: `${results.acceleration.accelerationEvents} acceleration events`,
      rawValue: results.acceleration.accelerationEvents,
    },
    {
      title: 'Response Time',
      titleVi: 'Tốc độ phản hồi',
      score: results.responseTime.score,
      tag: results.responseTime.tag,
      value: `${results.responseTime.responseTimeMs}ms to first speech`,
      rawValue: results.responseTime.responseTimeMs,
    },
    {
      title: 'Pause Management',
      titleVi: 'Quản lý ngừng nghỉ',
      score: results.pauseManagement.score,
      tag: results.pauseManagement.tag,
      value: `${results.pauseManagement.pauseCount} pauses (avg ${results.pauseManagement.avgPauseDuration}s)`,
      rawValue: results.pauseManagement.pauseCount,
    },
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
      
      {/* Metrics */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
          <span className="w-1 h-6 rounded-full gradient-primary" />
          Metric Breakdown
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
