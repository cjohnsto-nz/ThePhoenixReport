import { useState } from 'react';
import { ConceptDetailContent } from './DetailModalContent';
import { GlassCard } from './GlassCard';
import { Modal } from './Modal';
import type { ConceptItem, WayItem } from '../types';

interface ConceptCardProps {
  concept: ConceptItem | WayItem;
  revealed: boolean;
  index: number;
  revealedIds?: Set<string>;
}

export function ConceptCard({ concept, revealed, index, revealedIds }: ConceptCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const color = concept.color;

  return (
    <>
      <GlassCard
        revealed={revealed}
        onClick={() => setIsOpen(true)}
        glowColor={`${color}20`}
        delay={index * 0.04}
        className="px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs flex-shrink-0" style={{ color }}>◆</span>
          <div className="min-w-0">
            <span className="text-sm font-medium text-white/85 truncate block">{concept.title}</span>
            <span className="text-xs text-white/35 truncate block leading-tight">{concept.subtitle}</span>
          </div>
        </div>
      </GlassCard>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} accentColor={color}>
        <ConceptDetailContent concept={concept} revealedIds={revealedIds} />
      </Modal>
    </>
  );
}
