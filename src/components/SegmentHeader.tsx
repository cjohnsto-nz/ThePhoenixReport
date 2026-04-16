import { motion, AnimatePresence } from 'framer-motion';
import { usePresentation } from '../PresentationContext';

export function SegmentHeader() {
  const { currentSegment, state } = usePresentation();

  if (!currentSegment) return null;

  const isStandaloneHero =
    state.mode === 'presentation' &&
    (currentSegment.phase === 'intro' || currentSegment.phase === 'outro');
  const isSegmentPage =
    state.mode === 'presentation' &&
    !isStandaloneHero &&
    state.segmentScreen !== 'content';

  if (isStandaloneHero) {
    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={currentSegment.id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="flex items-center justify-center h-[calc(100vh-80px)]"
        >
          <div className="text-center">
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.6 }}
              className="text-5xl md:text-7xl font-bold text-white tracking-tight mb-3"
            >
              {currentSegment.title}
            </motion.h1>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-xl text-white/40 max-w-2xl mx-auto"
            >
              {currentSegment.subtitle}
            </motion.p>
            {currentSegment.phase === 'intro' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-white/30 text-sm"
              >
                by Gene Kim, Kevin Behr &amp; George Spafford
              </motion.p>
            )}
            {currentSegment.phase === 'outro' && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6 }}
                className="mt-6 text-phoenix-400/60 text-lg"
              >
                The full journey revealed
              </motion.p>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }

  if (isSegmentPage) return null;

  // Content segments — compact top bar
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={currentSegment.id}
        initial={{ opacity: 0, x: -12 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 12 }}
        transition={{ duration: 0.4 }}
        className="flex items-center gap-4 mb-4"
      >
        {state.mode === 'presentation' && (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-phoenix-500/10 border border-phoenix-500/20 text-phoenix-400 text-[10px] font-semibold uppercase tracking-wider flex-shrink-0">
            <span className="w-1.5 h-1.5 rounded-full bg-phoenix-400 animate-glow-pulse" />
            {currentSegment.phase}
          </span>
        )}
        <h1 className="text-xl font-bold text-white tracking-tight truncate">
          {currentSegment.title}
        </h1>
        {currentSegment.narrativeArc && state.mode === 'presentation' && (
          <span className="text-xs text-white/30 italic truncate hidden xl:inline">
            &ldquo;{currentSegment.narrativeArc}&rdquo;
          </span>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
