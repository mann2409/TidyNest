import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { Session, User } from "@supabase/supabase-js";

interface AuthStore {
  session: Session | null;
  user: User | null;
  initialized: boolean;
  setSession: (session: Session | null) => void;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      session: null,
      user: null,
      initialized: false,
      setSession: (session) => {
        set({ session, user: session?.user ?? null, initialized: true });
      },
      signOut: async () => {
        await supabase.auth.signOut();
        set({ session: null, user: null });
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

