import React from 'react';
import { motion } from 'framer-motion';

interface BackgroundProps {
  className?: string;
  children?: React.ReactNode;
}

export const Background: React.FC<BackgroundProps> = ({ className, children }) => {
  return (
    <div className={`min-h-screen relative overflow-hidden ${className || ''}`}>
      <motion.div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        initial={{ backgroundPosition: '0% 50%' }}
        animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage:
            'radial-gradient(1200px 600px at -10% -20%, rgba(255, 200, 150, 0.25), transparent 60%),' +
            'radial-gradient(1000px 500px at 110% 120%, rgba(255, 180, 120, 0.25), transparent 60%),' +
            'linear-gradient(135deg, #fff7ed, #fff1d6, #fef3c7)',
          backgroundSize: '200% 200%',
        }}
      />

      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};


