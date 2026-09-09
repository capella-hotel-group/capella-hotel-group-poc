// src/blocks/hero-video/lib/types.ts

export type TransitionStyle = 'crossfade' | 'slide' | 'cut';

export interface HeroVideoConfig {
  prefix: string;
  suffix: string;
  transition: TransitionStyle;
  destinationLabel: string;
  destinationHref: string;
  experienceLabel: string;
  experienceHref: string;
}

/** hero-video block element carrying the soft-nav readiness gate promise. */
export interface HeroVideoElement extends HTMLElement {
  __heroFirstFrameReady?: Promise<void>;
}

export interface HeroVideoItem {
  label: string;
  videoUrl: string;
  posterUrl: string;
  link: string | null;
  focalDesktop: string;
  focalMobile: string;
  /** Original row element for moveInstrumentation */
  sourceRow: HTMLElement;
}

export interface HeroVideoState {
  activeIndex: number;
  introComplete: boolean;
  muted: boolean;
}

export interface IntroElements {
  introPhrase: HTMLElement;
  prefix: HTMLElement;
  suffix: HTMLElement;
  itemList: HTMLElement;
  controls: HTMLElement;
}
