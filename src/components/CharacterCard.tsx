import { useState } from 'react';
import { CharacterDetailContent } from './DetailModalContent';
import { GlassCard } from './GlassCard';
import { Modal } from './Modal';
import { useControls } from '../ControlsContext';
import type { Character } from '../types';

interface CharacterCardProps {
  character: Character;
  revealed: boolean;
  index: number;
}

export function CharacterCard({ character, revealed, index }: CharacterCardProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { isCardLegibilityMode } = useControls();

  return (
    <>
      <GlassCard
        revealed={revealed}
        onClick={() => setIsOpen(true)}
        glowColor={`${character.color}30`}
        delay={index * 0.04}
        className={`${isCardLegibilityMode ? 'px-3 py-2.5' : 'px-2.5 py-1.5'} flex-1 flex items-center`}
      >
        <div className="grid grid-cols-[1.25rem_minmax(0,1fr)_1.25rem] items-center gap-2 w-full">
          <span className={`${isCardLegibilityMode ? 'text-base' : 'text-sm'} flex h-5 w-5 items-center justify-center flex-shrink-0`}>
            {character.avatar}
          </span>
          <div className="min-w-0 text-center">
            <h3 className={`${isCardLegibilityMode ? 'text-lg' : 'text-sm'} font-semibold text-white/90 leading-tight`}>
              {character.name}
            </h3>
            {!isCardLegibilityMode && <p className="text-xs text-white/45 leading-tight">{character.role}</p>}
            <p
              className={`${isCardLegibilityMode ? 'text-sm mt-1' : 'text-xs mt-0.5'} font-medium leading-tight`}
              style={{ color: `${character.color}cc` }}
            >
              {character.archetype}
            </p>
          </div>
          <span aria-hidden className="h-5 w-5 flex-shrink-0" />
        </div>
      </GlassCard>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} accentColor={character.color}>
        <CharacterDetailContent character={character} />
      </Modal>
    </>
  );
}
