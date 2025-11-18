import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { IsoMessageType, MessagePayload } from '@shared/types';

interface Draft {
  id: string;
  type: IsoMessageType;
  payload: MessagePayload;
  lastSaved: string;
  name?: string;
}

interface DraftState {
  drafts: Draft[];
  currentDraft: Draft | null;
  saveDraft: (type: IsoMessageType, payload: MessagePayload, name?: string) => void;
  loadDraft: (id: string) => void;
  deleteDraft: (id: string) => void;
  clearCurrentDraft: () => void;
  autoSave: (type: IsoMessageType, payload: MessagePayload) => void;
}

export const useDraftStore = create<DraftState>()(
  persist(
    (set, get) => ({
      drafts: [],
      currentDraft: null,
      
      saveDraft: (type, payload, name) => {
        const draft: Draft = {
          id: `draft-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          type,
          payload,
          lastSaved: new Date().toISOString(),
          name: name || `${type} Draft ${new Date().toLocaleString()}`,
        };
        set((state) => ({
          drafts: [draft, ...state.drafts.slice(0, 49)], // Keep last 50 drafts
          currentDraft: draft,
        }));
      },
      
      loadDraft: (id) => {
        const draft = get().drafts.find((d) => d.id === id);
        if (draft) {
          set({ currentDraft: draft });
        }
      },
      
      deleteDraft: (id) => {
        set((state) => ({
          drafts: state.drafts.filter((d) => d.id !== id),
          currentDraft: state.currentDraft?.id === id ? null : state.currentDraft,
        }));
      },
      
      clearCurrentDraft: () => set({ currentDraft: null }),
      
      autoSave: (type, payload) => {
        const state = get();
        const existingAutoSave = state.drafts.find(
          (d) => d.name?.startsWith('Auto-save:') && d.type === type
        );
        
        const draft: Draft = {
          id: existingAutoSave?.id || `autosave-${type}-${Date.now()}`,
          type,
          payload,
          lastSaved: new Date().toISOString(),
          name: `Auto-save: ${type}`,
        };
        
        set((state) => ({
          drafts: existingAutoSave
            ? state.drafts.map((d) => (d.id === existingAutoSave.id ? draft : d))
            : [draft, ...state.drafts.slice(0, 49)],
        }));
      },
    }),
    {
      name: 'loxra-draft-storage',
    }
  )
);
