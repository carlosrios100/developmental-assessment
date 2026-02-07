import { View, Text, ScrollView, TouchableOpacity, StyleSheet, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useState } from 'react';
import { router } from 'expo-router';
import { MapPin, Home, Users, GraduationCap, Briefcase, ChevronRight, Check, ChevronLeft } from 'lucide-react-native';
import { useMosaicStore } from '@/stores/mosaic-store';
import { useChildStore } from '@/stores/child-store';
import { api } from '@/lib/api';

type SurveyStep = 'location' | 'household' | 'education' | 'employment' | 'review';

interface Option {
  id: string;
  label: string;
  description?: string;
}

const HOUSEHOLD_SIZE_OPTIONS: Option[] = [
  { id: '1-2', label: '1-2 people' },
  { id: '3-4', label: '3-4 people' },
  { id: '5-6', label: '5-6 people' },
  { id: '7+', label: '7 or more' },
];

const EDUCATION_OPTIONS: Option[] = [
  { id: 'some_high_school', label: 'Some High School' },
  { id: 'high_school', label: 'High School Diploma/GED' },
  { id: 'some_college', label: 'Some College' },
  { id: 'associates', label: "Associate's Degree" },
  { id: 'bachelors', label: "Bachelor's Degree" },
  { id: 'masters', label: "Master's Degree" },
  { id: 'doctorate', label: 'Doctorate/Professional' },
];

const EMPLOYMENT_OPTIONS: Option[] = [
  { id: 'employed_full', label: 'Employed Full-time' },
  { id: 'employed_part', label: 'Employed Part-time' },
  { id: 'self_employed', label: 'Self-employed' },
  { id: 'seeking', label: 'Seeking Employment' },
  { id: 'homemaker', label: 'Homemaker' },
  { id: 'student', label: 'Student' },
  { id: 'retired', label: 'Retired' },
  { id: 'other', label: 'Other' },
];

const HOUSING_OPTIONS: Option[] = [
  { id: 'own', label: 'Own Home' },
  { id: 'rent', label: 'Rent' },
  { id: 'family', label: 'Living with Family' },
  { id: 'other', label: 'Other' },
];

