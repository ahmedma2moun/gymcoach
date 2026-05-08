import React from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import Svg, { Polyline, Polygon, Circle, Line, Text as SvgText } from 'react-native-svg';
import { colors } from '@/src/theme/colors';
import type { ExerciseHistoryEntry } from '@/src/types/api';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 64;
const CHART_H = 170;
const PAD = { top: 14, right: 10, bottom: 30, left: 38 };

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
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-10);

  if (points.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>{name}</Text>
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

  // Closed area under the curve for a soft fill effect
  const areaPoints =
    `${PAD.left},${PAD.top + innerH} ` +
    polyPoints +
    ` ${PAD.left + innerW},${PAD.top + innerH}`;

  const labelIndices =
    points.length <= 5
      ? points.map((_, i) => i)
      : [0, Math.floor(points.length / 2), points.length - 1];

  const last = points[points.length - 1];
  const first = points[0];
  const delta = last.weight - first.weight;
  const trend = delta === 0 ? 'flat' : delta > 0 ? 'up' : 'down';
  const trendColor =
    trend === 'up' ? colors.success : trend === 'down' ? colors.danger : colors.textMuted;
  const trendLabel = delta > 0 ? `+${delta.toFixed(1)}` : delta.toFixed(1);

  return (
    <View style={styles.wrapper}>
      <View style={styles.headerRow}>
        <Text style={styles.exerciseName}>{name}</Text>
        <View style={[styles.trendPill, { backgroundColor: trendColor + '18', borderColor: trendColor + '40' }]}>
          <Text style={[styles.trendText, { color: trendColor }]}>
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : '→'} {trendLabel} kg
          </Text>
        </View>
      </View>

      <View style={styles.chartRow}>
        <Svg width={CHART_W} height={CHART_H}>
          {/* Y axis labels */}
          <SvgText
            x={PAD.left - 6}
            y={PAD.top + innerH / 2}
            fill={colors.textMuted}
            fontSize={10}
            textAnchor="end"
            alignmentBaseline="middle"
          >
            {minW}
          </SvgText>
          <SvgText
            x={PAD.left - 6}
            y={PAD.top + 2}
            fill={colors.textMuted}
            fontSize={10}
            textAnchor="end"
            alignmentBaseline="middle"
          >
            {maxW}
          </SvgText>

          {/* Subtle horizontal grid */}
          <Line
            x1={PAD.left}
            y1={PAD.top + innerH}
            x2={PAD.left + innerW}
            y2={PAD.top + innerH}
            stroke={colors.borderSubtle}
            strokeWidth={1}
          />
          <Line
            x1={PAD.left}
            y1={PAD.top + innerH / 2}
            x2={PAD.left + innerW}
            y2={PAD.top + innerH / 2}
            stroke={colors.borderSubtle}
            strokeWidth={1}
            strokeDasharray="2,4"
            opacity={0.6}
          />

          {/* Filled area under the curve */}
          <Polygon
            points={areaPoints}
            fill={colors.primary}
            opacity={0.12}
          />

          {/* Line */}
          <Polyline
            points={polyPoints}
            fill="none"
            stroke={colors.primary}
            strokeWidth={2.5}
            strokeLinejoin="round"
            strokeLinecap="round"
          />

          {/* Dots + X labels */}
          {points.map((p, i) => (
            <React.Fragment key={i}>
              <Circle
                cx={toX(i)}
                cy={toY(p.weight)}
                r={i === points.length - 1 ? 5 : 4}
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

      <View style={styles.footer}>
        <Text style={styles.footerLabel}>Latest</Text>
        <Text style={styles.lastValue}>{points[points.length - 1].weight} kg</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  exerciseName: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.1,
    flex: 1,
    marginRight: 8,
  },
  trendPill: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    borderWidth: 1,
  },
  trendText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  chartRow: {
    alignItems: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
  },
  footerLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  lastValue: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  empty: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginBottom: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 4,
  },
  emptyTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  emptyText: {
    color: colors.textMuted,
    fontSize: 12,
  },
});
