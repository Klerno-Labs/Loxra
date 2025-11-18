import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type UiState = {
  showBuilderHint: boolean;
  showValidatorHint: boolean;
  toggleBuilderHint: () => void;
  toggleValidatorHint: () => void;
};

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      showBuilderHint: true,
      showValidatorHint: true,
      toggleBuilderHint: () => set((s) => ({ showBuilderHint: !s.showBuilderHint })),
      toggleValidatorHint: () => set((s) => ({ showValidatorHint: !s.showValidatorHint }))
    }),
    { name: 'ui-preferences' }
  )
);
