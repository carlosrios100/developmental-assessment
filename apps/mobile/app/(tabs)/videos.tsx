import { View, Text, ScrollView, Pressable, Image } from 'react-native';
import { Link } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Video,
  Plus,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Play,
} from 'lucide-react-native';

export default function VideosScreen() {
  // Mock data - replace with Supabase query
  const videos = [
    {
      id: '1',
      childName: 'Emma',
      context: 'free_play',
      duration: 185,
      recordedAt: '2026-01-25',
      status: 'completed' as const,
      thumbnailUrl: null,
    },
    {
      id: '2',
      childName: 'Emma',
      context: 'caregiver_interaction',
      duration: 240,
      recordedAt: '2026-01-20',
      status: 'processing' as const,
      thumbnailUrl: null,
    },
    {
      id: '3',
      childName: 'Liam',
      context: 'physical_activity',
      duration: 120,
      recordedAt: '2026-01-18',
      status: 'completed' as const,
      thumbnailUrl: null,
    },
  ];

  const contextLabels: Record<string, string> = {
    free_play: 'Free Play',
    structured_activity: 'Structured Activity',
    caregiver_interaction: 'Caregiver Interaction',
    feeding: 'Feeding',
    book_reading: 'Book Reading',
    physical_activity: 'Physical Activity',
    peer_interaction: 'Peer Interaction',
    self_care_routine: 'Self-Care Routine',
  };

  return (
    <SafeAreaView className="flex-1 bg-gray-50" edges={['bottom']}>
      <ScrollView className="flex-1">
        {/* Stats */}
        <View className="px-6 pt-4">
          <View className="flex-row space-x-3">
            <View className="flex-1 bg-white rounded-xl p-4">
              <Text className="text-gray-400 text-xs uppercase">Total</Text>
              <Text className="text-gray-900 font-bold text-2xl mt-1">
                {videos.length}
              </Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4">
              <Text className="text-gray-400 text-xs uppercase">Analyzed</Text>
              <Text className="text-green-600 font-bold text-2xl mt-1">
                {videos.filter((v) => v.status === 'completed').length}
              </Text>
            </View>
            <View className="flex-1 bg-white rounded-xl p-4">
              <Text className="text-gray-400 text-xs uppercase">Pending</Text>
              <Text className="text-amber-600 font-bold text-2xl mt-1">
                {videos.filter((v) => v.status === 'processing').length}
              </Text>
            </View>
          </View>
        </View>

        {/* Video List */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 font-semibold text-lg mb-4">
            Recent Videos
          </Text>

          {videos.length > 0 ? (
            <View className="space-y-3">
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  contextLabel={contextLabels[video.context]}
                />
              ))}
            </View>
          ) : (
            <View className="bg-white rounded-2xl p-8 items-center">
              <View className="bg-gray-100 rounded-full p-4 mb-4">
                <Video size={32} color="#9ca3af" />
              </View>
              <Text className="text-gray-900 font-semibold text-lg">
                No videos yet
              </Text>
              <Text className="text-gray-500 text-center mt-2">
                Record videos of your child to get AI-powered developmental
                insights
              </Text>
            </View>
          )}
        </View>

        {/* Record Button */}
        <View className="px-6 mt-6 mb-8">
          <Link href="/videos/record" asChild>
            <Pressable className="bg-primary-500 rounded-2xl p-4 flex-row items-center justify-center">
              <Plus size={24} color="#ffffff" />
              <Text className="text-white font-semibold text-lg ml-2">
                Record New Video
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function VideoCard({
  video,
  contextLabel,
}: {
  video: {
    id: string;
    childName: string;
    duration: number;
    recordedAt: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    thumbnailUrl: string | null;
  };
  contextLabel: string;
}) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statusIcons = {
    pending: { icon: Clock, color: '#9ca3af', label: 'Pending' },
    processing: { icon: Loader, color: '#f59e0b', label: 'Processing' },
    completed: { icon: CheckCircle, color: '#22c55e', label: 'Analyzed' },
    failed: { icon: AlertCircle, color: '#ef4444', label: 'Failed' },
  };

  const { icon: StatusIcon, color, label } = statusIcons[video.status];

  return (
    <Pressable className="bg-white rounded-2xl overflow-hidden shadow-sm">
      <View className="flex-row">
        {/* Thumbnail */}
        <View className="w-32 h-24 bg-gray-200 items-center justify-center">
          {video.thumbnailUrl ? (
            <Image
              source={{ uri: video.thumbnailUrl }}
              className="w-full h-full"
            />
          ) : (
            <View className="bg-gray-300 w-full h-full items-center justify-center">
              <Play size={32} color="#9ca3af" />
            </View>
          )}
          <View className="absolute bottom-1 right-1 bg-black/70 rounded px-1.5 py-0.5">
            <Text className="text-white text-xs font-medium">
              {formatDuration(video.duration)}
            </Text>
          </View>
        </View>

        {/* Info */}
        <View className="flex-1 p-3 justify-between">
          <View>
            <Text className="text-gray-900 font-semibold">{contextLabel}</Text>
            <Text className="text-gray-500 text-sm mt-0.5">
              {video.childName} •{' '}
              {new Date(video.recordedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View className="flex-row items-center">
            <StatusIcon size={14} color={color} />
            <Text
              className="text-xs font-medium ml-1"
              style={{ color }}
            >
              {label}
            </Text>
          </View>
        </View>
      </View>
    </Pressable>
  );
}
