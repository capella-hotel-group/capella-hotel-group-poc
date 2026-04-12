/**
 * Global type augmentations for the AEM EDS runtime.
 */

interface BlockConfig {
  blockName: string;
  blockURL: string;
}

interface HlxConfig {
  codeBasePath: string;
  lighthouse: boolean;
  RUM_MASK_URL?: string;
  RUM_MANUAL_ENHANCE?: boolean;
  pageLoaded?: boolean;
  patchBlockConfig?: Array<(config: BlockConfig) => BlockConfig>;
  rum?: {
    weight: number;
    id: string;
    isSelected: boolean;
    firstReadTime: number;
    sampleRUM: (checkpoint?: string, data?: Record<string, unknown>) => void;
    queue: unknown[][];
    collector: (...args: unknown[]) => number;
    cwv?: Record<string, unknown>;
    generation?: string;
  };
}

declare global {
  interface Window {
    hlx: HlxConfig;
    SAMPLE_PAGEVIEWS_AT_RATE?: string;
    RUM_BASE?: string;
    RUM_PARAMS?: string;
  }

  interface DOMStringMap {
    // Universal Editor instrumentation attributes
    aueResource?: string;
    aueBehavior?: string;
    aueProp?: string;
    aueLabel?: string;
    aueFilter?: string;
    aueType?: string;
    // Rich-text instrumentation attributes
    richtextResource?: string;
    richtextProp?: string;
    richtextFilter?: string;
    richtextLabel?: string;
  }

  // Vite define globals — replaced at build time
  var __APP_VERSION__: string;
  var __APP_NAME__: string;
}

export {};
