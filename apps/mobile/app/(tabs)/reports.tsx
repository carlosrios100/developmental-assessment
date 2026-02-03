import { useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Modal, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  FileText,
  Download,
  Share2,
  Calendar,
  User,
  Brain,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  ChevronRight,
  X,
  Sparkles,
  Clock,
} from 'lucide-react-native';
import { useChildren } from '@/hooks/useChildren';
import { useRecentAssessments } from '@/hooks/useAssessments';
import { useGenerateReport } from '@/hooks/useReports';
import { calculateAge } from '@/lib/mock-data';

interface Report {
  id: string;
  childId: string;
  childName: string;
  type: 'comprehensive' | 'progress' | 'milestone' | 'video-analysis';
  title: string;
  generatedAt: string;
  status: 'ready' | 'generating' | 'failed';
  summary?: string;
}

const REPORT_TYPES = [
  {
    id: 'comprehensive',
    title: 'Comprehensive Report',
    description: 'Full developmental assessment with AI insights',
    icon: FileText,
    color: '#3b82f6',
  },
  {
    id: 'progress',
    title: 'Progress Report',
    description: 'Track changes over time',
    icon: TrendingUp,
    color: '#22c55e',
  },
  {
    id: 'milestone',
    title: 'Milestone Report',
    description: 'Age-specific milestone analysis',
    icon: CheckCircle,
    color: '#8b5cf6',
  },
  {
    id: 'video-analysis',
    title: 'Video Analysis Report',
    description: 'AI analysis of recorded videos',
    icon: Brain,
    color: '#f59e0b',
  },
];

