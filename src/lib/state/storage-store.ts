import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "@/lib/supabase";
import { useAuthStore } from "./auth-store";
import 'react-native-get-random-values';
import { v4 as uuidv4 } from 'uuid';

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
  lastViewedAt?: string;
  viewCount?: number;
}

export interface Item {
  id: string;
  containerId: string;
  name: string;
  tags: string[];
  quantity?: number;
  notes?: string;
  photoUrl?: string;
  expiryDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  code: string;
  name: string;
  keywords: string[];
  isDefault?: boolean;
}

interface StorageStore {
  locations: Location[];
  containers: Container[];
  items: Item[];
  categories: Category[];
  customCategories: string[]; // Keep for backward compatibility or transition

  // Location actions
  addLocation: (location: Omit<Location, 'id'>) => Location;
  updateLocation: (id: string, updates: Partial<Location>) => void;
  deleteLocation: (id: string) => void;

  // Category actions
  addCategory: (category: string) => void;
  deleteCategory: (category: string) => void;
  
  // Container actions
  addContainer: (container: Omit<Container, 'id' | 'createdAt' | 'updatedAt' | 'lastViewedAt' | 'viewCount'>) => Container;
  updateContainer: (id: string, updates: Partial<Container>) => void;
  deleteContainer: (id: string) => void;
  getNextContainerCode: (locationId: string, category: string) => string;
  trackContainerView: (id: string) => void;

  // Item actions
  addItem: (item: Omit<Item, 'id' | 'createdAt' | 'updatedAt'>) => Item;
  updateItem: (id: string, updates: Partial<Item>) => void;
  deleteItem: (id: string) => void;

  // Search
  search: (query: string) => { items: Item[]; containers: Container[]; locations: Location[] };

  // Sync actions
  fetchData: () => Promise<void>;
}

const generateId = () => uuidv4();

// Default locations
const defaultLocations: Location[] = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Garage', code: 'G' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Office', code: 'OF' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Bedroom', code: 'BD' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'Attic', code: 'AT' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Basement', code: 'BS' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Closet', code: 'CL' },
];

