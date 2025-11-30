'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MAIN_BUTTON_CONFIG } from '@/lib/constants/main-button';

interface MainButtonProps {
  children: React.ReactNode;
  className?: string;
}

export const MainButton = ({ children, className = '' }: MainButtonProps) => {
  const router = useRouter();
  const { base, shadow, dropShadow, hover, animation } = MAIN_BUTTON_CONFIG;

  const handleClick = () => {
    router.push('/auth');
  };

  return (
    <motion.button
      onClick={handleClick}
      whileTap={{ scale: animation.scale }}
      whileHover={{ backgroundImage: hover.backgroundImage }}
      transition={{ duration: animation.duration }}
      className={`${base} ${shadow} ${dropShadow} ${className}`}
    >
      {children}
    </motion.button>
  );
};

