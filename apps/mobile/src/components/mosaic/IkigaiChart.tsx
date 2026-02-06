import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Circle, Text as SvgText, G } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CHART_SIZE = SCREEN_WIDTH - 48;

interface IkigaiChartProps {
  talents: string[];
  passions: string[];
  worldNeeds: string[];
  careers: string[];
  size?: number;
}

export function IkigaiChart({
  talents,
  passions,
  worldNeeds,
  careers,
  size = CHART_SIZE,
}: IkigaiChartProps) {
  const center = size / 2;
  const radius = size * 0.35;
  const offset = radius * 0.4;

  const circles = [
    { id: 'talents', color: '#3b82f6', x: center - offset, y: center - offset, label: 'Talents' },
    { id: 'passions', color: '#ec4899', x: center + offset, y: center - offset, label: 'Passions' },
    { id: 'worldNeeds', color: '#22c55e', x: center - offset, y: center + offset, label: 'World Needs' },
    { id: 'careers', color: '#f59e0b', x: center + offset, y: center + offset, label: 'Careers' },
  ];

  return (
    <View style={[styles.container, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        {/* Draw overlapping circles */}
        {circles.map((circle) => (
          <G key={circle.id}>
            <Circle
              cx={circle.x}
              cy={circle.y}
              r={radius}
              fill={circle.color}
              fillOpacity={0.2}
              stroke={circle.color}
              strokeWidth={2}
            />
          </G>
        ))}

        {/* Center ikigai label */}
        <Circle cx={center} cy={center} r={radius * 0.25} fill="#6366f1" />
        <SvgText
          x={center}
          y={center + 4}
          fontSize={12}
          fontWeight="bold"
          fill="#ffffff"
          textAnchor="middle"
        >
          IKIGAI
        </SvgText>
      </Svg>

      {/* Circle labels */}
      <View style={[styles.label, styles.labelTopLeft]}>
        <Text style={[styles.labelTitle, { color: '#3b82f6' }]}>Talents</Text>
        <Text style={styles.labelCount}>{talents.length} identified</Text>
      </View>

      <View style={[styles.label, styles.labelTopRight]}>
        <Text style={[styles.labelTitle, { color: '#ec4899' }]}>Passions</Text>
        <Text style={styles.labelCount}>{passions.length} identified</Text>
      </View>

      <View style={[styles.label, styles.labelBottomLeft]}>
        <Text style={[styles.labelTitle, { color: '#22c55e' }]}>World Needs</Text>
        <Text style={styles.labelCount}>{worldNeeds.length} identified</Text>
      </View>

      <View style={[styles.label, styles.labelBottomRight]}>
        <Text style={[styles.labelTitle, { color: '#f59e0b' }]}>Careers</Text>
        <Text style={styles.labelCount}>{careers.length} viable</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignSelf: 'center',
    position: 'relative',
  },
  label: {
    position: 'absolute',
    alignItems: 'center',
  },
  labelTopLeft: {
    top: 8,
    left: 8,
  },
  labelTopRight: {
    top: 8,
    right: 8,
  },
  labelBottomLeft: {
    bottom: 8,
    left: 8,
  },
  labelBottomRight: {
    bottom: 8,
    right: 8,
  },
  labelTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  labelCount: {
    fontSize: 10,
    color: '#6b7280',
  },
});
