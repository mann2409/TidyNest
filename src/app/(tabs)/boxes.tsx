import { useMemo, useState } from 'react';
import { View, Text, Pressable, FlatList, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box, Plus, ChevronRight, MapPin } from 'lucide-react-native';
import useStorageStore from '@/lib/state/storage-store';

export default function BoxesScreen() {
  const router = useRouter();
  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  const locations = useStorageStore((s) => s.locations);
  const [selectedLocationId, setSelectedLocationId] = useState<string | null>(null);

  const getLocation = (locationId: string) => {
    return locations.find((l) => l.id === locationId);
  };

  // Group containers by location
  const groupedContainers = useMemo(() => {
    const groups: Record<string, typeof containers> = {};
    for (const container of containers) {
      const locationId = container.locationId;
      if (!groups[locationId]) {
        groups[locationId] = [];
      }
      groups[locationId].push(container);
    }
    return groups;
  }, [containers]);

  const filteredLocationIds = useMemo(() => {
    const ids = Object.keys(groupedContainers);
    if (!selectedLocationId) return ids;
    return ids.filter(id => id === selectedLocationId);
  }, [groupedContainers, selectedLocationId]);

  const activeLocations = useMemo(() => {
    const idsWithData = Object.keys(groupedContainers);
    return locations.filter(l => idsWithData.includes(l.id));
  }, [locations, groupedContainers]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <View>
            <Text className="text-3xl font-bold text-white tracking-tight">All Boxes</Text>
            <Text className="text-[#94a3b8]/60 mt-1 uppercase text-[10px] font-bold tracking-widest">
              {selectedLocationId 
                ? `${groupedContainers[selectedLocationId]?.length || 0} boxes in ${getLocation(selectedLocationId)?.name}`
                : `${containers.length} boxes total`}
            </Text>
          </View>
          <Pressable
            className="w-12 h-12 bg-brand-orange rounded-full items-center justify-center active:opacity-80 shadow-lg shadow-brand-orange/20"
            onPress={() => router.push('/add-container')}
          >
            <Plus size={24} color="#000" />
          </Pressable>
        </View>

        {/* Location Filter Strip */}
        {activeLocations.length > 0 && (
          <View className="mb-4">
            <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
              <Pressable
                onPress={() => setSelectedLocationId(null)}
                className={`flex-row items-center px-4 py-2 rounded-xl mr-2 border ${
                  selectedLocationId === null 
                    ? 'bg-brand-orange border-brand-orange' 
                    : 'bg-zinc-900 border-zinc-800'
                }`}
              >
                <Text className={`font-bold ${selectedLocationId === null ? 'text-black' : 'text-zinc-300'}`}>
                  All
                </Text>
              </Pressable>
              {activeLocations.map((loc) => (
                <Pressable
                  key={loc.id}
                  onPress={() => setSelectedLocationId(selectedLocationId === loc.id ? null : loc.id)}
                  className={`flex-row items-center px-4 py-2 rounded-xl mr-2 border ${
                    selectedLocationId === loc.id 
                      ? 'bg-brand-orange border-brand-orange' 
                      : 'bg-zinc-900 border-zinc-800'
                  }`}
                >
                  <MapPin size={14} color={selectedLocationId === loc.id ? '#000' : '#94a3b8'} className="mr-2" />
                  <Text className={`font-bold ${selectedLocationId === loc.id ? 'text-black' : 'text-zinc-300'}`}>
                    {loc.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        )}

        {containers.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="w-24 h-24 bg-brand-orange/10 rounded-3xl items-center justify-center mb-6 border-2 border-brand-orange/20">
              <Box size={48} color="#FF9500" />
            </View>
            <Text className="text-white text-2xl font-black text-center mb-3">
              No boxes yet? Let's create your first one!
            </Text>
            <Text className="text-zinc-400 text-center leading-6 mb-8">
              Scan items with AI, get auto-suggested labels, and never lose track of your stuff again.
            </Text>
            <Pressable
              className="bg-brand-orange rounded-2xl px-8 py-4 active:opacity-90 shadow-lg shadow-brand-orange/30 flex-row items-center"
              onPress={() => router.push('/add-container')}
            >
              <Plus size={22} color="#000" />
              <Text className="text-black font-black text-lg ml-2">Add Your First Box</Text>
            </Pressable>
          </View>
        ) : (
          <FlatList
            data={filteredLocationIds}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: locationId }) => {
              const location = getLocation(locationId);
              const locationContainers = groupedContainers[locationId];

              return (
                <View className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 bg-brand-orange/20 rounded-lg items-center justify-center mr-2">
                      <Text className="text-brand-orange font-bold text-sm">{location?.code}</Text>
                    </View>
                    <Text className="text-white font-semibold text-lg">{location?.name}</Text>
                    <Text className="text-zinc-500 ml-2">({locationContainers.length})</Text>
                  </View>

                  {locationContainers.map((container) => {
                    const itemCount = items.filter((i) => i.containerId === container.id).length;
                    return (
                      <Pressable
                        key={container.id}
                        className="bg-zinc-900 rounded-xl p-4 mb-2 flex-row items-center active:opacity-80 border border-zinc-800/50"
                        onPress={() => router.push(`/container/${container.id}`)}
                      >
                        <View className="w-12 h-12 bg-[#94a3b8]/10 rounded-xl items-center justify-center mr-3">
                          <Box size={24} color="#94a3b8" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-brand-orange font-bold text-base">{container.code}</Text>
                          {container.description && (
                            <Text className="text-[#94a3b8] text-sm mt-0.5" numberOfLines={1}>
                              {container.description}
                            </Text>
                          )}
                          <Text className="text-[#94a3b8]/60 text-[10px] mt-1 uppercase font-bold tracking-tighter">
                            {itemCount} item{itemCount !== 1 ? 's' : ''} • {container.category}
                          </Text>
                        </View>
                        <ChevronRight size={20} color="#94a3b8" />
                      </Pressable>
                    );
                  })}
                </View>
              );
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}
