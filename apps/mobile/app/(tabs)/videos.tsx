import { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Image, StyleSheet, Alert, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  Video,
  Upload,
  Camera,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader,
  Play,
  X,
  User,
} from 'lucide-react-native';
import { useChildren } from '@/hooks/useChildren';
import { useVideos, useUploadVideo } from '@/hooks/useVideos';
import { supabase } from '@/lib/supabase';

type VideoStatus = 'pending' | 'processing' | 'completed' | 'failed';

interface VideoItem {
  id: string;
  childId: string;
  childName: string;
  context: string;
  duration: number;
  recordedAt: string;
  status: VideoStatus;
  thumbnailUrl: string | null;
  uri?: string;
}

const CONTEXT_OPTIONS = [
  { value: 'free_play', label: 'Free Play' },
  { value: 'structured_activity', label: 'Structured Activity' },
  { value: 'caregiver_interaction', label: 'Caregiver Interaction' },
  { value: 'feeding', label: 'Feeding' },
  { value: 'book_reading', label: 'Book Reading' },
  { value: 'physical_activity', label: 'Physical Activity' },
  { value: 'peer_interaction', label: 'Peer Interaction' },
  { value: 'self_care_routine', label: 'Self-Care Routine' },
];

export default function VideosScreen() {
  const { children } = useChildren();
  const { data: videoData = [], isLoading: videosLoading, error: videosError, refetch: refetchVideos } = useVideos();
  const uploadVideo = useUploadVideo();

  const videos: VideoItem[] = videoData.map(v => ({
    id: v.id,
    childId: v.childId,
    childName: children.find(c => c.id === v.childId)?.firstName || 'Unknown',
    context: v.context,
    duration: v.duration,
    recordedAt: v.recordedAt.toISOString(),
    status: v.processingStatus as VideoStatus,
    thumbnailUrl: null,
  }));

  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [pollingVideoId, setPollingVideoId] = useState<string | null>(null);

  useEffect(() => {
    if (!pollingVideoId) return;
    const interval = setInterval(async () => {
      const { data, error } = await supabase
        .from('video_uploads')
        .select('processing_status')
        .eq('id', pollingVideoId)
        .single();
      if (error || !data) return;
      if (data.processing_status === 'completed' || data.processing_status === 'failed') {
        setPollingVideoId(null);
        clearInterval(interval);
        // Refetch videos list
        // The useVideos hook will auto-refetch via React Query
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingVideoId]);

  const pickVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library to upload videos.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 300, // 5 minutes max
    });

    if (!result.canceled && result.assets[0]) {
      handleVideoSelected(result.assets[0]);
    }
  };

  const recordVideo = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera to record videos.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 300, // 5 minutes max
    });

    if (!result.canceled && result.assets[0]) {
      handleVideoSelected(result.assets[0]);
    }
  };

  const handleVideoSelected = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!selectedChild || !selectedContext) {
      Alert.alert('Missing Information', 'Please select a child and context before uploading.');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadVideo.mutateAsync({
        fileUri: asset.uri,
        fileName: asset.fileName || `video_${Date.now()}.mp4`,
        childId: selectedChild,
        context: selectedContext,
        recordedAt: new Date(),
      });
      setUploading(false);
      setShowUploadModal(false);
      setSelectedChild(null);
      setSelectedContext(null);
      // Start polling for processing status
      if (result && (result as any).video_id) {
        setPollingVideoId((result as any).video_id);
      }
      Alert.alert('Upload Complete', 'Your video is being analyzed. Status will update automatically.');
    } catch (error) {
      setUploading(false);
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const contextLabels: Record<string, string> = Object.fromEntries(
    CONTEXT_OPTIONS.map(o => [o.value, o.label])
  );

  const completedCount = videos.filter(v => v.status === 'completed').length;
  const processingCount = videos.filter(v => v.status === 'processing' || v.status === 'pending').length;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Total</Text>
            <Text style={styles.statValue}>{videos.length}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Analyzed</Text>
            <Text style={[styles.statValue, styles.statValueGreen]}>{completedCount}</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statLabel}>Pending</Text>
            <Text style={[styles.statValue, styles.statValueAmber]}>{processingCount}</Text>
          </View>
        </View>

        {/* Video List */}
        <View style={styles.listContainer}>
          <Text style={styles.sectionTitle}>Recent Videos</Text>

          {videosLoading ? (
            <View style={styles.emptyState}>
              <ActivityIndicator size="large" color="#3b82f6" />
              <Text style={[styles.emptyTitle, { marginTop: 16 }]}>Loading videos...</Text>
            </View>
          ) : videosError ? (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <AlertCircle size={32} color="#ef4444" />
              </View>
              <Text style={styles.emptyTitle}>Failed to load videos</Text>
              <Text style={styles.emptyText}>
                Please check your connection and try again.
              </Text>
              <TouchableOpacity
                style={[styles.uploadButton, { marginTop: 16, paddingHorizontal: 24, paddingVertical: 12 }]}
                onPress={() => refetchVideos()}
              >
                <Text style={styles.uploadButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : videos.length > 0 ? (
            <View style={styles.videoList}>
              {videos.map((video) => (
                <VideoCard
                  key={video.id}
                  video={video}
                  contextLabel={contextLabels[video.context] || video.context}
                />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <View style={styles.emptyIcon}>
                <Video size={32} color="#9ca3af" />
              </View>
              <Text style={styles.emptyTitle}>No videos yet</Text>
              <Text style={styles.emptyText}>
                Record or upload videos of your child to get AI-powered developmental insights
              </Text>
            </View>
          )}
        </View>

        {/* Upload Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={() => setShowUploadModal(true)}
          >
            <Upload size={24} color="#ffffff" />
            <Text style={styles.uploadButtonText}>Upload Video</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal
        visible={showUploadModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Upload Video</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowUploadModal(false)}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Select Child */}
            <Text style={styles.fieldLabel}>Select Child</Text>
            <View style={styles.optionsGrid}>
              {children.map((child) => (
                <TouchableOpacity
                  key={child.id}
                  style={[
                    styles.optionCard,
                    selectedChild === child.id && styles.optionCardSelected,
                  ]}
                  onPress={() => setSelectedChild(child.id)}
                >
                  <View style={styles.childAvatar}>
                    <User size={20} color={selectedChild === child.id ? '#3b82f6' : '#9ca3af'} />
                  </View>
                  <Text style={[
                    styles.optionText,
                    selectedChild === child.id && styles.optionTextSelected,
                  ]}>
                    {child.firstName}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Select Context */}
            <Text style={styles.fieldLabel}>Video Context</Text>
            <View style={styles.contextList}>
              {CONTEXT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.contextOption,
                    selectedContext === option.value && styles.contextOptionSelected,
                  ]}
                  onPress={() => setSelectedContext(option.value)}
                >
                  <Text style={[
                    styles.contextOptionText,
                    selectedContext === option.value && styles.contextOptionTextSelected,
                  ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[
                  styles.actionButton,
                  (!selectedChild || !selectedContext) && styles.actionButtonDisabled,
                ]}
                onPress={pickVideo}
                disabled={!selectedChild || !selectedContext || uploading}
              >
                <Upload size={24} color={(!selectedChild || !selectedContext) ? '#9ca3af' : '#3b82f6'} />
                <Text style={[
                  styles.actionButtonText,
                  (!selectedChild || !selectedContext) && styles.actionButtonTextDisabled,
                ]}>
                  Choose from Library
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.actionButton,
                  (!selectedChild || !selectedContext) && styles.actionButtonDisabled,
                ]}
                onPress={recordVideo}
                disabled={!selectedChild || !selectedContext || uploading}
              >
                <Camera size={24} color={(!selectedChild || !selectedContext) ? '#9ca3af' : '#3b82f6'} />
                <Text style={[
                  styles.actionButtonText,
                  (!selectedChild || !selectedContext) && styles.actionButtonTextDisabled,
                ]}>
                  Record New Video
                </Text>
              </TouchableOpacity>
            </View>

            {uploading && (
              <View style={styles.uploadingIndicator}>
                <Loader size={24} color="#3b82f6" />
                <Text style={styles.uploadingText}>Uploading video...</Text>
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function VideoCard({
  video,
  contextLabel,
}: {
  video: VideoItem;
  contextLabel: string;
}) {
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const statusConfig = {
    pending: { icon: Clock, color: '#9ca3af', label: 'Pending' },
    processing: { icon: Loader, color: '#f59e0b', label: 'Processing' },
    completed: { icon: CheckCircle, color: '#22c55e', label: 'Analyzed' },
    failed: { icon: AlertCircle, color: '#ef4444', label: 'Failed' },
  };

  const { icon: StatusIcon, color, label } = statusConfig[video.status];

  return (
    <TouchableOpacity style={styles.videoCard}>
      <View style={styles.videoCardContent}>
        {/* Thumbnail */}
        <View style={styles.thumbnail}>
          <Play size={32} color="#9ca3af" />
          <View style={styles.durationBadge}>
            <Text style={styles.durationText}>{formatDuration(video.duration)}</Text>
          </View>
        </View>

        {/* Info */}
        <View style={styles.videoInfo}>
          <View>
            <Text style={styles.videoTitle}>{contextLabel}</Text>
            <Text style={styles.videoMeta}>
              {video.childName} • {new Date(video.recordedAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
              })}
            </Text>
          </View>
          <View style={styles.statusContainer}>
            {video.status === 'processing' ? (
              <ActivityIndicator size="small" color={color} />
            ) : (
              <StatusIcon size={14} color={color} />
            )}
            <Text style={[styles.statusText, { color }]}>{label}</Text>
          </View>
        </View>
      </View>
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
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
  },
  statLabel: {
    fontSize: 12,
    color: '#9ca3af',
    textTransform: 'uppercase',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    marginTop: 4,
  },
  statValueGreen: {
    color: '#22c55e',
  },
  statValueAmber: {
    color: '#f59e0b',
  },
  listContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  videoList: {
    gap: 12,
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyIcon: {
    backgroundColor: '#f3f4f6',
    borderRadius: 32,
    padding: 16,
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
  buttonContainer: {
    paddingHorizontal: 16,
    marginTop: 24,
    marginBottom: 32,
  },
  uploadButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
  },
  videoCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  videoCardContent: {
    flexDirection: 'row',
  },
  thumbnail: {
    width: 128,
    height: 96,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  durationText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
  videoInfo: {
    flex: 1,
    padding: 12,
    justifyContent: 'space-between',
  },
  videoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  videoMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  closeButton: {
    padding: 8,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
    marginTop: 16,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  optionCard: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minWidth: 100,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionCardSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  childAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e5e7eb',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  optionText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  optionTextSelected: {
    color: '#3b82f6',
  },
  contextList: {
    gap: 8,
  },
  contextOption: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  contextOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  contextOptionText: {
    fontSize: 16,
    color: '#4b5563',
  },
  contextOptionTextSelected: {
    color: '#3b82f6',
    fontWeight: '600',
  },
  actionButtons: {
    marginTop: 32,
    gap: 12,
  },
  actionButton: {
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  actionButtonTextDisabled: {
    color: '#9ca3af',
  },
  uploadingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 24,
    gap: 8,
  },
  uploadingText: {
    fontSize: 16,
    color: '#3b82f6',
  },
});