export default function SurveyScreen() {
  const { selectedChild: currentChild } = useChildStore();
  const [currentStep, setCurrentStep] = useState<SurveyStep>('location');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form data
  const [zipCode, setZipCode] = useState('');
  const [householdSize, setHouseholdSize] = useState<string | null>(null);
  const [housingStatus, setHousingStatus] = useState<string | null>(null);
  const [parentEducation, setParentEducation] = useState<string | null>(null);
  const [employmentStatus, setEmploymentStatus] = useState<string | null>(null);

  const steps: SurveyStep[] = ['location', 'household', 'education', 'employment', 'review'];
  const currentStepIndex = steps.indexOf(currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  const canProceed = () => {
    switch (currentStep) {
      case 'location':
        return zipCode.length === 5;
      case 'household':
        return householdSize !== null && housingStatus !== null;
      case 'education':
        return parentEducation !== null;
      case 'employment':
        return employmentStatus !== null;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const parseHouseholdSize = (size: string | null): number | undefined => {
    if (!size) return undefined;
    const map: Record<string, number> = { '1-2': 2, '3-4': 4, '5-6': 6, '7+': 8 };
    return map[size];
  };

  const handleNext = async () => {
    if (currentStep === 'review') {
      if (!currentChild) return;
      setIsSubmitting(true);
      try {
        await api.post('/context/family', {
          child_id: currentChild.id,
          zip_code: zipCode || undefined,
          household_size: parseHouseholdSize(householdSize),
          parent_education_level: parentEducation || undefined,
        });
        router.replace('/mosaic');
      } catch (error) {
        Alert.alert(
          'Submission Error',
          error instanceof Error ? error.message : 'Failed to save family context. Please try again.'
        );
      } finally {
        setIsSubmitting(false);
      }
    } else {
      const nextIndex = currentStepIndex + 1;
      if (nextIndex < steps.length) {
        setCurrentStep(steps[nextIndex]);
      }
    }
  };

  const handleBack = () => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      setCurrentStep(steps[prevIndex]);
    } else {
      router.back();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'location':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <MapPin size={32} color="#3b82f6" />
            </View>
            <Text style={styles.stepTitle}>Where do you live?</Text>
            <Text style={styles.stepDescription}>
              Your zip code helps us find local opportunities, grants, and resources in your area.
            </Text>

            <View style={styles.inputContainer}>
              <TextInput
                style={styles.zipInput}
                value={zipCode}
                onChangeText={(text) => setZipCode(text.replace(/[^0-9]/g, '').slice(0, 5))}
                placeholder="Enter ZIP code"
                placeholderTextColor="#9ca3af"
                keyboardType="number-pad"
                maxLength={5}
              />
            </View>

            <View style={styles.benefitNote}>
              <Check size={14} color="#22c55e" />
              <Text style={styles.benefitNoteText}>
                This helps match career pathways to jobs in your community
              </Text>
            </View>
          </View>
        );

      case 'household':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Home size={32} color="#8b5cf6" />
            </View>
            <Text style={styles.stepTitle}>About Your Household</Text>
            <Text style={styles.stepDescription}>
              This helps us understand your family's situation to provide relevant resources.
            </Text>

            <Text style={styles.optionGroupLabel}>Household Size</Text>
            <View style={styles.optionGrid}>
              {HOUSEHOLD_SIZE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionButton, householdSize === option.id && styles.optionButtonSelected]}
                  onPress={() => setHouseholdSize(option.id)}
                >
                  <Text style={[styles.optionButtonText, householdSize === option.id && styles.optionButtonTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.optionGroupLabel}>Housing Status</Text>
            <View style={styles.optionGrid}>
              {HOUSING_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.optionButton, housingStatus === option.id && styles.optionButtonSelected]}
                  onPress={() => setHousingStatus(option.id)}
                >
                  <Text style={[styles.optionButtonText, housingStatus === option.id && styles.optionButtonTextSelected]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'education':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <GraduationCap size={32} color="#f59e0b" />
            </View>
            <Text style={styles.stepTitle}>Parent Education</Text>
            <Text style={styles.stepDescription}>
              Highest education level of any parent/guardian in the household.
            </Text>

            <View style={styles.optionList}>
              {EDUCATION_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.listOptionButton, parentEducation === option.id && styles.listOptionButtonSelected]}
                  onPress={() => setParentEducation(option.id)}
                >
                  <Text style={[styles.listOptionText, parentEducation === option.id && styles.listOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {parentEducation === option.id && <Check size={20} color="#3b82f6" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'employment':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Briefcase size={32} color="#22c55e" />
            </View>
            <Text style={styles.stepTitle}>Employment Status</Text>
            <Text style={styles.stepDescription}>
              Primary employment status of the household.
            </Text>

            <View style={styles.optionList}>
              {EMPLOYMENT_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[styles.listOptionButton, employmentStatus === option.id && styles.listOptionButtonSelected]}
                  onPress={() => setEmploymentStatus(option.id)}
                >
                  <Text style={[styles.listOptionText, employmentStatus === option.id && styles.listOptionTextSelected]}>
                    {option.label}
                  </Text>
                  {employmentStatus === option.id && <Check size={20} color="#3b82f6" />}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 'review':
        return (
          <View style={styles.stepContent}>
            <View style={styles.stepIcon}>
              <Users size={32} color="#ec4899" />
            </View>
            <Text style={styles.stepTitle}>Review Your Information</Text>
            <Text style={styles.stepDescription}>
              Please confirm the information below is correct.
            </Text>

            <View style={styles.reviewCard}>
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>ZIP Code</Text>
                <Text style={styles.reviewValue}>{zipCode}</Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Household Size</Text>
                <Text style={styles.reviewValue}>
                  {HOUSEHOLD_SIZE_OPTIONS.find((o) => o.id === householdSize)?.label}
                </Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Housing</Text>
                <Text style={styles.reviewValue}>
                  {HOUSING_OPTIONS.find((o) => o.id === housingStatus)?.label}
                </Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Education</Text>
                <Text style={styles.reviewValue}>
                  {EDUCATION_OPTIONS.find((o) => o.id === parentEducation)?.label}
                </Text>
              </View>
              <View style={styles.reviewDivider} />
              <View style={styles.reviewItem}>
                <Text style={styles.reviewLabel}>Employment</Text>
                <Text style={styles.reviewValue}>
                  {EMPLOYMENT_OPTIONS.find((o) => o.id === employmentStatus)?.label}
                </Text>
              </View>
            </View>

            <View style={styles.privacyNote}>
              <Text style={styles.privacyNoteText}>
                This information is used solely to enhance your child's assessment and find relevant resources.
                You can update or delete this data anytime in Settings.
              </Text>
            </View>
          </View>
        );
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBack}>
            <ChevronLeft size={24} color="#6b7280" />
          </TouchableOpacity>
          <View style={styles.progressContainer}>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: `${progress}%` }]} />
            </View>
            <Text style={styles.progressText}>
              Step {currentStepIndex + 1} of {steps.length}
            </Text>
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderStepContent()}
        </ScrollView>

        {/* Bottom Action */}
        <View style={styles.bottomAction}>
          <TouchableOpacity
            style={[styles.continueButton, !canProceed() && styles.continueButtonDisabled]}
            onPress={handleNext}
            disabled={!canProceed() || isSubmitting}
          >
            <Text style={styles.continueButtonText}>
              {currentStep === 'review' ? 'Submit & View Mosaic' : 'Continue'}
            </Text>
            <ChevronRight size={20} color="#ffffff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f9fafb',
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    flex: 1,
  },
  progressBar: {
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#3b82f6',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 4,
    textAlign: 'right',
  },
  scrollView: {
    flex: 1,
  },
  stepContent: {
    padding: 24,
  },
  stepIcon: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    alignSelf: 'center',
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  stepDescription: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 24,
    lineHeight: 22,
  },
  inputContainer: {
    marginBottom: 16,
  },
  zipInput: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    color: '#1f2937',
  },
  benefitNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f0fdf4',
    padding: 12,
    borderRadius: 8,
  },
  benefitNoteText: {
    flex: 1,
    fontSize: 13,
    color: '#166534',
  },
  optionGroupLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
    marginTop: 16,
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    minWidth: '45%',
    alignItems: 'center',
  },
  optionButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  optionButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6b7280',
  },
  optionButtonTextSelected: {
    color: '#1d4ed8',
  },
  optionList: {
    gap: 8,
  },
  listOptionButton: {
    backgroundColor: '#ffffff',
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  listOptionButtonSelected: {
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  },
  listOptionText: {
    fontSize: 15,
    color: '#6b7280',
  },
  listOptionTextSelected: {
    color: '#1d4ed8',
    fontWeight: '500',
  },
  reviewCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  reviewItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
  },
  reviewLabel: {
    fontSize: 14,
    color: '#6b7280',
  },
  reviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  reviewDivider: {
    height: 1,
    backgroundColor: '#f3f4f6',
  },
  privacyNote: {
    backgroundColor: '#f3f4f6',
    padding: 12,
    borderRadius: 8,
  },
  privacyNoteText: {
    fontSize: 12,
    color: '#6b7280',
    lineHeight: 18,
    textAlign: 'center',
  },
  bottomAction: {
    padding: 16,
    paddingBottom: 24,
    backgroundColor: '#ffffff',
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#3b82f6',
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
