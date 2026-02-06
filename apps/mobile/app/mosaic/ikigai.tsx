import { View, Text, ScrollView, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect } from 'react';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';
import { Star, Heart, Globe, Briefcase, Target } from 'lucide-react-native';
import { useMosaicStore } from '@/stores/mosaic-store';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = SCREEN_WIDTH - 48;

export default function IkigaiScreen() {
  const { ikigaiChart, isLoading } = useMosaicStore();

  if (isLoading || !ikigaiChart) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading Ikigai...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const { talents, passions, worldNeeds, viableCareers, ikigaiCenter } = ikigaiChart;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Ikigai</Text>
          <Text style={styles.headerSubtitle}>
            The Japanese concept of "reason for being"
          </Text>
        </View>

        {/* Ikigai Diagram */}
        <View style={styles.chartContainer}>
          <IkigaiDiagram />
        </View>

        {/* Ikigai Center */}
        {ikigaiCenter && (
          <View style={styles.centerCard}>
            <View style={styles.centerIcon}>
              <Target size={32} color="#f59e0b" />
            </View>
            <Text style={styles.centerTitle}>{ikigaiCenter.primaryPath}</Text>
            <Text style={styles.centerDescription}>{ikigaiCenter.description}</Text>
            <View style={styles.actionSteps}>
              <Text style={styles.actionStepsTitle}>Next Steps:</Text>
              {ikigaiCenter.actionableSteps?.slice(0, 3).map((step: string, i: number) => (
                <View key={i} style={styles.actionStep}>
                  <Text style={styles.actionStepNumber}>{i + 1}</Text>
                  <Text style={styles.actionStepText}>{step}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Four Circles Breakdown */}
        <View style={styles.circlesSection}>
          {/* Talents */}
          <CircleCard
            icon={Star}
            iconColor="#3b82f6"
            title="What You're Good At"
            subtitle="Natural Talents"
            items={talents.map((t: { name: string; score: number }) => ({ name: t.name, value: t.score }))}
          />

          {/* Passions */}
          <CircleCard
            icon={Heart}
            iconColor="#ec4899"
            title="What You Love"
            subtitle="Passions"
            items={passions.map((p: { name: string; engagementScore: number }) => ({ name: p.name, value: p.engagementScore }))}
          />

          {/* World Needs */}
          <CircleCard
            icon={Globe}
            iconColor="#22c55e"
            title="What the World Needs"
            subtitle="Community Needs"
            items={worldNeeds.map((w: { need: string; localDemand: string }) => ({
              name: w.need,
              badge: w.localDemand === 'high' ? 'High Demand' : undefined,
            }))}
          />

          {/* Viable Careers */}
          <CircleCard
            icon={Briefcase}
            iconColor="#f59e0b"
            title="What You Can Be Paid For"
            subtitle="Career Paths"
            items={viableCareers.map((c: { career: string; matchScore: number; localAvailability: string }) => ({
              name: c.career,
              value: c.matchScore,
              badge: c.localAvailability === 'abundant' ? 'Local Jobs' : undefined,
            }))}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function IkigaiDiagram() {
  const size = CHART_SIZE;
  const center = size / 2;
  const radius = size / 4;
  const offset = radius * 0.6;

  const circles = [
    { id: 'talent', label: 'Talents', color: '#3b82f6', cx: center - offset, cy: center - offset },
    { id: 'passion', label: 'Passions', color: '#ec4899', cx: center + offset, cy: center - offset },
    { id: 'need', label: 'World Needs', color: '#22c55e', cx: center + offset, cy: center + offset },
    { id: 'career', label: 'Careers', color: '#f59e0b', cx: center - offset, cy: center + offset },
  ];

  return (
    <Svg width={size} height={size}>
      {circles.map((circle) => (
        <G key={circle.id}>
          <Circle
            cx={circle.cx}
            cy={circle.cy}
            r={radius}
            fill={circle.color}
            fillOpacity={0.15}
            stroke={circle.color}
            strokeWidth={2}
          />
          <SvgText
            x={circle.cx}
            y={circle.cy}
            textAnchor="middle"
            alignmentBaseline="middle"
            fontSize={12}
            fontWeight="600"
            fill={circle.color}
          >
            {circle.label}
          </SvgText>
        </G>
      ))}
      {/* Center Ikigai */}
      <Circle
        cx={center}
        cy={center}
        r={radius * 0.4}
        fill="#f59e0b"
        fillOpacity={0.3}
      />
      <SvgText
        x={center}
        y={center}
        textAnchor="middle"
        alignmentBaseline="middle"
        fontSize={14}
        fontWeight="700"
        fill="#92400e"
      >
        Ikigai
      </SvgText>
    </Svg>
  );
}

function CircleCard({
  icon: Icon,
  iconColor,
  title,
  subtitle,
  items,
}: {
  icon: React.ComponentType<any>;
  iconColor: string;
  title: string;
  subtitle: string;
  items: { name: string; value?: number; badge?: string }[];
}) {
  return (
    <View style={styles.circleCard}>
      <View style={styles.circleCardHeader}>
        <View style={[styles.circleCardIcon, { backgroundColor: iconColor + '15' }]}>
          <Icon size={24} color={iconColor} />
        </View>
        <View>
          <Text style={styles.circleCardTitle}>{title}</Text>
          <Text style={styles.circleCardSubtitle}>{subtitle}</Text>
        </View>
      </View>
      <View style={styles.circleCardItems}>
        {items.slice(0, 4).map((item, i) => (
          <View key={i} style={styles.circleCardItem}>
            <Text style={styles.circleCardItemName}>{item.name}</Text>
            <View style={styles.circleCardItemRight}>
              {item.badge && (
                <View style={[styles.itemBadge, { backgroundColor: iconColor + '20' }]}>
                  <Text style={[styles.itemBadgeText, { color: iconColor }]}>
                    {item.badge}
                  </Text>
                </View>
              )}
              {item.value !== undefined && (
                <Text style={styles.circleCardItemValue}>{Math.round(item.value)}</Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fef3c7',
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6b7280',
  },
  header: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#92400e',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#a16207',
    marginTop: 4,
  },
  chartContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  centerCard: {
    margin: 16,
    padding: 24,
    backgroundColor: '#ffffff',
    borderRadius: 20,
    alignItems: 'center',
  },
  centerIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  centerTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
  },
  centerDescription: {
    fontSize: 15,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 22,
  },
  actionSteps: {
    width: '100%',
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  actionStepsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 12,
  },
  actionStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  actionStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#f59e0b',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 24,
    marginRight: 10,
  },
  actionStepText: {
    flex: 1,
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  circlesSection: {
    padding: 16,
    gap: 12,
  },
  circleCard: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 16,
  },
  circleCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  circleCardIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  circleCardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  circleCardSubtitle: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
  },
  circleCardItems: {
    gap: 8,
  },
  circleCardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  circleCardItemName: {
    fontSize: 15,
    color: '#374151',
    flex: 1,
  },
  circleCardItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  circleCardItemValue: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6366f1',
  },
  itemBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  itemBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
});
