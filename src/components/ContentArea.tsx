import { useMemo, useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { usePresentation } from '../PresentationContext';
import {
  challengesData,
  conceptsData,
  charactersData,
  epicsData,
  lookupItem,
} from '../data';
import { ChallengeCard } from './ChallengeCard';
import { CharacterCard } from './CharacterCard';
import { ConceptCard } from './ConceptCard';
import { EpicCard } from './EpicCard';
import { SegmentHeader } from './SegmentHeader';
import { TakeawayBanner } from './TakeawayBanner';
import { CenterStage } from './CenterStage';
import { useControls } from '../ControlsContext';
import type { ConceptItem, WayItem, Challenge, Character, Epic } from '../types';

type StageItem = {
  type: 'challenge' | 'concept' | 'character' | 'epic';
  data: Challenge | Character | ConceptItem | WayItem | Epic;
} | null;

export function ContentArea() {
  const { state, currentSegment } = usePresentation();
  const { revealedIds, mode } = state;

  const prevCountRef = useRef(revealedIds.size);
  const [stageItem, setStageItem] = useState<StageItem>(null);

  useEffect(() => {
    if (mode !== 'presentation') {
      setStageItem(null);
      return;
    }
    const prevCount = prevCountRef.current;
    prevCountRef.current = revealedIds.size;
    if (revealedIds.size > prevCount) {
      const seg = currentSegment;
      if (!seg) return;
      const sorted = [...seg.reveals].sort((a, b) => a.delaySeconds - b.delaySeconds);
      let newest: { type: string; id: string } | null = null;
      for (const r of sorted) {
        if (revealedIds.has(r.id)) newest = r;
      }
      if (newest) {
        const data = lookupItem(newest.type, newest.id);
        if (data) {
          setStageItem({ type: newest.type as NonNullable<StageItem>['type'], data } as NonNullable<StageItem>);
        }
      }
    }
  }, [revealedIds, mode, currentSegment]);

  const dismissStage = useCallback(() => setStageItem(null), []);

  const visibleCharacters = useMemo(
    () => charactersData.characters.filter((c) => revealedIds.has(c.id)),
    [revealedIds],
  );
  const visibleChallenges = useMemo(
    () => challengesData.challenges.filter((c) => revealedIds.has(c.id)),
    [revealedIds],
  );
  const visibleEpics = useMemo(
    () => epicsData.epics.filter((e) => revealedIds.has(e.id)),
    [revealedIds],
  );
  const visibleFourTypes = useMemo(
    () => conceptsData.fourTypesOfWork.items.filter((item) => revealedIds.has(item.id)),
    [revealedIds],
  );
  const visibleThreeWays = useMemo(
    () => conceptsData.threeWays.items.filter((way) => revealedIds.has(way.id)),
    [revealedIds],
  );

  const isIntroOutro =
    mode === 'presentation' &&
    (currentSegment?.phase === 'intro' || currentSegment?.phase === 'outro');

  const allFourTypesTotal = conceptsData.fourTypesOfWork.items.length;
  const allThreeWaysTotal = conceptsData.threeWays.items.length;

  // ===== Determine data for each section =====
  const isExplore = mode === 'explore';
  const chars = isExplore ? charactersData.characters : visibleCharacters;
  const epics = isExplore ? epicsData.epics : visibleEpics;
  const fourTypes = isExplore ? conceptsData.fourTypesOfWork.items : visibleFourTypes;
  const threeWays = isExplore ? conceptsData.threeWays.items : visibleThreeWays;
  const challenges = isExplore ? challengesData.challenges : visibleChallenges;

  const { isPopped } = useControls();

  // ===== UNIFIED LAYOUT — same grid for both modes =====
  return (
    <div className={`h-screen flex flex-col p-4 overflow-hidden relative ${isPopped ? 'pb-4' : 'pb-16'}`}>
      <SegmentHeader />

      {!isIntroOutro && (
        <div className="flex-1 grid grid-cols-5 grid-rows-[1fr_auto] gap-3 min-h-0">
          {/* Left column (1/5): Epics, Four Types, Three Ways stacked + Center Stage */}
          <div className="col-span-1 row-span-1 flex flex-col gap-3 min-h-0">
            {mode === 'presentation' && (
              <InlineCenterStage item={stageItem} revealedIds={revealedIds} onDismiss={dismissStage} />
            )}
            <DashboardPanel
              title="Epics"
              accent="#f97316"
              count={epics.length}
              total={epicsData.epics.length}
              showProgress={!isExplore}
            >
              <div className="flex flex-col gap-1.5">
                {epics.map((e, i) => (
                  <EpicCard key={e.id} epic={e} revealed={true} index={i} />
                ))}
              </div>
            </DashboardPanel>
            <DashboardPanel
              title="Four Types of Work"
              accent="#ff8511"
              count={fourTypes.length}
              total={allFourTypesTotal}
              showProgress={!isExplore}
            >
              <div className="flex flex-col gap-1.5">
                {fourTypes.map((c, i) => (
                  <ConceptCard key={c.id} concept={c} revealed={true} index={i} revealedIds={revealedIds} />
                ))}
              </div>
            </DashboardPanel>
            <DashboardPanel
              title="The Three Ways"
              accent="#f06a07"
              count={threeWays.length}
              total={allThreeWaysTotal}
              showProgress={!isExplore}
              className="flex-1"
            >
              <div className="flex flex-col gap-1.5">
                {threeWays.map((c, i) => (
                  <ConceptCard key={c.id} concept={c} revealed={true} index={i} revealedIds={revealedIds} />
                ))}
              </div>
            </DashboardPanel>
          </div>

          {/* Right column (4/5): Characters top half, Challenges bottom half */}
          <div className="col-span-4 row-span-1 flex flex-col gap-3 min-h-0">
            <div className="h-1/2 min-h-0">
            <DashboardPanel
              title="Characters"
              accent="#3668fc"
              count={chars.length}
              total={charactersData.characters.length}
              showProgress={!isExplore}
              className="h-full"
            >
              <OrgChart characters={chars} />
            </DashboardPanel>
            </div>
            <DashboardPanel
              title="Challenges"
              accent="#ef4444"
              count={challenges.length}
              total={challengesData.challenges.length}
              showProgress={!isExplore}
              className="flex-1 min-h-0"
            >
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-1.5">
                {challenges.map((c, i) => (
                  <ChallengeCard key={c.id} challenge={c} revealed={true} index={i} />
                ))}
              </div>
            </DashboardPanel>
          </div>

          {/* Takeaway banner (presentation only) */}
          {mode === 'presentation' && (
            <div className="col-span-5">
              <TakeawayBanner />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ---- Inline Center Stage — reserved area for newly revealed items ----

function InlineCenterStage({
  item,
  revealedIds,
  onDismiss,
}: {
  item: StageItem;
  revealedIds: Set<string>;
  onDismiss: () => void;
}) {
  const color = item ? (item.data as { color?: string }).color ?? '#ff8511' : '#ff8511';

  return (
    <motion.div
      className="h-full rounded-lg border border-white/[0.06] bg-white/[0.02] overflow-hidden flex flex-col"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-white/[0.04] flex-shrink-0">
        <div className="w-0.5 h-3 rounded-full bg-phoenix-400" />
        <span className="text-[11px] font-semibold text-white/60">Now Revealing</span>
      </div>
      <div className="flex-1 flex items-center justify-center p-3 relative">
        <AnimatePresence mode="wait">
          {item ? (
            <motion.div
              key={`stage-${(item.data as { id: string }).id}`}
              className="w-full max-w-xs cursor-pointer relative"
              onClick={onDismiss}
              initial={{ opacity: 0, scale: 0.8, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: -10 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Glow */}
              <div
                className="absolute -inset-1 rounded-xl blur-lg opacity-30"
                style={{ backgroundColor: color }}
              />
              <div className="relative">
                {item.type === 'challenge' && (
                  <ChallengeCard challenge={item.data as Challenge} revealed={true} index={0} />
                )}
                {item.type === 'character' && (
                  <CharacterCard character={item.data as Character} revealed={true} index={0} />
                )}
                {item.type === 'concept' && (
                  <ConceptCard concept={item.data as ConceptItem | WayItem} revealed={true} index={0} revealedIds={revealedIds} />
                )}
                {item.type === 'epic' && (
                  <EpicCard epic={item.data as Epic} revealed={true} index={0} />
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty-stage"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center"
            >
              <span className="text-white/10 text-xs italic">Press Reveal Next</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---- DashboardPanel — unified container for both modes ----

function DashboardPanel({
  title,
  accent,
  count,
  total,
  showProgress = false,
  children,
  className = '',
}: {
  title: string;
  accent: string;
  count: number;
  total: number;
  showProgress?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  const hasItems = count > 0;
  const isEmpty = showProgress && !hasItems;

  return (
    <motion.div
      layout
      className={`flex flex-col rounded-lg border overflow-hidden transition-colors duration-500 ${
        isEmpty
          ? 'border-white/[0.03] border-dashed bg-white/[0.01]'
          : 'border-white/[0.06] bg-white/[0.02]'
      } ${className}`}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2 px-4 py-2 border-b border-white/[0.04] flex-shrink-0">
        <div className="w-0.5 h-3.5 rounded-full" style={{ backgroundColor: accent }} />
        <span className="text-sm font-semibold text-white/70">{title}</span>
        <span className="text-xs text-white/25 font-mono">
          {showProgress ? `${count}/${total}` : count}
        </span>
      </div>
      <div className="flex-1 p-3 overflow-auto min-h-0">
        <AnimatePresence mode="popLayout">
          {!isEmpty && children}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

// ---- Org Chart — proper top-down tree layout ----

// Fixed grid coordinates [col, row] for each character id (1-based for CSS grid).
// Grid: 5 columns × 4 rows.
const GRID_COLS = 5;
const GRID_ROWS = 4;

const GRID_POS: Record<string, [number, number]> = {
  'erik-reid':    [1, 1],
  'steve-masters':[3, 1],
  'bill-palmer':  [2, 2],
  'chris-allers': [4, 2],
  'sarah-moulton':[5, 2],
  'wes-davis':    [1, 3],
  'patty-mckee':  [2, 3],
  'john-pesche':  [3, 3],
  'brent-geller': [1, 4],
};

function OrgChart({ characters }: { characters: Character[] }) {
  if (characters.length === 0) return null;

  return (
    <div
      className="w-full"
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
        gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
        height: '100%',
        gap: '8px',
      }}
    >
      {characters.map((c) => {
        const pos = GRID_POS[c.id];
        if (!pos) return null;
        const [col, row] = pos;
        return (
          <div
            key={c.id}
            className="flex flex-col"
            style={{ gridColumn: col, gridRow: row }}
          >
            <CharacterCard character={c} revealed={true} index={0} />
          </div>
        );
      })}
    </div>
  );
}

