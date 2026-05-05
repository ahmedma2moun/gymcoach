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
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.header}>
        <Text style={styles.title} numberOfLines={1}>
          {plan.title}
        </Text>
        <Badge
          label={completed ? 'Done' : `${pct}%`}
          variant={completed ? 'success' : pct > 0 ? 'warning' : 'default'}
        />
      </View>

      {plan.date && (
        <Text style={styles.date}>{formatDate(plan.date)}</Text>
      )}

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
      </View>

      <View style={styles.footer}>
        <Text style={styles.meta}>
          {done}/{total} exercises
        </Text>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  title: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
    flex: 1,
    marginRight: 8,
  },
  date: {
    color: colors.textMuted,
    fontSize: 12,
    marginBottom: 10,
  },
  progressBar: {
    height: 4,
    backgroundColor: colors.borderSubtle,
    borderRadius: 2,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.primary,
    borderRadius: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  meta: {
    color: colors.textMuted,
    fontSize: 13,
  },
});
