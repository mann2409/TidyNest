// Category mapping from keywords to canonical categories
export const CATEGORY_KEYWORDS: Record<string, string[]> = {
  TOOLS: [
    'hammer', 'screwdriver', 'wrench', 'pliers', 'drill', 'saw', 'tape measure',
    'level', 'tool', 'socket', 'ratchet', 'clamp', 'vise', 'chisel', 'file',
    'sandpaper', 'sanding', 'protective', 'safety', 'goggles', 'gloves', 'mask',
    'ear protection', 'earmuffs', 'hearing protection'
  ],
  ELEC: [
    'cable', 'wire', 'electrical', 'plug', 'socket', 'extension', 'power strip',
    'adapter', 'charger', 'battery', 'batteries', 'led', 'bulb', 'light', 'lamp',
    'electronics', 'circuit', 'switch', 'outlet', 'voltage', 'multimeter'
  ],
  TAPE: [
    'tape', 'duct tape', 'masking tape', 'packing tape', 'electrical tape',
    'painters tape', 'adhesive', 'velcro', 'straps', 'ties', 'zip ties', 'bungee'
  ],
  PAINT: [
    'paint', 'brush', 'roller', 'primer', 'stain', 'varnish', 'lacquer',
    'spray paint', 'drop cloth', 'tray', 'spackle', 'putty', 'caulk', 'painters'
  ],
  GARDEN: [
    'garden', 'plant', 'seed', 'pot', 'soil', 'fertilizer', 'hose', 'sprinkler',
    'rake', 'shovel', 'trowel', 'pruner', 'shears', 'gloves', 'wheelbarrow',
    'lawn', 'grass', 'weed', 'mulch'
  ],
  CAMPING: [
    'tent', 'sleeping bag', 'lantern', 'cooler', 'camping', 'outdoor', 'hiking',
    'backpack', 'compass', 'flashlight', 'headlamp', 'rope', 'carabiner',
    'camping stove', 'canteen', 'first aid'
  ],
  XMAS: [
    'christmas', 'holiday', 'ornament', 'decoration', 'lights', 'tree', 'wreath',
    'garland', 'stocking', 'santa', 'snowman', 'reindeer', 'tinsel', 'bow'
  ],
  KITCHEN: [
    'kitchen', 'cooking', 'baking', 'pot', 'pan', 'utensil', 'spatula', 'whisk',
    'bowl', 'plate', 'cup', 'mug', 'glass', 'silverware', 'knife', 'cutting board',
    'container', 'tupperware', 'storage container', 'food'
  ],
  CLEAN: [
    'cleaning', 'cleaner', 'soap', 'detergent', 'sponge', 'brush', 'mop', 'broom',
    'vacuum', 'duster', 'rag', 'towel', 'bucket', 'spray bottle', 'disinfectant'
  ],
  OFFICE: [
    'office', 'paper', 'pen', 'pencil', 'stapler', 'clip', 'folder', 'binder',
    'notebook', 'sticky note', 'tape', 'scissors', 'ruler', 'calculator', 'desk'
  ],
  KIDS: [
    'toy', 'game', 'puzzle', 'doll', 'action figure', 'lego', 'blocks', 'ball',
    'bike', 'scooter', 'skateboard', 'art supplies', 'crayon', 'marker', 'kids'
  ],
  SPORTS: [
    'sports', 'ball', 'bat', 'racket', 'helmet', 'pads', 'jersey', 'shoes',
    'cleats', 'glove', 'net', 'goal', 'weights', 'dumbbell', 'yoga', 'exercise'
  ],
  AUTO: [
    'car', 'auto', 'vehicle', 'oil', 'filter', 'brake', 'tire', 'wheel', 'jack',
    'jumper cables', 'windshield', 'wiper', 'coolant', 'antifreeze', 'spark plug'
  ],
  PLUMB: [
    'plumbing', 'pipe', 'faucet', 'valve', 'fitting', 'pvc', 'copper', 'drain',
    'snake', 'plunger', 'washer', 'o-ring', 'teflon tape', 'wrench', 'toilet'
  ],
  CRAFT: [
    'craft', 'fabric', 'yarn', 'needle', 'thread', 'sewing', 'knitting', 'glue',
    'scissors', 'beads', 'ribbon', 'paint', 'brush', 'canvas', 'paper', 'scrapbook'
  ],
  MISC: [
    'miscellaneous', 'other', 'various', 'mixed', 'assorted', 'general'
  ]
};

export const ALL_CATEGORIES = Object.keys(CATEGORY_KEYWORDS);

// Map keywords to a category
export function mapKeywordsToCategory(keywords: string[]): string {
  const scores: Record<string, number> = {};

  for (const category of ALL_CATEGORIES) {
    scores[category] = 0;
  }

  for (const keyword of keywords) {
    const lowerKeyword = keyword.toLowerCase();

    for (const [category, categoryKeywords] of Object.entries(CATEGORY_KEYWORDS)) {
      for (const catKeyword of categoryKeywords) {
        if (lowerKeyword.includes(catKeyword) || catKeyword.includes(lowerKeyword)) {
          scores[category]++;
        }
      }
    }
  }

  // Find category with highest score
  let maxScore = 0;
  let bestCategory = 'MISC';

  for (const [category, score] of Object.entries(scores)) {
    if (score > maxScore) {
      maxScore = score;
      bestCategory = category;
    }
  }

  return bestCategory;
}

export interface PhotoAnalysisResult {
  keywords: string[];
  suggestedCategory: string;
}

// This function will be called with the AI response
export function analyzeKeywordsForCategory(keywords: string[]): PhotoAnalysisResult {
  const suggestedCategory = mapKeywordsToCategory(keywords);
  return {
    keywords,
    suggestedCategory,
  };
}