// Default categories
const defaultCategories: Category[] = [
  { id: 'cat-tools', code: 'TOOLS', name: 'Tools', keywords: ['hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'tape measure', 'level', 'tool', 'socket', 'ratchet', 'clamp', 'vise', 'chisel', 'file', 'sandpaper', 'sanding', 'protective', 'safety', 'goggles', 'gloves', 'mask'], isDefault: true },
  { id: 'cat-elec', code: 'ELEC', name: 'Electronics', keywords: ['cable', 'wire', 'electrical', 'plug', 'socket', 'extension', 'power strip', 'adapter', 'charger', 'battery', 'batteries', 'led', 'bulb', 'light', 'lamp', 'electronics', 'circuit', 'switch', 'outlet', 'voltage', 'multimeter'], isDefault: true },
  { id: 'cat-tape', code: 'TAPE', name: 'Tape & Adhesives', keywords: ['tape', 'duct tape', 'masking tape', 'packing tape', 'electrical tape', 'painters tape', 'adhesive', 'velcro', 'straps', 'ties', 'zip ties', 'bungee'], isDefault: true },
  { id: 'cat-paint', code: 'PAINT', name: 'Paint', keywords: ['paint', 'brush', 'roller', 'primer', 'stain', 'varnish', 'lacquer', 'spray paint', 'drop cloth', 'tray', 'spackle', 'putty', 'caulk', 'painters'], isDefault: true },
  { id: 'cat-garden', code: 'GARDEN', name: 'Garden', keywords: ['garden', 'plant', 'seed', 'pot', 'soil', 'fertilizer', 'hose', 'sprinkler', 'rake', 'shovel', 'trowel', 'pruner', 'shears', 'wheelbarrow', 'lawn', 'grass', 'weed', 'mulch'], isDefault: true },
  { id: 'cat-camping', code: 'CAMPING', name: 'Camping', keywords: ['tent', 'sleeping bag', 'lantern', 'cooler', 'camping', 'outdoor', 'hiking', 'backpack', 'compass', 'flashlight', 'headlamp', 'rope', 'carabiner', 'camping stove', 'canteen', 'first aid'], isDefault: true },
  { id: 'cat-xmas', code: 'XMAS', name: 'Christmas', keywords: ['christmas', 'holiday', 'ornament', 'decoration', 'lights', 'tree', 'wreath', 'garland', 'stocking', 'santa', 'snowman', 'reindeer', 'tinsel', 'bow'], isDefault: true },
  { id: 'cat-kitchen', code: 'KITCHEN', name: 'Kitchen', keywords: ['kitchen', 'cooking', 'baking', 'pot', 'pan', 'utensil', 'spatula', 'whisk', 'bowl', 'plate', 'cup', 'mug', 'glass', 'silverware', 'knife', 'cutting board', 'container', 'tupperware', 'storage container', 'food'], isDefault: true },
  { id: 'cat-clean', code: 'CLEAN', name: 'Cleaning', keywords: ['cleaning', 'cleaner', 'soap', 'detergent', 'sponge', 'brush', 'mop', 'broom', 'vacuum', 'duster', 'rag', 'towel', 'bucket', 'spray bottle', 'disinfectant'], isDefault: true },
  { id: 'cat-office', code: 'OFFICE', name: 'Office', keywords: ['office', 'paper', 'pen', 'pencil', 'stapler', 'clip', 'folder', 'binder', 'notebook', 'sticky note', 'tape', 'scissors', 'ruler', 'calculator', 'desk'], isDefault: true },
  { id: 'cat-kids', code: 'KIDS', name: 'Kids', keywords: ['toy', 'game', 'puzzle', 'doll', 'action figure', 'lego', 'blocks', 'ball', 'bike', 'scooter', 'skateboard', 'art supplies', 'crayon', 'marker', 'kids'], isDefault: true },
  { id: 'cat-sports', code: 'SPORTS', name: 'Sports', keywords: ['sports', 'ball', 'bat', 'racket', 'helmet', 'pads', 'jersey', 'shoes', 'cleats', 'glove', 'net', 'goal', 'weights', 'dumbbell', 'yoga', 'exercise'], isDefault: true },
  { id: 'cat-auto', code: 'AUTO', name: 'Auto', keywords: ['car', 'auto', 'vehicle', 'oil', 'filter', 'brake', 'tire', 'wheel', 'jack', 'jumper cables', 'windshield', 'wiper', 'coolant', 'antifreeze', 'spark plug'], isDefault: true },
  { id: 'cat-plumb', code: 'PLUMB', name: 'Plumbing', keywords: ['plumbing', 'pipe', 'faucet', 'valve', 'fitting', 'pvc', 'copper', 'drain', 'snake', 'plunger', 'washer', 'o-ring', 'teflon tape', 'toilet'], isDefault: true },
  { id: 'cat-craft', code: 'CRAFT', name: 'Crafts', keywords: ['craft', 'fabric', 'yarn', 'needle', 'thread', 'sewing', 'knitting', 'glue', 'scissors', 'beads', 'ribbon', 'canvas', 'scrapbook'], isDefault: true },
  { id: 'cat-misc', code: 'MISC', name: 'Miscellaneous', keywords: ['miscellaneous', 'other', 'various', 'mixed', 'assorted', 'general'], isDefault: true },
];

const useStorageStore = create<StorageStore>()(
  persist(
    (set, get) => ({
      locations: defaultLocations,
      containers: [],
      items: [],
      categories: defaultCategories,
      customCategories: [],

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

      // Category actions
      addCategory: (category) => {
        const cat = category.toUpperCase().trim();
        if (!cat) return;
        set((state) => ({
          customCategories: Array.from(new Set([...state.customCategories, cat])),
          // Also add to structured categories for consistency
          categories: [
            ...state.categories,
            { id: generateId(), code: cat, name: cat, keywords: [], isDefault: false }
          ]
        }));
      },

      deleteCategory: (category) => {
        set((state) => ({
          customCategories: state.customCategories.filter((c) => c !== category),
          categories: state.categories.filter((c) => c.code !== category),
        }));
      },

      // Container actions
      addContainer: (container) => {
        const now = new Date().toISOString();
        const id = generateId();
        const newContainer: Container = {
          ...container,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          containers: [...state.containers, newContainer],
        }));

        // Background sync to Supabase
        const user = useAuthStore.getState().user;
        if (user?.id) {
          supabase.from('containers').insert({
            id,
            user_id: user.id,
            name: container.code,
            code: container.code,
            location_id: container.locationId,
            category: container.category,
            description: container.description,
            photo_url: container.photoUrl,
          }).then(({ error }) => {
            if (error) console.error('Supabase sync error (containers):', error);
          });
        }

        return newContainer;
      },

      updateContainer: (id, updates) => {
        set((state) => ({
          containers: state.containers.map((c) =>
            c.id === id ? { ...c, ...updates, updatedAt: new Date().toISOString() } : c
          ),
        }));

        // Update Supabase
        supabase.from('containers').update({
          name: updates.code,
          code: updates.code,
          location_id: updates.locationId,
          category: updates.category,
          description: updates.description,
          photo_url: updates.photoUrl,
          updated_at: new Date().toISOString(),
        }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase update error:', error);
        });
      },

      deleteContainer: (id) => {
        set((state) => ({
          containers: state.containers.filter((c) => c.id !== id),
          items: state.items.filter((item) => item.containerId !== id),
        }));

        // Delete from Supabase
        supabase.from('containers').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase delete error:', error);
        });
      },

      trackContainerView: (id) => {
        const now = new Date().toISOString();
        set((state) => ({
          containers: state.containers.map((c) =>
            c.id === id 
              ? { 
                  ...c, 
                  lastViewedAt: now, 
                  viewCount: (c.viewCount || 0) + 1 
                } 
              : c
          ),
        }));

        // Update Supabase with view metadata
        const container = get().containers.find(c => c.id === id);
        if (container) {
          supabase.from('containers').update({
            last_viewed_at: now,
            view_count: container.viewCount,
          }).eq('id', id).then(({ error }) => {
            if (error) console.error('Supabase view track error:', error);
          });
        }
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
        const id = generateId();
        const newItem: Item = {
          ...item,
          id,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => ({
          items: [...state.items, newItem],
        }));

        // Background sync to Supabase
        const user = useAuthStore.getState().user;
        if (user?.id) {
          supabase.from('items').insert({
            id,
            user_id: user.id,
            container_id: item.containerId,
            name: item.name,
            tags: item.tags,
            quantity: item.quantity,
            notes: item.notes,
            expiry_date: item.expiryDate,
          }).then(({ error }) => {
            if (error) console.error('Supabase sync error (items):', error);
          });
        }

        return newItem;
      },

      updateItem: (id, updates) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates, updatedAt: new Date().toISOString() } : item
          ),
        }));

        // Update Supabase
        supabase.from('items').update({
          name: updates.name,
          tags: updates.tags,
          quantity: updates.quantity,
          notes: updates.notes,
          expiry_date: updates.expiryDate,
          updated_at: new Date().toISOString(),
        }).eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase update error:', error);
        });
      },

      deleteItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));

        // Delete from Supabase
        supabase.from('items').delete().eq('id', id).then(({ error }) => {
          if (error) console.error('Supabase delete error:', error);
        });
      },

      // Search
      search: (query) => {
        const { items, containers, locations } = get();
        const lowerQuery = query.toLowerCase().trim();
        const words = lowerQuery.split(/\s+/);

        if (!lowerQuery) {
          return { items: [], containers: [], locations: [] };
        }

        const matchedItems = items
          .map(item => {
            let score = 0;
            const itemName = item.name.toLowerCase();
            const itemTags = (item.tags || []).map(t => t.toLowerCase());
            const itemNotes = (item.notes || '').toLowerCase();

            if (itemName === lowerQuery) score += 100;
            else if (itemName.includes(lowerQuery)) score += 50;

            for (const word of words) {
              if (itemName.includes(word)) score += 20;
              if (itemTags.some(t => t.includes(word))) score += 15;
              if (itemNotes.includes(word)) score += 5;
            }

            return { ...item, searchScore: score };
          })
          .filter(item => (item as any).searchScore > 0)
          .sort((a, b) => (b as any).searchScore - (a as any).searchScore);

        const matchedContainers = containers
          .map(c => {
            let score = 0;
            const code = c.code.toLowerCase();
            const category = c.category.toLowerCase();
            const desc = (c.description || '').toLowerCase();

            if (code === lowerQuery) score += 100;
            if (category === lowerQuery) score += 80;
            
            for (const word of words) {
              if (code.includes(word)) score += 30;
              if (category.includes(word)) score += 25;
              if (desc.includes(word)) score += 10;
            }

            return { ...c, searchScore: score };
          })
          .filter(c => (c as any).searchScore > 0)
          .sort((a, b) => (b as any).searchScore - (a as any).searchScore);

        const matchedLocations = locations
          .map(l => {
            let score = 0;
            const name = l.name.toLowerCase();
            const code = l.code.toLowerCase();

            if (name === lowerQuery) score += 100;
            if (code === lowerQuery) score += 80;

            for (const word of words) {
              if (name.includes(word)) score += 30;
              if (code.includes(word)) score += 20;
            }

            return { ...l, searchScore: score };
          })
          .filter(l => (l as any).searchScore > 0)
          .sort((a, b) => (b as any).searchScore - (a as any).searchScore);

        return { 
          items: matchedItems.map(({ searchScore, ...i }: any) => i as Item), 
          containers: matchedContainers.map(({ searchScore, ...c }: any) => c as Container),
          locations: matchedLocations.map(({ searchScore, ...l }: any) => l as Location)
        };
      },

      fetchData: async () => {
        const { data: containers, error: cError } = await supabase
          .from('containers')
          .select('*');
        
        const { data: items, error: iError } = await supabase
          .from('items')
          .select('*');

        if (cError || iError) {
          console.error('Fetch error:', cError || iError);
          return;
        }

        set({
          containers: (containers || []).map(c => ({
            id: c.id,
            code: c.code,
            locationId: c.location_id,
            category: c.category,
            description: c.description,
            photoUrl: c.photo_url,
            createdAt: c.created_at,
            updatedAt: c.updated_at,
            lastViewedAt: c.last_viewed_at,
            viewCount: c.view_count || 0,
          })),
          items: (items || []).map(i => ({
            id: i.id,
            containerId: i.container_id,
            name: i.name,
            tags: i.tags || [],
            quantity: i.quantity,
            notes: i.notes,
            expiryDate: i.expiry_date,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
          }))
        });
      },
    }),
    {
      name: "home-storage",
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

export default useStorageStore;
