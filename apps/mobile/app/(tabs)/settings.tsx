import {
  View,
  Text,
  ScrollView,
  Switch,
  Alert,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Profile Section */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.profileCard} activeOpacity={0.7}>
            <View style={styles.avatarContainer}>
              <Text style={styles.avatarText}>{userInitial}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{userName}</Text>
              <Text style={styles.profileEmail}>{userEmail}</Text>
            </View>
            <ChevronRight size={20} color="#9ca3af" />
          </TouchableOpacity>
        </View>

        {/* Preferences */}
        <View style={styles.sectionWithMargin}>
          <Text style={styles.sectionTitle}>Preferences</Text>
          <View style={styles.card}>
            <SettingToggle
              icon={Bell}
              label="Notifications"
              description="Assessment reminders & milestones"
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
            />
            <View style={styles.divider} />
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
        <View style={styles.sectionWithMargin}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.card}>
            <SettingLink
              icon={User}
              label="Edit Profile"
              onPress={() => Alert.alert('Coming Soon', 'Profile editing will be available in a future update.')}
            />
            <View style={styles.divider} />
            <SettingLink
              icon={Shield}
              label="Privacy Settings"
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available in a future update.')}
            />
          </View>
        </View>

        {/* Support */}
        <View style={styles.sectionWithMargin}>
          <Text style={styles.sectionTitle}>Support</Text>
          <View style={styles.card}>
            <SettingLink
              icon={HelpCircle}
              label="Help & FAQ"
              onPress={() => Alert.alert('Coming Soon', 'Help & FAQ will be available in a future update.')}
            />
            <View style={styles.divider} />
            <SettingLink
              icon={FileText}
              label="Terms & Privacy Policy"
              onPress={() => Alert.alert('Coming Soon', 'Terms & Privacy Policy will be available in a future update.')}
            />
          </View>
        </View>

        {/* Sign Out */}
        <View style={styles.signOutSection}>
          <TouchableOpacity
            style={styles.signOutButton}
            activeOpacity={0.7}
            onPress={signOut}
          >
            <LogOut size={20} color="#ef4444" />
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        {/* App Version */}
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>DevAssess v1.0.0</Text>
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
    <View style={styles.toggleRow}>
      <View style={styles.iconContainer}>
        <Icon size={20} color="#6b7280" />
      </View>
      <View style={styles.toggleContent}>
        <Text style={styles.settingLabel}>{label}</Text>
        <Text style={styles.settingDescription}>{description}</Text>
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
    <TouchableOpacity
      style={styles.linkRow}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View style={styles.iconContainer}>
        <Icon size={20} color="#6b7280" />
      </View>
      <Text style={styles.linkLabel}>{label}</Text>
      <ChevronRight size={20} color="#9ca3af" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  sectionWithMargin: {
    paddingHorizontal: 24,
    marginTop: 24,
  },
  sectionTitle: {
    color: '#9ca3af',
    fontSize: 12,
    textTransform: 'uppercase',
    fontWeight: '600',
    marginBottom: 12,
    marginLeft: 4,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
  },
  profileCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    backgroundColor: '#dbeafe',
    borderRadius: 32,
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: '#2563eb',
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
    marginLeft: 16,
  },
  profileName: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 18,
  },
  profileEmail: {
    color: '#6b7280',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#f3f4f6',
    marginHorizontal: 16,
  },
  toggleRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    backgroundColor: '#f3f4f6',
    borderRadius: 999,
    padding: 8,
  },
  toggleContent: {
    flex: 1,
    marginLeft: 12,
  },
  settingLabel: {
    color: '#111827',
    fontWeight: '500',
  },
  settingDescription: {
    color: '#6b7280',
    fontSize: 14,
  },
  linkRow: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  linkLabel: {
    flex: 1,
    color: '#111827',
    fontWeight: '500',
    marginLeft: 12,
  },
  signOutSection: {
    paddingHorizontal: 24,
    marginTop: 24,
    marginBottom: 32,
  },
  signOutButton: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  signOutText: {
    color: '#ef4444',
    fontWeight: '600',
    marginLeft: 8,
  },
  versionContainer: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  versionText: {
    color: '#9ca3af',
    fontSize: 14,
  },
});
