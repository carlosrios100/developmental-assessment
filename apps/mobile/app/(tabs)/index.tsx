import { View, Text, ScrollView, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ClipboardList,
  Video,
  TrendingUp,
  Bell,
  ChevronRight,
  Baby,
  Plus,
} from 'lucide-react-native';

export default function HomeScreen() {
  // Mock data - replace with real data from Supabase
  const hasChildren = true;
  const upcomingScreening = {
    childName: 'Emma',
    ageMonths: 18,
    dueDate: 'Feb 15, 2026',
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Welcome Section */}
        <View className="bg-primary-500 px-6 pb-8 pt-4">
          <Text className="text-white text-2xl font-bold">
            Welcome back!
          </Text>
          <Text className="text-primary-100 mt-1">
            Track your child's developmental milestones
          </Text>
        </View>

        {/* Quick Actions */}
        <View className="px-6 -mt-4">
          <View className="bg-white rounded-2xl shadow-sm p-4">
            <Text className="text-gray-900 font-semibold text-lg mb-4">
              Quick Actions
            </Text>
            <View className="flex-row flex-wrap gap-3">
              <QuickActionButton
                icon={ClipboardList}
                label="New Assessment"
                href="/assessment/new"
                color="#3b82f6"
              />
              <QuickActionButton
                icon={Video}
                label="Record Video"
                href="/videos/record"
                color="#22c55e"
              />
              <QuickActionButton
                icon={TrendingUp}
                label="View Progress"
                href="/progress"
                color="#8b5cf6"
              />
              <QuickActionButton
                icon={Baby}
                label="Add Child"
                href="/child/new"
                color="#ec4899"
              />
            </View>
          </View>
        </View>

        {/* Upcoming Screening Alert */}
        {upcomingScreening && (
          <View className="px-6 mt-6">
            <Pressable className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex-row items-center">
              <View className="bg-amber-100 rounded-full p-3">
                <Bell size={24} color="#d97706" />
              </View>
              <View className="flex-1 ml-4">
                <Text className="text-amber-800 font-semibold">
                  Screening Due Soon
                </Text>
                <Text className="text-amber-700 text-sm mt-1">
                  {upcomingScreening.childName}'s {upcomingScreening.ageMonths}-month screening is due {upcomingScreening.dueDate}
                </Text>
              </View>
              <ChevronRight size={20} color="#d97706" />
            </Pressable>
          </View>
        )}

        {/* Children Overview */}
        <View className="px-6 mt-6">
          <View className="flex-row justify-between items-center mb-4">
            <Text className="text-gray-900 font-semibold text-lg">
              My Children
            </Text>
            <Link href="/children" asChild>
              <Pressable>
                <Text className="text-primary-500 font-medium">View All</Text>
              </Pressable>
            </Link>
          </View>

          {hasChildren ? (
            <View className="space-y-3">
              <ChildCard
                name="Emma"
                ageMonths={18}
                lastAssessment="Jan 10, 2026"
                status="typical"
              />
              <ChildCard
                name="Liam"
                ageMonths={36}
                lastAssessment="Dec 15, 2025"
                status="monitoring"
              />
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-6 items-center">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <Baby size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-900 font-semibold text-lg">
                No children added yet
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Add your child to start tracking their developmental milestones
              </Text>
              <Link href="/child/new" asChild>
                <Pressable className="bg-primary-500 rounded-full px-6 py-3 mt-4 flex-row items-center">
                  <Plus size={20} color="#ffffff" />
                  <Text className="text-white font-semibold ml-2">
                    Add Child
                  </Text>
                </Pressable>
              </Link>
            </View>
          )}
        </View>

        {/* Recent Activity */}
        <View className="px-6 mt-6 mb-8">
          <Text className="text-gray-900 font-semibold text-lg mb-4">
            Recent Activity
          </Text>
          <View className="bg-white rounded-2xl p-4 space-y-4">
            <ActivityItem
              type="assessment"
              title="Assessment Completed"
              description="Emma's 18-month assessment"
              time="2 days ago"
            />
            <ActivityItem
              type="video"
              title="Video Analyzed"
              description="Play session with Emma"
              time="3 days ago"
            />
            <ActivityItem
              type="milestone"
              title="Milestone Achieved"
              description="Emma: Walking independently"
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
  href,
  color,
}: {
  icon: typeof ClipboardList;
  label: string;
  href: string;
  color: string;
}) {
  return (
    <Link href={href as any} asChild>
      <Pressable className="bg-gray-50 rounded-xl p-4 items-center w-[48%]">
        <View
          className="rounded-full p-3 mb-2"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon size={24} color={color} />
        </View>
        <Text className="text-gray-700 font-medium text-sm">{label}</Text>
      </Pressable>
    </Link>
  );
}

function ChildCard({
  name,
  ageMonths,
  lastAssessment,
  status,
}: {
  name: string;
  ageMonths: number;
  lastAssessment: string;
  status: 'typical' | 'monitoring' | 'at_risk' | 'concern';
}) {
  const statusColors = {
    typical: { bg: '#dcfce7', text: '#16a34a', label: 'On Track' },
    monitoring: { bg: '#fef9c3', text: '#ca8a04', label: 'Monitor' },
    at_risk: { bg: '#ffedd5', text: '#ea580c', label: 'Review Needed' },
    concern: { bg: '#fee2e2', text: '#dc2626', label: 'Evaluation Needed' },
  };

  const statusStyle = statusColors[status];

  const formatAge = (months: number) => {
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    const remainingMonths = months % 12;
    if (remainingMonths === 0) return `${years} year${years > 1 ? 's' : ''}`;
    return `${years}y ${remainingMonths}m`;
  };

  return (
    <Link href={`/child/${name.toLowerCase()}`} asChild>
      <Pressable className="bg-white rounded-2xl p-4 flex-row items-center shadow-sm">
        <View className="bg-primary-100 rounded-full w-14 h-14 items-center justify-center">
          <Text className="text-primary-600 text-xl font-bold">
            {name.charAt(0)}
          </Text>
        </View>
        <View className="flex-1 ml-4">
          <Text className="text-gray-900 font-semibold text-lg">{name}</Text>
          <Text className="text-gray-500 text-sm">
            {formatAge(ageMonths)} • Last assessment: {lastAssessment}
          </Text>
        </View>
        <View
          className="rounded-full px-3 py-1"
          style={{ backgroundColor: statusStyle.bg }}
        >
          <Text
            className="text-xs font-medium"
            style={{ color: statusStyle.text }}
          >
            {statusStyle.label}
          </Text>
        </View>
      </Pressable>
    </Link>
  );
}

function ActivityItem({
  type,
  title,
  description,
  time,
}: {
  type: 'assessment' | 'video' | 'milestone';
  title: string;
  description: string;
  time: string;
}) {
  const icons = {
    assessment: { icon: ClipboardList, color: '#3b82f6' },
    video: { icon: Video, color: '#22c55e' },
    milestone: { icon: TrendingUp, color: '#8b5cf6' },
  };

  const { icon: Icon, color } = icons[type];

  return (
    <View className="flex-row items-center">
      <View
        className="rounded-full p-2"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon size={18} color={color} />
      </View>
      <View className="flex-1 ml-3">
        <Text className="text-gray-900 font-medium">{title}</Text>
        <Text className="text-gray-500 text-sm">{description}</Text>
      </View>
      <Text className="text-gray-400 text-xs">{time}</Text>
    </View>
  );
}
