import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, ChevronRight, Tag, Download, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import useStorageStore from '@/lib/state/storage-store';

export default function SettingsScreen() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  const locations = useStorageStore((s) => s.locations);
  const categories = useStorageStore((s) => s.categories);
  const customCategoriesCount = categories.filter((c) => !c.isDefault).length;

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      const exportData = {
        exportDate: new Date().toISOString(),
        version: '1.0',
        data: {
          locations,
          containers,
          items,
          categories: categories.filter((c) => !c.isDefault), // Only export custom categories
        },
        stats: {
          totalLocations: locations.length,
          totalContainers: containers.length,
          totalItems: items.length,
          customCategories: customCategoriesCount,
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const fileName = `home-storage-backup-${new Date().toISOString().split('T')[0]}.json`;
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
      } else {
        Alert.alert('Export Complete', `Data saved to: ${fileName}`);
      }
    } catch (error) {
      console.error('Export error:', error);
      Alert.alert('Export Failed', 'Could not export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

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

        {/* Manage Categories */}
        <Pressable
          className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-2"
          onPress={() => router.push('/categories')}
        >
          <View className="w-10 h-10 bg-emerald-500/20 rounded-xl items-center justify-center mr-3">
            <Tag size={20} color="#10b981" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium">Categories</Text>
            <Text className="text-zinc-500 text-sm">
              {categories.length} categories{customCategoriesCount > 0 ? ` (${customCategoriesCount} custom)` : ''}
            </Text>
          </View>
          <ChevronRight size={20} color="#71717a" />
        </Pressable>

        {/* Data Management */}
        <Text className="text-zinc-400 text-sm mb-2 px-1 mt-6">Data</Text>
        <Pressable
          className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-2"
          onPress={handleExportData}
          disabled={isExporting}
        >
          <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center mr-3">
            {isExporting ? (
              <ActivityIndicator size="small" color="#3b82f6" />
            ) : (
              <Download size={20} color="#3b82f6" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium">Export Data</Text>
            <Text className="text-zinc-500 text-sm">
              Download all your data as JSON
            </Text>
          </View>
          <Share2 size={18} color="#71717a" />
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
