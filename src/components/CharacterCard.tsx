import { useState } from 'react';
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
        className="px-3 py-2 h-full flex items-center"
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
        <div className="space-y-6">
          <div className="flex items-center gap-5">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-5xl flex-shrink-0"
              style={{ backgroundColor: `${character.color}15` }}
            >
              {character.avatar}
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{character.name}</h2>
              <p className="text-white/50">{character.role}</p>
              <p className="text-sm font-medium mt-1" style={{ color: character.color }}>
                {character.archetype}
              </p>
              <p className="text-xs text-white/35 mt-0.5">{character.traits}</p>
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider text-white/30 font-semibold mb-2">
              About
            </h3>
            <p className="text-white/70 leading-relaxed">{character.description}</p>
          </div>

          <blockquote
            className="pl-4 py-3 border-l-2 italic text-white/60"
            style={{ borderColor: character.color }}
          >
            &ldquo;{character.quote}&rdquo;
          </blockquote>
        </div>
      </Modal>
    </>
  );
}
