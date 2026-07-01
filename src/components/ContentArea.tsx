import { AnimatePresence, motion } from 'framer-motion';
import { usePresentation } from '../PresentationContext';
import type { DeckSlide } from '../types';

function twoDigit(value: number) {
  return value.toString().padStart(2, '0');
}

function splitParagraphs(value?: string) {
  return value?.split(/\n+/).map((line) => line.trim()).filter(Boolean) ?? [];
}

function SlideBullets({ slide }: { slide: DeckSlide }) {
  if (!slide.bullets?.length) return null;

  if (slide.variant === 'title') {
    return (
      <div className="mt-16 grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {slide.bullets.map((bullet, index) => (
          <div key={bullet} className="flex min-w-0 items-center gap-4">
            <span className="text-2xl font-semibold text-cyan-300">{twoDigit(index + 1)}</span>
            <span className="h-8 w-px bg-white/18" />
            <span className="text-xl font-medium text-white/92">{bullet}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="mt-10 max-w-5xl divide-y divide-white/10 border-y border-white/10">
      {slide.bullets.map((bullet, index) => (
        <div key={bullet} className="grid grid-cols-[4.5rem_minmax(0,1fr)] gap-5 py-4">
          <span className="font-mono text-sm text-cyan-300">{twoDigit(index + 1)}</span>
          <span className="text-2xl leading-snug text-white/90">{bullet}</span>
        </div>
      ))}
    </div>
  );
}

function SlideBody({ slide }: { slide: DeckSlide }) {
  const paragraphs = splitParagraphs(slide.body);
  if (paragraphs.length === 0) return null;

  return (
    <div className="mt-8 max-w-5xl space-y-5">
      {paragraphs.map((paragraph) => (
        <p key={paragraph} className="text-3xl leading-snug text-white/82">
          {paragraph}
        </p>
      ))}
    </div>
  );
}

function DiscussionPrompt({ slide }: { slide: DeckSlide }) {
  if (!slide.discussionPrompt) return null;

  return (
    <div className="mt-12 max-w-5xl border-t border-cyan-300/50 pt-6">
      <div className="mb-3 font-mono text-xs uppercase text-cyan-300">Room prompt</div>
      <p className="text-3xl leading-snug text-white">{slide.discussionPrompt}</p>
    </div>
  );
}

function ProgressRail() {
  const { slides, currentAbsoluteIndex, dispatch } = usePresentation();

  return (
    <div className="flex items-center gap-2">
      {slides.map((entry, index) => (
        <button
          key={`${entry.segment.id}-${entry.slide.id}`}
          type="button"
          onClick={() => dispatch({ type: 'GO_TO_SLIDE', absoluteIndex: index })}
          title={entry.slide.title}
          className={`h-1 rounded-full transition-all ${
            index === currentAbsoluteIndex
              ? 'w-12 bg-cyan-300 shadow-[0_0_18px_rgba(34,211,238,0.45)]'
              : index < currentAbsoluteIndex
                ? 'w-8 bg-white/35'
                : 'w-8 bg-white/16 hover:bg-white/28'
          }`}
        />
      ))}
    </div>
  );
}

export function ContentArea() {
  const {
    currentSegment,
    currentSlide,
    currentStep,
    currentAbsoluteIndex,
    slides,
  } = usePresentation();

  return (
    <main className="relative h-full overflow-hidden px-16 py-12">
      <div className="flex items-start justify-between gap-8">
        <div className="min-w-0">
          <div className="flex items-center gap-4 font-mono text-sm">
            <span className="uppercase text-cyan-300">
              Section {twoDigit(slides[currentAbsoluteIndex].segmentIndex + 1)}
            </span>
            <span className="h-4 w-px bg-white/30" />
            <span className="truncate text-white/64">{currentSegment.title}</span>
          </div>
        </div>
        <ProgressRail />
      </div>

      <AnimatePresence mode="wait">
        <motion.section
          key={currentSlide.id}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="flex h-full min-h-0 flex-col justify-center pb-28 pt-12"
        >
          <div className="max-w-[76rem]">
            {currentSlide.subtitle && (
              <p className="mb-7 max-w-4xl text-2xl leading-snug text-white/70">
                {currentSlide.subtitle}
              </p>
            )}

            <h1
              className={`font-semibold leading-[1.02] text-white ${
                currentSlide.variant === 'title'
                  ? 'text-8xl'
                  : 'text-7xl'
              }`}
            >
              {currentSlide.title}
            </h1>

            <div className="mt-8 h-1 w-20 bg-cyan-300 shadow-[0_0_24px_rgba(34,211,238,0.45)]" />

            <SlideBody slide={currentSlide} />
            <SlideBullets slide={currentSlide} />
            <DiscussionPrompt slide={currentSlide} />
          </div>
        </motion.section>
      </AnimatePresence>

      <div className="pointer-events-none absolute bottom-10 left-16 right-16 flex items-center justify-between font-mono text-xs text-white/52">
        <span>
          {currentStep.slideNumber} / {currentStep.totalSlides}
        </span>
        <span>{currentSegment.shortTitle}</span>
      </div>
    </main>
  );
}
