export type GlobalState = {
  currentSection: string | null;
  scrollProgress: number;
  viewport?: {
    width: number;
    height: number;
  };
};

export type StateListener = (state: GlobalState) => void;

export type StateSelector<T> = (state: GlobalState) => T;

export type SetStateFn = (partial: Partial<GlobalState>) => void;

export type UnsubscribeFn = () => void;
