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

  // Category actions
  addCategory: (category: Omit<Category, 'id'>) => Category;
  updateCategory: (id: string, updates: Partial<Category>) => void;
  deleteCategory: (id: string) => void;

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

      // Category actions
      addCategory: (category) => {
        const newCategory: Category = {
          ...category,
          id: generateId(),
        };
        set((state) => ({
          categories: [...state.categories, newCategory],
        }));
        return newCategory;
      },

      updateCategory: (id, updates) => {
        set((state) => ({
          categories: state.categories.map((cat) =>
            cat.id === id ? { ...cat, ...updates } : cat
          ),
        }));
      },

      deleteCategory: (id) => {
        set((state) => ({
          categories: state.categories.filter((cat) => cat.id !== id),
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
