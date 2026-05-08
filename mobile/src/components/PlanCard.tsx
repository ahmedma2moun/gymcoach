import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import { Badge } from './ui';
import type { Plan } from '@/src/types/api';

function formatDate(iso?: string) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

export function PlanCard({ plan, onPress }: { plan: Plan; onPress: () => void }) {
  const total = plan.exercises.length;
  const done = plan.exercises.filter((e) => e.done).length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;
  const completed = done === total && total > 0;

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      {/* Accent stripe down the left side */}
      <View style={[styles.accent, completed && styles.accentDone]} />

      <View style={styles.body}>
        <View style={styles.header}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <Text style={styles.title} numberOfLines={1}>
              {plan.title}
            </Text>
            {plan.date && (
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={11} color={colors.textMuted} />
                <Text style={styles.date}>{formatDate(plan.date)}</Text>
              </View>
            )}
          </View>
          <Badge
            label={completed ? 'Done' : `${pct}%`}
            variant={completed ? 'success' : pct > 0 ? 'warning' : 'default'}
          />
        </View>

        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: completed ? colors.success : colors.primary }]} />
        </View>

        <View style={styles.footer}>
          <Text style={styles.meta}>
            {done}/{total} exercises
          </Text>
          <View style={styles.chevronWrap}>
            <Ionicons name="chevron-forward" size={14} color={colors.textMuted} />
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 18,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  accent: {
    width: 4,
    backgroundColor: colors.primary,
  },
  accentDone: {
    backgroundColor: colors.success,
  },
  body: {
    flex: 1,
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  title: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: -0.2,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: colors.surface2,
    borderRadius: 3,
    marginBottom: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: 6,
    borderRadius: 3,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    color: colors.textSub,
    fontSize: 13,
    fontWeight: '500',
  },
  chevronWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
