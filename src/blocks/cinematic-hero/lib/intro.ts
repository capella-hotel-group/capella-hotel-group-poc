// src/blocks/cinematic-hero/lib/intro.ts
import type { IntroElements } from './types';

// Timeline (ms)
const T_PHRASE_START = 800; // unified phrase fades in
const T_PHRASE_FADE = 400; // phrase fade-in duration
const T_SPLIT_START = 2800; // crossfade: phrase out → split layout in
const T_SPLIT_FADE = 450; // crossfade duration
const T_CONTROLS_START = 3400; // controls fade in
const T_INTRO_DONE = 3700; // interaction unlocks
const PHRASE_LIFT_PX = 28;
const SPLIT_TRAVEL_PX = 110;
const CENTERED_TRANSLATE = 'translate(-50%, -50%)';

function centeredTranslateWithYOffset(yOffsetPx: number): string {
  return `translate(-50%, calc(-50% + ${yOffsetPx}px))`;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run the full intro animation sequence:
 * 1. Video plays with no UI
 * 2. "See with new eyes" fades in as one centered phrase
 * 3. Phrase crossfades into the 3-part split layout (prefix | items | suffix)
 * 4. Controls fade in at the bottom
 *
 * onBeforeSplit is called just before the split so the caller can position
 * the selector list at item 0 while still invisible.
 * onSplitStart is called right when split animations start, allowing the
 * active item highlight to fade in during the split.
 */
export async function runIntro(
  elements: IntroElements,
  onBeforeSplit?: () => void,
  onSplitStart?: () => void,
): Promise<void> {
  const { introPhrase, prefix, suffix, itemList, controls } = elements;

  // Initial state: everything hidden
  introPhrase.style.display = '';
  introPhrase.style.opacity = '0';
  introPhrase.style.transform = centeredTranslateWithYOffset(PHRASE_LIFT_PX);
  prefix.style.opacity = '0';
  prefix.style.transform = `translateX(${SPLIT_TRAVEL_PX}px)`;
  suffix.style.opacity = '0';
  suffix.style.transform = `translateX(-${SPLIT_TRAVEL_PX}px)`;
  itemList.style.opacity = '0';
  controls.style.opacity = '0';

  // Phase 1: fade in unified phrase
  await delay(T_PHRASE_START);
  const phraseIn = introPhrase.animate(
    [
      { opacity: 0, transform: centeredTranslateWithYOffset(PHRASE_LIFT_PX) },
      { opacity: 1, transform: CENTERED_TRANSLATE },
    ],
    {
      duration: T_PHRASE_FADE,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  );
  await phraseIn.finished.catch(() => {});
  introPhrase.style.opacity = '1';
  introPhrase.style.transform = CENTERED_TRANSLATE;
  phraseIn.cancel();

  // Wait until crossfade start
  await delay(T_SPLIT_START - T_PHRASE_START - T_PHRASE_FADE);

  // Let caller position prefix/suffix at item 0 before they become visible
  onBeforeSplit?.();

  // Phase 2: crossfade phrase → split layout
  const phraseOut = introPhrase.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: T_SPLIT_FADE,
    easing: 'ease-in',
    fill: 'forwards',
  });
  const prefixIn = prefix.animate(
    [
      { opacity: 0, transform: `translateX(${SPLIT_TRAVEL_PX}px)` },
      { opacity: 1, transform: 'translateX(0)' },
    ],
    {
      duration: T_SPLIT_FADE,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  );
  const suffixIn = suffix.animate(
    [
      { opacity: 0, transform: `translateX(-${SPLIT_TRAVEL_PX}px)` },
      { opacity: 1, transform: 'translateX(0)' },
    ],
    {
      duration: T_SPLIT_FADE,
      easing: 'cubic-bezier(0.22, 1, 0.36, 1)',
      fill: 'forwards',
    },
  );
  const itemsIn = itemList.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: T_SPLIT_FADE,
    easing: 'ease-out',
    fill: 'forwards',
  });

  onSplitStart?.();

  await Promise.all([phraseOut.finished, prefixIn.finished, suffixIn.finished, itemsIn.finished]).catch(() => {});

  introPhrase.style.opacity = '0';
  introPhrase.style.display = 'none';
  prefix.style.opacity = '1';
  prefix.style.transform = 'translateX(0)';
  suffix.style.opacity = '1';
  suffix.style.transform = 'translateX(0)';
  itemList.style.opacity = '1';
  phraseOut.cancel();
  prefixIn.cancel();
  suffixIn.cancel();
  itemsIn.cancel();

  // Phase 3: fade in controls
  await delay(T_CONTROLS_START - T_SPLIT_START - T_SPLIT_FADE);
  const controlsIn = controls.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: 300,
    easing: 'ease-out',
    fill: 'forwards',
  });
  controlsIn.finished
    .then(() => {
      controls.style.opacity = '1';
      controlsIn.cancel();
    })
    .catch(() => {});

  // Wait until intro done
  await delay(T_INTRO_DONE - T_CONTROLS_START);
}

/**
 * Skip intro — jump to final state immediately.
 * Used for: prefers-reduced-motion, Universal Editor context.
 */
export function skipIntro(elements: IntroElements): void {
  const { introPhrase, prefix, suffix, itemList, controls } = elements;
  introPhrase.style.opacity = '0';
  introPhrase.style.display = 'none';
  prefix.style.opacity = '1';
  prefix.style.transform = '';
  suffix.style.opacity = '1';
  suffix.style.transform = '';
  itemList.style.opacity = '1';
  controls.style.opacity = '1';
}
