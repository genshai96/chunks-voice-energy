import { motion } from "framer-motion";
import { Zap, Settings } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <motion.header
      className="py-8 px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Empty spacer for balance */}
        <div className="w-10" />

        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <motion.div
              className="p-2 rounded-xl gradient-primary energy-glow"
              animate={{
                boxShadow: [
                  "0 0 20px hsl(190 100% 50% / 0.3)",
                  "0 0 40px hsl(190 100% 50% / 0.5)",
                  "0 0 20px hsl(190 100% 50% / 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Zap className="w-6 h-6 text-primary-foreground" />
            </motion.div>
            <h1 className="text-3xl font-display font-bold">
              <span className="bg-gradient-to-r from-primary via-energy-cyan-glow to-accent bg-clip-text text-transparent">
                CHUNKS
              </span>
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">Voice Energy Measurement</p>
        </div>

        {/* Settings Button */}
        <Link to="/admin">
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground hover:text-foreground hover:bg-secondary"
          >
            <Settings className="w-5 h-5" />
          </Button>
        </Link>
      </div>
    </motion.header>
  );
}
