import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '@/src/theme/colors';
import type { ExerciseHistoryEntry } from '@/src/types/api';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 64;
const CHART_H = 160;
const PAD = { top: 12, right: 8, bottom: 28, left: 36 };

function parseWeight(entry: ExerciseHistoryEntry): number | null {
  const raw = entry.weightKg ?? entry.weight;
  if (!raw) return null;
  const n = parseFloat(raw);
  return isNaN(n) ? null : n;
}

function shortDate(iso: string) {
  const d = new Date(iso);
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

export function WeightChart({ name, history }: { name: string; history: ExerciseHistoryEntry[] }) {
  const points = history
    .map((e) => ({ date: e.date, weight: parseWeight(e) }))
    .filter((p): p is { date: string; weight: number } => p.weight !== null)
    .slice(-10);

  if (points.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Not enough data to plot</Text>
      </View>
    );
  }

  const innerW = CHART_W - PAD.left - PAD.right;
  const innerH = CHART_H - PAD.top - PAD.bottom;

  const weights = points.map((p) => p.weight);
  const minW = Math.min(...weights);
  const maxW = Math.max(...weights);
  const range = maxW - minW || 1;

  const toX = (i: number) => PAD.left + (i / (points.length - 1)) * innerW;
  const toY = (w: number) => PAD.top + innerH - ((w - minW) / range) * innerH;

  const polyPoints = points.map((p, i) => `${toX(i)},${toY(p.weight)}`).join(' ');

  const labelIndices =
    points.length <= 5
      ? points.map((_, i) => i)
      : [0, Math.floor(points.length / 2), points.length - 1];

  return (
    <View style={styles.wrapper}>
      <Text style={styles.exerciseName}>{name}</Text>
      <View style={styles.chartRow}>
        <Svg width={CHART_W} height={CHART_H}>
          {/* Y axis label */}
          <SvgText
            x={PAD.left - 4}
            y={PAD.top + innerH / 2}
            fill={colors.textMuted}
            fontSize={10}
            textAnchor="end"
            alignmentBaseline="middle"
          >
            {minW}
          </SvgText>
          <SvgText
            x={PAD.left - 4}
            y={PAD.top}
            fill={colors.textMuted}
            fontSize={10}
            textAnchor="end"
            alignmentBaseline="middle"
          >
            {maxW}
          </SvgText>

          {/* Grid line */}
          <Line
            x1={PAD.left}
            y1={PAD.top + innerH}
            x2={PAD.left + innerW}
            y2={PAD.top + innerH}
            stroke={colors.borderSubtle}
            strokeWidth={1}
          />

          {/* Line */}
          <Polyline
            points={polyPoints}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots + X labels */}
          {points.map((p, i) => (
            <React.Fragment key={i}>
              <Circle
                cx={toX(i)}
                cy={toY(p.weight)}
                r={4}
                fill={i === points.length - 1 ? colors.primary : colors.surface}
                stroke={colors.primary}
                strokeWidth={2}
              />
              {labelIndices.includes(i) && (
                <SvgText
                  x={toX(i)}
                  y={CHART_H - 6}
                  fill={colors.textMuted}
                  fontSize={10}
                  textAnchor="middle"
                >
                  {shortDate(p.date)}
                </SvgText>
              )}
            </React.Fragment>
          ))}
        </Svg>
      </View>
      <Text style={styles.lastValue}>
        Latest: {points[points.length - 1].weight} kg
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  exerciseName: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
    marginBottom: 8,
  },
  chartRow: {
    alignItems: 'center',
  },
  lastValue: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '600',
    marginTop: 6,
    textAlign: 'right',
  },
  empty: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
