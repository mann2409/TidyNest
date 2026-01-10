import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type UserId = string;

interface SurveyStore {
  completedByUserId: Record<UserId, true>;
  markCompleted: (userId: UserId) => void;
  resetForUser: (userId: UserId) => void;
}

export const useSurveyStore = create<SurveyStore>()(
  persist(
    (set) => ({
      completedByUserId: {},
      markCompleted: (userId) => {
        if (!userId) return;
        set((state) => ({
          completedByUserId: { ...state.completedByUserId, [userId]: true },
        }));
      },
      resetForUser: (userId) => {
        if (!userId) return;
        set((state) => {
          const next = { ...state.completedByUserId };
          delete next[userId];
          return { completedByUserId: next };
        });
      },
    }),
    {
      name: 'survey-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
