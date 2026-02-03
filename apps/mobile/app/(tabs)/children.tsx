import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Plus, Baby, ChevronRight } from 'lucide-react-native';
import { useChildren } from '@/hooks/useChildren';
import { useRecentAssessments } from '@/hooks/useAssessments';
import { calculateAge } from '@/lib/mock-data';

export default function ChildrenScreen() {
  const { children, isLoading, error } = useChildren();
  const { data: allAssessments = [] } = useRecentAssessments();

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1 px-6 pt-4">
        {isLoading ? (
          <View style={{ padding: 32, alignItems: 'center' }}>
            <ActivityIndicator size="large" color="#3b82f6" />
          </View>
        ) : children.length > 0 ? (
          <View className="space-y-4">
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
          <View className="flex-1 items-center justify-center py-20">
            <View className="bg-gray-100 rounded-full p-6 mb-4">
              <Baby size={48} color="#9ca3af" />
            </View>
            <Text className="text-gray-900 font-semibold text-xl">
              No children yet
            </Text>
            <Text className="text-gray-500 text-center mt-2 px-8">
              Add your first child to start tracking their developmental progress
            </Text>
          </View>
        )}

        {/* Add Child Button */}
        <Link href="/child/new" asChild>
          <Pressable className="bg-primary-500 rounded-2xl p-4 flex-row items-center justify-center mt-6 mb-8">
            <Plus size={24} color="#ffffff" />
            <Text className="text-white font-semibold text-lg ml-2">
              Add Child
            </Text>
          </Pressable>
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
      <Pressable className="bg-white rounded-2xl p-5 shadow-sm">
        <View className="flex-row items-center">
          <View className="bg-primary-100 rounded-full w-16 h-16 items-center justify-center">
            <Text className="text-primary-600 text-2xl font-bold">
              {child.name.charAt(0)}
            </Text>
          </View>
          <View className="flex-1 ml-4">
            <View className="flex-row items-center justify-between">
              <Text className="text-gray-900 font-bold text-xl">
                {child.name}
              </Text>
              <View
                className="rounded-full px-3 py-1"
                style={{ backgroundColor: statusStyle.bg }}
              >
                <Text
                  className="text-xs font-semibold"
                  style={{ color: statusStyle.text }}
                >
                  {statusStyle.label}
                </Text>
              </View>
            </View>
            <Text className="text-gray-500 mt-1">
              {formatAge(child.ageMonths)} old
            </Text>
          </View>
        </View>

        <View className="flex-row mt-4 pt-4 border-t border-gray-100">
          <View className="flex-1">
            <Text className="text-gray-400 text-xs uppercase">
              Assessments
            </Text>
            <Text className="text-gray-900 font-semibold mt-1">
              {child.assessmentCount}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-gray-400 text-xs uppercase">
              Last Assessment
            </Text>
            <Text className="text-gray-900 font-semibold mt-1">
              {new Date(child.lastAssessment).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View className="items-end justify-center">
            <ChevronRight size={20} color="#9ca3af" />
          </View>
        </View>
      </Pressable>
    </Link>
  );
}
