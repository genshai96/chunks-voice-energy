import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronDown, ChevronUp, Volume2, Zap, TrendingUp, Clock, Waves } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScoreDisplay } from "./ScoreDisplay";
import { MetricCard } from "./MetricCard";
import { AnalysisResult } from "@/lib/audioAnalysis";

interface ResultsViewProps {
  results: AnalysisResult;
  onRetry: () => void;
}

export function ResultsView({ results, onRetry }: ResultsViewProps) {
  const [showDetails, setShowDetails] = useState(false);

  const metrics = [
    {
      title: "Voice Power",
      titleVi: "Công suất giọng nói",
      score: results.volume.score,
      value: `Average: ${results.volume.averageDb.toFixed(1)} dB`,
      rawValue: results.volume.averageDb,
      tag: "POWER",
      icon: Volume2,
    },
    {
      title: "Speech Tempo",
      titleVi: "Nhịp độ nói",
      score: results.speechRate.score,
      value: `${results.speechRate.wordsPerMinute} WPM`,
      rawValue: results.speechRate.wordsPerMinute,
      tag: "TEMPO",
      icon: Zap,
    },
    {
      title: "Energy Boost",
      titleVi: "Tăng cường năng lượng",
      score: results.acceleration.score,
      value: results.acceleration.isAccelerating
        ? `↑ Power: ${results.acceleration.segment1Volume}→${results.acceleration.segment2Volume}dB | Tempo: ${results.acceleration.segment1Rate}→${results.acceleration.segment2Rate}WPM`
        : `Power: ${results.acceleration.segment1Volume}→${results.acceleration.segment2Volume}dB | Tempo: ${results.acceleration.segment1Rate}→${results.acceleration.segment2Rate}WPM`,
      rawValue: results.acceleration.isAccelerating ? 1 : 0,
      tag: "BOOST",
      icon: TrendingUp,
    },
    {
      title: "Initial Spark",
      titleVi: "Khởi động năng lượng",
      score: results.responseTime.score,
      value: `${results.responseTime.responseTimeMs}ms to first sound`,
      rawValue: results.responseTime.responseTimeMs,
      tag: "SPARK",
      icon: Clock,
    },
    {
      title: "Energy Flow",
      titleVi: "Dòng năng lượng",
      score: results.pauseManagement.score,
      value:
        results.pauseManagement.pauseCount === 0
          ? "Continuous flow - Perfect!"
          : `${results.pauseManagement.pauseCount} breaks (max ${results.pauseManagement.maxPauseDuration}s)`,
      rawValue: results.pauseManagement.pauseCount,
      tag: "FLOW",
      icon: Waves,
    },
  ];

  const getScoreColor = (score: number) => {
    if (score >= 70) return "text-green-500";
    if (score >= 40) return "text-yellow-500";
    return "text-red-500";
  };

  return (
    <motion.div className="w-full max-w-md mx-auto px-4 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Overall Score */}
      <ScoreDisplay score={results.overallScore} emotionalFeedback={results.emotionalFeedback} />

      {/* Summary View */}
      <motion.div
        className="mt-6 glass-card p-4"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex justify-between items-center gap-4">
          {metrics.map((metric) => {
            const IconComponent = metric.icon;
            const shortValue = metric.tag === "POWER" 
              ? `${results.volume.averageDb.toFixed(0)}dB`
              : metric.tag === "TEMPO"
              ? `${results.speechRate.wordsPerMinute}WPM`
              : metric.tag === "BOOST"
              ? (results.acceleration.isAccelerating ? "↑" : "→")
              : metric.tag === "SPARK"
              ? `${results.responseTime.responseTimeMs}ms`
              : `${results.pauseManagement.pauseCount}`;
            return (
              <div key={metric.tag} className="flex flex-col items-center gap-1">
                <IconComponent className={`w-6 h-6 ${getScoreColor(metric.score)}`} />
                <span className={`text-xl font-bold ${getScoreColor(metric.score)}`}>
                  {metric.score}
                </span>
                <span className="text-xs text-muted-foreground">{shortValue}</span>
              </div>
            );
          })}
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full mt-4 text-muted-foreground hover:text-foreground"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-4 h-4 mr-1" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4 mr-1" />
              View Details
            </>
          )}
        </Button>
      </motion.div>

      {/* Details View */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            className="mt-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
          >
            <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
              <span className="w-1 h-6 rounded-full gradient-primary" />
              Voice Energy Breakdown
            </h3>

            <div className="space-y-3">
              {metrics.map((metric, index) => (
                <MetricCard key={metric.title} {...metric} index={index} />
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
