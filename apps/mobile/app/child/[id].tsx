import { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Modal, Alert, ActivityIndicator, TextInput } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import {
  User,
  Calendar,
  FileText,
  Video,
  ChevronRight,
  Brain,
  Upload,
  Camera,
  Play,
  X,
  Sparkles,
  Clock,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Pencil,
  Trash2,
} from 'lucide-react-native';
import { useChild } from '@/hooks/useChildren';
import { useAssessments } from '@/hooks/useAssessments';
import { useVideos, useUploadVideo } from '@/hooks/useVideos';
import { calculateAge } from '@/lib/mock-data';
import { useChildStore } from '@/stores/child-store';
import { supabase } from '@/lib/supabase';

const DOMAIN_COLORS: Record<string, string> = {
  communication: '#3b82f6',
  gross_motor: '#22c55e',
  fine_motor: '#f59e0b',
  problem_solving: '#8b5cf6',
  personal_social: '#ec4899',
};

const DOMAIN_LABELS: Record<string, string> = {
  communication: 'Communication',
  gross_motor: 'Gross Motor',
  fine_motor: 'Fine Motor',
  problem_solving: 'Problem Solving',
  personal_social: 'Personal-Social',
};

const RISK_COLORS: Record<string, string> = {
  typical: '#22c55e',
  monitoring: '#eab308',
  'at-risk': '#f97316',
  concern: '#ef4444',
};

const CONTEXT_OPTIONS = [
  { value: 'free_play', label: 'Free Play' },
  { value: 'structured_activity', label: 'Structured Activity' },
  { value: 'caregiver_interaction', label: 'Caregiver Interaction' },
  { value: 'physical_activity', label: 'Physical Activity' },
];

