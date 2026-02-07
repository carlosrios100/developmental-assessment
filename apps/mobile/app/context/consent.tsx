import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { Shield, MapPin, Users, ChevronRight, Check, Info } from 'lucide-react-native';
import { useMosaicStore } from '@/stores/mosaic-store';
import { useChildStore } from '@/stores/child-store';
import { api } from '@/lib/api';

interface ConsentCategory {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  required: boolean;
  benefits: string[];
}

const CONSENT_CATEGORIES: ConsentCategory[] = [
  {
    id: 'location',
    title: 'Location Data',
    description: 'Your zip code helps us understand local opportunities and resources available in your area.',
    icon: MapPin,
    required: false,
    benefits: [
      'Match career pathways to local job markets',
      'Discover grants and programs in your area',
      'Get region-specific recommendations',
    ],
  },
  {
    id: 'family_context',
    title: 'Family Context',
    description: 'Optional information about your family helps us recognize resilience and provide better support.',
    icon: Users,
    required: false,
    benefits: [
      'Recognize achievements despite challenges',
      'Identify appropriate support resources',
      'Personalize recommendations for your situation',
    ],
  },
  {
    id: 'district_analytics',
    title: 'Anonymous Analytics',
    description: 'Contribute anonymized data to help improve resources for all children in your community.',
    icon: Shield,
    required: false,
    benefits: [
      'Help identify community-wide needs',
      'Support better resource allocation',
      'Contribute to educational research',
    ],
  },
];

export default function ConsentScreen() {
  const { selectedChild: currentChild } = useChildStore();
  const [consents, setConsents] = useState<Record<string, boolean>>({
    location: false,
    family_context: false,
    district_analytics: false,
  });
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleToggle = (categoryId: string) => {
    setConsents((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleContinue = async () => {
    if (!currentChild) return;
    setIsSubmitting(true);
    try {
      // Grant consent for each enabled category
      const grantPromises = Object.entries(consents)
        .filter(([_, enabled]) => enabled)
        .map(([category]) =>
          api.post('/context/consent/grant', {
            child_id: currentChild.id,
            category,
          })
        );
      await Promise.all(grantPromises);

      if (consents.location || consents.family_context) {
        router.push('/context/survey');
      } else {
        router.back();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to save consent preferences. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hasAnyConsent = Object.values(consents).some((v) => v);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerIcon}>
            <Shield size={32} color="#22c55e" />
          </View>
          <Text style={styles.headerTitle}>Your Privacy Matters</Text>
          <Text style={styles.headerSubtitle}>
            Choose what information you'd like to share. All data is optional and protected.
          </Text>
        </View>

        {/* Privacy Promise */}
        <View style={styles.promiseCard}>
          <Text style={styles.promiseTitle}>Our Promise to You</Text>
          <View style={styles.promiseItem}>
            <Check size={16} color="#22c55e" />
            <Text style={styles.promiseText}>Your data is never sold</Text>
          </View>
          <View style={styles.promiseItem}>
            <Check size={16} color="#22c55e" />
            <Text style={styles.promiseText}>You can withdraw consent anytime</Text>
          </View>
          <View style={styles.promiseItem}>
            <Check size={16} color="#22c55e" />
            <Text style={styles.promiseText}>Analytics are always anonymized</Text>
          </View>
        </View>

        {/* Consent Categories */}
        <View style={styles.categoriesSection}>
          <Text style={styles.sectionTitle}>Data Categories</Text>

          {CONSENT_CATEGORIES.map((category) => {
            const Icon = category.icon;
            const isExpanded = expandedCategory === category.id;
            const isEnabled = consents[category.id];

            return (
              <View key={category.id} style={styles.categoryCard}>
                <TouchableOpacity
                  style={styles.categoryHeader}
                  onPress={() => setExpandedCategory(isExpanded ? null : category.id)}
                >
                  <View style={[styles.categoryIcon, isEnabled && styles.categoryIconEnabled]}>
                    <Icon size={24} color={isEnabled ? '#22c55e' : '#6b7280'} />
                  </View>
                  <View style={styles.categoryContent}>
                    <Text style={styles.categoryTitle}>{category.title}</Text>
                    <Text style={styles.categoryDescription} numberOfLines={isExpanded ? undefined : 2}>
                      {category.description}
                    </Text>
                  </View>
                  <Switch
                    value={isEnabled}
                    onValueChange={() => handleToggle(category.id)}
                    trackColor={{ false: '#e5e7eb', true: '#86efac' }}
                    thumbColor={isEnabled ? '#22c55e' : '#f4f4f5'}
                  />
                </TouchableOpacity>

                {isExpanded && (
                  <View style={styles.benefitsContainer}>
                    <Text style={styles.benefitsTitle}>How this helps:</Text>
                    {category.benefits.map((benefit, index) => (
                      <View key={index} style={styles.benefitItem}>
                        <Check size={14} color="#3b82f6" />
                        <Text style={styles.benefitText}>{benefit}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            );
          })}
        </View>

        {/* Info Note */}
        <View style={styles.infoNote}>
          <Info size={16} color="#6b7280" />
          <Text style={styles.infoText}>
            You can change these preferences anytime in Settings. Assessments work without sharing any additional data.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Actions */}
      <View style={styles.bottomActions}>
        <TouchableOpacity style={styles.skipButton} onPress={() => router.back()}>
          <Text style={styles.skipButtonText}>Skip for Now</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.continueButton, !hasAnyConsent && styles.continueButtonDisabled]}
          onPress={handleContinue}
          disabled={isSubmitting}
        >
          <Text style={styles.continueButtonText}>
            {hasAnyConsent ? 'Continue' : 'No Thanks'}
          </Text>
          <ChevronRight size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
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
  header: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  headerIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#dcfce7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  headerSubtitle: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  promiseCard: {
    marginHorizontal: 16,
    padding: 16,
    backgroundColor: '#f0fdf4',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#bbf7d0',
  },
  promiseTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#16a34a',
    marginBottom: 12,
  },
  promiseItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  promiseText: {
    fontSize: 14,
    color: '#166534',
  },
  categoriesSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  categoryCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryIconEnabled: {
    backgroundColor: '#dcfce7',
  },
  categoryContent: {
    flex: 1,
    marginRight: 12,
  },
  categoryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  categoryDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 18,
  },
  benefitsContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  benefitsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  benefitText: {
    fontSize: 13,
    color: '#4b5563',
    flex: 1,
  },
  infoNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#f3f4f6',
    borderRadius: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
  },
  bottomActions: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 24,
    gap: 12,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  skipButton: {
    flex: 1,
    paddingVertical: 14,
    alignItems: 'center',
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
  },
  skipButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6b7280',
  },
  continueButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    backgroundColor: '#22c55e',
    borderRadius: 12,
    gap: 4,
  },
  continueButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
  },
});
