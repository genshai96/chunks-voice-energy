import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface ScoreDisplayProps {
  score: number;
  emotionalFeedback: 'excellent' | 'good' | 'poor';
}

const emojis = {
  excellent: '😊',
  good: '😐',
  poor: '😢',
};

const feedbackText = {
  excellent: { en: 'High Energy!', vi: 'Năng lượng cao!' },
  good: { en: 'Good Energy', vi: 'Năng lượng ổn' },
  poor: { en: 'Low Energy', vi: 'Năng lượng thấp' },
};

const feedbackColors = {
  excellent: 'from-energy-green to-primary',
  good: 'from-energy-yellow to-energy-green',
  poor: 'from-energy-red to-energy-yellow',
};

export function ScoreDisplay({ score, emotionalFeedback }: ScoreDisplayProps) {
  const [displayScore, setDisplayScore] = useState(0);
  
  useEffect(() => {
    const duration = 1500;
    const steps = 60;
    const increment = score / steps;
    let current = 0;
    
    const timer = setInterval(() => {
      current += increment;
      if (current >= score) {
        setDisplayScore(score);
        clearInterval(timer);
      } else {
        setDisplayScore(Math.floor(current));
      }
    }, duration / steps);
    
    return () => clearInterval(timer);
  }, [score]);

  return (
    <motion.div
      className="text-center py-8"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
    >
      {/* Emoji */}
      <motion.div
        className="text-7xl mb-4"
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
      >
        {emojis[emotionalFeedback]}
      </motion.div>
      
      {/* Score Circle */}
      <div className="relative inline-flex items-center justify-center mb-4">
        {/* Outer ring */}
        <svg className="w-48 h-48 -rotate-90">
          <circle
            cx="96"
            cy="96"
            r="88"
            stroke="currentColor"
            strokeWidth="8"
            fill="none"
            className="text-muted"
          />
          <motion.circle
            cx="96"
            cy="96"
            r="88"
            stroke="url(#scoreGradient)"
            strokeWidth="8"
            fill="none"
            strokeLinecap="round"
            initial={{ strokeDasharray: "0 553" }}
            animate={{ strokeDasharray: `${(score / 100) * 553} 553` }}
            transition={{ delay: 0.5, duration: 1.5, ease: "easeOut" }}
          />
          <defs>
            <linearGradient id="scoreGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={
                emotionalFeedback === 'excellent' ? 'hsl(150, 80%, 50%)' :
                emotionalFeedback === 'good' ? 'hsl(45, 100%, 60%)' : 'hsl(0, 84%, 60%)'
              } />
              <stop offset="100%" stopColor="hsl(190, 100%, 50%)" />
            </linearGradient>
          </defs>
        </svg>
        
        {/* Score number */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span
            className={`text-5xl font-display font-bold bg-gradient-to-r ${feedbackColors[emotionalFeedback]} bg-clip-text text-transparent`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            {displayScore}
          </motion.span>
          <span className="text-muted-foreground text-sm">/100 points</span>
        </div>
      </div>
      
      {/* Feedback text - English only */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
      >
        <h2 className={`text-2xl font-display font-bold bg-gradient-to-r ${feedbackColors[emotionalFeedback]} bg-clip-text text-transparent`}>
          {feedbackText[emotionalFeedback].en}
        </h2>
      </motion.div>
    </motion.div>
  );
}
