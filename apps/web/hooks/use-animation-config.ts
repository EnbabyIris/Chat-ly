import { ANIMATION_CONFIG, TRANSITION_DURATION } from '@/lib/constants/animations';

export const useAnimationConfig = () => {
  return {
    spring: ANIMATION_CONFIG.spring,
    springSlow: ANIMATION_CONFIG.springSlow,
    springFast: ANIMATION_CONFIG.springFast,
    duration: TRANSITION_DURATION,
  };
};

