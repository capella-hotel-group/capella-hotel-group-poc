// src/blocks/cinematic-hero/lib/analytics.ts
import type { HeroMode } from './types';

function emit(eventName: string, detail: Record<string, unknown>): void {
  document.dispatchEvent(new CustomEvent(eventName, { detail, bubbles: true }));
}

export function emitHeroImpression(blockId: string, mode: HeroMode, item: string): void {
  emit('cinematic-hero:impression', { blockId, mode, item });
}

export function emitItemSelect(
  previousItem: string,
  newItem: string,
  mode: HeroMode,
  inputSource: 'pointer' | 'keyboard' | 'touch',
): void {
  emit('cinematic-hero:item-select', { previousItem, newItem, mode, inputSource });
}

export function emitModeChange(previousMode: HeroMode, newMode: HeroMode, newActiveItem: string): void {
  emit('cinematic-hero:mode-change', { previousMode, newMode, newActiveItem });
}

export function emitItemNavigation(item: string, href: string): void {
  emit('cinematic-hero:item-navigate', { item, href });
}

export function emitSoundToggle(muted: boolean): void {
  emit('cinematic-hero:sound-toggle', { muted });
}

export function emitMediaError(item: string, mediaUrl: string, errorType: string): void {
  emit('cinematic-hero:media-error', { item, mediaUrl, errorType });
}
