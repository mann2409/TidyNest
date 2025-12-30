import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Types
export interface Location {
  id: string;
  name: string;
  code: string;
}

export interface Container {
  id: string;
  code: string;
  locationId: string;
  category: string;
  description?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Item {
  id: string;
  containerId: string;
  name: string;
  tags: string[];
  quantity?: number;
  notes?: string;
  photoUrl?: string;
  createdAt: string;
  updatedAt: string;
}

interface StorageStore {
  locations: Location[];
  containers: Container[];
  items: Item[];

  // Location actions
  addLocation: (location: Omit<Location, 'id'>) => Location;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  // Container actions
  addContainer: (container: Omit<Container, 'id' | 'createdAt' | 'updatedAt'>) => Container;
  updateContainer: (id: string, updates: Partial<Container>) => void;
  deleteContainer: (id: string) => void;
  getNextContainerCode: (locationId: string, category: string) => string;

  // Item actions
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;

  // Search
  search: (query: string) => { items: Item[]; containers: Container[] };
}

const generateId = () => Math.random().toString(36).substring(2, 15);

// Default locations
const defaultLocations: Location[] = [
  { id: 'loc-garage', name: 'Garage', code: 'G' },
  { id: 'loc-office', name: 'Office', code: 'OF' },
  { id: 'loc-bedroom', name: 'Bedroom', code: 'BD' },
  { id: 'loc-attic', name: 'Attic', code: 'AT' },
  { id: 'loc-basement', name: 'Basement', code: 'BS' },
  { id: 'loc-closet', name: 'Closet', code: 'CL' },
];

const useStorageStore = create<StorageStore>()(
  persist(
    (set, get) => ({
      locations: defaultLocations,
      containers: [],
      items: [],

      // Location actions
      addLocation: (location) => {
        const newLocation: Location = {
          ...location,
          id: generateId(),
        };
        set((state) => ({
          locations: [...state.locations, newLocation],
        }));
        return newLocation;
      },

      updateLocation: (id, updates) => {
        set((state) => ({
          locations: state.locations.map((loc) =>
            loc.id === id ? { ...loc, ...updates } : loc
          ),
        }));
      },

      deleteLocation: (id) => {
        set((state) => ({
          locations: state.locations.filter((loc) => loc.id !== id),
        }));
      },

      // Container actions
      addContainer: (container) => {
        const now = new Date().toISOString();
        const newContainer: Container = {
          ...container,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          containers: [...state.containers, newContainer],
        }));
        return newContainer;
      },

      updateContainer: (id, updates) => {
        set((state) => ({
          containers: state.containers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));
      },

      deleteContainer: (id) => {
        set((state) => ({
          containers: state.containers.filter((c) => c.id !== id),
          items: state.items.filter((item) => item.containerId !== id),
        }));
      },

      getNextContainerCode: (locationId, category) => {
        const { locations, containers } = get();
        const location = locations.find((l) => l.id === locationId);
        if (!location) return '';

        const prefix = `${location.code}-${category}`;
        const existingCodes = containers
          .filter((c) => c.code.startsWith(prefix))
          .map((c) => {
            const match = c.code.match(/-(\d+)$/);
            return match ? parseInt(match[1], 10) : 0;
          });

        const maxNum = existingCodes.length > 0 ? Math.max(...existingCodes) : 0;
        const nextNum = (maxNum + 1).toString().padStart(2, '0');
        return `${prefix}-${nextNum}`;
      },

      // Item actions
      addItem: (item) => {
        const now = new Date().toISOString();
        const newItem: Item = {
          ...item,
          id: generateId(),
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));
        return newItem;
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
          ),
        }));
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      // Search
      search: (query) => {
        const { items, containers } = get();
        const lowerQuery = query.toLowerCase().trim();

        if (!lowerQuery) {
          return { items: [], containers: [] };
        }

        const matchedItems = items.filter(
          (item) =>
            item.name.toLowerCase().includes(lowerQuery) ||
            item.tags.some((tag) => tag.toLowerCase().includes(lowerQuery)) ||
            item.notes?.toLowerCase().includes(lowerQuery)
        );

        const matchedContainers = containers.filter(
          (c) =>
            c.code.toLowerCase().includes(lowerQuery) ||
            c.category.toLowerCase().includes(lowerQuery) ||
            c.description?.toLowerCase().includes(lowerQuery)
        );

        return { items: matchedItems, containers: matchedContainers };
      },
    }),
    {
      name: "home-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useStorageStore;
