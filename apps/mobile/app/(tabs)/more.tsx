import { View, Text, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import {
  Video,
  TrendingUp,
  Settings,
  HelpCircle,
  FileText,
  MessageCircle,
  Star,
  Bell,
  Shield,
  ChevronRight,
  Camera,
  ClipboardList,
  BookOpen,
  Users,
} from 'lucide-react-native';

interface MenuItemProps {
  icon: React.ComponentType<{ size: number; color: string }>;
  title: string;
  subtitle?: string;
  onPress: () => void;
  color?: string;
  badge?: string;
}

const MenuItem = ({ icon: Icon, title, subtitle, onPress, color = '#6b7280', badge }: MenuItemProps) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View style={[styles.menuItemIcon, { backgroundColor: color + '15' }]}>
      <Icon size={22} color={color} />
    </View>
    <View style={styles.menuItemContent}>
      <Text style={styles.menuItemTitle}>{title}</Text>
      {subtitle && <Text style={styles.menuItemSubtitle}>{subtitle}</Text>}
    </View>
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    <ChevronRight size={20} color="#d1d5db" />
  </TouchableOpacity>
);

export default function MoreScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Tools Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Tools</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={Video}
              title="Video Library"
              subtitle="View and upload developmental videos"
              onPress={() => router.push('/(tabs)/videos')}
              color="#22c55e"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={Camera}
              title="Record Video"
              subtitle="Capture new developmental footage"
              onPress={() => router.push('/(tabs)/videos')}
              color="#3b82f6"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={ClipboardList}
              title="Developmental Screener"
              subtitle="Start milestone screening"
              onPress={() => router.push('/screening')}
              color="#8b5cf6"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={TrendingUp}
              title="Progress Tracking"
              subtitle="View developmental trends"
              onPress={() => router.push('/(tabs)/progress')}
              color="#f59e0b"
            />
          </View>
        </View>

        {/* Resources Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Resources</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={BookOpen}
              title="Learning Center"
              subtitle="Developmental milestones guide"
              onPress={() => {}}
              color="#ec4899"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={Users}
              title="Community"
              subtitle="Connect with other parents"
              onPress={() => {}}
              color="#06b6d4"
              badge="New"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={HelpCircle}
              title="Help & Support"
              subtitle="FAQs and contact support"
              onPress={() => {}}
              color="#6366f1"
            />
          </View>
        </View>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Account</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={Bell}
              title="Notifications"
              subtitle="Manage alerts and reminders"
              onPress={() => router.push('/(tabs)/settings')}
              color="#f59e0b"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={Shield}
              title="Privacy"
              subtitle="Data and security settings"
              onPress={() => router.push('/(tabs)/settings')}
              color="#22c55e"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={Settings}
              title="Settings"
              subtitle="App preferences"
              onPress={() => router.push('/(tabs)/settings')}
              color="#6b7280"
            />
          </View>
        </View>

        {/* Feedback Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Feedback</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={Star}
              title="Rate the App"
              subtitle="Share your experience"
              onPress={() => {}}
              color="#f59e0b"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={MessageCircle}
              title="Send Feedback"
              subtitle="Help us improve DevAssess"
              onPress={() => {}}
              color="#3b82f6"
            />
          </View>
        </View>

        {/* Legal Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal</Text>
          <View style={styles.menuGroup}>
            <MenuItem
              icon={FileText}
              title="Terms of Service"
              onPress={() => {}}
              color="#6b7280"
            />
            <View style={styles.divider} />
            <MenuItem
              icon={Shield}
              title="Privacy Policy"
              onPress={() => {}}
              color="#6b7280"
            />
          </View>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appName}>DevAssess</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.copyright}>© 2026 DevAssess Inc.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#9ca3af',
    textTransform: 'uppercase',
    marginBottom: 8,
    marginLeft: 4,
  },
  menuGroup: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  menuItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  menuItemContent: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  menuItemSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginLeft: 74,
  },
  badge: {
    backgroundColor: '#ef4444',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginRight: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
  appInfo: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingBottom: 48,
  },
  appName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  appVersion: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 4,
  },
  copyright: {
    fontSize: 12,
    color: '#d1d5db',
    marginTop: 8,
  },
});
