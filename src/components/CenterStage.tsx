import { motion, AnimatePresence } from 'framer-motion';
import type { Challenge, Character, ConceptItem, WayItem, Epic } from '../types';
import { ChallengeCard } from './ChallengeCard';
import { CharacterCard } from './CharacterCard';
import { ConceptCard } from './ConceptCard';
import { EpicCard } from './EpicCard';

interface CenterStageProps {
  item: {
    type: 'challenge' | 'concept' | 'character' | 'epic';
    data: Challenge | Character | ConceptItem | WayItem | Epic;
  } | null;
  revealedIds: Set<string>;
  onDismiss: () => void;
}

export function CenterStage({ item, revealedIds, onDismiss }: CenterStageProps) {
  return (
    <AnimatePresence>
      {item && (
        <motion.div
          key={`stage-${(item.data as { id: string }).id}`}
          className="fixed inset-0 z-40 flex items-center justify-center pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {/* Subtle backdrop */}
          <motion.div
            className="absolute inset-0 bg-navy-950/60 backdrop-blur-sm pointer-events-auto"
            onClick={onDismiss}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Center card — large format */}
          <motion.div
            className="relative z-10 w-full max-w-lg mx-4 pointer-events-auto"
            initial={{ opacity: 0, scale: 0.7, y: 40 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.85, y: -20 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Glow ring */}
            <div
              className="absolute -inset-1 rounded-3xl blur-xl opacity-40"
              style={{ backgroundColor: getItemColor(item) }}
            />

            <div className="relative">
              {item.type === 'challenge' && (
                <ChallengeCard
                  challenge={item.data as Challenge}
                  revealed={true}
                  index={0}
                />
              )}
              {item.type === 'character' && (
                <CharacterCard
                  character={item.data as Character}
                  revealed={true}
                  index={0}
                />
              )}
              {item.type === 'concept' && (
                <ConceptCard
                  concept={item.data as ConceptItem | WayItem}
                  revealed={true}
                  index={0}
                  revealedIds={revealedIds}
                />
              )}
              {item.type === 'epic' && (
                <EpicCard
                  epic={item.data as Epic}
                  revealed={true}
                  index={0}
                />
              )}
            </div>

            {/* Dismiss hint */}
            <motion.p
              className="text-center text-white/30 text-xs mt-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.5 }}
            >
              Click anywhere or reveal next to continue
            </motion.p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function getItemColor(item: CenterStageProps['item']): string {
  if (!item) return '#ff8511';
  const d = item.data as { color?: string };
  return d.color ?? '#ff8511';
}
