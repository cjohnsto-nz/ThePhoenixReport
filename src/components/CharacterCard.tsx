import { useState } from 'react';
import { CharacterDetailContent } from './DetailModalContent';
import { GlassCard } from './GlassCard';
import { Modal } from './Modal';
import type { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  revealed: boolean;
  index: number;
}

export function CharacterCard({ character, revealed, index }: CharacterCardProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <GlassCard
        revealed={revealed}
        onClick={() => setIsOpen(true)}
        glowColor={`${character.color}30`}
        delay={index * 0.04}
        className="px-2.5 py-1.5 flex-1 flex items-center"
      >
        <div className="flex items-center gap-2 w-full">
          <span className="text-sm flex-shrink-0">{character.avatar}</span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-white/90 leading-tight">{character.name}</h3>
            <p className="text-xs text-white/45 leading-tight">{character.role}</p>
            <p className="text-xs font-medium leading-tight mt-0.5" style={{ color: `${character.color}cc` }}>{character.archetype}</p>
          </div>
        </div>
      </GlassCard>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} accentColor={character.color}>
        <CharacterDetailContent character={character} />
      </Modal>
    </>
  );
}
