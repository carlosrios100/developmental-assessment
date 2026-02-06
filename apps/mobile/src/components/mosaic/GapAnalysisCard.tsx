import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { useRef, useEffect } from 'react';
import { AlertCircle, BookOpen, Users, Zap, ChevronRight, ExternalLink } from 'lucide-react-native';

type GapPriority = 'high' | 'medium' | 'low';
type ResourceType = 'program' | 'mentorship' | 'grant' | 'activity' | 'community';

interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  description?: string;
  isLocal?: boolean;
}

interface GapAnalysisCardProps {
  domain: string;
  gapDescription: string;
  priority: GapPriority;
  resources: Resource[];
  onResourcePress?: (resourceId: string) => void;
  onExpand?: () => void;
  expanded?: boolean;
}

const PRIORITY_COLORS: Record<GapPriority, string> = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#22c55e',
};

const PRIORITY_LABELS: Record<GapPriority, string> = {
  high: 'Priority',
  medium: 'Recommended',
  low: 'Nice to have',
};

const RESOURCE_ICONS: Record<ResourceType, React.ComponentType<any>> = {
  program: BookOpen,
  mentorship: Users,
  grant: Zap,
  activity: Zap,
  community: Users,
};

export function GapAnalysisCard({
  domain,
  gapDescription,
  priority,
  resources,
  onResourcePress,
  onExpand,
  expanded = false,
}: GapAnalysisCardProps) {
  const expandAnim = useRef(new Animated.Value(expanded ? 1 : 0)).current;
  const priorityColor = PRIORITY_COLORS[priority];

  useEffect(() => {
    Animated.timing(expandAnim, {
      toValue: expanded ? 1 : 0,
      duration: 200,
      useNativeDriver: false,
    }).start();
  }, [expanded]);

  return (
    <View style={styles.card}>
      {/* Header */}
      <TouchableOpacity style={styles.header} onPress={onExpand}>
        <View style={[styles.priorityIndicator, { backgroundColor: priorityColor }]} />
        <View style={styles.headerContent}>
          <Text style={styles.domain}>{domain}</Text>
          <Text style={styles.gapDescription} numberOfLines={expanded ? undefined : 2}>
            {gapDescription}
          </Text>
        </View>
        <View style={styles.headerRight}>
          <View style={[styles.priorityBadge, { backgroundColor: priorityColor + '20' }]}>
            <Text style={[styles.priorityText, { color: priorityColor }]}>
              {PRIORITY_LABELS[priority]}
            </Text>
          </View>
          <Animated.View
            style={{
              transform: [
                {
                  rotate: expandAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: ['0deg', '90deg'],
                  }),
                },
              ],
            }}
          >
            <ChevronRight size={20} color="#9ca3af" />
          </Animated.View>
        </View>
      </TouchableOpacity>

      {/* Expandable resources section */}
      {expanded && resources.length > 0 && (
        <View style={styles.resourcesSection}>
          <Text style={styles.resourcesTitle}>Matched Resources</Text>
          {resources.map((resource) => {
            const ResourceIcon = RESOURCE_ICONS[resource.type] || Zap;

            return (
              <TouchableOpacity
                key={resource.id}
                style={styles.resourceItem}
                onPress={() => onResourcePress?.(resource.id)}
              >
                <View style={styles.resourceIcon}>
                  <ResourceIcon size={16} color="#6366f1" />
                </View>
                <View style={styles.resourceContent}>
                  <Text style={styles.resourceName}>{resource.name}</Text>
                  {resource.description && (
                    <Text style={styles.resourceDescription} numberOfLines={1}>
                      {resource.description}
                    </Text>
                  )}
                </View>
                {resource.isLocal && (
                  <View style={styles.localBadge}>
                    <Text style={styles.localText}>Local</Text>
                  </View>
                )}
                <ExternalLink size={14} color="#9ca3af" />
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Empty state */}
      {expanded && resources.length === 0 && (
        <View style={styles.emptyState}>
          <AlertCircle size={20} color="#9ca3af" />
          <Text style={styles.emptyText}>No matched resources yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'flex-start',
  },
  priorityIndicator: {
    width: 4,
    height: '100%',
    borderRadius: 2,
    marginRight: 12,
    minHeight: 40,
  },
  headerContent: {
    flex: 1,
  },
  domain: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  gapDescription: {
    fontSize: 13,
    color: '#6b7280',
    marginTop: 2,
    lineHeight: 18,
  },
  headerRight: {
    alignItems: 'flex-end',
    gap: 8,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  resourcesSection: {
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
    padding: 12,
  },
  resourcesTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6b7280',
    marginBottom: 8,
  },
  resourceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  resourceIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  resourceContent: {
    flex: 1,
  },
  resourceName: {
    fontSize: 13,
    fontWeight: '500',
    color: '#1f2937',
  },
  resourceDescription: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 1,
  },
  localBadge: {
    backgroundColor: '#dcfce7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  localText: {
    fontSize: 9,
    fontWeight: '600',
    color: '#059669',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  emptyText: {
    fontSize: 13,
    color: '#9ca3af',
  },
});
