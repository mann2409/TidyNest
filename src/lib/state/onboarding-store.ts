import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type UserId = string;

interface OnboardingStore {
  completedByUserId: Record<UserId, true>;
  seenFirstBoxTutorial: Record<UserId, true>;
  markCompleted: (userId: UserId) => void;
  markFirstBoxTutorialSeen: (userId: UserId) => void;
  resetForUser: (userId: UserId) => void;
}

export const useOnboardingStore = create<OnboardingStore>()(
  persist(
    (set) => ({
      completedByUserId: {},
      seenFirstBoxTutorial: {},
      markCompleted: (userId) => {
        if (!userId) return;
        set((state) => ({
          completedByUserId: { ...state.completedByUserId, [userId]: true },
        }));
      },
      markFirstBoxTutorialSeen: (userId) => {
        if (!userId) return;
        set((state) => ({
          seenFirstBoxTutorial: { ...state.seenFirstBoxTutorial, [userId]: true },
        }));
      },
      resetForUser: (userId) => {
        if (!userId) return;
        set((state) => {
          const next = { ...state.completedByUserId };
          const nextTutorial = { ...state.seenFirstBoxTutorial };
          delete next[userId];
          delete nextTutorial[userId];
          return { completedByUserId: next, seenFirstBoxTutorial: nextTutorial };
        });
      },
    }),
    {
      name: 'onboarding-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

