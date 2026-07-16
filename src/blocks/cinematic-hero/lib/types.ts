// src/blocks/cinematic-hero/lib/types.ts

export type HeroMode = 'experiences' | 'destinations';

export interface HeroConfig {
  prefix: string;
  suffix: string;
  experiencesLabel: string;
  destinationsLabel: string;
}

export interface HeroItem {
  label: string;
  mode: HeroMode;
  videoUrl: string;
  posterUrl: string;
  link: string | null;
  focalDesktop: string;
  focalMobile: string;
  hasAudio: boolean;
  /** Original row element for moveInstrumentation */
  sourceRow: HTMLElement;
}

export interface HeroState {
  activeMode: HeroMode;
  activeIndex: Record<HeroMode, number>;
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
