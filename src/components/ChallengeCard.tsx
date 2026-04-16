import { useState } from 'react';
import { GlassCard } from './GlassCard';
import { Modal } from './Modal';
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

  return (
    <>
      <GlassCard
        revealed={revealed}
        onClick={() => setIsOpen(true)}
        glowColor={`${challenge.color}20`}
        delay={index * 0.04}
        className="px-3 py-2"
      >
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full flex-shrink-0 ${severityDot[challenge.severity]}`} />
          <div className="min-w-0">
            <span className="text-sm font-medium text-white/85 truncate block">{challenge.title}</span>
            <span className="text-xs text-white/35 truncate block leading-tight">{challenge.subtitle}</span>
          </div>
        </div>
      </GlassCard>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} accentColor={challenge.color}>
        <div className="space-y-6">
          <div>
            <span
              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium border mb-4 ${severityBadge[challenge.severity]}`}
            >
              {challenge.severity} severity
            </span>
            <h2 className="text-2xl font-bold text-white">{challenge.title}</h2>
            <p className="text-white/50 mt-1">{challenge.subtitle}</p>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs uppercase tracking-wider text-white/30 font-semibold mb-2">
                Description
              </h3>
              <p className="text-white/70 leading-relaxed">{challenge.description}</p>
            </div>

            <div
              className="p-4 rounded-xl border"
              style={{
                backgroundColor: `${challenge.color}08`,
                borderColor: `${challenge.color}20`,
              }}
            >
              <h3 className="text-xs uppercase tracking-wider font-semibold mb-2" style={{ color: challenge.color }}>
                Impact
              </h3>
              <p className="text-white/70 leading-relaxed">{challenge.impact}</p>
            </div>
          </div>
        </div>
      </Modal>
    </>
  );
}
