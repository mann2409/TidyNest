import { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView, Image, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Plus, Package, Trash2, QrCode, Share as ShareIcon, Pencil } from 'lucide-react-native';
import useStorageStore from '@/lib/state/storage-store';

export default function ContainerDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [showQR, setShowQR] = useState(false);

  const containers = useStorageStore((s) => s.containers);
  const items = useStorageStore((s) => s.items);
  const locations = useStorageStore((s) => s.locations);
  const deleteContainer = useStorageStore((s) => s.deleteContainer);
  const deleteItem = useStorageStore((s) => s.deleteItem);

  const container = useMemo(() => {
    return containers.find((c) => c.id === id);
  }, [containers, id]);

  const location = useMemo(() => {
    if (!container) return null;
    return locations.find((l) => l.id === container.locationId);
  }, [locations, container]);

  const containerItems = useMemo(() => {
    return items.filter((item) => item.containerId === id);
  }, [items, id]);

  const handleDelete = () => {
    if (container) {
      deleteContainer(container.id);
      router.back();
    }
  };

  const handleShareQR = async () => {
    if (container) {
      await Share.share({
        message: `Box ${container.code} - ${container.description || 'No description'}`,
      });
    }
  };

  // Generate QR code URL using a free API
  const qrCodeUrl = container
    ? `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(container.code)}`
    : '';

  if (!container) {
    return (
      <SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center">
        <Text className="text-white">Box not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-zinc-950" edges={['top']}>
      <View className="flex-1">
        {/* Header */}
        <View className="flex-row items-center justify-between px-4 py-3">
          <Pressable onPress={() => router.back()} className="flex-row items-center">
            <ChevronLeft size={24} color="#fff" />
            <Text className="text-white ml-1">Back</Text>
          </Pressable>
          <View className="flex-row gap-2">
            <Pressable
              className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"
              onPress={() => router.push(`/edit-container?id=${container.id}`)}
            >
              <Pencil size={20} color="#f59e0b" />
            </Pressable>
            <Pressable
              className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"
              onPress={() => setShowQR(!showQR)}
            >
              <QrCode size={20} color="#f59e0b" />
            </Pressable>
            <Pressable
              className="w-10 h-10 bg-zinc-800 rounded-full items-center justify-center"
              onPress={handleDelete}
            >
              <Trash2 size={20} color="#ef4444" />
            </Pressable>
          </View>
        </View>

        <ScrollView className="flex-1 px-4" showsVerticalScrollIndicator={false}>
          {/* Box Code Header */}
          <View className="items-center py-6">
            <View className="bg-amber-500/20 rounded-2xl px-8 py-4">
              <Text className="text-amber-500 text-4xl font-bold">{container.code}</Text>
            </View>
            <View className="flex-row items-center mt-3 gap-2">
              <View className="bg-zinc-800 px-3 py-1 rounded-full">
                <Text className="text-zinc-300 text-sm">{container.category}</Text>
              </View>
              <Text className="text-zinc-500">•</Text>
              <Text className="text-zinc-400">{location?.name}</Text>
            </View>
          </View>

          {/* QR Code */}
          {showQR && (
            <View className="bg-white rounded-2xl p-6 items-center mb-6">
              <Image
                source={{ uri: qrCodeUrl }}
                style={{ width: 180, height: 180 }}
                resizeMode="contain"
              />
              <Text className="text-black font-bold mt-4 text-lg">{container.code}</Text>
              <Pressable
                className="flex-row items-center mt-4 bg-zinc-100 px-4 py-2 rounded-full"
                onPress={handleShareQR}
              >
                <ShareIcon size={16} color="#000" />
                <Text className="text-black ml-2 font-medium">Share / Print</Text>
              </Pressable>
            </View>
          )}

          {/* Photo */}
          {container.photoUrl && (
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-2">Photo</Text>
              <Image
                source={{ uri: container.photoUrl }}
                className="w-full h-48 rounded-xl"
                resizeMode="cover"
              />
            </View>
          )}

          {/* Description */}
          {container.description && (
            <View className="mb-6">
              <Text className="text-zinc-400 text-sm mb-2">Description</Text>
              <View className="bg-zinc-900 rounded-xl p-4">
                <Text className="text-white">{container.description}</Text>
              </View>
            </View>
          )}

          {/* Items */}
          <View className="mb-6">
            <View className="flex-row items-center justify-between mb-3">
              <Text className="text-lg font-semibold text-white">
                Items ({containerItems.length})
              </Text>
              <Pressable
                className="flex-row items-center bg-amber-500 px-4 py-2 rounded-full active:opacity-80"
                onPress={() => router.push(`/add-item?containerId=${container.id}`)}
              >
                <Plus size={16} color="#000" />
                <Text className="text-black font-medium ml-1">Add Item</Text>
              </Pressable>
            </View>

            {containerItems.length === 0 ? (
              <View className="bg-zinc-900 rounded-xl p-8 items-center">
                <Package size={40} color="#71717a" />
                <Text className="text-zinc-500 mt-3 text-center">
                  No items added yet
                </Text>
                <Text className="text-zinc-600 text-sm mt-1 text-center">
                  Add items to keep track of what's in this box
                </Text>
              </View>
            ) : (
              <View>
                {containerItems.map((item) => (
                  <Pressable
                    key={item.id}
                    className="bg-zinc-900 rounded-xl p-4 mb-2 flex-row items-start active:opacity-80"
                    onPress={() => router.push(`/edit-item?itemId=${item.id}`)}
                  >
                    <View className="w-10 h-10 bg-amber-500/20 rounded-xl items-center justify-center mr-3">
                      <Package size={20} color="#f59e0b" />
                    </View>
                    <View className="flex-1">
                      <View className="flex-row items-center">
                        <Text className="text-white font-medium flex-1">{item.name}</Text>
                        <Pencil size={14} color="#71717a" />
                      </View>
                      {item.quantity && (
                        <Text className="text-zinc-500 text-sm">Qty: {item.quantity}</Text>
                      )}
                      {item.tags.length > 0 && (
                        <View className="flex-row flex-wrap gap-1 mt-2">
                          {item.tags.map((tag, i) => (
                            <View key={i} className="bg-zinc-800 px-2 py-0.5 rounded">
                              <Text className="text-zinc-400 text-xs">{tag}</Text>
                            </View>
                          ))}
                        </View>
                      )}
                      {item.notes && (
                        <Text className="text-zinc-500 text-sm mt-1">{item.notes}</Text>
                      )}
                    </View>
                    <Pressable
                      className="p-2"
                      onPress={(e) => {
                        e.stopPropagation();
                        deleteItem(item.id);
                      }}
                    >
                      <Trash2 size={16} color="#71717a" />
                    </Pressable>
                  </Pressable>
                ))}
              </View>
            )}
          </View>

          {/* Created Date */}
          <View className="mb-8">
            <Text className="text-zinc-600 text-xs text-center">
              Created {new Date(container.createdAt).toLocaleDateString()}
            </Text>
          </View>
        </ScrollView>
      </View>
    </SafeAreaView>
  );
}
