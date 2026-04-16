import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { ChallengeDetailContent } from './DetailModalContent';
import { Modal } from './Modal';
import { useControls } from '../ControlsContext';
import type { Challenge } from '../types';

interface ChallengeCardProps {
  challenge: Challenge;
  revealed: boolean;
  index: number;
}

const severityBadge = {
  critical: 'bg-red-500/20 text-red-300 border-red-500/30',
  high: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
};

const severityDot = {
  critical: 'bg-red-400',
  high: 'bg-orange-400',
  medium: 'bg-yellow-400',
};

export function ChallengeCard({ challenge, revealed, index }: ChallengeCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isCardLegibilityMode } = useControls();

  return (
    <>
      <GlassCard
        revealed={revealed}
        onClick={() => setIsOpen(true)}
        glowColor={`${challenge.color}20`}
        delay={index * 0.04}
        className={isCardLegibilityMode ? 'px-3.5 py-3' : 'px-3 py-2'}
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDot[challenge.severity]}`} />
          <div className="min-w-0">
            <span className={`${isCardLegibilityMode ? 'text-lg font-semibold text-white/92' : 'text-sm font-medium text-white/85'} truncate block leading-tight`}>
              {challenge.title}
            </span>
            {!isCardLegibilityMode && (
              <span className="text-xs text-white/35 truncate block leading-tight">{challenge.subtitle}</span>
            )}
          </div>
        </div>
      </GlassCard>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} accentColor={challenge.color}>
        <ChallengeDetailContent challenge={challenge} />
      </Modal>
    </>
  );
}
