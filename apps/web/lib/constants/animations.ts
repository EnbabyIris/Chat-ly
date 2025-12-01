export const ANIMATION_CONFIG = {
  spring: {
    type: 'spring' as const,
    stiffness: 300,
    damping: 30,
  },
  springSlow: {
    type: 'spring' as const,
    stiffness: 200,
    damping: 25,
  },
  springFast: {
    type: 'spring' as const,
    stiffness: 400,
    damping: 35,
  },
} as const;

export const TRANSITION_DURATION = {
  fast: 0.2,
  normal: 0.3,
  medium: 0.4,
  slow: 0.6,
} as const;

export const ANIMATION_VARIANTS = {
  fadeIn: {
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    exit: { opacity: 0 },
  },
  slideLeft: {
    initial: { x: -100, opacity: 0, filter: 'blur(10px)' },
    animate: { x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: { x: -100, opacity: 0, filter: 'blur(10px)' },
  },
  slideRight: {
    initial: { x: 80, opacity: 0, filter: 'blur(10px)' },
    animate: { x: 0, opacity: 1, filter: 'blur(0px)' },
    exit: { x: 80, opacity: 0, filter: 'blur(10px)' },
  },
} as const;

