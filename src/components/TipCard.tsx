import { View, Text, Pressable } from 'react-native';
import { X, LucideIcon } from 'lucide-react-native';
import Animated, { FadeInDown, FadeOutUp } from 'react-native-reanimated';

interface TipCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  onDismiss: () => void;
}

export default function TipCard({ 
  icon: Icon, 
  title, 
  description, 
  actionText, 
  onAction, 
  onDismiss 
}: TipCardProps) {
  return (
    <Animated.View 
      entering={FadeInDown.springify()}
      exiting={FadeOutUp}
      className="bg-brand-orange/10 border-2 border-brand-orange/30 rounded-2xl p-4 mb-4"
    >
      <View className="flex-row items-start">
        <View className="w-10 h-10 bg-brand-orange/20 rounded-xl items-center justify-center mr-3">
          <Icon size={20} color="#FF9500" />
        </View>
        
        <View className="flex-1">
          <View className="flex-row items-start justify-between mb-1">
            <Text className="text-brand-orange text-sm font-bold uppercase tracking-wider">
              💡 Tip
            </Text>
            <Pressable
              onPress={onDismiss}
              className="p-1 -mt-1 -mr-1"
              hitSlop={8}
            >
              <X size={18} color="#FF9500" />
            </Pressable>
          </View>
          
          <Text className="text-white font-bold text-base mb-2">
            {title}
          </Text>
          
          <Text className="text-zinc-300 text-sm leading-5 mb-3">
            {description}
          </Text>
          
          {actionText && onAction && (
            <Pressable
              onPress={onAction}
              className="bg-brand-orange rounded-xl py-2.5 px-4 active:opacity-90 self-start"
            >
              <Text className="text-black font-bold text-sm">
                {actionText}
              </Text>
            </Pressable>
          )}
        </View>
      </View>
    </Animated.View>
  );
}
