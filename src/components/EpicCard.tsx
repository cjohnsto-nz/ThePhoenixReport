import { useState } from 'react';
import type { Epic } from '../types';
import { EpicDetailContent } from './DetailModalContent';
import { GlassCard } from './GlassCard';
import { Modal } from './Modal';
import { useControls } from '../ControlsContext';

interface EpicCardProps {
  epic: Epic;
  compact?: boolean;
  revealed?: boolean;
  index?: number;
}

export function EpicCard({ epic, revealed = true, index = 0 }: EpicCardProps) {
  const [showModal, setShowModal] = useState(false);
  const { isCardLegibilityMode } = useControls();

  return (
    <>
      <GlassCard
        revealed={revealed}
        glowColor={`${epic.color}20`}
        delay={index * 0.04}
        onClick={() => setShowModal(true)}
        className={isCardLegibilityMode ? 'px-3.5 py-3' : 'px-3 py-2'}
      >
        <div className="flex items-center gap-2">
          <span className="text-base flex-shrink-0">{epic.icon}</span>
          <div className="min-w-0">
            <span className={`${isCardLegibilityMode ? 'text-lg font-semibold text-white/92' : 'text-sm font-medium text-white/85'} truncate block leading-tight`}>
              {epic.title}
            </span>
            {!isCardLegibilityMode && (
              <span className="text-xs text-white/35 truncate block leading-tight">{epic.subtitle}</span>
            )}
          </div>
        </div>
      </GlassCard>
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} accentColor={epic.color}>
        <EpicDetailContent epic={epic} />
      </Modal>
    </>
  );
}
