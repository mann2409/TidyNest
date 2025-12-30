import { useMemo } from 'react';
import { View, Text, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Box, Plus, ChevronRight } from 'lucide-react-native';
import useStorageStore from '@/lib/state/storage-store';

export default function BoxesScreen() {
  const router = useRouter();
  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  const locations = useStorageStore((s) => s.locations);

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

  const locationIds = Object.keys(groupedContainers);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <View>
            <Text className="text-3xl font-bold text-white">All Boxes</Text>
            <Text className="text-zinc-400 mt-1">{containers.length} boxes total</Text>
          </View>
          <Pressable
            className="w-12 h-12 bg-amber-500 rounded-full items-center justify-center active:opacity-80"
            onPress={() => router.push('/add-container')}
          >
            <Plus size={24} color="#000" />
          </Pressable>
        </View>

        {containers.length === 0 ? (
          <View className="flex-1 items-center justify-center">
            <View className="w-20 h-20 bg-zinc-900 rounded-3xl items-center justify-center mb-4">
              <Box size={40} color="#71717a" />
            </View>
            <Text className="text-white text-lg font-medium">No boxes yet</Text>
            <Text className="text-zinc-500 text-center mt-2 px-8">
              Add your first storage box to get started
            </Text>
          </View>
        ) : (
          <FlatList
            data={locationIds}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            renderItem={({ item: locationId }) => {
              const location = getLocation(locationId);
              const locationContainers = groupedContainers[locationId];

              return (
                <View className="mb-6">
                  <View className="flex-row items-center mb-3">
                    <View className="w-8 h-8 bg-amber-500/20 rounded-lg items-center justify-center mr-2">
                      <Text className="text-amber-500 font-bold text-sm">{location?.code}</Text>
                    </View>
                    <Text className="text-white font-semibold text-lg">{location?.name}</Text>
                    <Text className="text-zinc-500 ml-2">({locationContainers.length})</Text>
                  </View>

                  {locationContainers.map((container) => {
                    const itemCount = items.filter((i) => i.containerId === container.id).length;
                    return (
                      <Pressable
                        key={container.id}
                        className="bg-zinc-900 rounded-xl p-4 mb-2 flex-row items-center active:opacity-80"
                        onPress={() => router.push(`/container/${container.id}`)}
                      >
                        <View className="w-12 h-12 bg-zinc-800 rounded-xl items-center justify-center mr-3">
                          <Box size={24} color="#f59e0b" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-amber-500 font-bold text-base">{container.code}</Text>
                          {container.description && (
                            <Text className="text-zinc-400 text-sm mt-0.5" numberOfLines={1}>
                              {container.description}
                            </Text>
                          )}
                          <Text className="text-zinc-500 text-xs mt-1">
                            {itemCount} item{itemCount !== 1 ? 's' : ''} • {container.category}
                          </Text>
                        </View>
                        <ChevronRight size={20} color="#71717a" />
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
