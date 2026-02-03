import { View, Text, ScrollView, Pressable, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  User,
  Bell,
  Shield,
  HelpCircle,
  FileText,
  LogOut,
  ChevronRight,
  Moon,
} from 'lucide-react-native';
import { useEffect } from 'react';
import { router } from 'expo-router';
import { useAuthStore } from '@/stores/auth-store';
import { useSettingsStore } from '@/stores/settings-store';

export default function SettingsScreen() {
  const {
    notificationsEnabled,
    darkMode,
    setNotificationsEnabled,
    setDarkMode,
    initialize: initSettings,
  } = useSettingsStore();
  const { user, signOut } = useAuthStore();

  useEffect(() => {
    initSettings();
  }, []);
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const userEmail = user?.email || '';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1">
        {/* Profile Section */}
        <View className="px-6 pt-4">
          <Pressable className="bg-white rounded-2xl p-4 flex-row items-center">
            <View className="bg-primary-100 rounded-full w-16 h-16 items-center justify-center">
              <Text className="text-primary-600 text-2xl font-bold">{userInitial}</Text>
            </View>
            <View className="flex-1 ml-4">
              <Text className="text-gray-900 font-bold text-lg">{userName}</Text>
              <Text className="text-gray-500">{userEmail}</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Preferences */}
        <View className="px-6 mt-6">
          <Text className="text-gray-400 text-xs uppercase font-semibold mb-3 ml-1">
            Preferences
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <SettingToggle
              icon={Bell}
              label="Notifications"
              description="Assessment reminders & milestones"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <View className="h-px bg-gray-100 mx-4" />
            <SettingToggle
              icon={Moon}
              label="Dark Mode"
              description="Use dark theme"
              value={darkMode}
              onValueChange={setDarkMode}
            />
          </View>
        </View>

        {/* Account */}
        <View className="px-6 mt-6">
          <Text className="text-gray-400 text-xs uppercase font-semibold mb-3 ml-1">
            Account
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <SettingLink
              icon={User}
              label="Edit Profile"
              onPress={() => {}}
            />
            <View className="h-px bg-gray-100 mx-4" />
            <SettingLink
              icon={Shield}
              label="Privacy Settings"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Support */}
        <View className="px-6 mt-6">
          <Text className="text-gray-400 text-xs uppercase font-semibold mb-3 ml-1">
            Support
          </Text>
          <View className="bg-white rounded-2xl overflow-hidden">
            <SettingLink
              icon={HelpCircle}
              label="Help & FAQ"
              onPress={() => {}}
            />
            <View className="h-px bg-gray-100 mx-4" />
            <SettingLink
              icon={FileText}
              label="Terms & Privacy Policy"
              onPress={() => {}}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View className="px-6 mt-6 mb-8">
          <Pressable
            className="bg-white rounded-2xl p-4 flex-row items-center justify-center"
            onPress={signOut}
          >
            <LogOut size={20} color="#ef4444" />
            <Text className="text-red-500 font-semibold ml-2">Sign Out</Text>
          </Pressable>
        </View>

        {/* App Version */}
        <View className="items-center pb-8">
          <Text className="text-gray-400 text-sm">DevAssess v1.0.0</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingToggle({
  icon: Icon,
  label,
  description,
  value,
  onValueChange,
}: {
  icon: typeof Bell;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  return (
    <View className="p-4 flex-row items-center">
      <View className="bg-gray-100 rounded-full p-2">
        <Icon size={20} color="#6b7280" />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-gray-900 font-medium">{label}</Text>
        <Text className="text-gray-500 text-sm">{description}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: '#d1d5db', true: '#93c5fd' }}
        thumbColor={value ? '#3b82f6' : '#f3f4f6'}
      />
    </View>
  );
}

function SettingLink({
  icon: Icon,
  label,
  onPress,
}: {
  icon: typeof User;
  label: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      className="p-4 flex-row items-center active:bg-gray-50"
      onPress={onPress}
    >
      <View className="bg-gray-100 rounded-full p-2">
        <Icon size={20} color="#6b7280" />
      </View>
      <Text className="flex-1 text-gray-900 font-medium ml-3">{label}</Text>
      <ChevronRight size={20} color="#9ca3af" />
    </Pressable>
  );
}
