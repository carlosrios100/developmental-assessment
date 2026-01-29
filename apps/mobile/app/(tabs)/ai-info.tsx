import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Bot,
  Brain,
  Shield,
  AlertTriangle,
  FileText,
  Eye,
  Lock,
  HelpCircle,
  ExternalLink,
  CheckCircle,
  XCircle,
  Info,
} from 'lucide-react-native';

const AI_FEATURES = [
  {
    title: 'Video Analysis',
    description: 'AI analyzes recorded videos to identify developmental patterns and behaviors',
    icon: Eye,
    color: '#3b82f6',
  },
  {
    title: 'Assessment Scoring',
    description: 'Machine learning assists in scoring ASQ-3 questionnaire responses',
    icon: Brain,
    color: '#8b5cf6',
  },
  {
    title: 'Report Generation',
    description: 'AI generates comprehensive developmental reports and recommendations',
    icon: FileText,
    color: '#22c55e',
  },
  {
    title: 'Progress Tracking',
    description: 'Automated analysis of developmental trends over time',
    icon: CheckCircle,
    color: '#f59e0b',
  },
];

const DATA_PRACTICES = [
  {
    title: 'What data is collected',
    items: [
      'Child profile information (name, date of birth)',
      'Assessment questionnaire responses',
      'Videos uploaded for analysis',
      'App usage patterns for improvement',
    ],
  },
  {
    title: 'How AI processes your data',
    items: [
      'Videos are analyzed for movement patterns and behaviors',
      'Questionnaire responses are scored using validated algorithms',
      'Data is compared against developmental norms',
      'Reports are generated based on aggregated analysis',
    ],
  },
  {
    title: 'Data protection measures',
    items: [
      'All data is encrypted in transit and at rest',
      'Videos are processed securely and not shared',
      'Personal data is never sold to third parties',
      'You can request data deletion at any time',
    ],
  },
];

