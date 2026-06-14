import { motion } from "motion/react";
import { ReactNode } from "react";

interface AnimatedPageProps {
  children: ReactNode;
}

export function AnimatedPage({ children }: AnimatedPageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ 
        duration: 0.45, 
        ease: [0.16, 1, 0.3, 1] // Out-quintic: clean, premium decelerating curve
      }}
    >
      {children}
    </motion.div>
  );
}
