import { useState, useMemo } from 'react';
import { View, Text, TextInput, Pressable, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ChevronLeft, Search, Package, Box, Plus } from 'lucide-react-native';
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
          <View className="bg-brand-orange/20 px-3 py-1 rounded-full">
            <Text className="text-brand-orange font-bold">{items.length}</Text>
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
                  <View className="w-10 h-10 bg-brand-orange/20 rounded-xl items-center justify-center mr-3">
                    <Package size={20} color="#FF9500" />
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
            <View className="flex-1 items-center justify-center px-8 pt-20">
              <View className="w-24 h-24 bg-brand-orange/10 rounded-3xl items-center justify-center mb-6 border-2 border-brand-orange/20">
                <Package size={48} color="#FF9500" />
              </View>
              <Text className="text-white text-2xl font-black text-center mb-3">
                {searchQuery ? 'No matching items' : 'No items yet'}
              </Text>
              <Text className="text-zinc-400 text-center leading-6 mb-8">
                {searchQuery 
                  ? 'Try searching with different keywords or add more items to your boxes.'
                  : 'Start by adding boxes and items to organize your storage.'}
              </Text>
              {!searchQuery && (
                <Pressable
                  className="bg-brand-orange rounded-2xl px-8 py-4 active:opacity-90 shadow-lg shadow-brand-orange/30 flex-row items-center"
                  onPress={() => router.push('/add-container')}
                >
                  <Plus size={22} color="#000" />
                  <Text className="text-black font-black text-lg ml-2">Add First Box</Text>
                </Pressable>
              )}
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

