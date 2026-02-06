import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Star, Lock, Check, Play } from 'lucide-react-native';

type ScenarioType =
  | 'sharing'
  | 'empathy_response'
  | 'delayed_gratification'
  | 'cooperation'
  | 'failure_recovery'
  | 'risk_assessment';

interface ScenarioNode {
  id: string;
  title: string;
  type: ScenarioType;
  completed: boolean;
  locked: boolean;
  starsEarned: number;
}

interface AdventureMapProps {
  scenarios: ScenarioNode[];
  onSelectScenario: (scenarioId: string) => void;
}

const SCENARIO_COLORS: Record<ScenarioType, string> = {
  sharing: '#3b82f6',
  empathy_response: '#ec4899',
  delayed_gratification: '#f59e0b',
  cooperation: '#22c55e',
  failure_recovery: '#8b5cf6',
  risk_assessment: '#ef4444',
};

const SCENARIO_EMOJIS: Record<ScenarioType, string> = {
  sharing: '\uD83D\uDC6B',
  empathy_response: '\uD83E\uDD17',
  delayed_gratification: '\uD83C\uDF81',
  cooperation: '\uD83E\uDD1D',
  failure_recovery: '\uD83D\uDCAA',
  risk_assessment: '\uD83C\uDF1F',
};

export function AdventureMap({ scenarios, onSelectScenario }: AdventureMapProps) {
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Path visualization */}
      <View style={styles.pathContainer}>
        {scenarios.map((scenario, index) => {
          const color = SCENARIO_COLORS[scenario.type];
          const emoji = SCENARIO_EMOJIS[scenario.type];
          const isLast = index === scenarios.length - 1;

          return (
            <View key={scenario.id} style={styles.nodeContainer}>
              {/* Connector line */}
              {!isLast && (
                <View
                  style={[
                    styles.connector,
                    scenario.completed && { backgroundColor: color },
                  ]}
                />
              )}

              {/* Node */}
              <TouchableOpacity
                style={[
                  styles.node,
                  { borderColor: color },
                  scenario.completed && { backgroundColor: color + '20' },
                  scenario.locked && styles.nodeLocked,
                ]}
                onPress={() => !scenario.locked && onSelectScenario(scenario.id)}
                disabled={scenario.locked}
              >
                {scenario.locked ? (
                  <Lock size={24} color="#9ca3af" />
                ) : scenario.completed ? (
                  <Check size={24} color={color} />
                ) : (
                  <Text style={styles.emoji}>{emoji}</Text>
                )}
              </TouchableOpacity>

              {/* Label */}
              <View style={styles.labelContainer}>
                <Text
                  style={[
                    styles.nodeTitle,
                    scenario.locked && styles.nodeTitleLocked,
                  ]}
                  numberOfLines={2}
                >
                  {scenario.title}
                </Text>

                {/* Stars */}
                {scenario.completed && (
                  <View style={styles.starsRow}>
                    {[1, 2, 3].map((i) => (
                      <Star
                        key={i}
                        size={14}
                        color="#fbbf24"
                        fill={i <= scenario.starsEarned ? '#fbbf24' : 'transparent'}
                      />
                    ))}
                  </View>
                )}

                {/* Play indicator */}
                {!scenario.locked && !scenario.completed && (
                  <View style={[styles.playBadge, { backgroundColor: color }]}>
                    <Play size={10} color="#ffffff" fill="#ffffff" />
                    <Text style={styles.playText}>Play</Text>
                  </View>
                )}
              </View>
            </View>
          );
        })}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: 24,
  },
  pathContainer: {
    alignItems: 'center',
  },
  nodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
  },
  connector: {
    position: 'absolute',
    left: 35,
    top: 70,
    width: 4,
    height: 48,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  node: {
    width: 70,
    height: 70,
    borderRadius: 35,
    borderWidth: 3,
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  nodeLocked: {
    backgroundColor: '#f3f4f6',
    borderColor: '#d1d5db',
  },
  emoji: {
    fontSize: 28,
  },
  labelContainer: {
    flex: 1,
    marginLeft: 16,
  },
  nodeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  nodeTitleLocked: {
    color: '#9ca3af',
  },
  starsRow: {
    flexDirection: 'row',
    gap: 2,
    marginTop: 4,
  },
  playBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    marginTop: 6,
  },
  playText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#ffffff',
  },
});
