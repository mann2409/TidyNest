import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Package, Box } from 'lucide-react-native';
import useStorageStore from '@/lib/state/storage-store';

export default function AllItemsScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  
  const items = useStorageStore((s) => s.items);
  const containers = useStorageStore((s) => s.containers);
  const locations = useStorageStore((s) => s.locations);

  const filteredItems = useMemo(() => {
    if (!searchQuery.trim()) return items;
    const lower = searchQuery.toLowerCase().trim();
    return items.filter(i => 
      i.name.toLowerCase().includes(lower) || 
      i.tags.some(t => t.toLowerCase().includes(lower))
    );
  }, [items, searchQuery]);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <View className="flex-1 px-4">
        {/* Header */}
        <View className="flex-row items-center justify-between py-4">
          <Pressable onPress={() => router.back()} className="flex-row items-center">
            <ChevronLeft size={24} color="#fff" />
            <Text className="text-white font-semibold text-lg ml-1">All Items</Text>
          </Pressable>
          <View className="bg-amber-500/20 px-3 py-1 rounded-full">
            <Text className="text-amber-500 font-bold">{items.length}</Text>
          </View>
        </View>

        {/* Search */}
        <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 py-3 mb-6">
          <Search size={20} color="#71717a" />
          <TextInput
            className="flex-1 ml-3 text-white text-base"
            placeholder="Filter items..."
            placeholderTextColor="#71717a"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const container = containers.find(c => c.id === item.containerId);
            const location = container ? locations.find(l => l.id === container.locationId) : null;
            
            return (
              <Pressable
                className="bg-zinc-900 rounded-xl p-4 mb-2 active:opacity-80"
                onPress={() => router.push(`/container/${container?.id}`)}
              >
                <View className="flex-row items-center">
                  <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center mr-3">
                    <Package size={20} color="#f59e0b" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-medium text-base">{item.name}</Text>
                    <View className="flex-row items-center mt-1">
                      <Box size={12} color="#71717a" />
                      <Text className="text-zinc-500 text-xs ml-1 mr-2">{container?.code}</Text>
                      <Text className="text-zinc-700">|</Text>
                      <Text className="text-zinc-500 text-xs ml-2">{location?.name}</Text>
                    </View>
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View className="flex-1 items-center justify-center pt-20">
              <Package size={48} color="#3f3f46" />
              <Text className="text-zinc-500 mt-4">No items found</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

