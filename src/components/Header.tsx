import { motion } from "framer-motion";
import { Settings, Sun, Moon } from "lucide-react";
import { Link } from "react-router-dom";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import logo from "@/assets/logo.png";

export function Header() {
  const { theme, setTheme } = useTheme();

  return (
    <motion.header
      className="py-8 px-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="flex items-center justify-between max-w-md mx-auto">
        {/* Theme Toggle */}
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
          className="text-muted-foreground hover:text-foreground hover:bg-secondary"
        >
          <Sun className="w-5 h-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
          <Moon className="absolute w-5 h-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          <span className="sr-only">Toggle theme</span>
        </Button>

        {/* Logo */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-3 mb-2">
            <motion.div
              className="overflow-hidden rounded-xl energy-glow"
              animate={{
                boxShadow: [
                  "0 0 20px hsl(0 72% 51% / 0.3)",
                  "0 0 40px hsl(0 72% 51% / 0.5)",
                  "0 0 20px hsl(0 72% 51% / 0.3)",
                ],
              }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <img src={logo} alt="CHUNKS" className="h-10 w-auto" />
            </motion.div>
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
