import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";
import useStorageStore from "./storage-store";

interface AuthStore {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  isGuest: boolean;
  isPro: boolean;
  setSession: (session: Session | null) => void;
  setGuestMode: (isGuest: boolean) => void;
  setIsPro: (isPro: boolean) => void;
  signOut: () => Promise<void>;
  deleteAccount: () => Promise<{ error: string | null }>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      session: null,
      user: null,
      initialized: false,
      isGuest: false,
      isPro: false,
      setSession: (session) => {
        set({ session, user: session?.user ?? null, initialized: true, isGuest: false });
      },
      setGuestMode: (isGuest) => {
        set({ isGuest, initialized: true });
      },
      setIsPro: (isPro) => {
        set({ isPro });
      },
      signOut: async () => {
        await supabase.auth.signOut();
        useStorageStore.getState().clearData();
        set({ session: null, user: null, isGuest: false });
      },
      deleteAccount: async () => {
        const { session } = get();
        if (!session?.access_token) return { error: "No session found" };

        try {
          const { data, error } = await supabase.functions.invoke('auth-delete-account');
          
          if (error) {
            console.error('Account deletion function error:', error);
            return { error: error.message };
          }

          // If successful, sign out locally
          await supabase.auth.signOut();
          useStorageStore.getState().clearData();
          set({ session: null, user: null, isGuest: false });
          
          return { error: null };
        } catch (err: any) {
          console.error('Account deletion error:', err);
          return { error: err.message || "Failed to delete account" };
        }
      },
    }),
    {
      name: "auth-storage",
      storage: createJSONStorage(() => AsyncStorage),
      onRehydrateStorage: () => (state) => {
        if (state) {
          // Add a small delay to ensure everything is ready
          setTimeout(() => {
            state.setInitialized(true);
          }, 0);
        }
      },
    }
  )
);

// Add helper to set initialized since it's missing in the interface
useAuthStore.setState((state: any) => ({
  ...state,
  setInitialized: (val: boolean) => useAuthStore.setState({ initialized: val })
}));

