import { motion } from 'framer-motion';
import React from 'react';

interface SectionContainerProps {
  title: string;
  subtitle?: string;
  accentColor?: string;
  children: React.ReactNode;
  count?: number;
  className?: string;
}

export function SectionContainer({
  title,
  subtitle,
  accentColor = '#ff8511',
  children,
  count,
  className = '',
}: SectionContainerProps) {
  return (
    <motion.section
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className={`mb-12 ${className}`}
    >
      <div className="flex items-end gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div
            className="w-1 h-6 rounded-full"
            style={{ backgroundColor: accentColor }}
          />
          <h2 className="text-lg font-semibold text-white/90">{title}</h2>
        </div>
        {count !== undefined && (
          <span className="text-xs text-white/20 font-mono">{count} items</span>
        )}
        {subtitle && (
          <span className="text-xs text-white/30">{subtitle}</span>
        )}
      </div>
      {children}
    </motion.section>
  );
}
