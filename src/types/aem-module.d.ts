/**
 * Type declarations for scripts/aem.js (Adobe-maintained, kept as plain JS).
 */

export interface OptimizedPictureOptions {
  width?: string;
  height?: string;
  media?: string;
}

declare module '*/aem.js' {
  export function sampleRUM(checkpoint: string, data?: Record<string, string | number>): void;

  export function loadScript(src: string, attrs?: Record<string, string>): Promise<HTMLScriptElement>;

  export function fetchPlaceholders(prefix?: string): Promise<Record<string, string>>;

  export function getMetadata(name: string): string;

  export function toClassName(text: string): string;

  export function toCamelCase(text: string): string;

  export function createOptimizedPicture(
    src: string,
    alt?: string,
    eager?: boolean,
    breakpoints?: OptimizedPictureOptions[],
  ): HTMLPictureElement;

  export function loadCSS(href: string): Promise<void>;

  export function decorateBlock(block: HTMLElement): void;

  export function decorateBlocks(main: HTMLElement): void;

  export function decorateButtons(main: HTMLElement): void;

  export function decorateIcons(main: HTMLElement, prefix?: string): void;

  export function decorateSections(main: HTMLElement): void;

  export function decorateTemplateAndTheme(): void;

  export function loadBlock(block: HTMLElement): Promise<HTMLElement>;

  export function loadSection(
    section: HTMLElement,
    loadCallback?: (el: HTMLElement) => void | Promise<void>,
  ): Promise<void>;

  export function loadSections(main: HTMLElement): Promise<void>;

  export function waitForFirstImage(section: HTMLElement): Promise<void>;

  export function loadHeader(header: HTMLElement): Promise<void>;

  export function loadFooter(footer: HTMLElement): Promise<void>;
}
