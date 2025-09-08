import React from 'react';
import { motion } from 'framer-motion';

interface HighlightLineProps {
  children: React.ReactNode;
  className?: string;
}

export const HighlightLine: React.FC<HighlightLineProps> = ({ children, className }) => {
  return (
    <span className={`relative inline-block ${className || ''}`}>
      <motion.span
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-3 rounded-md"
        initial={{ scaleX: 0, opacity: 0.6 }}
        animate={{ scaleX: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
        style={{ transformOrigin: 'left', background: 'linear-gradient(90deg, #fed7aa, #fde68a)' }}
      />
      <span className="relative z-10">{children}</span>
    </span>
  );
};


