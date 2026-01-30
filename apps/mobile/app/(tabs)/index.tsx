import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ClipboardList,
  Video,
  TrendingUp,
  Bell,
  ChevronRight,
  Baby,
  Plus,
  Brain,
  FileText,
  Sparkles,
} from 'lucide-react-native';
import { mockChildren, mockAssessments, calculateAge } from '@/lib/mock-data';

export default function HomeScreen() {
  const upcomingScreening = {
    childName: 'Emma',
    ageMonths: 18,
    dueDate: 'Feb 15, 2026',
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeTitle}>Welcome back!</Text>
          <Text style={styles.welcomeSubtitle}>
            Track your child's developmental milestones
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
          <View style={styles.quickActionsCard}>
            <Text style={styles.cardTitle}>Quick Actions</Text>
            <View style={styles.actionsGrid}>
              <QuickActionButton
                icon={Brain}
                label="AI Analysis"
                onPress={() => router.push('/(tabs)/videos')}
                color="#3b82f6"
              />
              <QuickActionButton
                icon={ClipboardList}
                label="Screener"
                onPress={() => router.push('/screening')}
                color="#8b5cf6"
              />
              <QuickActionButton
                icon={FileText}
                label="Reports"
                onPress={() => router.push('/(tabs)/reports')}
                color="#22c55e"
              />
              <QuickActionButton
                icon={Baby}
                label="Add Child"
                onPress={() => router.push('/child/new' as any)}
                color="#ec4899"
              />
            </View>
          </View>
        </View>

        {/* AI Features Banner */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.aiBanner}
            onPress={() => router.push('/(tabs)/reports')}
          >
            <View style={styles.aiBannerIcon}>
              <Sparkles size={24} color="#ffffff" />
            </View>
            <View style={styles.aiBannerContent}>
              <Text style={styles.aiBannerTitle}>AI-Powered Insights</Text>
              <Text style={styles.aiBannerText}>
                Generate developmental reports with artificial intelligence
              </Text>
            </View>
            <ChevronRight size={20} color="rgba(255,255,255,0.8)" />
          </TouchableOpacity>
        </View>

        {/* Upcoming Screening Alert */}
        {upcomingScreening && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.alertCard}>
              <View style={styles.alertIcon}>
                <Bell size={24} color="#d97706" />
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Screening Due Soon</Text>
                <Text style={styles.alertText}>
                  {upcomingScreening.childName}'s {upcomingScreening.ageMonths}-month screening is due {upcomingScreening.dueDate}
                </Text>
              </View>
              <ChevronRight size={20} color="#d97706" />
            </TouchableOpacity>
          </View>
        )}

        {/* My Children */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>My Children</Text>
            <TouchableOpacity onPress={() => router.push('/(tabs)/children')}>
              <Text style={styles.viewAllText}>View All</Text>
            </TouchableOpacity>
          </View>

          {mockChildren.length > 0 ? (
            <View style={styles.childrenList}>
              {mockChildren.map((child) => {
                const assessment = mockAssessments.find(a => a.child_id === child.id);
                const age = calculateAge(child.date_of_birth);
                return (
                  <ChildCard
                    key={child.id}
                    id={child.id}
                    name={child.first_name}
                    age={age.display}
                    lastAssessment={assessment?.completed_at}
                    status={assessment?.overall_risk_level || 'typical'}
                  />
                );
              })}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Baby size={32} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No children added yet</Text>
              <Text style={styles.emptyText}>
                Add your child to start tracking their developmental milestones
              </Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => router.push('/child/new' as any)}
              >
                <Plus size={20} color="#ffffff" />
                <Text style={styles.addButtonText}>Add Child</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View style={[styles.section, { marginBottom: 32 }]}>
          <Text style={styles.sectionTitle}>Recent Activity</Text>
          <View style={styles.activityCard}>
            <ActivityItem
              type="assessment"
              title="Assessment Completed"
              description="Emma's 10-month assessment"
              time="2 days ago"
            />
            <View style={styles.activityDivider} />
            <ActivityItem
              type="video"
              title="Video Analyzed"
              description="Play session with Emma"
              time="3 days ago"
            />
            <View style={styles.activityDivider} />
            <ActivityItem
              type="report"
              title="Report Generated"
              description="Comprehensive development report"
              time="1 week ago"
            />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function QuickActionButton({
  icon: Icon,
  label,
  onPress,
  color,
}: {
  icon: React.ComponentType<{ size: number; color: string }>;
  label: string;
  onPress: () => void;
  color: string;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress}>
      <View style={[styles.actionButtonIcon, { backgroundColor: color + '15' }]}>
        <Icon size={24} color={color} />
      </View>
      <Text style={styles.actionButtonLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

function ChildCard({
  id,
  name,
  age,
  lastAssessment,
  status,
}: {
  id: string;
  name: string;
  age: string;
  lastAssessment?: string;
  status: string;
}) {
  const statusColors: Record<string, { bg: string; text: string; label: string }> = {
    typical: { bg: '#dcfce7', text: '#16a34a', label: 'On Track' },
    monitoring: { bg: '#fef9c3', text: '#ca8a04', label: 'Monitor' },
    'at-risk': { bg: '#ffedd5', text: '#ea580c', label: 'Review' },
    concern: { bg: '#fee2e2', text: '#dc2626', label: 'Evaluate' },
  };

  const statusStyle = statusColors[status] || statusColors.typical;

  return (
    <TouchableOpacity
      style={styles.childCard}
      onPress={() => router.push(`/child/${id}`)}
    >
      <View style={styles.childAvatar}>
        <Text style={styles.childAvatarText}>{name.charAt(0)}</Text>
      </View>
      <View style={styles.childInfo}>
        <Text style={styles.childName}>{name}</Text>
        <Text style={styles.childMeta}>
          {age} {lastAssessment && `• Last: ${new Date(lastAssessment).toLocaleDateString()}`}
        </Text>
      </View>
      <View style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}>
        <Text style={[styles.statusText, { color: statusStyle.text }]}>
          {statusStyle.label}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

function ActivityItem({
  type,
  title,
  description,
  time,
}: {
  type: 'assessment' | 'video' | 'report';
  title: string;
  description: string;
  time: string;
}) {
  const icons = {
    assessment: { icon: ClipboardList, color: '#3b82f6' },
    video: { icon: Video, color: '#22c55e' },
    report: { icon: FileText, color: '#8b5cf6' },
  };

  const { icon: Icon, color } = icons[type];

  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: color + '15' }]}>
        <Icon size={18} color={color} />
      </View>
      <View style={styles.activityContent}>
        <Text style={styles.activityTitle}>{title}</Text>
        <Text style={styles.activityDescription}>{description}</Text>
      </View>
      <Text style={styles.activityTime}>{time}</Text>
    </View>
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
  welcomeSection: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 24,
    paddingBottom: 32,
    paddingTop: 16,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
  },
  welcomeSubtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  quickActionsCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    marginTop: -16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    width: '48%',
  },
  actionButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionButtonLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4b5563',
  },
  aiBanner: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  aiBannerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  aiBannerContent: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  aiBannerText: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  alertCard: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#fcd34d',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fde68a',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  alertText: {
    fontSize: 14,
    color: '#a16207',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  childrenList: {
    gap: 12,
  },
  childCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  childAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  childAvatarText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#3b82f6',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  childMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 24,
    paddingHorizontal: 24,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  activityCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 15,
    fontWeight: '500',
    color: '#1f2937',
  },
  activityDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 1,
  },
  activityTime: {
    fontSize: 12,
    color: '#9ca3af',
  },
  activityDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
    marginVertical: 8,
  },
});
