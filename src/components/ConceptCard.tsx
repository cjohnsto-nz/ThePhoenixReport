import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Modal } from './Modal';
import type { ConceptItem, WayItem } from '../types';

interface ConceptCardProps {
  concept: ConceptItem | WayItem;
  revealed: boolean;
  index: number;
  revealedIds?: Set<string>;
}

function isWayItem(c: ConceptItem | WayItem): c is WayItem {
  return 'principles' in c;
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
        <div className="space-y-6">
          <div>
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-4"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {concept.subtitle}
            </div>
            <h2 className="text-2xl font-bold text-white">{concept.title}</h2>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-wider text-white/30 font-semibold mb-2">
              Description
            </h3>
            <p className="text-white/70 leading-relaxed">{concept.description}</p>
          </div>

          {'examples' in concept && concept.examples && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-white/30 font-semibold mb-2">
                Examples
              </h3>
              <ul className="space-y-2">
                {concept.examples.map((ex, i) => (
                  <li key={i} className="flex items-start gap-2 text-white/60">
                    <span style={{ color }} className="mt-1 text-xs">●</span>
                    {ex}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {isWayItem(concept) && concept.principles && (
            <div>
              <h3 className="text-xs uppercase tracking-wider text-white/30 font-semibold mb-3">
                Principles
              </h3>
              <div className="space-y-3">
                {concept.principles.map((p) => {
                  const isRevealed = !revealedIds || revealedIds.has(p.id);
                  return (
                    <div
                      key={p.id}
                      className={`p-4 rounded-xl border transition-all duration-500 ${
                        isRevealed ? 'opacity-100' : 'opacity-30'
                      }`}
                      style={{
                        backgroundColor: `${color}08`,
                        borderColor: `${color}15`,
                      }}
                    >
                      <h4 className="text-sm font-semibold text-white/90 mb-1">{p.title}</h4>
                      <p className="text-sm text-white/50">{p.description}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
