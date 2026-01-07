import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, ChevronDown, ChevronUp } from "lucide-react";
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
      tag: "POWER",
      value: `Average: ${results.volume.averageDb.toFixed(1)} dB`,
      rawValue: results.volume.averageDb,
    },
    {
      title: "Speech Tempo",
      titleVi: "Nhịp độ nói",
      score: results.speechRate.score,
      tag: "TEMPO",
      value: `${results.speechRate.wordsPerMinute} WPM`,
      rawValue: results.speechRate.wordsPerMinute,
    },
    {
      title: "Energy Boost",
      titleVi: "Tăng cường năng lượng",
      score: results.acceleration.score,
      tag: "BOOST",
      value: results.acceleration.isAccelerating
        ? `↑ Power: ${results.acceleration.segment1Volume}→${results.acceleration.segment2Volume}dB | Tempo: ${results.acceleration.segment1Rate}→${results.acceleration.segment2Rate}WPM`
        : `Power: ${results.acceleration.segment1Volume}→${results.acceleration.segment2Volume}dB | Tempo: ${results.acceleration.segment1Rate}→${results.acceleration.segment2Rate}WPM`,
      rawValue: results.acceleration.isAccelerating ? 1 : 0,
    },
    {
      title: "Initial Spark",
      titleVi: "Khởi động năng lượng",
      score: results.responseTime.score,
      tag: "SPARK",
      value: `${results.responseTime.responseTimeMs}ms to first sound`,
      rawValue: results.responseTime.responseTimeMs,
    },
    {
      title: "Energy Flow",
      titleVi: "Dòng năng lượng",
      score: results.pauseManagement.score,
      tag: "FLOW",
      value:
        results.pauseManagement.pauseCount === 0
          ? "Continuous flow - Perfect!"
          : `${results.pauseManagement.pauseCount} breaks (max ${results.pauseManagement.maxPauseDuration}s)`,
      rawValue: results.pauseManagement.pauseCount,
    },
  ];

  return (
    <motion.div className="w-full max-w-md mx-auto px-4 pb-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      {/* Overall Score */}
      <ScoreDisplay score={results.overallScore} emotionalFeedback={results.emotionalFeedback} />

      {/* Summary View - Always visible */}
      <motion.div
        className="mt-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
      >
        {/* Quick Summary - 5 metric scores in compact view */}
        <div className="glass-card p-4 mb-4">
          <div className="grid grid-cols-5 gap-2">
            {metrics.map((metric) => (
              <div key={metric.tag} className="text-center">
                <div
                  className={`text-lg font-bold ${
                    metric.score >= 70
                      ? "text-energy-green"
                      : metric.score >= 40
                      ? "text-energy-yellow"
                      : "text-energy-red"
                  }`}
                >
                  {metric.score}
                </div>
                <div className="text-[10px] text-muted-foreground uppercase tracking-wider">
                  {metric.tag}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Toggle Details Button */}
        <Button
          variant="ghost"
          onClick={() => setShowDetails(!showDetails)}
          className="w-full flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground"
        >
          {showDetails ? (
            <>
              <ChevronUp className="w-4 h-4" />
              Hide Details
            </>
          ) : (
            <>
              <ChevronDown className="w-4 h-4" />
              View Details
            </>
          )}
        </Button>

        {/* Detailed Metrics - Only when expanded */}
        <AnimatePresence>
          {showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              <div className="mt-4">
                <h3 className="text-lg font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                  <span className="w-1 h-6 rounded-full gradient-primary" />
                  Voice Energy Breakdown
                </h3>

                <div className="space-y-3">
                  {metrics.map((metric, index) => (
                    <MetricCard key={metric.title} {...metric} index={index} />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          Try again
        </Button>
      </motion.div>
    </motion.div>
  );
}
