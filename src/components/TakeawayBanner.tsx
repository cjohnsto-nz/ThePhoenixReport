import { motion } from 'framer-motion';
import { usePresentation } from '../PresentationContext';

export function TakeawayBanner() {
  const { currentSegment, state } = usePresentation();

  if (!currentSegment?.takeaway) return null;

  // In presentation mode, only show after enough time has passed
  if (state.mode === 'presentation') {
    const segDuration = currentSegment.duration * 60;
    if (state.segmentElapsedSeconds < segDuration * 0.7) return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="px-4 py-2 rounded-lg bg-phoenix-500/[0.06] border border-phoenix-500/10"
    >
      <div className="flex items-center gap-3">
        <span className="text-[10px] uppercase tracking-wider text-phoenix-500/50 font-semibold flex-shrink-0">
          Takeaway
        </span>
        <p className="text-sm font-medium text-white/70">
          {currentSegment.takeaway}
        </p>
      </div>
    </motion.div>
  );
}
