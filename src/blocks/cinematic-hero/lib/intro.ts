// src/blocks/cinematic-hero/lib/intro.ts
import type { IntroElements } from './types';

// Intro timing (seconds from block-visible)
const T_SENTENCE_FADEIN = 700; // sentence fades in
const T_SENTENCE_SPLIT = 2750; // prefix/suffix split horizontally
const T_ITEMS_REVEAL = 3500; // items fade in
const T_INTRO_DONE = 3750; // interaction unlocks

// Horizontal distance prefix/suffix travel to their "separated" position
const SPLIT_TRANSLATE_PX = 120;

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Run the full intro animation (~3.75s).
 * Prefix and suffix start visually centered (as if one sentence),
 * then split horizontally, then settle vertically to first item row.
 * The SelectorUI will handle the vertical anchor placement for item 0
 * after introComplete is set.
 */
export async function runIntro(elements: IntroElements): Promise<void> {
  const { prefix, suffix, itemList, controls } = elements;

  // Initial state: UI invisible
  prefix.style.opacity = '0';
  suffix.style.opacity = '0';
  itemList.style.opacity = '0';
  controls.style.opacity = '0';

  // Initial centering transform (make prefix/suffix appear as one phrase)
  prefix.style.transform = `translateX(${SPLIT_TRANSLATE_PX}px)`;
  suffix.style.transform = `translateX(-${SPLIT_TRANSLATE_PX}px)`;

  // 0.70s: fade in sentence
  await delay(T_SENTENCE_FADEIN);
  await Promise.all([
    prefix.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'linear', fill: 'forwards' }).finished,
    suffix.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 300, easing: 'linear', fill: 'forwards' }).finished,
  ]).catch(() => {});
  prefix.style.opacity = '1';
  suffix.style.opacity = '1';

  // 2.75s: split horizontally
  await delay(T_SENTENCE_SPLIT - T_SENTENCE_FADEIN - 300);
  await Promise.all([
    prefix.animate([{ transform: `translateX(${SPLIT_TRANSLATE_PX}px)` }, { transform: 'translateX(0)' }], {
      duration: 250,
      easing: 'ease-out',
      fill: 'forwards',
    }).finished,
    suffix.animate([{ transform: `translateX(-${SPLIT_TRANSLATE_PX}px)` }, { transform: 'translateX(0)' }], {
      duration: 250,
      easing: 'ease-out',
      fill: 'forwards',
    }).finished,
    itemList.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 250, easing: 'ease-out', fill: 'forwards' })
      .finished,
  ]).catch(() => {});
  prefix.style.transform = 'translateX(0)';
  suffix.style.transform = 'translateX(0)';
  itemList.style.opacity = '1';

  // 3.50s: controls fade in
  await delay(T_ITEMS_REVEAL - T_SENTENCE_SPLIT - 250);
  controls
    .animate([{ opacity: 0 }, { opacity: 1 }], { duration: 200, easing: 'linear', fill: 'forwards' })
    .finished.then(() => {
      controls.style.opacity = '1';
    })
    .catch(() => {});

  // 3.75s: intro done
  await delay(T_INTRO_DONE - T_ITEMS_REVEAL);
}

/**
 * Skip intro and jump directly to final state.
 * Call when: prefers-reduced-motion, editor context, or config flag.
 */
export function skipIntro(elements: IntroElements): void {
  const { prefix, suffix, itemList, controls } = elements;
  prefix.style.opacity = '1';
  prefix.style.transform = 'translateX(0)';
  suffix.style.opacity = '1';
  suffix.style.transform = 'translateX(0)';
  itemList.style.opacity = '1';
  controls.style.opacity = '1';
}
