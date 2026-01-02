import { useState } from 'react';
import { View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Mail, Loader2, ArrowRight, ChevronLeft, CheckCircle2 } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!email) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email);

      if (resetError) throw resetError;
      
      setSuccess(true);
    } catch (e: any) {
      setError(e.message || 'Failed to send reset email');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-zinc-950">
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <ScrollView contentContainerStyle={{ flexGrow: 1 }} className="px-6">
          <View className="py-6">
            <Pressable onPress={() => router.back()} className="w-10 h-10 items-center justify-center bg-zinc-900 rounded-full">
              <ChevronLeft size={24} color="#fff" />
            </Pressable>
          </View>

          <View className="flex-1 justify-center pb-12">
            {!success ? (
              <>
                <View className="mb-12">
                  <Text className="text-white text-4xl font-bold">Reset Password</Text>
                  <Text className="text-zinc-500 text-lg mt-2">Enter your email to receive a reset link</Text>
                </View>

                <View className="space-y-4">
                  <View>
                    <Text className="text-zinc-400 text-sm mb-2 ml-1">Email Address</Text>
                    <View className="flex-row items-center bg-zinc-900 rounded-2xl px-4 border border-zinc-800">
                      <Mail size={20} color="#71717a" />
                      <TextInput
                        className="flex-1 py-4 ml-3 text-white"
                        placeholder="email@example.com"
                        placeholderTextColor="#3f3f46"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                        keyboardType="email-address"
                      />
                    </View>
                  </View>

                  {error && (
                    <View className="bg-red-500/10 border border-red-500/50 rounded-xl p-3 mt-4">
                      <Text className="text-red-500 text-sm text-center">{error}</Text>
                    </View>
                  )}

                  <Pressable
                    onPress={handleReset}
                    disabled={loading || !email}
                    className={`mt-8 py-4 rounded-2xl flex-row items-center justify-center ${
                      loading || !email ? 'bg-zinc-800' : 'bg-amber-500'
                    }`}
                  >
                    {loading ? (
                      <Loader2 size={24} color="#000" className="animate-spin" />
                    ) : (
                      <>
                        <Text className="text-black font-bold text-lg mr-2">Send Reset Link</Text>
                        <ArrowRight size={20} color="#000" />
                      </>
                    )}
                  </Pressable>
                </View>
              </>
            ) : (
              <View className="items-center">
                <View className="w-20 h-20 bg-green-500/20 rounded-full items-center justify-center mb-6">
                  <CheckCircle2 size={40} color="#22c55e" />
                </View>
                <Text className="text-white text-3xl font-bold text-center">Check Your Email</Text>
                <Text className="text-zinc-500 text-lg text-center mt-4">
                  We've sent a password reset link to {email}
                </Text>
                <Pressable
                  onPress={() => router.replace('/login')}
                  className="mt-12 bg-zinc-800 px-8 py-4 rounded-2xl"
                >
                  <Text className="text-white font-bold text-lg">Back to Login</Text>
                </Pressable>
              </View>
            )}
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

