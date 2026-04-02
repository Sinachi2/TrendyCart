import { motion, type Variants } from "framer-motion";
import { type ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  direction?: "up" | "down" | "left" | "right";
  duration?: number;
  once?: boolean;
}

const getVariants = (direction: string, distance = 40): Variants => {
  const dirs: Record<string, { x?: number; y?: number }> = {
    up: { y: distance },
    down: { y: -distance },
    left: { x: distance },
    right: { x: -distance },
  };
  const d = dirs[direction] || dirs.up;
  return {
    hidden: { opacity: 0, ...d },
    visible: { opacity: 1, x: 0, y: 0 },
  };
};

const ScrollReveal = ({
  children,
  className,
  delay = 0,
  direction = "up",
  duration = 0.6,
  once = true,
}: ScrollRevealProps) => (
  <motion.div
    className={className}
    variants={getVariants(direction)}
    initial="hidden"
    whileInView="visible"
    viewport={{ once, amount: 0.15 }}
    transition={{ duration, delay, ease: [0.25, 0.1, 0.25, 1] }}
  >
    {children}
  </motion.div>
);

export default ScrollReveal;
