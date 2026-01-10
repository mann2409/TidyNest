import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type TipId = 
  | 'export_data_after_2_boxes'
  | 'label_printer_after_5_boxes'
  | 'add_tags_after_first_search'
  | 'share_app_after_10_items';

type UserId = string;

interface ProgressiveTipsStore {
  // Track which tips have been shown/dismissed by user
  dismissedTips: Record<UserId, Record<TipId, true>>;
  
  // Track milestones reached
  milestones: Record<UserId, {
    hasSearched?: true;
    shownExportTip?: true;
    shownPrinterTip?: true;
    shownTagsTip?: true;
    shownShareTip?: true;
  }>;
  
  // Actions
  dismissTip: (userId: UserId, tipId: TipId) => void;
  markSearched: (userId: UserId) => void;
  markTipShown: (userId: UserId, tipId: TipId) => void;
  shouldShowTip: (userId: UserId, tipId: TipId, boxCount: number, itemCount: number, hasSearched: boolean) => boolean;
}

export const useProgressiveTipsStore = create<ProgressiveTipsStore>()(
  persist(
    (set, get) => ({
      dismissedTips: {},
      milestones: {},
      
      dismissTip: (userId, tipId) => {
        if (!userId) return;
        set((state) => ({
          dismissedTips: {
            ...state.dismissedTips,
            [userId]: {
              ...state.dismissedTips[userId],
              [tipId]: true,
            },
          },
        }));
      },
      
      markSearched: (userId) => {
        if (!userId) return;
        set((state) => ({
          milestones: {
            ...state.milestones,
            [userId]: {
              ...state.milestones[userId],
              hasSearched: true,
            },
          },
        }));
      },
      
      markTipShown: (userId, tipId) => {
        if (!userId) return;
        
        // Map tip IDs to milestone keys
        let key: string;
        switch (tipId) {
          case 'export_data_after_2_boxes':
            key = 'shownExportTip';
            break;
          case 'label_printer_after_5_boxes':
            key = 'shownPrinterTip';
            break;
          case 'add_tags_after_first_search':
            key = 'shownTagsTip';
            break;
          case 'share_app_after_10_items':
            key = 'shownShareTip';
            break;
          default:
            return;
        }
        
        set((state) => ({
          milestones: {
            ...state.milestones,
            [userId]: {
              ...state.milestones[userId],
              [key]: true,
            },
          },
        }));
      },
      
      shouldShowTip: (userId, tipId, boxCount, itemCount, hasSearched) => {
        if (!userId) return false;
        
        const state = get();
        const dismissed = state.dismissedTips[userId]?.[tipId];
        if (dismissed) return false;
        
        const userMilestones = state.milestones[userId] || {};
        
        // Check specific tip conditions
        switch (tipId) {
          case 'export_data_after_2_boxes':
            return boxCount >= 2 && !userMilestones.shownExportTip;
            
          case 'label_printer_after_5_boxes':
            return boxCount >= 5 && !userMilestones.shownPrinterTip;
            
          case 'add_tags_after_first_search':
            return hasSearched && !userMilestones.shownTagsTip;
            
          case 'share_app_after_10_items':
            return itemCount >= 10 && !userMilestones.shownShareTip;
            
          default:
            return false;
        }
      },
    }),
    {
      name: 'progressive-tips-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
