import { useState, useMemo, useCallback, useEffect } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, FlatList, RefreshControl, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Plus, Package, Box, MapPin, LayoutGrid, List as ListIcon, ChevronDown, ChevronUp, Filter, ArrowUpDown, Sparkles, Camera as CameraIcon, Download, Printer, Tag, Share2 } from 'lucide-react-native';
import useStorageStore from '@/lib/state/storage-store';
import { ALL_CATEGORIES as DEFAULT_CATEGORIES } from '@/lib/category-mapping';
import { useAuthStore } from '@/lib/state/auth-store';
import { useOnboardingStore } from '@/lib/state/onboarding-store';
import { useProgressiveTipsStore } from '@/lib/state/tips-store';
import TipCard from '@/components/TipCard';
import FirstBoxTutorial from '@/components/FirstBoxTutorial';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';

type SearchFilter = 'All' | 'Items' | 'Boxes' | 'Tags';
type SortOption = 'Smart' | 'Most Items' | 'Empty' | 'Alphabetical';
type ViewMode = 'Boxes' | 'Items';

const QUICK_FIND = [
  { label: 'Tools', emoji: '🔧', id: 'TOOLS' },
  { label: 'Decor', emoji: '🎄', id: 'XMAS' },
  { label: 'Kids', emoji: '🧸', id: 'KIDS' },
  { label: 'Sports', emoji: '⚽', id: 'SPORTS' },
  { label: 'Kitchen', emoji: '🍳', id: 'KITCHEN' },
  { label: 'Camping', emoji: '🏕️', id: 'CAMPING' },
];

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState<SearchFilter>('All');
  const [isCompact, setIsCompact] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('Boxes');
  
  const [sortBy, setSortBy] = useState<SortOption>('Smart');
  const [filterCategory, setFilterCategory] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  const locations = useStorageStore((s) => s.locations);
  const customCategories = useStorageStore((s) => s.customCategories);
  const search = useStorageStore((s) => s.search);
  const fetchData = useStorageStore((s) => s.fetchData);
  const remoteConfig = useStorageStore((s) => s.remoteConfig);

  const userId = useAuthStore((s) => s.user?.id ?? null);
  const isGuest = useAuthStore((s) => s.isGuest);
  const userKey = userId || (isGuest ? 'guest' : null);

  const completedOnboarding = useOnboardingStore((s) => s.completedByUserId);
  const seenFirstBoxTutorial = useOnboardingStore((s) => s.seenFirstBoxTutorial);
  const markFirstBoxTutorialSeen = useOnboardingStore((s) => s.markFirstBoxTutorialSeen);

  const { 
    shouldShowTip, 
    dismissTip, 
    markTipShown, 
    markSearched,
    milestones 
  } = useProgressiveTipsStore();

  const ALL_CATEGORIES = Array.from(new Set([...DEFAULT_CATEGORIES, ...customCategories]));

  // Show first box tutorial if:
  // 1. User has completed onboarding
  // 2. User has no boxes yet
  // 3. User hasn't seen the tutorial before
  const hasCompletedOnboarding = userKey ? !!completedOnboarding[userKey] : false;
  const showFirstBoxTutorial = userKey && hasCompletedOnboarding && containers.length === 0 && !seenFirstBoxTutorial[userKey];

  const handleDismissTutorial = () => {
    if (userKey) {
      markFirstBoxTutorialSeen(userKey);
    }
  };

  // Track when user searches
  useEffect(() => {
    if (searchQuery.trim() && userKey) {
      markSearched(userKey);
    }
  }, [searchQuery, userKey]);

  // Check which tips to show
  const hasSearchedBefore = userKey ? milestones[userKey]?.hasSearched : false;
  const showExportTip = userKey ? shouldShowTip(userKey, 'export_data_after_2_boxes', containers.length, items.length, !!hasSearchedBefore) : false;
  const showPrinterTip = userKey ? shouldShowTip(userKey, 'label_printer_after_5_boxes', containers.length, items.length, !!hasSearchedBefore) : false;
  const showTagsTip = userKey ? shouldShowTip(userKey, 'add_tags_after_first_search', containers.length, items.length, !!hasSearchedBefore) : false;
  const showShareTip = userKey ? shouldShowTip(userKey, 'share_app_after_10_items', containers.length, items.length, !!hasSearchedBefore) : false;

  // Debug logging
  useEffect(() => {
    if (userKey && containers.length >= 2) {
      console.log('📦 Debug Tips:', {
        userKey,
        containerCount: containers.length,
        itemCount: items.length,
        showExportTip,
        milestones: milestones[userKey],
      });
    }
  }, [containers.length, items.length, userKey, showExportTip]);

  const handleExportData = async () => {
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: { locations, containers, items, customCategories },
        stats: {
          totalLocations: locations.length,
          totalContainers: containers.length,
          totalItems: items.length,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `tidynest-backup-${new Date().toISOString().split('T')[0]}.json`;
      const filePath = `${FileSystem.documentDirectory}${fileName}`;

      await FileSystem.writeAsStringAsync(filePath, jsonString, {
        encoding: FileSystem.EncodingType.UTF8,
      });

      const canShare = await Sharing.isAvailableAsync();
      if (canShare) {
        await Sharing.shareAsync(filePath, {
          mimeType: 'application/json',
          dialogTitle: 'Export Storage Data',
          UTI: 'public.json',
        });
      }
      
      if (userKey) {
        dismissTip(userKey, 'export_data_after_2_boxes');
      }
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  }, [fetchData]);

  const getLocation = (locationId: string) => {
    return locations.find((l) => l.id === locationId);
  };

  const getContainer = (containerId: string) => {
    return containers.find((c) => c.id === containerId);
  };

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    const results = search(searchQuery);
    
    let items = results.items;
    let containers = results.containers;

    // Apply category filter if active
    if (filterCategory) {
      items = items.filter(i => getContainer(i.containerId)?.category === filterCategory);
      containers = containers.filter(c => c.category === filterCategory);
    }

    if (activeFilter === 'Items') return { ...results, containers: [], locations: [] };
    if (activeFilter === 'Boxes') return { ...results, items: [], locations: [] };
    if (activeFilter === 'Tags') {
      const tagQuery = searchQuery.toLowerCase().trim();
      return {
        containers: [],
        locations: [],
        items: items.filter(item => 
          item.tags.some(tag => tag.toLowerCase().includes(tagQuery))
        )
      };
    }

    return { items, containers, locations: results.locations };
  }, [searchQuery, search, activeFilter, filterCategory]);

  const smartContainers = useMemo(() => {
    const now = new Date();
    
    let processed = [...containers]
      .map(container => {
        let score = 0;
        let label = 'Recently used';
        const containerItems = items.filter(i => i.containerId === container.id);

        // 1. Recency of update (base score)
        const updatedHoursAgo = (now.getTime() - new Date(container.updatedAt).getTime()) / (1000 * 60 * 60);
        score += Math.max(0, 100 - updatedHoursAgo);

        // 2. Recency of view
        if (container.lastViewedAt) {
          const viewedHoursAgo = (now.getTime() - new Date(container.lastViewedAt).getTime()) / (1000 * 60 * 60);
          const viewScore = Math.max(0, 150 - viewedHoursAgo);
          if (viewScore > score) {
            score = viewScore;
            label = 'Recently viewed';
          }
        }

        // 3. Frequency of use
        if (container.viewCount && container.viewCount > 5) {
          score += container.viewCount * 2;
          if (label === 'Recently used') label = 'Frequently used';
        }

        // 4. Expiry Check
        const soonExpiring = containerItems.some(i => {
          if (!i.expiryDate) return false;
          const daysToExpiry = (new Date(i.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          return daysToExpiry >= 0 && daysToExpiry <= 7;
        });

        if (soonExpiring) {
          score += 200; // High priority
          label = 'Contains expiring items';
        }

        return { ...container, score, label, itemCount: containerItems.length };
      });

    if (filterCategory) {
      processed = processed.filter(c => c.category === filterCategory);
    }

    if (sortBy === 'Most Items') {
      processed.sort((a, b) => b.itemCount - a.itemCount);
    } else if (sortBy === 'Empty') {
      processed.sort((a, b) => a.itemCount - b.itemCount);
    } else if (sortBy === 'Alphabetical') {
      processed.sort((a, b) => a.code.localeCompare(b.code));
    } else {
      processed.sort((a, b) => b.score - a.score);
    }

    return processed.slice(0, 50);
  }, [containers, items, sortBy, filterCategory]);

  const smartItems = useMemo(() => {
    const now = new Date();
    let processed = [...items]
      .map(item => {
        let score = 0;
        let label = '';

        const updatedHoursAgo = (now.getTime() - new Date(item.updatedAt).getTime()) / (1000 * 60 * 60);
        score += Math.max(0, 100 - updatedHoursAgo);

        if (item.expiryDate) {
          const daysToExpiry = (new Date(item.expiryDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24);
          if (daysToExpiry >= 0 && daysToExpiry <= 7) {
            score += 200;
            label = 'Expiring Soon';
          }
        }

        return { ...item, score, label };
      });

    // Apply category filter if set
    if (filterCategory) {
      processed = processed.filter(item => {
        const container = getContainer(item.containerId);
        return container?.category === filterCategory;
      });
    }

    return processed
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }, [items, filterCategory]);

  const hasResults = searchResults && (searchResults.items.length > 0 || searchResults.containers.length > 0 || searchResults.locations.length > 0);
  const noResults = searchResults && searchResults.items.length === 0 && searchResults.containers.length === 0 && searchResults.locations.length === 0;

  const renderItemsList = () => {
    if (!searchResults?.items.length) return null;
    return (
      <View className="mb-6">
        <Text className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-3 ml-1">
          Items ({searchResults.items.length})
        </Text>
        {searchResults.items.map((item) => {
          const container = getContainer(item.containerId);
          const location = container ? getLocation(container.locationId) : null;
          return (
            <Pressable
              key={item.id}
              className="bg-zinc-900 rounded-xl p-4 mb-2 active:opacity-80 border border-zinc-800/50"
              onPress={() => router.push(`/container/${container?.id}`)}
            >
              <View className="flex-row items-start">
                <View className="w-10 h-10 bg-brand-orange/20 rounded-xl items-center justify-center mr-3">
                  <Package size={20} color="#FF9500" />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-medium text-base">{item.name}</Text>
                  {item.tags.length > 0 && (
                    <View className="flex-row flex-wrap gap-1 mt-1">
                      {item.tags.slice(0, 3).map((tag, i) => (
                        <View key={i} className="bg-zinc-800 px-2 py-0.5 rounded">
                          <Text className="text-zinc-400 text-[10px]">{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                  <View className="flex-row items-center mt-2 gap-2">
                    <View className="bg-brand-orange/10 px-2 py-0.5 rounded border border-brand-orange/20">
                      <Text className="text-brand-orange text-[10px] font-bold">{container?.code}</Text>
                    </View>
                    {location && (
                      <Text className="text-zinc-500 text-[10px] font-medium uppercase tracking-tighter">{location.name}</Text>
                    )}
                  </View>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderBoxesList = () => {
    if (!searchResults?.containers.length) return null;
    return (
      <View className="mb-6">
        <Text className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-3 ml-1">
          Boxes ({searchResults.containers.length})
        </Text>
        {searchResults.containers.map((container) => {
          const location = getLocation(container.locationId);
          const itemCount = items.filter((i) => i.containerId === container.id).length;
          return (
            <Pressable
              key={container.id}
              className="bg-zinc-900 rounded-xl p-4 mb-2 active:opacity-80 border border-zinc-800/50"
              onPress={() => router.push(`/container/${container.id}`)}
            >
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-zinc-800 rounded-xl items-center justify-center mr-3 border border-zinc-700">
                  <Box size={20} color="#FF9500" />
                </View>
                <View className="flex-1">
                  <Text className="text-brand-orange font-bold text-base">{container.code}</Text>
                  {container.description && (
                    <Text className="text-zinc-400 text-sm mt-0.5" numberOfLines={1}>
                      {container.description}
                    </Text>
                  )}
                  <Text className="text-zinc-500 text-[10px] mt-1 uppercase font-medium tracking-tighter">
                    {location?.name} • {itemCount} item{itemCount !== 1 ? 's' : ''}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    );
  };

  const renderLocationsList = () => {
    if (!searchResults?.locations.length) return null;
    return (
      <View className="mb-6">
        <Text className="text-zinc-500 text-[10px] uppercase tracking-widest font-bold mb-3 ml-1">
          Locations ({searchResults.locations.length})
        </Text>
        {searchResults.locations.map((loc) => (
          <Pressable
            key={loc.id}
            className="bg-zinc-900 rounded-xl p-4 mb-2 active:opacity-80 border border-zinc-800/50"
            onPress={() => {
              setFilterCategory(null);
              setSortBy('Alphabetical');
              setShowFilters(true);
              // In a real app, you might navigate to a specific location view
            }}
          >
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-zinc-800 rounded-xl items-center justify-center mr-3 border border-zinc-700">
                <MapPin size={20} color="#FF9500" />
              </View>
              <View className="flex-1">
                <Text className="text-white font-bold text-base">{loc.name}</Text>
                <Text className="text-zinc-500 text-[10px] mt-1 uppercase font-medium tracking-tighter">
                  Location Code: {loc.code}
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      {/* First Box Tutorial Overlay */}
      {showFirstBoxTutorial && (
        <FirstBoxTutorial onDismiss={handleDismissTutorial} />
      )}
      
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <View>
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-[#5a8d8d] rounded-xl items-center justify-center mr-3 overflow-hidden shadow-sm shadow-[#5a8d8d]/40">
                <Image 
                  source={require('../../../assets/logo.png')} 
                  style={{ width: '100%', height: '100%' }}
                  resizeMode="cover"
                />
              </View>
              <View>
                <Text className="text-3xl font-black text-white tracking-tighter">TidyNest</Text>
                <Text className="text-[8px] text-zinc-500 font-bold uppercase tracking-[0.2em] -mt-1 ml-0.5">Home Storage Solutions</Text>
              </View>
            </View>
            <View className="flex-row items-center mt-2 ml-1">
              <Pressable onPress={() => setViewMode('Boxes')} className="mr-3">
                <Text className={`text-sm ${viewMode === 'Boxes' ? 'text-brand-orange font-bold' : 'text-zinc-500'}`}>Boxes First</Text>
              </Pressable>
              <Pressable onPress={() => setViewMode('Items')}>
                <Text className={`text-sm ${viewMode === 'Items' ? 'text-brand-orange font-bold' : 'text-zinc-500'}`}>Items First</Text>
              </Pressable>
            </View>
          </View>
          <View className="flex-row gap-2">
            <Pressable 
              onPress={() => setShowFilters(!showFilters)}
              className={`w-10 h-10 rounded-full items-center justify-center border ${
                showFilters || sortBy !== 'Smart' || filterCategory 
                  ? 'bg-brand-orange border-brand-orange' 
                  : 'bg-zinc-900 border-zinc-800'
              }`}
            >
              <Filter size={20} color={showFilters || sortBy !== 'Smart' || filterCategory ? '#000' : '#94a3b8'} />
            </Pressable>
            <Pressable 
              onPress={() => setIsCompact(!isCompact)}
              className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800"
            >
              {isCompact ? <LayoutGrid size={20} color="#FF9500" /> : <ListIcon size={20} color="#94a3b8" />}
            </Pressable>
          </View>
        </View>

        {/* Filter and Sort UI */}
        {showFilters && (
          <View className="bg-zinc-900 rounded-2xl p-4 mb-4 border border-zinc-800">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-white font-bold">Sort & Filter</Text>
              <Pressable onPress={() => {
                setSortBy('Smart');
                setFilterCategory(null);
              }}>
                <Text className="text-brand-orange text-xs font-medium">Reset All</Text>
              </Pressable>
            </View>

            <Text className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Sort By</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {(['Smart', 'Most Items', 'Empty', 'Alphabetical'] as SortOption[]).map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => setSortBy(opt)}
                  className={`px-3 py-1.5 rounded-lg border ${
                    sortBy === opt ? 'bg-brand-orange border-brand-orange' : 'bg-zinc-800 border-zinc-700'
                  }`}
                >
                  <Text className={`text-xs ${sortBy === opt ? 'text-black font-bold' : 'text-zinc-400'}`}>
                    {opt}
                  </Text>
                </Pressable>
              ))}
            </View>

            <Text className="text-zinc-500 text-[10px] uppercase tracking-wider mb-2">Filter By Category</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row gap-2">
              <Pressable
                onPress={() => setFilterCategory(null)}
                className={`px-3 py-1.5 rounded-lg border mr-2 ${
                  filterCategory === null ? 'bg-brand-orange border-brand-orange' : 'bg-zinc-800 border-zinc-700'
                }`}
              >
                <Text className={`text-xs ${filterCategory === null ? 'text-black font-bold' : 'text-zinc-400'}`}>
                  All
                </Text>
              </Pressable>
              {ALL_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat}
                  onPress={() => setFilterCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg border mr-2 ${
                    filterCategory === cat ? 'bg-brand-orange border-brand-orange' : 'bg-zinc-800 border-zinc-700'
                  }`}
                >
                  <Text className={`text-xs ${filterCategory === cat ? 'text-black font-bold' : 'text-zinc-400'}`}>
                    {cat}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Search Bar */}
        <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 mb-3">
          <Search size={20} color="#94a3b8" />
          <TextInput
            className="flex-1 ml-3 text-white text-base"
            placeholder={viewMode === 'Boxes' ? "Search boxes or tags..." : "Find items (e.g. passport, drill)..."}
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text className="text-[#94a3b8]">Clear</Text>
            </Pressable>
          )}
        </View>

        {/* Quick Find Strip */}
        <View className="mb-4">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {QUICK_FIND.map((item) => (
              <Pressable
                key={item.id}
                onPress={() => {
                  setFilterCategory(filterCategory === item.id ? null : item.id);
                  if (filterCategory !== item.id) setShowFilters(true);
                }}
                className={`flex-row items-center px-4 py-2 rounded-2xl mr-2 border ${
                  filterCategory === item.id 
                    ? 'bg-brand-orange border-brand-orange' 
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <Text className="text-lg mr-2">{item.emoji}</Text>
                <Text className={`font-bold ${filterCategory === item.id ? 'text-black' : 'text-zinc-300'}`}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Search Filter Chips */}
        <View className="flex-row gap-2 mb-4">
          {(['All', 'Items', 'Boxes', 'Tags'] as SearchFilter[]).map((filter) => (
            <Pressable
              key={filter}
              onPress={() => setActiveFilter(filter)}
              className={`px-4 py-1.5 rounded-full border ${
                activeFilter === filter 
                  ? 'bg-brand-orange border-brand-orange' 
                  : 'bg-transparent border-zinc-800'
              }`}
            >
              <Text className={activeFilter === filter ? 'text-black font-semibold' : 'text-zinc-400'}>
                {filter}
              </Text>
            </Pressable>
          ))}
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            className="flex-1 bg-brand-orange rounded-2xl p-4 active:opacity-80 shadow-sm"
            onPress={() => router.push('/add-container')}
          >
            <View className="flex-row items-center justify-center gap-2">
              <CameraIcon size={20} color="#000" />
              <Text className="text-black font-bold text-base">Scan & Add</Text>
            </View>
          </Pressable>
          <Pressable
            className="flex-1 bg-[#94a3b8]/10 rounded-2xl p-4 active:opacity-80 border border-[#94a3b8]/20"
            onPress={() => router.push('/locations')}
          >
            <View className="flex-row items-center justify-center gap-2">
              <MapPin size={20} color="#94a3b8" />
              <Text className="text-[#94a3b8] font-semibold text-base">Locations</Text>
            </View>
          </Pressable>
        </View>

        {/* Progressive Tips */}
        {showExportTip && userKey && (
          <TipCard
            icon={Download}
            title="You can export all your data as JSON for backup"
            description="Keep your storage organized data safe! Export everything now and store it securely."
            actionText="Export Now"
            onAction={handleExportData}
            onDismiss={() => {
              dismissTip(userKey, 'export_data_after_2_boxes');
              markTipShown(userKey, 'export_data_after_2_boxes');
            }}
          />
        )}

        {showPrinterTip && userKey && (
          <TipCard
            icon={Printer}
            title="Pro tip: Use our label printer recommendation to mark your physical boxes!"
            description="Print waterproof labels with box codes to quickly identify your storage boxes."
            actionText="View Recommended Printers"
            onAction={() => {
              router.push('/settings');
              dismissTip(userKey, 'label_printer_after_5_boxes');
              markTipShown(userKey, 'label_printer_after_5_boxes');
            }}
            onDismiss={() => {
              dismissTip(userKey, 'label_printer_after_5_boxes');
              markTipShown(userKey, 'label_printer_after_5_boxes');
            }}
          />
        )}

        {showTagsTip && userKey && (
          <TipCard
            icon={Tag}
            title="Add tags to make searching even better"
            description="Add descriptive tags to your items (e.g., 'winter', 'camping') to find them faster!"
            onDismiss={() => {
              dismissTip(userKey, 'add_tags_after_first_search');
              markTipShown(userKey, 'add_tags_after_first_search');
            }}
          />
        )}

        {showShareTip && userKey && (
          <TipCard
            icon={Share2}
            title="You're getting organized! Share TidyNest with friends moving house"
            description="Help friends and family stay organized during their next move with TidyNest."
            onDismiss={() => {
              dismissTip(userKey, 'share_app_after_10_items');
              markTipShown(userKey, 'share_app_after_10_items');
            }}
          />
        )}

        {/* Search Results */}
        {hasResults && (
          <ScrollView 
            className="flex-1" 
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9500" />
            }
          >
            {(viewMode === 'Items' || activeFilter === 'Items' || activeFilter === 'Tags') ? (
              <>
                {renderItemsList()}
                {renderBoxesList()}
                {renderLocationsList()}
              </>
            ) : (
              <>
                {renderBoxesList()}
                {renderItemsList()}
                {renderLocationsList()}
              </>
            )}
          </ScrollView>
        )}

        {/* No Results */}
        {noResults && (
          <View className="flex-1 items-center justify-center">
            <Search size={48} color="#3f3f46" />
            <Text className="text-zinc-500 mt-4 text-center">
              No results for "{searchQuery}"
            </Text>
          </View>
        )}

        {/* Empty State / Recent */}
        {!searchQuery && (
          <View className="flex-1">
            {(viewMode === 'Boxes' ? containers.length : items.length) === 0 ? (
              <ScrollView
                contentContainerStyle={{ flexGrow: 1 }}
                refreshControl={
                  <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9500" />
                }
              >
                <View className="flex-1 items-center justify-center">
                  <View className="w-20 h-20 bg-[#94a3b8]/5 rounded-3xl items-center justify-center mb-4 border border-[#94a3b8]/10">
                    <Sparkles size={40} color="#94a3b8" />
                  </View>
                  <Text className="text-white text-xl font-bold text-center px-4">
                    {viewMode === 'Boxes' ? 'Ready to Organize?' : 'No items yet'}
                  </Text>
                  <Text className="text-[#94a3b8]/60 text-center mt-2 px-8 leading-5">
                    {viewMode === 'Boxes' 
                      ? 'Scan items with your camera to auto-suggest box codes and track your inventory effortlessly with AI.'
                      : 'Add items to your boxes to keep track of everything you own.'}
                  </Text>
                  <Pressable
                    className="bg-brand-orange rounded-full px-10 py-4 mt-8 active:opacity-80 shadow-lg shadow-brand-orange/20"
                    onPress={() => router.push(viewMode === 'Boxes' ? '/add-container' : '/all-items')}
                  >
                    <View className="flex-row items-center gap-2">
                      <CameraIcon size={20} color="#000" />
                      <Text className="text-black font-black text-lg">
                        {viewMode === 'Boxes' ? 'Scan & Add Items' : 'View All Items'}
                      </Text>
                    </View>
                  </Pressable>
                </View>
              </ScrollView>
            ) : (
              <View className="flex-1">
                <Text className="text-lg font-semibold text-white mb-3">
                  {viewMode === 'Boxes' ? 'Recommended for You' : 'Frequently Used Items'}
                </Text>
                <FlatList
                  data={(viewMode === 'Boxes' ? smartContainers : smartItems) as any[]}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  refreshControl={
                    <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FF9500" />
                  }
                  renderItem={({ item }: { item: any }) => {
                    if (viewMode === 'Items') {
                      const container = getContainer(item.containerId);
                      return (
                        <Pressable
                          className="bg-zinc-900 rounded-xl p-4 mb-2 flex-row items-center active:opacity-80"
                          onPress={() => router.push(`/container/${container?.id}`)}
                        >
                          <View className="w-10 h-10 bg-[#94a3b8]/10 rounded-xl items-center justify-center mr-3">
                            <Package size={20} color="#94a3b8" />
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center justify-between">
                              <Text className="text-white font-medium text-base">{(item as any).name}</Text>
                              {(item as any).label && (
                                <View className="bg-brand-orange/10 px-2 py-0.5 rounded-full border border-brand-orange/20">
                                  <Text className="text-brand-orange text-[10px] font-bold uppercase">{(item as any).label}</Text>
                                </View>
                              )}
                            </View>
                            <View className="flex-row items-center mt-1">
                              <Box size={12} color="#94a3b8" />
                              <Text className="text-[#94a3b8] text-xs ml-1">{container?.code || 'Unknown Box'}</Text>
                            </View>
                          </View>
                        </Pressable>
                      );
                    }

                    const container = item as any;
                    const location = getLocation(container.locationId);
                    const itemCount = items.filter((i) => i.containerId === container.id).length;
                    const isExpanded = expandedId === container.id;

                    if (isCompact && !isExpanded) {
                      return (
                        <Pressable
                          className={`bg-zinc-900 rounded-xl px-4 py-3 mb-2 flex-row items-center justify-between active:bg-zinc-800 ${itemCount === 0 ? 'opacity-60' : ''}`}
                          onPress={() => setExpandedId(container.id)}
                        >
                          <View className="flex-row items-center">
                            <Box size={18} color={itemCount === 0 ? '#71717a' : '#FF9500'} className="mr-3" />
                            <Text className={`font-bold text-base ${itemCount === 0 ? 'text-zinc-500' : 'text-brand-orange'}`}>{container.code}</Text>
                          </View>
                          <View className={itemCount === 0 ? 'bg-zinc-800/50 px-2 py-1 rounded-lg border border-zinc-700' : 'bg-zinc-800 px-2 py-1 rounded-lg'}>
                            <Text className={itemCount === 0 ? 'text-zinc-600 text-xs font-bold uppercase tracking-tighter' : 'text-zinc-400 text-xs font-medium'}>
                              {itemCount === 0 ? 'Empty' : `${itemCount} items`}
                            </Text>
                          </View>
                        </Pressable>
                      );
                    }

                    return (
                      <Pressable
                        className={`bg-zinc-900 rounded-xl p-4 mb-2 active:opacity-80 ${isExpanded ? 'border border-brand-orange/30' : ''} ${itemCount === 0 ? 'opacity-60' : ''}`}
                        onPress={() => isExpanded ? router.push(`/container/${container.id}`) : router.push(`/container/${container.id}`)}
                      >
                        <View className="flex-row items-center">
                          <View className="w-12 h-12 bg-[#94a3b8]/10 rounded-xl items-center justify-center mr-3">
                            <Box size={24} color={itemCount === 0 ? '#475569' : (container.label === 'Contains expiring items' ? '#ef4444' : '#94a3b8')} />
                          </View>
                          <View className="flex-1">
                            <View className="flex-row items-center justify-between">
                              <Text className={`font-bold text-base ${itemCount === 0 ? 'text-[#94a3b8]/40' : 'text-brand-orange'}`}>{container.code}</Text>
                              <View className="flex-row items-center gap-2">
                                <View className={`px-2 py-0.5 rounded-full border ${
                                  itemCount === 0 ? 'bg-zinc-900 border-zinc-800' : (container.label === 'Contains expiring items' ? 'bg-red-500/10 border-red-500/20' : 'bg-[#94a3b8]/10 border-[#94a3b8]/20')
                                }`}>
                                  <Text className={`text-[10px] font-medium uppercase tracking-wider ${
                                    itemCount === 0 ? 'text-[#94a3b8]/40' : (container.label === 'Contains expiring items' ? 'text-red-500' : 'text-[#94a3b8]')
                                  }`}>
                                    {itemCount === 0 ? 'Empty' : container.label}
                                  </Text>
                                </View>
                                {isExpanded && (
                                  <Pressable onPress={() => setExpandedId(null)} className="p-1">
                                    <ChevronUp size={16} color="#94a3b8" />
                                  </Pressable>
                                )}
                              </View>
                            </View>
                            {container.description && (
                              <Text className="text-[#94a3b8] text-sm mt-0.5" numberOfLines={1}>
                                {container.description}
                              </Text>
                            )}
                            <Text className="text-[#94a3b8]/60 text-xs mt-1 uppercase font-medium tracking-tighter">
                              {location?.name} • {itemCount === 0 ? 'No items' : `${itemCount} item${itemCount !== 1 ? 's' : ''}`}
                            </Text>
                          </View>
                        </View>
                        {isExpanded && (
                          <View className="mt-4 pt-4 border-t border-zinc-800 flex-row justify-end">
                            <Pressable 
                              onPress={() => router.push(`/container/${container.id}`)}
                              className="bg-brand-orange px-4 py-2 rounded-full"
                            >
                              <Text className="text-black font-bold">Open Details</Text>
                            </Pressable>
                          </View>
                        )}
                      </Pressable>
                    );
                  }}
                />
              </View>
            )}
          </View>
        )}

        {/* Stats Bar */}
        {containers.length > 0 && !searchQuery && (
          <View className="flex-row justify-around py-4 border-t border-zinc-800">
            <Pressable 
              className="items-center active:opacity-60"
              onPress={() => router.push('/boxes')}
            >
              <Text className="text-2xl font-bold text-white">{containers.length}</Text>
              <Text className="text-[#94a3b8] text-xs font-medium uppercase tracking-tighter">Boxes</Text>
            </Pressable>
            <Pressable 
              className="items-center active:opacity-60"
              onPress={() => router.push('/all-items')}
            >
              <Text className="text-2xl font-bold text-white">{items.length}</Text>
              <Text className="text-[#94a3b8] text-xs font-medium uppercase tracking-tighter">Items</Text>
            </Pressable>
            <Pressable 
              className="items-center active:opacity-60"
              onPress={() => router.push('/locations')}
            >
              <Text className="text-2xl font-bold text-white">{locations.length}</Text>
              <Text className="text-[#94a3b8] text-xs font-medium uppercase tracking-tighter">Locations</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
