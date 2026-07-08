/**
 * Motion language constants — docs/10-design-system.md §5.
 * Every animated component draws from these; no ad-hoc durations.
 */
import type { Transition, Variants } from "framer-motion";

export const DURATION = {
  micro: 0.12,
  standard: 0.24,
  data: 0.4,
  celebration: 1.2,
} as const;

/** ease-out-quint — entrances */
export const EASE_OUT = [0.22, 1, 0.36, 1] as const;

export const SPRING: Transition = {
  type: "spring",
  stiffness: 260,
  damping: 24,
};

export const fadeRise: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: DURATION.standard, ease: EASE_OUT },
  },
};

/** Stagger children entrance for lists/grids of cards. */
export const staggerChildren: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.05 } },
};
