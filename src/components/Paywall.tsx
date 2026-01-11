import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Modal, ScrollView, Platform, ActivityIndicator, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { X, Check, Star, Shield, Zap, Sparkles, Box, Ticket } from 'lucide-react-native';
import { useAuthStore } from '@/lib/state/auth-store';
import useStorageStore from '@/lib/state/storage-store';
import { LinearGradient } from 'expo-linear-gradient';
import Purchases, { PurchasesPackage } from 'react-native-purchases';

interface PaywallProps {
  isVisible: boolean;
  onClose: () => void;
  reason?: string;
}

export default function Paywall({ isVisible, onClose, reason }: PaywallProps) {
  const { setIsPro } = useAuthStore();
  const remoteConfig = useStorageStore((s) => s.remoteConfig);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [promoCode, setPromoCode] = useState('');
  const [isVerifyingPromo, setIsVerifyingPromo] = useState(false);

  useEffect(() => {
    async function loadOfferings() {
      try {
        const offerings = await Purchases.getOfferings();
        if (offerings.current !== null && offerings.current.availablePackages.length !== 0) {
          setPackages(offerings.current.availablePackages);
        }
      } catch (e) {
        console.error("Error fetching offerings", e);
      }
    }

    if (isVisible) {
      loadOfferings();
    }
  }, [isVisible]);

  const handleSubscribe = async (pack?: PurchasesPackage) => {
    setIsLoading(true);
    try {
      // If we have real packages from RevenueCat, use them
      if (pack) {
        const { customerInfo } = await Purchases.purchasePackage(pack);
        if (typeof customerInfo.entitlements.active['TidyNest Pro'] !== "undefined") {
          setIsPro(true);
          onClose();
        }
      } else {
        // Fallback/Simulated success for development
        setTimeout(() => {
          setIsPro(true);
          setIsLoading(false);
          onClose();
        }, 1500);
      }
    } catch (e: any) {
      if (!e.userCancelled) {
        Alert.alert("Error", e.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyPromo = () => {
    if (!promoCode.trim()) return;
    
    setIsVerifyingPromo(true);
    
    // Check against remote config promo_code
    const validCode = remoteConfig.promo_code;
    
    setTimeout(() => {
      if (validCode && promoCode.trim() === validCode) {
        setIsPro(true);
        Alert.alert("Success", "Promo code applied! You now have Pro access.");
        onClose();
      } else {
        Alert.alert("Invalid Code", "The promo code you entered is incorrect.");
      }
      setIsVerifyingPromo(false);
    }, 1000);
  };

  const features = [
    {
      icon: <Box size={24} color="#FF9500" />,
      title: 'Unlimited Boxes',
      description: 'Organize your entire home without any limits on box creation.'
    },
    {
      icon: <Zap size={24} color="#FF9500" />,
      title: 'AI Priority Scanning',
      description: 'Faster and more detailed item recognition with our latest AI models.'
    },
    {
      icon: <Shield size={24} color="#FF9500" />,
      title: 'Cloud Backup',
      description: 'Keep your storage data safe and synced across all your devices.'
    },
    {
      icon: <Star size={24} color="#FF9500" />,
      title: 'Pro Features',
      description: 'Export as CSV, custom categories, and priority support.'
    }
  ];

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-zinc-950">
        <LinearGradient
          colors={['rgba(255, 149, 0, 0.15)', 'transparent']}
          className="absolute inset-0 h-64"
        />
        
        <SafeAreaView className="flex-1">
          <View className="flex-row justify-end px-4 py-2">
            <Pressable 
              onPress={onClose}
              className="w-10 h-10 bg-zinc-900 rounded-full items-center justify-center border border-zinc-800"
            >
              <X size={20} color="#94a3b8" />
            </Pressable>
          </View>

          <ScrollView className="flex-1 px-6">
            <View className="items-center mt-4 mb-8">
              <View className="w-20 h-20 bg-brand-orange rounded-3xl items-center justify-center mb-6 shadow-2xl shadow-brand-orange/40">
                <Sparkles size={40} color="#000" />
              </View>
              <Text className="text-white text-3xl font-black text-center tracking-tighter">
                Upgrade to Pro
              </Text>
              <Text className="text-zinc-400 text-center mt-2 px-4 leading-5">
                {reason || "Unlock TidyNest's full potential and organize your home like a pro."}
              </Text>
            </View>

            <View className="space-y-6 mb-12">
              {features.map((feature, index) => (
                <View key={index} className="flex-row items-start mb-6">
                  <View className="w-12 h-12 bg-zinc-900 rounded-2xl items-center justify-center mr-4 border border-zinc-800">
                    {feature.icon}
                  </View>
                  <View className="flex-1">
                    <Text className="text-white font-bold text-lg">{feature.title}</Text>
                    <Text className="text-zinc-500 text-sm leading-5 mt-1">{feature.description}</Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Promo Code Section */}
            <View className="bg-zinc-900 rounded-3xl p-6 border border-zinc-800 mb-6">
              <View className="flex-row items-center mb-4">
                <Ticket size={20} color="#94a3b8" />
                <Text className="text-white font-bold ml-2">Have a Promo Code?</Text>
              </View>
              
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white"
                  placeholder="Enter code..."
                  placeholderTextColor="#3f3f46"
                  value={promoCode}
                  onChangeText={setPromoCode}
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <Pressable
                  onPress={handleVerifyPromo}
                  disabled={isVerifyingPromo || !promoCode.trim()}
                  className={`px-6 rounded-xl items-center justify-center ${
                    promoCode.trim() ? 'bg-zinc-800 active:bg-zinc-700' : 'bg-zinc-900'
                  }`}
                >
                  {isVerifyingPromo ? (
                    <ActivityIndicator size="small" color="#FF9500" />
                  ) : (
                    <Text className={`font-bold ${promoCode.trim() ? 'text-brand-orange' : 'text-zinc-600'}`}>Apply</Text>
                  )}
                </Pressable>
              </View>
            </View>

            <View className="bg-zinc-900 rounded-3xl p-6 border border-brand-orange/20 mb-8">
              {packages.length > 0 ? (
                packages.map((pack) => (
                  <View key={pack.identifier} className="mb-4">
                    <View className="flex-row items-center justify-between mb-4">
                      <View>
                        <Text className="text-white font-black text-2xl">{pack.product.title}</Text>
                        <Text className="text-brand-orange font-bold text-xs uppercase tracking-widest mt-1">Best Value</Text>
                      </View>
                      <View className="items-end">
                        <Text className="text-white font-black text-2xl">{pack.product.priceString}</Text>
                        <Text className="text-zinc-500 text-xs">per {pack.packageType.toLowerCase()}</Text>
                      </View>
                    </View>
                    
                    <View className="space-y-2 mb-6">
                      <View className="flex-row items-center mb-1">
                        <Check size={16} color="#FF9500" />
                        <Text className="text-zinc-300 ml-2 text-sm">Full access included</Text>
                      </View>
                      <View className="flex-row items-center mb-1">
                        <Check size={16} color="#FF9500" />
                        <Text className="text-zinc-300 ml-2 text-sm">Cancel anytime</Text>
                      </View>
                    </View>

                    <Pressable
                      onPress={() => handleSubscribe(pack)}
                      disabled={isLoading}
                      className="bg-brand-orange rounded-2xl py-4 items-center active:opacity-90 shadow-lg shadow-brand-orange/20"
                    >
                      {isLoading ? (
                        <ActivityIndicator color="#000" />
                      ) : (
                        <Text className="text-black font-black text-xl">Subscribe Now</Text>
                      )}
                    </Pressable>
                  </View>
                ))
              ) : (
                <View>
                  <View className="flex-row items-center justify-between mb-4">
                    <View>
                      <Text className="text-white font-black text-2xl">Yearly Access</Text>
                      <Text className="text-brand-orange font-bold text-xs uppercase tracking-widest mt-1">Best Value</Text>
                    </View>
                    <View className="items-end">
                      <Text className="text-white font-black text-2xl">$19.99</Text>
                      <Text className="text-zinc-500 text-xs">per year</Text>
                    </View>
                  </View>
                  
                  <View className="space-y-2 mb-6">
                    <View className="flex-row items-center mb-1">
                      <Check size={16} color="#FF9500" />
                      <Text className="text-zinc-300 ml-2 text-sm">7-day free trial included</Text>
                    </View>
                    <View className="flex-row items-center mb-1">
                      <Check size={16} color="#FF9500" />
                      <Text className="text-zinc-300 ml-2 text-sm">Cancel anytime</Text>
                    </View>
                  </View>

                  <Pressable
                    onPress={() => handleSubscribe()}
                    disabled={isLoading}
                    className="bg-brand-orange rounded-2xl py-4 items-center active:opacity-90 shadow-lg shadow-brand-orange/20"
                  >
                    {isLoading ? (
                      <ActivityIndicator color="#000" />
                    ) : (
                      <Text className="text-black font-black text-xl">Start Free Trial</Text>
                    )}
                  </Pressable>
                </View>
              )}
              
              <Text className="text-zinc-600 text-[10px] text-center mt-4 leading-4 px-4">
                Recurring billing. Cancel anytime. By subscribing, you agree to our Terms of Service and Privacy Policy.
              </Text>
            </View>
            
            <View className="flex-row justify-center gap-8 mb-12">
              <Pressable onPress={() => {}}>
                <Text className="text-zinc-500 text-xs">Privacy Policy</Text>
              </Pressable>
              <Pressable onPress={() => {}}>
                <Text className="text-zinc-500 text-xs">Restore Purchases</Text>
              </Pressable>
              <Pressable onPress={() => {}}>
                <Text className="text-zinc-500 text-xs">Terms of Use</Text>
              </Pressable>
            </View>
          </ScrollView>
        </SafeAreaView>
      </View>
    </Modal>
  );
}