export default function AIInfoScreen() {
  const openPrivacyPolicy = () => {
    Linking.openURL('https://example.com/privacy');
  };

  const openTermsOfService = () => {
    Linking.openURL('https://example.com/terms');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView}>
        {/* Header Banner */}
        <View style={styles.headerBanner}>
          <View style={styles.headerIcon}>
            <Bot size={32} color="#3b82f6" />
          </View>
          <Text style={styles.headerTitle}>AI Transparency</Text>
          <Text style={styles.headerSubtitle}>
            Understanding how artificial intelligence is used in DevAssess
          </Text>
        </View>

        {/* Important Notice */}
        <View style={styles.noticeCard}>
          <AlertTriangle size={24} color="#f59e0b" />
          <View style={styles.noticeContent}>
            <Text style={styles.noticeTitle}>Important Notice</Text>
            <Text style={styles.noticeText}>
              DevAssess uses artificial intelligence to assist with developmental assessments.
              AI-generated results are intended to support, not replace, professional medical advice.
              Always consult qualified healthcare providers for clinical decisions.
            </Text>
          </View>
        </View>

        {/* AI Features Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How We Use AI</Text>
          <View style={styles.featuresGrid}>
            {AI_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureCard}>
                <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                  <feature.icon size={24} color={feature.color} />
                </View>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Limitations Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>AI Limitations</Text>
          <View style={styles.limitationsCard}>
            <View style={styles.limitationItem}>
              <XCircle size={20} color="#ef4444" />
              <Text style={styles.limitationText}>
                AI cannot diagnose developmental disorders or medical conditions
              </Text>
            </View>
            <View style={styles.limitationItem}>
              <XCircle size={20} color="#ef4444" />
              <Text style={styles.limitationText}>
                Results may vary based on video quality and environmental factors
              </Text>
            </View>
            <View style={styles.limitationItem}>
              <XCircle size={20} color="#ef4444" />
              <Text style={styles.limitationText}>
                AI analysis should not be the sole basis for intervention decisions
              </Text>
            </View>
            <View style={styles.limitationItem}>
              <XCircle size={20} color="#ef4444" />
              <Text style={styles.limitationText}>
                Cultural and individual variations may not be fully captured
              </Text>
            </View>
          </View>
        </View>

        {/* Data Practices Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Data Practices</Text>
          {DATA_PRACTICES.map((practice, index) => (
            <View key={index} style={styles.practiceCard}>
              <Text style={styles.practiceTitle}>{practice.title}</Text>
              {practice.items.map((item, itemIndex) => (
                <View key={itemIndex} style={styles.practiceItem}>
                  <View style={styles.bullet} />
                  <Text style={styles.practiceText}>{item}</Text>
                </View>
              ))}
            </View>
          ))}
        </View>

        {/* Your Rights Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Your Rights</Text>
          <View style={styles.rightsCard}>
            <View style={styles.rightItem}>
              <Lock size={20} color="#22c55e" />
              <View style={styles.rightContent}>
                <Text style={styles.rightTitle}>Access Your Data</Text>
                <Text style={styles.rightDesc}>
                  Request a copy of all data we have collected about you
                </Text>
              </View>
            </View>
            <View style={styles.rightItem}>
              <Shield size={20} color="#22c55e" />
              <View style={styles.rightContent}>
                <Text style={styles.rightTitle}>Data Portability</Text>
                <Text style={styles.rightDesc}>
                  Export your data in a standard, machine-readable format
                </Text>
              </View>
            </View>
            <View style={styles.rightItem}>
              <XCircle size={20} color="#22c55e" />
              <View style={styles.rightContent}>
                <Text style={styles.rightTitle}>Right to Deletion</Text>
                <Text style={styles.rightDesc}>
                  Request permanent deletion of your personal data
                </Text>
              </View>
            </View>
            <View style={styles.rightItem}>
              <Eye size={20} color="#22c55e" />
              <View style={styles.rightContent}>
                <Text style={styles.rightTitle}>Opt-Out of AI Analysis</Text>
                <Text style={styles.rightDesc}>
                  Disable AI features while still using manual assessment tools
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Legal Links */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Legal Documents</Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity style={styles.legalLink} onPress={openPrivacyPolicy}>
              <FileText size={20} color="#3b82f6" />
              <Text style={styles.legalLinkText}>Privacy Policy</Text>
              <ExternalLink size={16} color="#9ca3af" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.legalLink} onPress={openTermsOfService}>
              <FileText size={20} color="#3b82f6" />
              <Text style={styles.legalLinkText}>Terms of Service</Text>
              <ExternalLink size={16} color="#9ca3af" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Contact Section */}
        <View style={styles.section}>
          <View style={styles.contactCard}>
            <HelpCircle size={24} color="#6b7280" />
            <View style={styles.contactContent}>
              <Text style={styles.contactTitle}>Questions about AI usage?</Text>
              <Text style={styles.contactText}>
                Contact our privacy team at privacy@devassess.com
              </Text>
            </View>
          </View>
        </View>

        {/* Compliance Badges */}
        <View style={styles.complianceSection}>
          <Text style={styles.complianceTitle}>Compliance</Text>
          <View style={styles.complianceBadges}>
            <View style={styles.badge}>
              <Shield size={16} color="#22c55e" />
              <Text style={styles.badgeText}>HIPAA Compliant</Text>
            </View>
            <View style={styles.badge}>
              <Lock size={16} color="#22c55e" />
              <Text style={styles.badgeText}>COPPA Compliant</Text>
            </View>
            <View style={styles.badge}>
              <CheckCircle size={16} color="#22c55e" />
              <Text style={styles.badgeText}>GDPR Ready</Text>
            </View>
          </View>
        </View>

        {/* Version Info */}
        <View style={styles.versionInfo}>
          <Text style={styles.versionText}>AI Model Version: v2.1.0</Text>
          <Text style={styles.versionText}>Last Updated: January 2026</Text>
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
  headerBanner: {
    backgroundColor: '#3b82f6',
    padding: 24,
    alignItems: 'center',
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  headerSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    marginTop: 8,
  },
  noticeCard: {
    flexDirection: 'row',
    backgroundColor: '#fef3c7',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fcd34d',
  },
  noticeContent: {
    flex: 1,
    marginLeft: 12,
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#92400e',
  },
  noticeText: {
    fontSize: 14,
    color: '#a16207',
    marginTop: 4,
    lineHeight: 20,
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
  featuresGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  featureCard: {
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
  featureIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  featureDesc: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    lineHeight: 18,
  },
  limitationsCard: {
    backgroundColor: '#fef2f2',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  limitationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  limitationText: {
    flex: 1,
    fontSize: 14,
    color: '#991b1b',
    lineHeight: 20,
  },
  practiceCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  practiceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  practiceItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  bullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#3b82f6',
    marginTop: 6,
    marginRight: 12,
  },
  practiceText: {
    flex: 1,
    fontSize: 14,
    color: '#4b5563',
    lineHeight: 20,
  },
  rightsCard: {
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    padding: 16,
    gap: 16,
  },
  rightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  rightContent: {
    flex: 1,
  },
  rightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#166534',
  },
  rightDesc: {
    fontSize: 13,
    color: '#15803d',
    marginTop: 2,
  },
  legalLinks: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    overflow: 'hidden',
  },
  legalLink: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  legalLinkText: {
    flex: 1,
    fontSize: 16,
    color: '#1f2937',
    marginLeft: 12,
  },
  contactCard: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  contactContent: {
    flex: 1,
    marginLeft: 12,
  },
  contactTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  contactText: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  complianceSection: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  complianceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
    textAlign: 'center',
  },
  complianceBadges: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 12,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fdf4',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  versionInfo: {
    alignItems: 'center',
    paddingBottom: 32,
  },
  versionText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});
