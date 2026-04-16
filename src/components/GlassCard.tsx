import { motion } from 'framer-motion';
import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  glowColor?: string;
  delay?: number;
  revealed?: boolean;
}

export function GlassCard({
  children,
  className = '',
  onClick,
  glowColor = 'rgba(255, 133, 17, 0.15)',
  delay = 0,
  revealed = true,
}: GlassCardProps) {
  if (!revealed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: Math.min(delay, 0.3),
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={onClick ? {
        scale: 1.04,
        transition: { duration: 0.2 },
      } : undefined}
      whileTap={onClick ? { scale: 0.97 } : undefined}
      onClick={onClick}
      className={`
        relative group
        bg-white/[0.04] backdrop-blur-xl
        border border-white/[0.08]
        rounded-lg
        overflow-hidden
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
      style={{
        boxShadow: `0 0 20px -8px ${glowColor}, inset 0 1px 0 0 rgba(255,255,255,0.06)`,
      }}
    >
      {/* Shimmer effect on hover */}
      {onClick && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-shimmer-gradient bg-[length:200%_100%] animate-shimmer" />
      )}

      {children}
    </motion.div>
  );
}
