// src/blocks/hero-video/lib/intro.ts
import type { IntroElements } from './types';

// Timeline (ms)
const T_PHRASE_START = 800; // unified phrase fades in
const T_PHRASE_FADE = 400; // phrase fade-in duration
const T_SPLIT_START = 2800; // phrase out → split layout in
const T_SPLIT_FADE = 380; // phrase fade-out (quick, overlaps the rising reveal)
const T_SPLIT_MOTION = 720; // prefix/list/suffix rise + fade in together for one cohesive glide
const T_CONTROLS_GAP = 180; // pause after the split settles before controls fade in
const T_CONTROLS_FADE = 320; // controls fade-in duration
const PHRASE_LIFT_PX = 28;
const PREFIX_RISE_PX = 40; // "See" starts this far below its resting spot above the list
const PREFIX_HOLD_PX = 18; // "See" holds here (just above the list) while readable
const PREFIX_EXIT_PX = 64; // "See" ends this far up as it fades out
const ITEMS_RISE_PX = 28; // list rises this far as it fades in
const SUFFIX_RISE_PX = 28; // "with new eyes" rises in sync with the list
const EASE_ENTRANCE = 'cubic-bezier(0.22, 1, 0.36, 1)'; // soft ease-out for the fade + rise reveals
const EASE_THROUGH = 'cubic-bezier(0.5, 0, 0.2, 1)'; // "See" gliding up through and out
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
 * 3. Phrase crossfades out; "See" rises up through the center (fading in then out) while the
 *    destination list fades in and rises to meet it — resting layout is the list + "with new eyes"
 * 4. Controls fade in at the bottom
 *
 * onBeforeSplit is called just before the split so the caller can position
 * the selector list at item 0 while still invisible.
 * onSplitStart is called once the list has settled, letting the caller assert the active
 * destination highlight.
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
  prefix.style.display = '';
  prefix.style.opacity = '0';
  prefix.style.transform = `translate(-50%, ${PREFIX_RISE_PX}px)`;
  suffix.style.opacity = '0';
  suffix.style.transform = `translateY(${SUFFIX_RISE_PX}px)`;
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

  // Phase 2: crossfade the unified phrase out while "See" rises up through the center — fading in
  // as it arrives, then out as it exits the top — and the destination list fades in and rises to
  // meet it. Prefix and list share T_SPLIT_MOTION so their motion stays in sync.
  const restMatch = /translateY\(([-\d.]+)px\)/.exec(itemList.style.transform);
  const restY = restMatch ? parseFloat(restMatch[1]) : 0;

  const phraseOut = introPhrase.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: T_SPLIT_FADE,
    easing: 'cubic-bezier(0.4, 0, 1, 1)',
    fill: 'forwards',
  });
  const itemsIn = itemList.animate(
    [
      { opacity: 0, transform: `translateY(${restY + ITEMS_RISE_PX}px)` },
      { opacity: 1, transform: `translateY(${restY}px)` },
    ],
    { duration: T_SPLIT_MOTION, easing: EASE_ENTRANCE, fill: 'forwards' },
  );
  const suffixIn = suffix.animate(
    [
      { opacity: 0, transform: `translateY(${SUFFIX_RISE_PX}px)` },
      { opacity: 1, transform: 'translateY(0)' },
    ],
    { duration: T_SPLIT_MOTION, easing: EASE_ENTRANCE, fill: 'forwards' },
  );
  const prefixPass = prefix.animate(
    [
      { opacity: 0, transform: `translate(-50%, ${PREFIX_RISE_PX}px)`, offset: 0 },
      { opacity: 1, transform: 'translate(-50%, 0)', offset: 0.4 },
      { opacity: 1, transform: `translate(-50%, -${PREFIX_HOLD_PX}px)`, offset: 0.62 },
      { opacity: 0, transform: `translate(-50%, -${PREFIX_EXIT_PX}px)`, offset: 1 },
    ],
    { duration: T_SPLIT_MOTION, easing: EASE_THROUGH, fill: 'forwards' },
  );

  await Promise.all([phraseOut.finished, suffixIn.finished, prefixPass.finished, itemsIn.finished]).catch(() => {});

  introPhrase.style.opacity = '0';
  introPhrase.style.display = 'none';
  itemList.style.opacity = '1';
  itemList.style.transform = `translateY(${restY}px)`;
  suffix.style.opacity = '1';
  suffix.style.transform = 'translateY(0)';
  prefix.style.opacity = '0';
  phraseOut.cancel();
  suffixIn.cancel();
  prefixPass.cancel();
  itemsIn.cancel();

  // List is in place — assert the active destination highlight (inline styles pre-set it during
  // the fade, so this only keeps SelectorUI's state in sync).
  onSplitStart?.();

  // Phase 3: fade in controls
  await delay(T_CONTROLS_GAP);
  const controlsIn = controls.animate([{ opacity: 0 }, { opacity: 1 }], {
    duration: T_CONTROLS_FADE,
    easing: 'ease-out',
    fill: 'forwards',
  });
  controlsIn.finished
    .then(() => {
      controls.style.opacity = '1';
      controlsIn.cancel();
    })
    .catch(() => {});

  // Wait until controls finish before unlocking interaction
  await delay(T_CONTROLS_FADE);
}

/**
 * Skip intro — jump to final state immediately.
 * Used for: prefers-reduced-motion, Universal Editor context.
 */
export function skipIntro(elements: IntroElements): void {
  const { introPhrase, prefix, suffix, itemList, controls } = elements;
  introPhrase.style.opacity = '0';
  introPhrase.style.display = 'none';
  prefix.style.opacity = '0';
  prefix.style.display = '';
  suffix.style.opacity = '1';
  suffix.style.transform = '';
  itemList.style.opacity = '1';
  controls.style.opacity = '1';
}
