import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, ChevronRight, LogOut, Tags, Plus, X, Download, Share2 } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import useStorageStore from '@/lib/state/storage-store';
import { useAuthStore } from '@/lib/state/auth-store';

export default function SettingsScreen() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  const locations = useStorageStore((s) => s.locations);
  const customCategories = useStorageStore((s) => s.customCategories);
  const addCategory = useStorageStore((s) => s.addCategory);
  const deleteCategory = useStorageStore((s) => s.deleteCategory);
  const { user, signOut } = useAuthStore();

  const [newCategory, setNewCategory] = useState('');
  const [showCategoryInput, setShowCategoryInput] = useState(false);

  const handleAddCategory = () => {
    if (newCategory.trim()) {
      addCategory(newCategory.trim());
      setNewCategory('');
      setShowCategoryInput(false);
    }
  };

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
          customCategories,
        },
        stats: {
          totalLocations: locations.length,
          totalContainers: containers.length,
          totalItems: items.length,
          customCategoriesCount: customCategories.length,
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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Sign Out', 
          style: 'destructive',
          onPress: async () => {
            await signOut();
            router.replace('/login');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-3xl font-bold text-white">Settings</Text>
        </View>

        {/* Stats */}
        <View className="bg-zinc-900 rounded-2xl p-4 mb-6 border border-zinc-800">
          <Text className="text-[#94a3b8]/60 text-[10px] uppercase tracking-wider font-bold mb-3">Storage Stats</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{locations.length}</Text>
              <Text className="text-[#94a3b8] text-xs font-medium uppercase tracking-tighter">Locations</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-teal-500">{containers.length}</Text>
              <Text className="text-[#94a3b8] text-xs font-medium uppercase tracking-tighter">Boxes</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{items.length}</Text>
              <Text className="text-[#94a3b8] text-xs font-medium uppercase tracking-tighter">Items</Text>
            </View>
          </View>
        </View>

        {/* Manage Locations */}
        <Text className="text-zinc-400 text-sm mb-2 px-1">Manage</Text>
        <Pressable
          className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-2 border border-zinc-800"
          onPress={() => router.push('/locations')}
        >
          <View className="w-10 h-10 bg-[#94a3b8]/10 rounded-xl items-center justify-center mr-3">
            <MapPin size={20} color="#94a3b8" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-medium">Locations</Text>
            <Text className="text-[#94a3b8]/60 text-sm">{locations.length} locations</Text>
          </View>
          <ChevronRight size={20} color="#94a3b8" />
        </Pressable>

        {/* Manage Categories */}
        <View className="flex-row justify-between items-center mb-2 px-1 mt-6">
          <Text className="text-zinc-400 text-sm">Categories</Text>
          <Pressable onPress={() => setShowCategoryInput(!showCategoryInput)}>
            <Text className="text-teal-500 text-sm font-medium">
              {showCategoryInput ? 'Cancel' : 'Add New'}
            </Text>
          </Pressable>
        </View>

        {showCategoryInput && (
          <View className="bg-zinc-900 rounded-xl p-4 flex-row items-center mb-2 border border-teal-500/30">
            <TextInput
              className="flex-1 text-white mr-2"
              placeholder="CATEGORY NAME (e.g. HOBBY)"
              placeholderTextColor="#3f3f46"
              value={newCategory}
              onChangeText={setNewCategory}
              autoCapitalize="characters"
              onSubmitEditing={handleAddCategory}
            />
            <Pressable
              onPress={handleAddCategory}
              className="bg-teal-500 p-2 rounded-lg"
            >
              <Plus size={20} color="#000" />
            </Pressable>
          </View>
        )}

        <View className="bg-zinc-900 rounded-xl overflow-hidden mb-6 border border-zinc-800">
          {customCategories.length === 0 ? (
            <View className="p-4 items-center">
              <Text className="text-zinc-500 text-sm italic">No custom categories yet</Text>
            </View>
          ) : (
            customCategories.map((cat) => (
              <View key={cat} className="p-4 flex-row items-center justify-between border-b border-zinc-800">
                <View className="flex-row items-center">
                  <Tags size={18} color="#14b8a6" className="mr-3" />
                  <Text className="text-white font-medium">{cat}</Text>
                </View>
                <Pressable onPress={() => deleteCategory(cat)} className="p-1">
                  <X size={18} color="#ef4444" />
                </Pressable>
              </View>
            ))
          )}
        </View>

        {/* Data Management */}
        <Text className="text-zinc-400 text-sm mb-2 px-1 mt-6">Data Management</Text>
        <Pressable
          className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-2 border border-zinc-800"
          onPress={handleExportData}
          disabled={isExporting}
        >
          <View className="w-10 h-10 bg-teal-500/20 rounded-xl items-center justify-center mr-3">
            {isExporting ? (
              <ActivityIndicator size="small" color="#14b8a6" />
            ) : (
              <Download size={20} color="#14b8a6" />
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
        <View className="bg-zinc-900 rounded-xl p-4 mb-6 border border-zinc-800">
          <Text className="text-white font-medium mb-1">TidyNest</Text>
          <Text className="text-zinc-500 text-sm">
            Home Storage Solutions. Track your storage boxes and find items easily with AI assistance.
          </Text>
        </View>

        {/* User Info */}
        <Text className="text-zinc-400 text-sm mb-2 px-1">Account</Text>
        <View className="bg-zinc-900 rounded-xl p-4 mb-2 border border-zinc-800">
          <Text className="text-white font-medium">{user?.email}</Text>
          <Text className="text-zinc-500 text-sm mt-1">Logged in</Text>
        </View>

        <Pressable
          className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-8 border border-zinc-800"
          onPress={handleSignOut}
        >
          <View className="w-10 h-10 bg-red-500/20 rounded-xl items-center justify-center mr-3">
            <LogOut size={20} color="#ef4444" />
          </View>
          <View className="flex-1">
            <Text className="text-red-500 font-medium">Sign Out</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
