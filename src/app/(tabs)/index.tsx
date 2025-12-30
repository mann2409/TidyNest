import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Search, Plus, Package, Box, MapPin } from 'lucide-react-native';
import useStorageStore from '@/lib/state/storage-store';

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');

  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  const locations = useStorageStore((s) => s.locations);
  const search = useStorageStore((s) => s.search);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return null;
    return search(searchQuery);
  }, [searchQuery, search]);

  const getLocation = (locationId: string) => {
    return locations.find((l) => l.id === locationId);
  };

  const getContainer = (containerId: string) => {
    return containers.find((c) => c.id === containerId);
  };

  const recentContainers = useMemo(() => {
    return [...containers]
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 10);
  }, [containers]);

  const hasResults = searchResults && (searchResults.items.length > 0 || searchResults.containers.length > 0);
  const noResults = searchResults && searchResults.items.length === 0 && searchResults.containers.length === 0;

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-3xl font-bold text-white">Home Storage</Text>
          <Text className="text-zinc-400 mt-1">Find anything in your boxes</Text>
        </View>

        {/* Search Bar */}
        <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 mb-4">
          <Search size={20} color="#71717a" />
          <TextInput
            className="flex-1 ml-3 text-white text-base"
            placeholder="Search items, boxes, or tags..."
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')}>
              <Text className="text-zinc-400">Clear</Text>
            </Pressable>
          )}
        </View>

        {/* Quick Actions */}
        <View className="flex-row gap-3 mb-6">
          <Pressable
            className="flex-1 bg-amber-500 rounded-2xl p-4 active:opacity-80"
            onPress={() => router.push('/add-container')}
          >
            <View className="flex-row items-center justify-center gap-2">
              <Plus size={20} color="#000" />
              <Text className="text-black font-semibold text-base">Add Box</Text>
            </View>
          </Pressable>
          <Pressable
            className="flex-1 bg-zinc-800 rounded-2xl p-4 active:opacity-80"
            onPress={() => router.push('/locations')}
          >
            <View className="flex-row items-center justify-center gap-2">
              <MapPin size={20} color="#fff" />
              <Text className="text-white font-semibold text-base">Locations</Text>
            </View>
          </Pressable>
        </View>

        {/* Search Results */}
        {hasResults && (
          <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
            {searchResults.items.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-white mb-3">
                  Items ({searchResults.items.length})
                </Text>
                {searchResults.items.map((item) => {
                  const container = getContainer(item.containerId);
                  const location = container ? getLocation(container.locationId) : null;
                  return (
                    <Pressable
                      key={item.id}
                      className="bg-zinc-900 rounded-xl p-4 mb-2 active:opacity-80"
                      onPress={() => router.push(`/container/${container?.id}`)}
                    >
                      <View className="flex-row items-start">
                        <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center mr-3">
                          <Package size={20} color="#f59e0b" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-white font-medium text-base">{item.name}</Text>
                          {item.tags.length > 0 && (
                            <View className="flex-row flex-wrap gap-1 mt-1">
                              {item.tags.slice(0, 3).map((tag, i) => (
                                <View key={i} className="bg-zinc-800 px-2 py-0.5 rounded">
                                  <Text className="text-zinc-400 text-xs">{tag}</Text>
                                </View>
                              ))}
                            </View>
                          )}
                          <View className="flex-row items-center mt-2 gap-2">
                            <View className="bg-amber-500/20 px-2 py-1 rounded">
                              <Text className="text-amber-500 text-xs font-medium">{container?.code}</Text>
                            </View>
                            {location && (
                              <Text className="text-zinc-500 text-xs">{location.name}</Text>
                            )}
                          </View>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            )}

            {searchResults.containers.length > 0 && (
              <View className="mb-6">
                <Text className="text-lg font-semibold text-white mb-3">
                  Boxes ({searchResults.containers.length})
                </Text>
                {searchResults.containers.map((container) => {
                  const location = getLocation(container.locationId);
                  const itemCount = items.filter((i) => i.containerId === container.id).length;
                  return (
                    <Pressable
                      key={container.id}
                      className="bg-zinc-900 rounded-xl p-4 mb-2 active:opacity-80"
                      onPress={() => router.push(`/container/${container.id}`)}
                    >
                      <View className="flex-row items-center">
                        <View className="w-10 h-10 bg-zinc-800 rounded-xl items-center justify-center mr-3">
                          <Box size={20} color="#fff" />
                        </View>
                        <View className="flex-1">
                          <Text className="text-amber-500 font-bold text-base">{container.code}</Text>
                          {container.description && (
                            <Text className="text-zinc-400 text-sm mt-0.5" numberOfLines={1}>
                              {container.description}
                            </Text>
                          )}
                          <Text className="text-zinc-500 text-xs mt-1">
                            {location?.name} • {itemCount} item{itemCount !== 1 ? 's' : ''}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  );
                })}
              </View>
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
            {containers.length === 0 ? (
              <View className="flex-1 items-center justify-center">
                <View className="w-20 h-20 bg-zinc-900 rounded-3xl items-center justify-center mb-4">
                  <Box size={40} color="#71717a" />
                </View>
                <Text className="text-white text-lg font-medium">No boxes yet</Text>
                <Text className="text-zinc-500 text-center mt-2 px-8">
                  Start by adding your first storage box. Take a photo and we'll suggest a code!
                </Text>
                <Pressable
                  className="bg-amber-500 rounded-full px-6 py-3 mt-6 active:opacity-80"
                  onPress={() => router.push('/add-container')}
                >
                  <Text className="text-black font-semibold">Add Your First Box</Text>
                </Pressable>
              </View>
            ) : (
              <View className="flex-1">
                <Text className="text-lg font-semibold text-white mb-3">Recent Boxes</Text>
                <FlatList
                  data={recentContainers}
                  keyExtractor={(item) => item.id}
                  showsVerticalScrollIndicator={false}
                  renderItem={({ item: container }) => {
                    const location = getLocation(container.locationId);
                    const itemCount = items.filter((i) => i.containerId === container.id).length;
                    return (
                      <Pressable
                        className="bg-zinc-900 rounded-xl p-4 mb-2 active:opacity-80"
                        onPress={() => router.push(`/container/${container.id}`)}
                      >
                        <View className="flex-row items-center">
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
                              {location?.name} • {itemCount} item{itemCount !== 1 ? 's' : ''}
                            </Text>
                          </View>
                        </View>
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
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{containers.length}</Text>
              <Text className="text-zinc-500 text-xs">Boxes</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{items.length}</Text>
              <Text className="text-zinc-500 text-xs">Items</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{locations.length}</Text>
              <Text className="text-zinc-500 text-xs">Locations</Text>
            </View>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
