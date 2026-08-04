// src/blocks/hero-video/lib/types.ts

export interface HeroVideoConfig {
  prefix: string;
  suffix: string;
}

export interface HeroVideoItem {
  label: string;
  videoUrl: string;
  posterUrl: string;
  link: string | null;
  focalDesktop: string;
  focalMobile: string;
  hasAudio: boolean;
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
