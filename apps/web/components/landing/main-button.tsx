'use client';

import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { MAIN_BUTTON_CONFIG } from '@/lib/constants/main-button';

interface MainButtonProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const MainButton = ({ children, className = '', onClick }: MainButtonProps) => {
  const { base, shadow, dropShadow, hover, animation } = MAIN_BUTTON_CONFIG;
  const router = useRouter();

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else {
      // Default behavior: navigate to auth page
      router.push('/auth');
    }
  };

  return (
    <motion.button
      whileTap={{ scale: animation.scale }}
      whileHover={{ backgroundImage: hover.backgroundImage }}
      transition={{ duration: animation.duration }}
      className={`${base} ${shadow} ${dropShadow} ${className}`}
      onClick={handleClick}
    >
      {children}
    </motion.button>
  );
};