export default function ChildDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { child, isLoading: childLoading } = useChild(id);
  const { data: assessments = [] } = useAssessments(id);
  const { data: videoData = [] } = useVideos(id);
  const uploadVideo = useUploadVideo();

  const [localVideos, setLocalVideos] = useState<typeof videoData>([]);
  const videos = [...localVideos, ...videoData];

  const [showVideoModal, setShowVideoModal] = useState(false);
  const [selectedContext, setSelectedContext] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
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
        Alert.alert(
          data.processing_status === 'completed' ? 'Analysis Complete' : 'Analysis Failed',
          data.processing_status === 'completed'
            ? 'AI analysis is ready. Check the reports section for insights.'
            : 'Video analysis encountered an error. Please try uploading again.'
        );
      }
    }, 3000);
    return () => clearInterval(interval);
  }, [pollingVideoId]);

  const [isEditing, setIsEditing] = useState(false);
  const [editFirstName, setEditFirstName] = useState('');
  const [editLastName, setEditLastName] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const { updateChild, deleteChild } = useChildStore();

  if (childLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ActivityIndicator size="large" color="#3b82f6" />
        </View>
      </SafeAreaView>
    );
  }

  if (!child) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Child not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const dob = child.dateOfBirth instanceof Date ? child.dateOfBirth.toISOString() : String(child.dateOfBirth);
  const age = calculateAge(dob);
  const latestAssessment = assessments[0];

  const pickAndAnalyzeVideo = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your photo library.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 300,
    });

    if (!result.canceled && result.assets[0]) {
      handleVideoForAnalysis(result.assets[0]);
    }
  };

  const recordAndAnalyzeVideo = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('Permission Required', 'Please allow access to your camera.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['videos'],
      allowsEditing: true,
      quality: 1,
      videoMaxDuration: 300,
    });

    if (!result.canceled && result.assets[0]) {
      handleVideoForAnalysis(result.assets[0]);
    }
  };

  const handleVideoForAnalysis = async (asset: ImagePicker.ImagePickerAsset) => {
    if (!selectedContext) {
      Alert.alert('Missing Context', 'Please select a video context first.');
      return;
    }

    setUploading(true);
    try {
      const result = await uploadVideo.mutateAsync({
        fileUri: asset.uri,
        fileName: asset.fileName || `video_${Date.now()}.mp4`,
        childId: id!,
        context: selectedContext,
        recordedAt: new Date(),
      });
      setUploading(false);
      setAnalyzing(true);

      if (result && result.video_id) {
        setPollingVideoId(result.video_id);
      }
      setAnalyzing(false);
      setShowVideoModal(false);
      setSelectedContext(null);
    } catch (error) {
      setUploading(false);
      Alert.alert('Upload Failed', error instanceof Error ? error.message : 'Unknown error');
    }
  };

  const startEditing = () => {
    setEditFirstName(child.firstName);
    setEditLastName(child.lastName || '');
    setEditNotes(child.notes || '');
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const { error } = await updateChild(id!, {
      firstName: editFirstName.trim(),
      lastName: editLastName.trim(),
      notes: editNotes.trim() || undefined,
    });
    if (error) {
      Alert.alert('Error', error.message);
    } else {
      setIsEditing(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Child',
      `Are you sure you want to delete ${child.firstName}'s profile? This will also delete all assessments, videos, and reports. This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteChild(id!);
            if (error) {
              Alert.alert('Error', error.message);
            } else {
              router.back();
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      {/* Profile Header */}
      <View style={styles.header}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{child.firstName.charAt(0)}</Text>
        </View>
        <Text style={styles.name}>{child.firstName} {child.lastName || ''}</Text>
        <View style={styles.ageContainer}>
          <Calendar size={16} color="#6b7280" />
          <Text style={styles.ageText}>{age.display} old</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity style={styles.editButton} onPress={startEditing}>
            <Pencil size={18} color="#3b82f6" />
            <Text style={styles.editButtonText}>Edit</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={18} color="#ef4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => setShowVideoModal(true)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#3b82f615' }]}>
              <Brain size={24} color="#3b82f6" />
            </View>
            <Text style={styles.actionTitle}>AI Video Analysis</Text>
            <Text style={styles.actionSubtitle}>Upload & analyze</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push(`/screening?childId=${id}`)}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#8b5cf615' }]}>
              <FileText size={24} color="#8b5cf6" />
            </View>
            <Text style={styles.actionTitle}>Screener</Text>
            <Text style={styles.actionSubtitle}>Milestone assessment</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/reports')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#22c55e15' }]}>
              <Sparkles size={24} color="#22c55e" />
            </View>
            <Text style={styles.actionTitle}>AI Reports</Text>
            <Text style={styles.actionSubtitle}>View insights</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => router.push('/(tabs)/progress')}
          >
            <View style={[styles.actionIcon, { backgroundColor: '#f59e0b15' }]}>
              <TrendingUp size={24} color="#f59e0b" />
            </View>
            <Text style={styles.actionTitle}>Progress</Text>
            <Text style={styles.actionSubtitle}>Track development</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Latest Assessment Summary */}
      {latestAssessment && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Latest Assessment</Text>
          <View style={styles.assessmentCard}>
            <View style={styles.assessmentHeader}>
              <Text style={styles.assessmentAge}>{latestAssessment.age_at_assessment} Month Questionnaire</Text>
              <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[latestAssessment.overall_risk_level] + '20' }]}>
                <Text style={[styles.riskText, { color: RISK_COLORS[latestAssessment.overall_risk_level] }]}>
                  {latestAssessment.overall_risk_level.charAt(0).toUpperCase() + latestAssessment.overall_risk_level.slice(1)}
                </Text>
              </View>
            </View>

            <View style={styles.domainScores}>
              {latestAssessment.domain_scores.map((score) => (
                <View key={score.domain} style={styles.domainRow}>
                  <View style={styles.domainInfo}>
                    <View style={[styles.domainDot, { backgroundColor: DOMAIN_COLORS[score.domain] }]} />
                    <Text style={styles.domainName}>{DOMAIN_LABELS[score.domain]}</Text>
                  </View>
                  <View style={styles.scoreContainer}>
                    <View style={styles.scoreBar}>
                      <View
                        style={[
                          styles.scoreBarFill,
                          {
                            width: `${score.percentile}%`,
                            backgroundColor: DOMAIN_COLORS[score.domain]
                          }
                        ]}
                      />
                    </View>
                    <Text style={styles.percentileText}>{score.percentile}%</Text>
                  </View>
                </View>
              ))}
            </View>

            <TouchableOpacity
              style={styles.viewDetailsButton}
              onPress={() => router.push(`/assessment/${latestAssessment.id}`)}
            >
              <Text style={styles.viewDetailsText}>View Full Report</Text>
              <ChevronRight size={16} color="#3b82f6" />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Videos for Analysis */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Videos ({videos.length})</Text>
          <TouchableOpacity onPress={() => setShowVideoModal(true)}>
            <Text style={styles.addButton}>+ Add Video</Text>
          </TouchableOpacity>
        </View>

        {videos.length > 0 ? (
          <View style={styles.videosList}>
            {videos.map((video) => (
              <View key={video.id} style={styles.videoCard}>
                <View style={styles.videoThumbnail}>
                  <Play size={24} color="#6b7280" />
                </View>
                <View style={styles.videoInfo}>
                  <Text style={styles.videoContext}>
                    {video.context.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Text>
                  <Text style={styles.videoMeta}>
                    {video.duration}s • {new Date(video.recorded_at || video.created_at).toLocaleDateString()}
                  </Text>
                </View>
                <View style={[
                  styles.videoStatus,
                  { backgroundColor: video.processing_status === 'completed' ? '#dcfce7' : '#fef3c7' }
                ]}>
                  {video.processing_status === 'completed' ? (
                    <CheckCircle size={14} color="#16a34a" />
                  ) : (
                    <Clock size={14} color="#d97706" />
                  )}
                  <Text style={[
                    styles.videoStatusText,
                    { color: video.processing_status === 'completed' ? '#16a34a' : '#d97706' }
                  ]}>
                    {video.processing_status === 'completed' ? 'Analyzed' : 'Processing'}
                  </Text>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyVideos}>
            <Video size={32} color="#d1d5db" />
            <Text style={styles.emptyText}>No videos yet</Text>
            <TouchableOpacity
              style={styles.uploadPrompt}
              onPress={() => setShowVideoModal(true)}
            >
              <Upload size={16} color="#3b82f6" />
              <Text style={styles.uploadPromptText}>Upload video for AI analysis</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Assessment History */}
      <View style={[styles.section, { marginBottom: 32 }]}>
        <Text style={styles.sectionTitle}>Assessment History</Text>
        {assessments.length > 0 ? (
          assessments.map((assessment) => (
            <TouchableOpacity
              key={assessment.id}
              style={styles.historyCard}
              onPress={() => router.push(`/assessment/${assessment.id}`)}
            >
              <View style={styles.historyInfo}>
                <Text style={styles.historyTitle}>{assessment.age_at_assessment} Month Assessment</Text>
                <Text style={styles.historyDate}>
                  {new Date(assessment.completed_at).toLocaleDateString()}
                </Text>
              </View>
              <View style={[styles.riskBadge, { backgroundColor: RISK_COLORS[assessment.overall_risk_level] + '20' }]}>
                <Text style={[styles.riskText, { color: RISK_COLORS[assessment.overall_risk_level] }]}>
                  {assessment.overall_risk_level}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        ) : (
          <Text style={styles.emptyHistoryText}>No assessments yet</Text>
        )}
      </View>

      {/* Video Analysis Modal */}
      <Modal
        visible={showVideoModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowVideoModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>AI Video Analysis</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowVideoModal(false)}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* AI Info Banner */}
            <View style={styles.aiBanner}>
              <Sparkles size={20} color="#3b82f6" />
              <View style={styles.aiBannerContent}>
                <Text style={styles.aiBannerTitle}>AI-Powered Analysis</Text>
                <Text style={styles.aiBannerText}>
                  Our AI will analyze the video for developmental patterns and behaviors.
                </Text>
              </View>
            </View>

            {/* Select Context */}
            <Text style={styles.fieldLabel}>Video Context</Text>
            <Text style={styles.fieldHint}>What activity is shown in the video?</Text>
            <View style={styles.contextOptions}>
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
                  {selectedContext === option.value && (
                    <CheckCircle size={18} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* Action Buttons */}
            <View style={styles.uploadActions}>
              <TouchableOpacity
                style={[styles.uploadAction, !selectedContext && styles.uploadActionDisabled]}
                onPress={pickAndAnalyzeVideo}
                disabled={!selectedContext || uploading || analyzing}
              >
                <Upload size={24} color={selectedContext ? '#3b82f6' : '#9ca3af'} />
                <Text style={[styles.uploadActionText, !selectedContext && styles.uploadActionTextDisabled]}>
                  Choose from Library
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.uploadAction, !selectedContext && styles.uploadActionDisabled]}
                onPress={recordAndAnalyzeVideo}
                disabled={!selectedContext || uploading || analyzing}
              >
                <Camera size={24} color={selectedContext ? '#3b82f6' : '#9ca3af'} />
                <Text style={[styles.uploadActionText, !selectedContext && styles.uploadActionTextDisabled]}>
                  Record New Video
                </Text>
              </TouchableOpacity>
            </View>

            {/* Progress Indicator */}
            {(uploading || analyzing) && (
              <View style={styles.progressContainer}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.progressText}>
                  {uploading ? 'Uploading video...' : 'AI is analyzing the video...'}
                </Text>
                <Text style={styles.progressHint}>
                  This may take a few moments
                </Text>
              </View>
            )}

            {/* Disclaimer */}
            <View style={styles.disclaimer}>
              <AlertCircle size={16} color="#6b7280" />
              <Text style={styles.disclaimerText}>
                AI analysis is for informational purposes only and should not replace professional evaluation.
              </Text>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Edit Child Modal */}
      <Modal
        visible={isEditing}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setIsEditing(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Edit Child</Text>
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsEditing(false)}>
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <Text style={styles.fieldLabel}>First Name</Text>
            <TextInput
              style={styles.editInput}
              value={editFirstName}
              onChangeText={setEditFirstName}
              placeholder="First name"
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>Last Name</Text>
            <TextInput
              style={styles.editInput}
              value={editLastName}
              onChangeText={setEditLastName}
              placeholder="Last name"
              autoCapitalize="words"
            />
            <Text style={styles.fieldLabel}>Notes</Text>
            <TextInput
              style={[styles.editInput, { minHeight: 80, textAlignVertical: 'top' }]}
              value={editNotes}
              onChangeText={setEditNotes}
              placeholder="Notes about your child"
              multiline
              numberOfLines={3}
            />
            <TouchableOpacity style={styles.saveEditButton} onPress={handleSaveEdit}>
              <Text style={styles.saveEditButtonText}>Save Changes</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    backgroundColor: '#ffffff',
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#dbeafe',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '600',
    color: '#3b82f6',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 8,
  },
  ageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  ageText: {
    fontSize: 16,
    color: '#6b7280',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#eff6ff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  deleteButton: {
    backgroundColor: '#fef2f2',
    padding: 8,
    borderRadius: 20,
  },
  section: {
    padding: 16,
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
    marginBottom: 12,
  },
  addButton: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    width: '48%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  actionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  actionSubtitle: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  assessmentCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  assessmentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  assessmentAge: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  riskBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  riskText: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  domainScores: {
    gap: 12,
  },
  domainRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  domainInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  domainDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  domainName: {
    fontSize: 14,
    color: '#4b5563',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  scoreBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
  },
  scoreBarFill: {
    height: 6,
    borderRadius: 3,
  },
  percentileText: {
    fontSize: 12,
    color: '#6b7280',
    width: 32,
    textAlign: 'right',
  },
  viewDetailsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  viewDetailsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
  videosList: {
    gap: 8,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 12,
  },
  videoThumbnail: {
    width: 64,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  videoInfo: {
    flex: 1,
  },
  videoContext: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1f2937',
  },
  videoMeta: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  videoStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  videoStatusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  emptyVideos: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  uploadPrompt: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 12,
  },
  uploadPromptText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#3b82f6',
  },
  historyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1f2937',
  },
  historyDate: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  emptyHistoryText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
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
  aiBanner: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  aiBannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  aiBannerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1e40af',
  },
  aiBannerText: {
    fontSize: 14,
    color: '#3b82f6',
    marginTop: 4,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  fieldHint: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 12,
  },
  contextOptions: {
    gap: 8,
  },
  contextOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f9fafb',
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
  uploadActions: {
    marginTop: 24,
    gap: 12,
  },
  uploadAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 20,
    gap: 12,
  },
  uploadActionDisabled: {
    opacity: 0.5,
  },
  uploadActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
  },
  uploadActionTextDisabled: {
    color: '#9ca3af',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 32,
    padding: 24,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3b82f6',
    marginTop: 16,
  },
  progressHint: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  disclaimer: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 13,
    color: '#6b7280',
    lineHeight: 18,
  },
  editInput: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    color: '#1f2937',
    marginBottom: 16,
  },
  saveEditButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  saveEditButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
});
