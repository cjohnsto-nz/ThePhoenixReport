import { motion, AnimatePresence } from 'framer-motion';
import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  accentColor?: string;
}

export function Modal({ isOpen, onClose, children, accentColor = '#ff8511' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const handleKey = (e: KeyboardEvent) => {
        if (e.key === 'Escape') onClose();
      };
      window.addEventListener('keydown', handleKey);
      return () => {
        document.body.style.overflow = '';
        window.removeEventListener('keydown', handleKey);
      };
    } else {
      document.body.style.overflow = '';
    }
  }, [isOpen, onClose]);

  if (typeof document === 'undefined') {
    return null;
  }

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-[#050812]/72 backdrop-blur-xl"
            onClick={onClose}
          />

          {/* Content */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="relative w-full max-w-5xl max-h-[94vh] overflow-y-auto rounded-3xl backdrop-blur-2xl border border-white/[0.08] shadow-2xl"
            style={{
              background: 'rgba(5,8,18,0.95)',
              boxShadow: `0 0 80px -20px ${accentColor}40, 0 25px 50px -12px rgba(0,0,0,0.5)`,
            }}
          >
            {/* Top accent line */}
            <div
              className="absolute top-0 left-0 right-0 h-[2px]"
              style={{
                background: `linear-gradient(90deg, transparent, ${accentColor}, transparent)`,
              }}
            />

            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/45 hover:text-white transition-all z-10"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <div className="p-7 md:p-8 lg:p-10 text-base md:text-lg [&_p]:leading-relaxed [&_li]:leading-relaxed">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
    , document.body
  );
}
