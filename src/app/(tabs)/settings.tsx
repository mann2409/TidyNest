import { View, Text, Pressable, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, ChevronRight, Trash2 } from 'lucide-react-native';
import useStorageStore from '@/lib/state/storage-store';

export default function SettingsScreen() {
  const router = useRouter();
  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  const locations = useStorageStore((s) => s.locations);

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-3xl font-bold text-white">Settings</Text>
        </View>

        {/* Stats */}
        <View className="bg-zinc-900 rounded-2xl p-4 mb-6">
          <Text className="text-zinc-400 text-sm mb-3">Storage Stats</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{locations.length}</Text>
              <Text className="text-zinc-500 text-xs">Locations</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-amber-500">{containers.length}</Text>
              <Text className="text-zinc-500 text-xs">Boxes</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{items.length}</Text>
              <Text className="text-zinc-500 text-xs">Items</Text>
            </View>
          </View>
        </View>

        {/* Manage Locations */}
        <Text className="text-zinc-400 text-sm mb-2 px-1">Manage</Text>
        <Pressable
          className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-2"
          onPress={() => router.push('/locations')}
        >
          <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center mr-3">
            <MapPin size={20} color="#f59e0b" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium">Locations</Text>
            <Text className="text-zinc-500 text-sm">{locations.length} locations</Text>
          </View>
          <ChevronRight size={20} color="#71717a" />
        </Pressable>

        {/* About */}
        <Text className="text-zinc-400 text-sm mb-2 px-1 mt-6">About</Text>
        <View className="bg-zinc-900 rounded-xl p-4 mb-6">
          <Text className="text-white font-medium mb-1">Home Storage</Text>
          <Text className="text-zinc-500 text-sm">
            Track your storage boxes and find items easily. Take photos to get AI-suggested codes!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
