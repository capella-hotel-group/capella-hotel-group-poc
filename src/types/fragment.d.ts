/**
 * Type declarations for the fragment block (used by header/footer).
 */

declare module '*/fragment.js' {
  export function loadFragment(path: string): Promise<HTMLElement | null>;
  export default function decorate(block: HTMLElement): Promise<void>;
}
