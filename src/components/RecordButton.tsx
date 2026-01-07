import { motion } from 'framer-motion';
import { Mic, Square, Loader2 } from 'lucide-react';

interface RecordButtonProps {
  isRecording: boolean;
  isProcessing: boolean;
  audioLevel: number;
  onStart: () => void;
  onStop: () => void;
}

export function RecordButton({ 
  isRecording, 
  isProcessing,
  audioLevel, 
  onStart, 
  onStop 
}: RecordButtonProps) {
  const handleClick = () => {
    if (isProcessing) return;
    if (isRecording) {
      onStop();
    } else {
      onStart();
    }
  };

  return (
    <div className="relative flex items-center justify-center">
      {/* Outer glow rings */}
      {isRecording && (
        <>
          <motion.div
            className="absolute rounded-full bg-destructive/20"
            animate={{
              width: [160, 200 + audioLevel * 60],
              height: [160, 200 + audioLevel * 60],
              opacity: [0.5, 0.1],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeOut",
            }}
          />
          <motion.div
            className="absolute rounded-full bg-destructive/30"
            animate={{
              width: [140, 180 + audioLevel * 40],
              height: [140, 180 + audioLevel * 40],
              opacity: [0.6, 0.2],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: "easeOut",
              delay: 0.2,
            }}
          />
        </>
      )}

      {/* Static glow for idle state */}
      {!isRecording && !isProcessing && (
        <motion.div
          className="absolute w-44 h-44 rounded-full energy-glow"
          animate={{
            opacity: [0.5, 0.8, 0.5],
            scale: [1, 1.02, 1],
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      )}

      {/* Main button */}
      <motion.button
        onClick={handleClick}
        disabled={isProcessing}
        className={`
          relative z-10 w-32 h-32 rounded-full flex items-center justify-center
          transition-all duration-300 cursor-pointer
          ${isRecording 
            ? 'bg-destructive recording-pulse' 
            : isProcessing
              ? 'bg-muted cursor-not-allowed'
              : 'gradient-primary energy-glow hover:scale-105'
          }
        `}
        whileTap={{ scale: 0.95 }}
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", stiffness: 300, damping: 20 }}
      >
        {isProcessing ? (
          <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
        ) : isRecording ? (
          <Square className="w-10 h-10 text-destructive-foreground fill-current" />
        ) : (
          <Mic className="w-12 h-12 text-primary-foreground" />
        )}
      </motion.button>

      {/* Label */}
      <motion.p
        className="absolute -bottom-12 text-sm text-muted-foreground font-medium"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
      >
        {isProcessing 
          ? 'Đang phân tích...' 
          : isRecording 
            ? 'Nhấn để dừng' 
            : 'Nhấn để ghi âm'
        }
      </motion.p>
    </div>
  );
}
