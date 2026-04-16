import { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence, useAnimate } from 'framer-motion';
import { createPortal } from 'react-dom';
import { usePresentation } from '../PresentationContext';
import {
  challengesData,
  conceptsData,
  charactersData,
  epicsData,
  lessonsData,
  lookupItem,
} from '../data';
import { ChallengeCard } from './ChallengeCard';
import { CharacterCard } from './CharacterCard';
import { ConceptCard } from './ConceptCard';
import {
  ChallengeDetailContent,
  CharacterDetailContent,
  ConceptDetailContent,
  EpicDetailContent,
  QuoteDetailContent,
} from './DetailModalContent';
import { EpicCard } from './EpicCard';
import { Modal } from './Modal';
import { SegmentHeader } from './SegmentHeader';
import { useControls } from '../ControlsContext';
import type { ConceptItem, WayItem, Challenge, Character, Epic, Lesson, QuoteItem } from '../types';

export function ContentArea() {
  const { state, dispatch, currentSegment, segments } = usePresentation();
  const { revealedIds, mode, stagedId, segmentScreen } = state;
  const epicsPanelRef = useRef<HTMLDivElement | null>(null);
  const fourTypesPanelRef = useRef<HTMLDivElement | null>(null);
  const threeWaysPanelRef = useRef<HTMLDivElement | null>(null);
  const charactersPanelRef = useRef<HTMLDivElement | null>(null);
  const challengesPanelRef = useRef<HTMLDivElement | null>(null);

  const fourTypeIds = useMemo(
    () => new Set(conceptsData.fourTypesOfWork.items.map((item) => item.id)),
    [],
  );
  const threeWayIds = useMemo(
    () => new Set(conceptsData.threeWays.items.map((item) => item.id)),
    [],
  );

  // Look up the staged item's data for the center-stage overlay
  const stagedData = useMemo(() => {
    if (!stagedId) return null;
    for (const seg of segments) {
      const reveal = seg.reveals.find((r) => r.id === stagedId);
      if (reveal) {
        const data = lookupItem(reveal.type, reveal.id);
        if (data)
          return {
            type: reveal.type as 'challenge' | 'concept' | 'character' | 'epic' | 'quote',
            data: data as Challenge | Character | ConceptItem | WayItem | Epic | QuoteItem,
          };
      }
    }
    return null;
  }, [stagedId, segments]);

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

  const isStandaloneHero =
    mode === 'presentation' &&
    (currentSegment?.phase === 'intro' || currentSegment?.phase === 'outro');
  const isSegmentIntroPage = mode === 'presentation' && !isStandaloneHero && segmentScreen === 'intro';
  const isSegmentSummaryPage = mode === 'presentation' && !isStandaloneHero && segmentScreen === 'summary';
  const sectionLabel = useMemo(() => {
    if (!currentSegment) return 'Section';
    const contentSegments = segments.filter(
      (segment) => segment.phase !== 'intro' && segment.phase !== 'outro',
    );
    const sectionIndex = contentSegments.findIndex((segment) => segment.id === currentSegment.id);
    const words = ['One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten'];
    const ordinal = words[sectionIndex] ?? String(sectionIndex + 1);
    return `Section ${ordinal}`;
  }, [currentSegment, segments]);
  const currentSegmentRevealIds = useMemo(
    () => new Set(currentSegment?.reveals.map((reveal) => reveal.id) ?? []),
    [currentSegment],
  );
  const sectionSummaryCharacters = useMemo(
    () => charactersData.characters.filter((character) => currentSegmentRevealIds.has(character.id)),
    [currentSegmentRevealIds],
  );
  const sectionSummaryEpics = useMemo(
    () => epicsData.epics.filter((epic) => currentSegmentRevealIds.has(epic.id)),
    [currentSegmentRevealIds],
  );
  const sectionSummaryFourTypes = useMemo(
    () => conceptsData.fourTypesOfWork.items.filter((concept) => currentSegmentRevealIds.has(concept.id)),
    [currentSegmentRevealIds],
  );
  const sectionSummaryThreeWays = useMemo(
    () => conceptsData.threeWays.items.filter((way) => currentSegmentRevealIds.has(way.id)),
    [currentSegmentRevealIds],
  );
  const sectionSummaryChallenges = useMemo(
    () => challengesData.challenges.filter((challenge) => currentSegmentRevealIds.has(challenge.id)),
    [currentSegmentRevealIds],
  );
  const sectionSummaryLessons = useMemo(
    () => (lessonsData.segments.find((segmentLessons) => segmentLessons.segmentId === currentSegment?.id)?.items ?? []).slice(0, 6),
    [currentSegment],
  );
  const hasSummaryLessons = sectionSummaryLessons.length > 0;
  const hasSummaryLeftColumn =
    sectionSummaryEpics.length > 0 ||
    sectionSummaryFourTypes.length > 0 ||
    sectionSummaryThreeWays.length > 0;
  const hasSummaryCharacters = sectionSummaryCharacters.length > 0;
  const hasSummaryChallenges = sectionSummaryChallenges.length > 0;
  const hasSummaryRightColumn = hasSummaryCharacters || hasSummaryChallenges;

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
  const [placementGhost, setPlacementGhost] = useState<{
    item: StageItemData;
    revealedIds: Set<string>;
    targetRect: DOMRect | null;
  } | null>(null);

  // Determine which panel the staged item belongs to
  const stagedPanel = useMemo((): string | null => {
    if (!stagedData) return null;
    const itemData = stagedData.data as { id?: string; parentWay?: string; characterId?: string };
    if (stagedData.type === 'character') return 'characters';
    if (stagedData.type === 'quote') return null;
    if (stagedData.type === 'challenge') return 'challenges';
    if (stagedData.type === 'epic') return 'epics';
    if (stagedData.type === 'concept') {
      if ('parentWay' in itemData || threeWayIds.has(itemData.id ?? '')) return 'threeWays';
      if (fourTypeIds.has(itemData.id ?? '')) return 'fourTypes';
    }
    return null;
  }, [stagedData, fourTypeIds, threeWayIds]);

  // Build a stable getter that reads position at the moment of need (never stale)
  const getTargetRect = useCallback((): DOMRect | null => {
    if (!stagedData) return null;

    // Characters: compute exact grid cell from known positions
    if (stagedData.type === 'character' || stagedData.type === 'quote') {
      const charId = stagedData.type === 'quote'
        ? ((stagedData.data as { characterId?: string }).characterId ?? '')
        : ((stagedData.data as { id?: string }).id ?? '');
      const pos = GRID_POS[charId];
      const panel = charactersPanelRef.current;
      if (pos && panel) {
        const panelRect = panel.getBoundingClientRect();
        const headerEl = panel.querySelector('[class*="border-b"]') as HTMLElement | null;
        const headerH = headerEl ? headerEl.offsetHeight : 32;
        const pad = 12; // p-3
        const contentW = panelRect.width - pad * 2;
        const contentH = panelRect.height - headerH - pad * 2;
        const [col, row] = pos;
        const cellW = (contentW - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
        const cellH = (contentH - GRID_GAP * (GRID_ROWS - 1)) / GRID_ROWS;
        return new DOMRect(
          panelRect.left + pad + (col - 1) * (cellW + GRID_GAP),
          panelRect.top + headerH + pad + (row - 1) * (cellH + GRID_GAP),
          cellW,
          cellH,
        );
      }
    }

    // All other panels: read the invisible slot that sits at the next card position.
    if (stagedPanel && typeof document !== 'undefined') {
      const marker = document.querySelector(`[data-placement-marker="${stagedPanel}"]`) as HTMLElement | null;
      if (marker) {
        return marker.getBoundingClientRect();
      }
    }

    // Final fallback: whole panel rect
    const panelRefMap: Record<string, React.RefObject<HTMLDivElement | null>> = {
      characters: charactersPanelRef,
      challenges: challengesPanelRef,
      epics: epicsPanelRef,
      threeWays: threeWaysPanelRef,
      fourTypes: fourTypesPanelRef,
    };
    const sp = stagedData.type === 'concept'
      ? (threeWayIds.has((stagedData.data as { id?: string }).id ?? '') ? 'threeWays' : 'fourTypes')
      : stagedData.type === 'character' || stagedData.type === 'quote' ? 'characters'
      : stagedData.type === 'challenge' ? 'challenges'
      : 'epics';
    return panelRefMap[sp]?.current?.getBoundingClientRect() ?? null;
  }, [stagedData, stagedPanel, threeWayIds]);

  // ===== UNIFIED LAYOUT — same grid for both modes =====
  return (
    <div className={`h-screen flex flex-col px-8 pt-6 overflow-hidden relative ${isPopped ? 'pb-6' : 'pb-20'}`}>
      <SegmentHeader />

      {isSegmentIntroPage && currentSegment && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentSegment.id}-intro`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 flex items-center justify-center min-h-0"
          >
            <div className="max-w-4xl w-full rounded-3xl border border-white/[0.08] bg-white/[0.03] backdrop-blur-xl px-10 py-12 text-center shadow-2xl">
              <div className="text-[11px] uppercase tracking-[0.28em] text-phoenix-400/60 font-semibold mb-4">
                {sectionLabel}
              </div>
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight mb-4">
                {currentSegment.title}
              </h2>
              <p className="text-lg md:text-2xl text-white/55 max-w-3xl mx-auto leading-relaxed">
                {currentSegment.subtitle}
              </p>
              {currentSegment.narrativeArc && (
                <p className="mt-8 text-base md:text-lg text-phoenix-300/70 italic max-w-2xl mx-auto leading-relaxed">
                  {currentSegment.narrativeArc}
                </p>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {isSegmentSummaryPage && currentSegment && (
        <AnimatePresence mode="wait">
          <motion.div
            key={`${currentSegment.id}-summary`}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="flex-1 min-h-0"
          >
            <div className="h-full flex flex-col gap-4 min-h-0">
              <div className="rounded-3xl border border-phoenix-500/15 bg-phoenix-500/[0.04] backdrop-blur-xl px-8 md:px-12 py-5 md:py-6 text-center shadow-2xl flex-shrink-0">
                <div className="text-[11px] uppercase tracking-[0.28em] text-phoenix-400/60 font-semibold mb-4">
                  {sectionLabel} Summary
                </div>
                <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight max-w-6xl mx-auto leading-tight">
                  {currentSegment.title}
                </h2>
              </div>

              {hasSummaryLessons && (
                <DashboardPanel
                  title="Lessons"
                  accent="#f59e0b"
                  count={sectionSummaryLessons.length}
                  total={sectionSummaryLessons.length}
                  className="flex-shrink-0 max-h-[40vh]"
                >
                  <div className="grid grid-cols-1 xl:grid-cols-2 gap-2">
                    {sectionSummaryLessons.map((lesson, index) => (
                      <LessonCard key={lesson.id} lesson={lesson} index={index} />
                    ))}
                  </div>
                </DashboardPanel>
              )}

              {(hasSummaryLeftColumn || hasSummaryRightColumn) && (
                <div className="flex-1 grid grid-cols-5 gap-3 min-h-0">
                  {hasSummaryLeftColumn && (
                    <div className={`${hasSummaryRightColumn ? 'col-span-1' : 'col-span-5'} flex flex-col gap-3 min-h-0`}>
                      {sectionSummaryEpics.length > 0 && (
                        <DashboardPanel
                          title="Epics"
                          accent="#f97316"
                          count={sectionSummaryEpics.length}
                          total={sectionSummaryEpics.length}
                          className="min-h-0 flex-[6]"
                        >
                          <div className="flex flex-col gap-1.5">
                            {sectionSummaryEpics.map((epic, index) => (
                              <EpicCard key={epic.id} epic={epic} revealed={true} index={index} />
                            ))}
                          </div>
                        </DashboardPanel>
                      )}
                      {sectionSummaryFourTypes.length > 0 && (
                        <DashboardPanel
                          title="Four Types of Work"
                          accent="#ff8511"
                          count={sectionSummaryFourTypes.length}
                          total={sectionSummaryFourTypes.length}
                          className="min-h-0 flex-[5]"
                        >
                          <div className="flex flex-col gap-1.5">
                            {sectionSummaryFourTypes.map((concept, index) => (
                              <ConceptCard key={concept.id} concept={concept} revealed={true} index={index} revealedIds={revealedIds} />
                            ))}
                          </div>
                        </DashboardPanel>
                      )}
                      {sectionSummaryThreeWays.length > 0 && (
                        <DashboardPanel
                          title="The Three Ways"
                          accent="#f06a07"
                          count={sectionSummaryThreeWays.length}
                          total={sectionSummaryThreeWays.length}
                          className="min-h-0 flex-[4]"
                        >
                          <div className="flex flex-col gap-1.5">
                            {sectionSummaryThreeWays.map((concept, index) => (
                              <ConceptCard key={concept.id} concept={concept} revealed={true} index={index} revealedIds={revealedIds} />
                            ))}
                          </div>
                        </DashboardPanel>
                      )}
                    </div>
                  )}

                  {hasSummaryRightColumn && (
                    <div className={`${hasSummaryLeftColumn ? 'col-span-4' : 'col-span-5'} flex flex-col gap-3 min-h-0`}>
                      {hasSummaryCharacters && (
                        <div className={`${hasSummaryChallenges ? 'h-1/2' : 'flex-1'} min-h-0`}>
                          <DashboardPanel
                            title="Characters"
                            accent="#3668fc"
                            count={sectionSummaryCharacters.length}
                            total={sectionSummaryCharacters.length}
                            className="h-full"
                          >
                            <div className="grid grid-cols-3 xl:grid-cols-4 gap-1.5">
                              {sectionSummaryCharacters.map((character, index) => (
                                <CharacterCard key={character.id} character={character} revealed={true} index={index} />
                              ))}
                            </div>
                          </DashboardPanel>
                        </div>
                      )}
                      {hasSummaryChallenges && (
                        <DashboardPanel
                          title="Challenges"
                          accent="#ef4444"
                          count={sectionSummaryChallenges.length}
                          total={sectionSummaryChallenges.length}
                          className="flex-1 min-h-0"
                        >
                          <div className="grid grid-cols-3 xl:grid-cols-4 gap-1.5">
                            {sectionSummaryChallenges.map((challenge, index) => (
                              <ChallengeCard key={challenge.id} challenge={challenge} revealed={true} index={index} />
                            ))}
                          </div>
                        </DashboardPanel>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      )}

      {!isStandaloneHero && !isSegmentIntroPage && !isSegmentSummaryPage && (
        <div className="flex-1 grid grid-cols-5 grid-rows-[1fr_auto] gap-3 min-h-0">
          {/* Left column (1/5): Epics, Four Types, Three Ways stacked */}
          <div className="col-span-1 row-span-1 flex flex-col gap-3 min-h-0">
            <DashboardPanel
              title="Epics"
              accent="#f97316"
              count={epics.length}
              total={epicsData.epics.length}
              showProgress={!isExplore}
              className="min-h-0 flex-[6]"
              panelRef={epicsPanelRef}
            >
              <div className="flex flex-col gap-1.5">
                {epics.map((e, i) => (
                  <EpicCard key={e.id} epic={e} revealed={true} index={i} />
                ))}
                {(epics.length === 0 || stagedPanel === 'epics') && <PlacementMarker panel="epics" />}
              </div>
            </DashboardPanel>
            <DashboardPanel
              title="Four Types of Work"
              accent="#ff8511"
              count={fourTypes.length}
              total={allFourTypesTotal}
              showProgress={!isExplore}
              className="min-h-0 flex-[5]"
              panelRef={fourTypesPanelRef}
            >
              <div className="flex flex-col gap-1.5">
                {fourTypes.map((c, i) => (
                  <ConceptCard key={c.id} concept={c} revealed={true} index={i} revealedIds={revealedIds} />
                ))}
                {(fourTypes.length === 0 || stagedPanel === 'fourTypes') && <PlacementMarker panel="fourTypes" />}
              </div>
            </DashboardPanel>
            <DashboardPanel
              title="The Three Ways"
              accent="#f06a07"
              count={threeWays.length}
              total={allThreeWaysTotal}
              showProgress={!isExplore}
              className="min-h-0 flex-[4]"
              panelRef={threeWaysPanelRef}
            >
              <div className="flex flex-col gap-1.5">
                {threeWays.map((c, i) => (
                  <ConceptCard key={c.id} concept={c} revealed={true} index={i} revealedIds={revealedIds} />
                ))}
                {(threeWays.length === 0 || stagedPanel === 'threeWays') && <PlacementMarker panel="threeWays" />}
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
              panelRef={charactersPanelRef}
            >
              <div className="h-full"><OrgChart characters={chars} /></div>
            </DashboardPanel>
            </div>
            <DashboardPanel
              title="Challenges"
              accent="#ef4444"
              count={challenges.length}
              total={challengesData.challenges.length}
              showProgress={!isExplore}
              className="flex-1 min-h-0"
              panelRef={challengesPanelRef}
            >
              <div className="grid grid-cols-3 xl:grid-cols-4 gap-1.5">
                {challenges.map((c, i) => (
                  <ChallengeCard key={c.id} challenge={c} revealed={true} index={i} />
                ))}
                {(challenges.length === 0 || stagedPanel === 'challenges') && <PlacementMarker panel="challenges" />}
              </div>
            </DashboardPanel>
          </div>
        </div>
      )}

      {/* Full-screen detail modal for two-phase reveals */}
      {mode === 'presentation' && stagedData && (
        <FullScreenStage
          key={(stagedData.data as { id?: string }).id ?? 'staged-item'}
          item={stagedData}
          revealedIds={revealedIds}
          onPlace={() => {
            setPlacementGhost({
              item: stagedData,
              revealedIds: new Set(revealedIds),
              targetRect: getTargetRect(),
            });
            dispatch({ type: 'REVEAL_NEXT' });
          }}
          onBack={() => dispatch({ type: 'REVEAL_PREV' })}
        />
      )}

      {placementGhost && (
        <PlacementGhost
          item={placementGhost.item}
          revealedIds={placementGhost.revealedIds}
          targetRect={placementGhost.targetRect}
          onComplete={() => setPlacementGhost(null)}
        />
      )}
    </div>
  );
}

function PlacementMarker({
  panel,
}: {
  panel: 'epics' | 'fourTypes' | 'threeWays' | 'challenges';
}) {
  return (
    <div
      data-placement-marker={panel}
      aria-hidden
      className="pointer-events-none select-none invisible relative bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-lg overflow-hidden px-3 py-2"
      style={{
        boxShadow: '0 0 20px -8px rgba(255, 133, 17, 0.15), inset 0 1px 0 0 rgba(255,255,255,0.06)',
      }}
    >
      <div className="flex items-center gap-2">
        <span className="text-base flex-shrink-0">•</span>
        <div className="min-w-0 flex-1">
          <span className="text-sm font-medium truncate block">Placeholder title</span>
          <span className="text-xs truncate block leading-tight">Placeholder subtitle</span>
        </div>
      </div>
    </div>
  );
}

// ---- FullScreenStage — reuses the detail Modal for staged items ----

type StageItemData = {
  type: 'challenge' | 'concept' | 'character' | 'epic' | 'quote';
  data: Challenge | Character | ConceptItem | WayItem | Epic | QuoteItem;
};

function FullScreenStage({
  item,
  revealedIds,
  onPlace,
  onBack,
}: {
  item: StageItemData;
  revealedIds: Set<string>;
  onPlace: () => void;
  onBack: () => void;
}) {
  const color = (item.data as { color?: string }).color ?? '#ff8511';
  const isBusyRef = useRef(false);
  const handlePlaceRef = useRef(onPlace);
  handlePlaceRef.current = () => {
    if (isBusyRef.current) return;
    isBusyRef.current = true;
    onPlace();
  };
  const onBackRef = useRef(onBack);
  onBackRef.current = onBack;

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    const handleKey = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'ArrowRight' || e.key === 'Escape') {
        e.preventDefault();
        handlePlaceRef.current();
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        onBackRef.current();
      }
    };

    window.addEventListener('keydown', handleKey);

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKey);
    };
  }, []);

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none">
      {/* Backdrop */}
      <motion.div
        className="absolute inset-0 modal-scrim pointer-events-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        onClick={() => handlePlaceRef.current()}
      />

      {/* Modal shell */}
      <motion.div
        initial={{ opacity: 0, scale: 0.88, y: 30 }}
        animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-5xl max-h-[94vh] overflow-hidden rounded-3xl border border-white/[0.08] shadow-2xl pointer-events-auto"
        style={{
          background: 'rgba(5,8,18,0.95)',
          boxShadow: `0 0 80px -20px ${color}40, 0 25px 50px -12px rgba(0,0,0,0.5)`,
        }}
      >
        {/* Top accent line */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />

        {/* Close button */}
        <button
          onClick={() => handlePlaceRef.current()}
          className="absolute top-5 right-5 w-10 h-10 flex items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] text-white/45 hover:text-white transition-all z-10"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Content */}
        <div className="p-7 md:p-8 lg:p-10 text-base md:text-lg [&_p]:leading-relaxed [&_li]:leading-relaxed">
          {item.type === 'challenge' && <ChallengeDetailContent challenge={item.data as Challenge} />}
          {item.type === 'character' && <CharacterDetailContent character={item.data as Character} />}
          {item.type === 'quote' && <QuoteDetailContent quote={item.data as QuoteItem} />}
          {item.type === 'concept' && (
            <ConceptDetailContent concept={item.data as ConceptItem | WayItem} revealedIds={revealedIds} />
          )}
          {item.type === 'epic' && <EpicDetailContent epic={item.data as Epic} />}
        </div>
      </motion.div>
    </div>,
    document.body,
  );
}

function PlacementGhost({
  item,
  revealedIds,
  targetRect,
  onComplete,
}: {
  item: StageItemData;
  revealedIds: Set<string>;
  targetRect: DOMRect | null;
  onComplete: () => void;
}) {
  const color = (item.data as { color?: string }).color ?? '#ff8511';
  const vw = typeof window !== 'undefined' ? window.innerWidth : 1920;
  const vh = typeof window !== 'undefined' ? window.innerHeight : 1080;
  const cx = vw / 2;
  const cy = vh / 2;
  const tx = targetRect ? targetRect.left + targetRect.width / 2 : cx;
  const ty = targetRect ? targetRect.top + targetRect.height / 2 : cy;
  const exitX = tx - cx;
  const exitY = ty - cy;
  const modalW = Math.min(vw - 64, 1024);
  const modalH = Math.min(vh * 0.94, 820);
  const exitScale = targetRect
    ? Math.max(0.02, Math.min(0.18, Math.min(targetRect.width / modalW, targetRect.height / modalH)))
    : 0.08;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 md:p-6 lg:p-8 pointer-events-none">
      <motion.div
        className="absolute inset-0 modal-scrim"
        initial={{ opacity: 1 }}
        animate={{ opacity: 0 }}
        transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      />

      <motion.div
        initial={{ opacity: 1, scale: 1, x: 0, y: 0 }}
        animate={{ x: exitX, y: exitY, scale: exitScale, opacity: 0 }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        onAnimationComplete={onComplete}
        className="relative w-full max-w-5xl max-h-[94vh] overflow-hidden rounded-3xl border border-white/[0.08] shadow-2xl"
        style={{
          background: 'rgba(5,8,18,0.95)',
          boxShadow: `0 0 80px -20px ${color}40, 0 25px 50px -12px rgba(0,0,0,0.5)`,
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: `linear-gradient(90deg, transparent, ${color}, transparent)` }}
        />

        <div className="p-7 md:p-8 lg:p-10 text-base md:text-lg [&_p]:leading-relaxed [&_li]:leading-relaxed">
          {item.type === 'challenge' && <ChallengeDetailContent challenge={item.data as Challenge} />}
          {item.type === 'character' && <CharacterDetailContent character={item.data as Character} />}
          {item.type === 'quote' && <QuoteDetailContent quote={item.data as QuoteItem} />}
          {item.type === 'concept' && (
            <ConceptDetailContent concept={item.data as ConceptItem | WayItem} revealedIds={revealedIds} />
          )}
          {item.type === 'epic' && <EpicDetailContent epic={item.data as Epic} />}
        </div>
      </motion.div>
    </div>,
    document.body,
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
  panelRef,
}: {
  title: string;
  accent: string;
  count: number;
  total: number;
  showProgress?: boolean;
  children: React.ReactNode;
  className?: string;
  panelRef?: React.Ref<HTMLDivElement>;
}) {
  const hasItems = count > 0;
  const isEmpty = showProgress && !hasItems;

  return (
    <motion.div
      ref={panelRef}
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
      </div>
      <div className="flex-1 p-3 overflow-auto min-h-0">
        <AnimatePresence mode="popLayout">
          {children}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}

function LessonCard({ lesson, index }: { lesson: Lesson; index: number }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <motion.button
        type="button"
        layout
        onClick={() => setIsOpen(true)}
        className="w-full text-left rounded-lg border border-white/[0.06] bg-white/[0.02] px-3 py-2 overflow-hidden"
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, delay: index * 0.03 }}
        style={{
          boxShadow: '0 0 20px -8px rgba(245, 158, 11, 0.18), inset 0 1px 0 0 rgba(255,255,255,0.06)',
        }}
      >
        <h3 className="text-sm font-medium text-white/85 mb-1 leading-snug">
          {lesson.title}
        </h3>
        <p className="text-xs text-white/55 leading-relaxed line-clamp-2">
          {lesson.description}
        </p>
      </motion.button>

      <Modal isOpen={isOpen} onClose={() => setIsOpen(false)} accentColor="#f59e0b">
        <div className="space-y-4">
          <div className="text-[11px] uppercase tracking-[0.28em] text-phoenix-300/65 font-semibold">
            Lesson {index + 1}
          </div>
          <h3 className="text-2xl md:text-3xl font-bold text-white tracking-tight">
            {lesson.title}
          </h3>
          <p className="text-base md:text-lg text-white/70 leading-relaxed">
            {lesson.description}
          </p>
        </div>
      </Modal>
    </>
  );
}

// Fixed grid coordinates [col, row] for each character id (1-based for CSS grid).
// Grid: 5 columns × 4 rows.
const GRID_COLS = 5;
const GRID_ROWS = 4;
const GRID_GAP = 8;
const GRID_CELL_PAD = 8;
const CONNECTOR_COLOR = 'rgba(255, 255, 255, 0.15)';

const GRID_POS: Record<string, [number, number]> = {
  'erik-reid':    [1, 1],
  'steve-masters':[3, 1],
  'bill-palmer':  [2, 2],
  'chris-allers': [3, 2],
  'sarah-moulton':[5, 2],
  'wes-davis':    [1, 3],
  'patty-mckee':  [2, 3],
  'john-pesche':  [3, 3],
  'ron-johnson':  [4, 2],
  'maggie-lee':   [5, 3],
  'brent-geller': [1, 4],
};

function OrgChart({ characters }: { characters: Character[] }) {
  if (characters.length === 0) return null;

  const visibleIds = new Set(characters.map((character) => character.id));

  const containerRef = useRef<HTMLDivElement | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const updateSize = () => {
      setSize({ width: el.clientWidth, height: el.clientHeight });
    };

    updateSize();

    const observer = new ResizeObserver(() => {
      updateSize();
    });
    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, []);

  const childrenByParent = new Map<string, string[]>();
  for (const character of characters) {
    if (!character.reportsTo) continue;
    if (!visibleIds.has(character.reportsTo)) continue;
    if (!GRID_POS[character.id] || !GRID_POS[character.reportsTo]) continue;
    const list = childrenByParent.get(character.reportsTo) ?? [];
    list.push(character.id);
    childrenByParent.set(character.reportsTo, list);
  }

  const cellWidth = size.width > 0
    ? (size.width - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS
    : 0;
  const cellHeight = size.height > 0
    ? (size.height - GRID_GAP * (GRID_ROWS - 1)) / GRID_ROWS
    : 0;

  const getCellRect = (col: number, row: number) => ({
    left: (col - 1) * (cellWidth + GRID_GAP),
    top: (row - 1) * (cellHeight + GRID_GAP),
    width: cellWidth,
    height: cellHeight,
  });

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-0"
    >
      <svg
        className="absolute inset-0 pointer-events-none z-0"
        width="100%"
        height="100%"
        viewBox={`0 0 ${Math.max(size.width, 1)} ${Math.max(size.height, 1)}`}
        preserveAspectRatio="none"
      >
        {size.width > 0 && size.height > 0 && Array.from(childrenByParent.entries()).map(([parentId, childIds]) => {
          const [parentCol, parentRow] = GRID_POS[parentId];
          const parentRect = getCellRect(parentCol, parentRow);
          const parentX = parentRect.left + parentRect.width / 2;
          const parentY = parentRect.top + parentRect.height - GRID_CELL_PAD;

          const childPoints = childIds.map((childId) => {
            const [childCol, childRow] = GRID_POS[childId];
            const childRect = getCellRect(childCol, childRow);
            return {
              id: childId,
              x: childRect.left + childRect.width / 2,
              y: childRect.top + GRID_CELL_PAD,
            };
          });

          const railY = childPoints.length === 1
            ? parentY + (childPoints[0].y - parentY) / 2
            : parentY + (Math.min(...childPoints.map((point) => point.y)) - parentY) / 2;

          return (
            <g key={parentId}>
              <path
                d={`M ${parentX} ${parentY} L ${parentX} ${railY}`}
                fill="none"
                stroke={CONNECTOR_COLOR}
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              {childPoints.length > 1 && (
                <path
                  d={`M ${Math.min(...childPoints.map((point) => point.x))} ${railY} L ${Math.max(...childPoints.map((point) => point.x))} ${railY}`}
                  fill="none"
                  stroke={CONNECTOR_COLOR}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
              {childPoints.length === 1 && childPoints[0].x !== parentX && (
                <path
                  d={`M ${parentX} ${railY} L ${childPoints[0].x} ${railY}`}
                  fill="none"
                  stroke={CONNECTOR_COLOR}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              )}
              {childPoints.map((point) => (
                <path
                  key={point.id}
                  d={`M ${point.x} ${railY} L ${point.x} ${point.y}`}
                  fill="none"
                  stroke={CONNECTOR_COLOR}
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              ))}
            </g>
          );
        })}
      </svg>

      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${GRID_COLS}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${GRID_ROWS}, 1fr)`,
          gap: `${GRID_GAP}px`,
        }}
      >
        {characters.map((c) => {
          const pos = GRID_POS[c.id];
          if (!pos) return null;
          const [col, row] = pos;
          return (
            <div
              key={c.id}
              className="relative z-10 flex flex-col min-h-0 p-2"
              style={{ gridColumn: col, gridRow: row }}
            >
              <CharacterCard character={c} revealed={true} index={0} />
            </div>
          );
        })}
      </div>
    </div>
  );
}

