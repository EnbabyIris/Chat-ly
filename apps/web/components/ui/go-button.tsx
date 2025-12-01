'use client';

import { motion } from 'framer-motion';

interface GoButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {}

export const GoButton = ({ onClick, ...props }: GoButtonProps) => {
  return (
    <motion.button
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.97 }}
      transition={{ duration: 0.2 }}
      onClick={onClick}
      className="bg-white hover:bg-neutral-50 p-1 px-3 z-10 flex items-center justify-center relative rounded-md font-medium font-saira text-sm text-neutral-600 shadow-[0_1px_2px_0_rgba(0,0,0,0.2)] transition-colors"
      {...props}
    >
      Go
    </motion.button>
  );
};

