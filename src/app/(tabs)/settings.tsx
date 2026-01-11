import { useState } from 'react';
import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MapPin, ChevronRight, LogOut, Tags, Plus, X, Download, Share2, Printer, ExternalLink, Trash2, Sparkles, RefreshCw, Database } from 'lucide-react-native';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as Linking from 'expo-linking';
import * as SecureStore from 'expo-secure-store';
import Purchases from 'react-native-purchases';
import { supabase } from '@/lib/supabase';
import useStorageStore from '@/lib/state/storage-store';
import { useAuthStore } from '@/lib/state/auth-store';
import Paywall from '@/components/Paywall';

export default function SettingsScreen() {
  const router = useRouter();
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const [isResettingPro, setIsResettingPro] = useState(false);
  const [isResettingDevice, setIsResettingDevice] = useState(false);
  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  const locations = useStorageStore((s) => s.locations);
  const customCategories = useStorageStore((s) => s.customCategories);
  const remoteConfig = useStorageStore((s) => s.remoteConfig);
  const addCategory = useStorageStore((s) => s.addCategory);
  const deleteCategory = useStorageStore((s) => s.deleteCategory);
  const { user, signOut, deleteAccount, isPro, setIsPro } = useAuthStore();

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

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete Account',
      'This action is PERMANENT. All your locations, boxes, and items will be permanently deleted. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete Everything', 
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'Once you delete your account, there is no going back. Do you wish to proceed?',
              [
                { text: 'Cancel', style: 'cancel' },
                { 
                  text: 'Yes, Delete Permanently', 
                  style: 'destructive',
                  onPress: async () => {
                    setIsDeleting(true);
                    const { error } = await deleteAccount();
                    setIsDeleting(false);
                    
                    if (error) {
                      Alert.alert(
                        'Deletion Failed',
                        'We could not delete your account automatically. Please contact support at manish.sandil@hotmail.com to request manual deletion.\n\nError: ' + error
                      );
                    } else {
                      Alert.alert(
                        'Account Deleted',
                        'Your account and all associated data have been permanently removed.',
                        [{ text: 'OK', onPress: () => router.replace('/login') }]
                      );
                    }
                  }
                }
              ]
            );
          }
        },
      ]
    );
  };

  const handleResetProStatus = async () => {
    Alert.alert(
      'Reset Pro Status',
      'This will reset your subscription status for testing. Use this if you want to test the free tier again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            setIsResettingPro(true);
            try {
              console.log('🔄 Resetting Pro status...');
              // Log out of RevenueCat to clear cached subscription
              await Purchases.logOut();
              console.log('✅ Logged out of RevenueCat');
              // Re-initialize to get fresh status
              const customerInfo = await Purchases.getCustomerInfo();
              const hasPro = typeof customerInfo.entitlements.active['TidyNest Pro'] !== "undefined";
              console.log('📊 New Pro status:', hasPro);
              setIsPro(hasPro);
              Alert.alert('Success', `Pro status has been reset. Current status: ${hasPro ? 'Pro' : 'Free'}`);
            } catch (e: any) {
              console.error('❌ Reset Pro error:', e);
              Alert.alert('Error', `Failed to reset: ${e.message || 'Unknown error'}`);
            } finally {
              setIsResettingPro(false);
            }
          }
        },
      ]
    );
  };

  const handleResetDeviceLimit = async () => {
    Alert.alert(
      'Reset Device Limit',
      'This will clear the device box count from the database, allowing you to test the limit again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          onPress: async () => {
            setIsResettingDevice(true);
            try {
              const deviceId = await SecureStore.getItemAsync('tidynest_device_id');
              if (deviceId) {
                console.log('🗑️ Deleting device usage for:', deviceId);
                const { error } = await supabase
                  .from('device_usage')
                  .delete()
                  .eq('device_id', deviceId);
                
                if (error) {
                  Alert.alert('Error', `Failed to reset: ${error.message}`);
                } else {
                  Alert.alert('Success', 'Device limit has been reset to 0.');
                }
              } else {
                Alert.alert('Info', 'No device ID found.');
              }
            } catch (e: any) {
              console.error('❌ Reset device error:', e);
              Alert.alert('Error', `Failed to reset: ${e.message || 'Unknown error'}`);
            } finally {
              setIsResettingDevice(false);
            }
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <Paywall isVisible={showPaywall} onClose={() => setShowPaywall(false)} />
      <ScrollView className="flex-1 px-4">
        {/* Header */}
        <View className="py-4">
          <Text className="text-3xl font-bold text-white">Settings</Text>
        </View>

        {/* Pro Banner */}
        {!isPro ? (
          <Pressable 
            onPress={() => setShowPaywall(true)}
            className="bg-brand-orange rounded-2xl p-5 mb-6 shadow-lg shadow-brand-orange/20 overflow-hidden"
          >
            <View className="flex-row items-center justify-between">
              <View className="flex-1">
                <Text className="text-black font-black text-xl tracking-tight">Upgrade to TidyNest Pro</Text>
                <Text className="text-black/70 text-sm font-bold mt-1">Unlimited boxes, priority AI, & cloud sync.</Text>
              </View>
              <View className="w-12 h-12 bg-black/10 rounded-xl items-center justify-center">
                <Sparkles size={24} color="#000" />
              </View>
            </View>
          </Pressable>
        ) : (
          <View className="bg-zinc-900 rounded-2xl p-5 mb-6 border border-brand-orange/30">
            <View className="flex-row items-center">
              <View className="w-10 h-10 bg-brand-orange/10 rounded-full items-center justify-center mr-4">
                <Sparkles size={20} color="#FF9500" />
              </View>
              <View>
                <Text className="text-white font-bold text-lg">Pro Member</Text>
                <Text className="text-brand-orange text-xs font-bold uppercase tracking-widest">Active Subscription</Text>
              </View>
            </View>
          </View>
        )}

        {/* Stats */}
        <View className="bg-zinc-900 rounded-2xl p-4 mb-6 border border-zinc-800">
          <Text className="text-[#94a3b8]/60 text-[10px] uppercase tracking-wider font-bold mb-3">Storage Stats</Text>
          <View className="flex-row justify-around">
            <View className="items-center">
              <Text className="text-2xl font-bold text-white">{locations.length}</Text>
              <Text className="text-[#94a3b8] text-xs font-medium uppercase tracking-tighter">Locations</Text>
            </View>
            <View className="items-center">
              <Text className="text-2xl font-bold text-brand-orange">{containers.length}</Text>
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
            <Text className="text-brand-orange text-sm font-medium">
              {showCategoryInput ? 'Cancel' : 'Add New'}
            </Text>
          </Pressable>
        </View>

        {showCategoryInput && (
          <View className="bg-zinc-900 rounded-xl p-4 flex-row items-center mb-2 border border-brand-orange/30">
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
              className="bg-brand-orange p-2 rounded-lg"
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
                  <Tags size={18} color="#FF9500" className="mr-3" />
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
          <View className="w-10 h-10 bg-brand-orange/20 rounded-xl items-center justify-center mr-3">
            {isExporting ? (
              <ActivityIndicator size="small" color="#FF9500" />
            ) : (
              <Download size={20} color="#FF9500" />
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

        {/* Recommended Gear */}
        <Text className="text-zinc-400 text-sm mb-2 px-1 mt-6">Recommended Gear</Text>
        <Pressable
          className="bg-zinc-900 rounded-2xl p-4 flex-row items-center active:opacity-80 mb-6 border border-zinc-800"
          onPress={() => Linking.openURL(remoteConfig.affiliate_printer_link || 'https://www.amazon.com')}
        >
          <View className="w-12 h-12 bg-brand-orange/10 rounded-xl items-center justify-center mr-4">
            <Printer size={24} color="#FF9500" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-base">Pro Label Printer</Text>
            <Text className="text-[#94a3b8] text-sm leading-4 mt-0.5">
              The best way to organize your boxes. Durable, water-resistant labels.
            </Text>
            <View className="flex-row items-center mt-2">
              <Text className="text-brand-orange text-xs font-bold uppercase tracking-wider">Shop on Amazon</Text>
              <ExternalLink size={12} color="#FF9500" className="ml-1" />
            </View>
          </View>
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

        {/* Reset Pro Status (Testing) */}
        {__DEV__ && (
          <>
            <Pressable
              className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-2 border border-zinc-800"
              onPress={handleResetProStatus}
              disabled={isResettingPro}
            >
              <View className="w-10 h-10 bg-yellow-500/20 rounded-xl items-center justify-center mr-3">
                {isResettingPro ? (
                  <ActivityIndicator size="small" color="#eab308" />
                ) : (
                  <RefreshCw size={20} color="#eab308" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-yellow-500 font-medium text-sm">Reset Pro Status (RevenueCat)</Text>
                <Text className="text-zinc-500 text-xs mt-0.5">Clear RevenueCat subscription cache</Text>
              </View>
            </Pressable>
            
            <Pressable
              className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-2 border border-zinc-800"
              onPress={() => {
                setIsPro(false);
                Alert.alert('Success', 'Pro status set to FREE for testing.');
              }}
            >
              <View className="w-10 h-10 bg-orange-500/20 rounded-xl items-center justify-center mr-3">
                <X size={20} color="#f97316" />
              </View>
              <View className="flex-1">
                <Text className="text-orange-500 font-medium text-sm">Force Free Tier (Quick Test)</Text>
                <Text className="text-zinc-500 text-xs mt-0.5">Immediately set to free without RevenueCat</Text>
              </View>
            </Pressable>
            
            <Pressable
              className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-2 border border-zinc-800"
              onPress={handleResetDeviceLimit}
              disabled={isResettingDevice}
            >
              <View className="w-10 h-10 bg-blue-500/20 rounded-xl items-center justify-center mr-3">
                {isResettingDevice ? (
                  <ActivityIndicator size="small" color="#3b82f6" />
                ) : (
                  <Database size={20} color="#3b82f6" />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-blue-500 font-medium text-sm">Reset Device Box Count</Text>
                <Text className="text-zinc-500 text-xs mt-0.5">Clear device limit tracking from database</Text>
              </View>
            </Pressable>
          </>
        )}

        <Pressable
          className="bg-zinc-900 rounded-xl p-4 flex-row items-center active:opacity-80 mb-12 border border-zinc-800"
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          <View className="w-10 h-10 bg-red-900/20 rounded-xl items-center justify-center mr-3">
            {isDeleting ? (
              <ActivityIndicator size="small" color="#ef4444" />
            ) : (
              <Trash2 size={20} color="#ef4444" />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-red-500/70 font-medium text-sm">Delete Account</Text>
          </View>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}
