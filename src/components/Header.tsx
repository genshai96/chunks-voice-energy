import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export function Header() {
  return (
    <motion.header
      className="text-center py-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-center gap-3 mb-2">
        <motion.div
          className="p-2 rounded-xl gradient-primary energy-glow"
          animate={{ 
            boxShadow: [
              '0 0 20px hsl(190 100% 50% / 0.3)',
              '0 0 40px hsl(190 100% 50% / 0.5)',
              '0 0 20px hsl(190 100% 50% / 0.3)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <Zap className="w-6 h-6 text-primary-foreground" />
        </motion.div>
        <h1 className="text-3xl font-display font-bold">
          <span className="bg-gradient-to-r from-primary via-energy-cyan-glow to-accent bg-clip-text text-transparent">
            ĐIỆN ÁP
          </span>
        </h1>
      </div>
      <p className="text-muted-foreground text-sm">
        Voice Energy Measurement
      </p>
    </motion.header>
  );
}