export default function ReportsScreen() {
  const { children } = useChildren();
  const { data: assessments = [] } = useRecentAssessments();
  const generateReportMutation = useGenerateReport();

  const [reports, setReports] = useState<Report[]>([]);

  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [selectedChild, setSelectedChild] = useState<string | null>(null);
  const [selectedReportType, setSelectedReportType] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);

  const generateReport = async () => {
    if (!selectedChild || !selectedReportType) return;

    const child = children.find(c => c.id === selectedChild);
    const latestAssessment = assessments.find(a => a.child_id === selectedChild);
    if (!latestAssessment) {
      Alert.alert('No Assessment', 'Please complete an assessment first before generating a report.');
      return;
    }

    setGenerating(true);
    try {
      const report = await generateReportMutation.mutateAsync({
        assessmentId: latestAssessment.id,
        childId: selectedChild,
        reportType: selectedReportType === 'comprehensive' ? 'parent_summary' :
                    selectedReportType === 'progress' ? 'progress_comparison' :
                    selectedReportType === 'video-analysis' ? 'video_analysis' : 'professional_detailed',
      });

      const newReport: Report = {
        id: report.id,
        childId: selectedChild,
        childName: child?.firstName || 'Unknown',
        type: selectedReportType as Report['type'],
        title: REPORT_TYPES.find(t => t.id === selectedReportType)?.title || 'Report',
        generatedAt: report.generated_at || new Date().toISOString(),
        status: 'ready',
        summary: report.sections?.[0]?.content?.substring(0, 200) || 'Report generated successfully.',
      };

      setReports(prev => [newReport, ...prev]);
      setGenerating(false);
      setShowGenerateModal(false);
      setSelectedChild(null);
      setSelectedReportType(null);
    } catch (error) {
      setGenerating(false);
      Alert.alert('Error', error instanceof Error ? error.message : 'Failed to generate report');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* AI Disclaimer Banner */}
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerIcon}>
            <Sparkles size={20} color="#3b82f6" />
          </View>
          <View style={styles.aiBannerContent}>
            <Text style={styles.aiBannerTitle}>AI-Powered Reports</Text>
            <Text style={styles.aiBannerText}>
              Reports are generated using artificial intelligence to analyze assessment data.
            </Text>
          </View>
        </View>

        {/* Generate New Report */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.generateButton}
            onPress={() => setShowGenerateModal(true)}
          >
            <View style={styles.generateButtonIcon}>
              <Brain size={24} color="#ffffff" />
            </View>
            <View style={styles.generateButtonContent}>
              <Text style={styles.generateButtonTitle}>Generate New Report</Text>
              <Text style={styles.generateButtonSubtitle}>
                Create AI-powered developmental insights
              </Text>
            </View>
            <ChevronRight size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Report Types Overview */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Available Report Types</Text>
          <View style={styles.reportTypesGrid}>
            {REPORT_TYPES.map((type) => (
              <TouchableOpacity
                key={type.id}
                style={styles.reportTypeCard}
                onPress={() => {
                  setSelectedReportType(type.id);
                  setShowGenerateModal(true);
                }}
              >
                <View style={[styles.reportTypeIcon, { backgroundColor: type.color + '15' }]}>
                  <type.icon size={24} color={type.color} />
                </View>
                <Text style={styles.reportTypeTitle}>{type.title}</Text>
                <Text style={styles.reportTypeDesc}>{type.description}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recent Reports */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Reports</Text>
          {reports.length > 0 ? (
            <View style={styles.reportsList}>
              {reports.map((report) => (
                <TouchableOpacity
                  key={report.id}
                  style={styles.reportCard}
                  onPress={() => setSelectedReport(report)}
                >
                  <View style={styles.reportCardHeader}>
                    <View style={styles.reportCardIcon}>
                      <FileText size={20} color="#3b82f6" />
                    </View>
                    <View style={styles.reportCardInfo}>
                      <Text style={styles.reportCardTitle}>{report.title}</Text>
                      <Text style={styles.reportCardMeta}>
                        {report.childName} • {new Date(report.generatedAt).toLocaleDateString()}
                      </Text>
                    </View>
                    <View style={[
                      styles.statusBadge,
                      { backgroundColor: report.status === 'ready' ? '#dcfce7' : '#fef3c7' }
                    ]}>
                      <Text style={[
                        styles.statusText,
                        { color: report.status === 'ready' ? '#16a34a' : '#d97706' }
                      ]}>
                        {report.status === 'ready' ? 'Ready' : 'Generating'}
                      </Text>
                    </View>
                  </View>
                  {report.summary && (
                    <Text style={styles.reportSummary} numberOfLines={2}>
                      {report.summary}
                    </Text>
                  )}
                  <View style={styles.reportCardActions}>
                    <TouchableOpacity style={styles.reportAction}>
                      <Download size={16} color="#6b7280" />
                      <Text style={styles.reportActionText}>Download</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.reportAction}>
                      <Share2 size={16} color="#6b7280" />
                      <Text style={styles.reportActionText}>Share</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <FileText size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No reports yet</Text>
              <Text style={styles.emptyText}>
                Generate your first AI-powered developmental report
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Generate Report Modal */}
      <Modal
        visible={showGenerateModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowGenerateModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Generate Report</Text>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowGenerateModal(false)}
            >
              <X size={24} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* Select Child */}
            <Text style={styles.fieldLabel}>Select Child</Text>
            <View style={styles.childOptions}>
              {children.map((child) => {
                const dob = child.dateOfBirth instanceof Date ? child.dateOfBirth.toISOString() : String(child.dateOfBirth);
                return (
                  <TouchableOpacity
                    key={child.id}
                    style={[
                      styles.childOption,
                      selectedChild === child.id && styles.childOptionSelected,
                    ]}
                    onPress={() => setSelectedChild(child.id)}
                  >
                    <View style={styles.childAvatar}>
                      <Text style={styles.childAvatarText}>
                        {child.firstName.charAt(0)}
                      </Text>
                    </View>
                    <View style={styles.childInfo}>
                      <Text style={[
                        styles.childName,
                        selectedChild === child.id && styles.childNameSelected,
                      ]}>
                        {child.firstName} {child.lastName || ''}
                      </Text>
                      <Text style={styles.childAge}>
                        {calculateAge(dob).display}
                      </Text>
                    </View>
                    {selectedChild === child.id && (
                      <CheckCircle size={20} color="#3b82f6" />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Select Report Type */}
            <Text style={styles.fieldLabel}>Report Type</Text>
            <View style={styles.reportTypeOptions}>
              {REPORT_TYPES.map((type) => (
                <TouchableOpacity
                  key={type.id}
                  style={[
                    styles.reportTypeOption,
                    selectedReportType === type.id && styles.reportTypeOptionSelected,
                  ]}
                  onPress={() => setSelectedReportType(type.id)}
                >
                  <View style={[styles.reportTypeOptionIcon, { backgroundColor: type.color + '15' }]}>
                    <type.icon size={20} color={type.color} />
                  </View>
                  <View style={styles.reportTypeOptionInfo}>
                    <Text style={[
                      styles.reportTypeOptionTitle,
                      selectedReportType === type.id && styles.reportTypeOptionTitleSelected,
                    ]}>
                      {type.title}
                    </Text>
                    <Text style={styles.reportTypeOptionDesc}>{type.description}</Text>
                  </View>
                  {selectedReportType === type.id && (
                    <CheckCircle size={20} color="#3b82f6" />
                  )}
                </TouchableOpacity>
              ))}
            </View>

            {/* AI Notice */}
            <View style={styles.aiNotice}>
              <AlertTriangle size={20} color="#f59e0b" />
              <Text style={styles.aiNoticeText}>
                This report will be generated using AI. Results should be reviewed by a qualified professional.
              </Text>
            </View>

            {/* Generate Button */}
            <TouchableOpacity
              style={[
                styles.generateReportButton,
                (!selectedChild || !selectedReportType) && styles.generateReportButtonDisabled,
              ]}
              onPress={generateReport}
              disabled={!selectedChild || !selectedReportType || generating}
            >
              {generating ? (
                <>
                  <ActivityIndicator color="#ffffff" />
                  <Text style={styles.generateReportButtonText}>Generating with AI...</Text>
                </>
              ) : (
                <>
                  <Sparkles size={20} color="#ffffff" />
                  <Text style={styles.generateReportButtonText}>Generate Report</Text>
                </>
              )}
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* View Report Modal */}
      <Modal
        visible={selectedReport !== null}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedReport(null)}
      >
        {selectedReport && (
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedReport.title}</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setSelectedReport(null)}
              >
                <X size={24} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalContent}>
              <View style={styles.reportDetail}>
                <View style={styles.reportDetailHeader}>
                  <User size={16} color="#6b7280" />
                  <Text style={styles.reportDetailLabel}>Child:</Text>
                  <Text style={styles.reportDetailValue}>{selectedReport.childName}</Text>
                </View>
                <View style={styles.reportDetailHeader}>
                  <Calendar size={16} color="#6b7280" />
                  <Text style={styles.reportDetailLabel}>Generated:</Text>
                  <Text style={styles.reportDetailValue}>
                    {new Date(selectedReport.generatedAt).toLocaleDateString()}
                  </Text>
                </View>
              </View>

              <View style={styles.reportSummarySection}>
                <Text style={styles.reportSummarySectionTitle}>AI Summary</Text>
                <View style={styles.aiSummaryBox}>
                  <Sparkles size={16} color="#3b82f6" />
                  <Text style={styles.aiSummaryText}>{selectedReport.summary}</Text>
                </View>
              </View>

              <View style={styles.reportActions}>
                <TouchableOpacity style={styles.reportActionButton}>
                  <Download size={20} color="#3b82f6" />
                  <Text style={styles.reportActionButtonText}>Download PDF</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.reportActionButton}>
                  <Share2 size={20} color="#3b82f6" />
                  <Text style={styles.reportActionButtonText}>Share Report</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </SafeAreaView>
        )}
      </Modal>
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
  aiBanner: {
    flexDirection: 'row',
    backgroundColor: '#eff6ff',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bfdbfe',
  },
  aiBannerIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  aiBannerContent: {
    flex: 1,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e40af',
  },
  aiBannerText: {
    fontSize: 12,
    color: '#3b82f6',
    marginTop: 2,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  generateButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
  },
  generateButtonIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  generateButtonContent: {
    flex: 1,
  },
  generateButtonTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  generateButtonSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 2,
  },
  reportTypesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  reportTypeCard: {
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
  reportTypeIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  reportTypeTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  reportTypeDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
  },
  reportsList: {
    gap: 12,
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  reportCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  reportCardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportCardInfo: {
    flex: 1,
  },
  reportCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  reportCardMeta: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  reportSummary: {
    fontSize: 14,
    color: '#4b5563',
    marginTop: 12,
    lineHeight: 20,
  },
  reportCardActions: {
    flexDirection: 'row',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    gap: 16,
  },
  reportAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reportActionText: {
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
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
  childOptions: {
    gap: 8,
  },
  childOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  childOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  childAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#dbeafe',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  childAvatarText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#3b82f6',
  },
  childInfo: {
    flex: 1,
  },
  childName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  childNameSelected: {
    color: '#3b82f6',
  },
  childAge: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  reportTypeOptions: {
    gap: 8,
  },
  reportTypeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  reportTypeOptionSelected: {
    backgroundColor: '#eff6ff',
    borderColor: '#3b82f6',
  },
  reportTypeOptionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reportTypeOptionInfo: {
    flex: 1,
  },
  reportTypeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  reportTypeOptionTitleSelected: {
    color: '#3b82f6',
  },
  reportTypeOptionDesc: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  aiNotice: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginTop: 24,
    gap: 12,
  },
  aiNoticeText: {
    flex: 1,
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
  generateReportButton: {
    backgroundColor: '#3b82f6',
    borderRadius: 12,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 24,
    marginBottom: 32,
  },
  generateReportButtonDisabled: {
    backgroundColor: '#d1d5db',
  },
  generateReportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
  reportDetail: {
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  reportDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  reportDetailLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  reportDetailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  reportSummarySection: {
    marginTop: 24,
  },
  reportSummarySectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  aiSummaryBox: {
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    gap: 12,
  },
  aiSummaryText: {
    flex: 1,
    fontSize: 14,
    color: '#1e40af',
    lineHeight: 22,
  },
  reportActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 32,
  },
  reportActionButton: {
    flex: 1,
    backgroundColor: '#eff6ff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  reportActionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3b82f6',
  },
});
