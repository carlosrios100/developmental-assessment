import { View, Text, ScrollView, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Baby, ChevronRight } from 'lucide-react-native';
import { useChildren } from '@/hooks/useChildren';
import { useRecentAssessments } from '@/hooks/useAssessments';
import { calculateAge } from '@/lib/utils';

export default function ChildrenScreen() {
  const { children, isLoading, error } = useChildren();
  const { data: allAssessments = [] } = useRecentAssessments();

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : children.length > 0 ? (
          <View style={styles.childrenList}>
            {children.map((child) => {
              const childAssessments = allAssessments.filter(a => a.child_id === child.id);
              const latestAssessment = childAssessments[0];
              const dob = child.dateOfBirth instanceof Date ? child.dateOfBirth.toISOString() : String(child.dateOfBirth);
              const ageMonths = Math.floor((Date.now() - new Date(dob).getTime()) / (1000 * 60 * 60 * 24 * 30));
              return (
                <ChildProfileCard
                  key={child.id}
                  child={{
                    id: child.id,
                    name: child.firstName,
                    ageMonths,
                    gender: child.gender || 'unknown',
                    lastAssessment: latestAssessment?.completed_at || '',
                    assessmentCount: childAssessments.length,
                    status: (latestAssessment?.overall_risk_level || 'typical') as any,
                  }}
                />
              );
            })}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Baby size={48} color="#9ca3af" />
            </View>
            <Text style={styles.emptyTitle}>
              No children yet
            </Text>
            <Text style={styles.emptyText}>
              Add your first child to start tracking their developmental progress
            </Text>
          </View>
        )}

        {/* Add Child Button */}
        <Link href="/child/new" asChild>
          <TouchableOpacity style={styles.addButton}>
            <Plus size={24} color="#ffffff" />
            <Text style={styles.addButtonText}>
              Add Child
            </Text>
          </TouchableOpacity>
        </Link>
      </ScrollView>
    </SafeAreaView>
  );
}

function ChildProfileCard({
  child,
}: {
  child: {
    id: string;
    name: string;
    ageMonths: number;
    gender: string;
    lastAssessment: string;
    assessmentCount: number;
    status: 'typical' | 'monitoring' | 'at_risk' | 'concern';
  };
}) {
  const statusColors = {
    typical: { bg: '#dcfce7', text: '#16a34a', label: 'On Track' },
    monitoring: { bg: '#fef9c3', text: '#ca8a04', label: 'Monitor' },
    at_risk: { bg: '#ffedd5', text: '#ea580c', label: 'Review Needed' },
    concern: { bg: '#fee2e2', text: '#dc2626', label: 'Evaluation Needed' },
  };

  const statusStyle = statusColors[child.status];

  const formatAge = (months: number) => {
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}y ${remainingMonths}m`;
  };

  return (
    <Link href={`/child/${child.id}`} asChild>
      <TouchableOpacity style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {child.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <View style={styles.nameRow}>
              <Text style={styles.childName}>
                {child.name}
              </Text>
              <View
                style={[styles.statusBadge, { backgroundColor: statusStyle.bg }]}
              >
                <Text
                  style={[styles.statusText, { color: statusStyle.text }]}
                >
                  {statusStyle.label}
                </Text>
              </View>
            </View>
            <Text style={styles.childAge}>
              {formatAge(child.ageMonths)} old
            </Text>
          </View>
        </View>

        <View style={styles.cardFooter}>
          <View style={styles.cardStat}>
            <Text style={styles.cardStatLabel}>
              Assessments
            </Text>
            <Text style={styles.cardStatValue}>
              {child.assessmentCount}
            </Text>
          </View>
          <View style={styles.cardStat}>
            <Text style={styles.cardStatLabel}>
              Last Assessment
            </Text>
            <Text style={styles.cardStatValue}>
              {new Date(child.lastAssessment).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.chevronContainer}>
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </View>
      </TouchableOpacity>
    </Link>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  childrenList: {
    gap: 16,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyIcon: {
    backgroundColor: '#f3f4f6',
    borderRadius: 9999,
    padding: 24,
    marginBottom: 16,
  },
  emptyTitle: {
    color: '#111827',
    fontWeight: '600',
    fontSize: 20,
  },
  emptyText: {
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 32,
    fontSize: 14,
  },
  addButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    marginBottom: 32,
  },
  addButtonText: {
    color: '#ffffff',
    fontWeight: '600',
    fontSize: 18,
    marginLeft: 8,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    backgroundColor: '#dbeafe',
    borderRadius: 9999,
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
  cardHeaderInfo: {
    flex: 1,
    marginLeft: 16,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  childName: {
    color: '#111827',
    fontWeight: '700',
    fontSize: 20,
  },
  statusBadge: {
    borderRadius: 9999,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  childAge: {
    color: '#6b7280',
    marginTop: 4,
    fontSize: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  cardStat: {
    flex: 1,
  },
  cardStatLabel: {
    color: '#9ca3af',
    fontSize: 12,
    textTransform: 'uppercase',
  },
  cardStatValue: {
    color: '#111827',
    fontWeight: '600',
    marginTop: 4,
    fontSize: 14,
  },
  chevronContainer: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
