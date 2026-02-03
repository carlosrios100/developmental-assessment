import { View, Text, ScrollView, Pressable, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TrendingUp, TrendingDown, Minus, ChevronDown } from 'lucide-react-native';
import { useState, useEffect } from 'react';
import { useChildren } from '@/hooks/useChildren';
import { useProgress } from '@/hooks/useProgress';

export default function ProgressScreen() {
  const { children } = useChildren();
  const [selectedChildId, setSelectedChildId] = useState<string | null>(null);

  // Auto-select first child
  useEffect(() => {
    if (children.length > 0 && !selectedChildId) {
      setSelectedChildId(children[0].id);
    }
  }, [children]);

  const selectedChild = children.find(c => c.id === selectedChildId);
  const { data: progressData, isLoading: progressLoading } = useProgress(selectedChildId ?? undefined);

  const domainProgress = (progressData?.domains ?? []).map(d => ({
    domain: d.domain.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
    score: d.currentScore,
    trend: d.trend,
    change: d.change,
  }));

  const recentMilestones = (progressData?.milestones ?? []).map(m => ({
    id: m.id,
    description: m.description,
    achievedAt: m.achievedAt,
    domain: m.domain.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase()),
  }));

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1">
        {/* Child Selector */}
        <View className="px-6 pt-4">
          <Pressable
            className="bg-white rounded-xl p-4 flex-row items-center justify-between"
            onPress={() => {
              // Cycle through children
              if (children.length > 1) {
                const currentIdx = children.findIndex(c => c.id === selectedChildId);
                const nextIdx = (currentIdx + 1) % children.length;
                setSelectedChildId(children[nextIdx].id);
              }
            }}
          >
            <View className="flex-row items-center">
              <View className="bg-primary-100 rounded-full w-10 h-10 items-center justify-center">
                <Text className="text-primary-600 font-bold">
                  {selectedChild?.firstName?.charAt(0) || '?'}
                </Text>
              </View>
              <Text className="text-gray-900 font-semibold ml-3">
                {selectedChild?.firstName || 'Select Child'}
              </Text>
            </View>
            <ChevronDown size={20} color="#9ca3af" />
          </Pressable>
        </View>

        {/* Overall Progress */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 font-semibold text-lg mb-4">
            Development Overview
          </Text>

          {progressLoading ? (
            <View style={{ padding: 32, alignItems: 'center' }}>
              <ActivityIndicator size="large" color="#3b82f6" />
            </View>
          ) : domainProgress.length > 0 ? (
            <View className="bg-white rounded-2xl p-4">
              {domainProgress.map((item, index) => (
                <DomainProgressBar
                  key={item.domain}
                  domain={item.domain}
                  score={item.score}
                  trend={item.trend as 'up' | 'down' | 'stable'}
                  change={item.change}
                  isLast={index === domainProgress.length - 1}
                />
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center">
              <Text className="text-gray-500">No progress data yet. Complete an assessment first.</Text>
            </View>
          )}
        </View>

        {/* Score Legend */}
        <View className="px-6 mt-4">
          <View className="flex-row justify-center space-x-4">
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-green-500 mr-1.5" />
              <Text className="text-gray-500 text-xs">On Track (75+)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-amber-500 mr-1.5" />
              <Text className="text-gray-500 text-xs">Monitor (50-74)</Text>
            </View>
            <View className="flex-row items-center">
              <View className="w-3 h-3 rounded-full bg-red-500 mr-1.5" />
              <Text className="text-gray-500 text-xs">Review (&lt;50)</Text>
            </View>
          </View>
        </View>

        {/* Recent Milestones */}
        <View className="px-6 mt-6 mb-8">
          <Text className="text-gray-900 font-semibold text-lg mb-4">
            Recent Milestones
          </Text>

          <View className="bg-white rounded-2xl">
            {recentMilestones.map((milestone, index) => (
              <View
                key={milestone.id}
                className={`p-4 flex-row items-center ${
                  index < recentMilestones.length - 1
                    ? 'border-b border-gray-100'
                    : ''
                }`}
              >
                <View className="bg-green-100 rounded-full p-2">
                  <TrendingUp size={16} color="#22c55e" />
                </View>
                <View className="flex-1 ml-3">
                  <Text className="text-gray-900 font-medium">
                    {milestone.description}
                  </Text>
                  <Text className="text-gray-500 text-sm">
                    {milestone.domain} •{' '}
                    {new Date(milestone.achievedAt).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function DomainProgressBar({
  domain,
  score,
  trend,
  change,
  isLast,
}: {
  domain: string;
  score: number;
  trend: 'up' | 'down' | 'stable';
  change: number;
  isLast: boolean;
}) {
  const getScoreColor = (score: number) => {
    if (score >= 75) return '#22c55e';
    if (score >= 50) return '#f59e0b';
    return '#ef4444';
  };

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? '#22c55e' : trend === 'down' ? '#ef4444' : '#9ca3af';

  return (
    <View className={`${!isLast ? 'mb-4 pb-4 border-b border-gray-100' : ''}`}>
      <View className="flex-row justify-between items-center mb-2">
        <Text className="text-gray-700 font-medium">{domain}</Text>
        <View className="flex-row items-center">
          <Text className="text-gray-900 font-bold mr-2">{score}%</Text>
          <TrendIcon size={14} color={trendColor} />
          {change !== 0 && (
            <Text
              className="text-xs ml-1"
              style={{ color: trendColor }}
            >
              {change > 0 ? '+' : ''}{change}
            </Text>
          )}
        </View>
      </View>
      <View className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <View
          className="h-full rounded-full"
          style={{
            width: `${score}%`,
            backgroundColor: getScoreColor(score),
          }}
        />
      </View>
    </View>
  );
}
