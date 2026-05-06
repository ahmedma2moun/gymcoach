import { useState, useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  Alert,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { useAuth } from '@/src/auth/AuthContext';
import { usePlans } from '@/src/hooks/usePlans';
import { apiFetch } from '@/src/api/client';
import { ExerciseItem } from '@/src/components/ExerciseItem';
import { Badge, EmptyState } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import type { Plan } from '@/src/types/api';

export default function PlanDetailScreen() {
  const { planId, userId: queryUserId } = useLocalSearchParams<{ planId: string; userId?: string }>();
  const { user } = useAuth();

  // Admin can view any user's plan by passing userId as query param
  const targetUserId = queryUserId ?? user?.id;

  const { data: plans, isRefreshing, refresh } = usePlans(targetUserId);
  const navigation = useNavigation();

  const plan = plans?.find((p) => String(p.id) === planId);

  // Set the header title once plan is loaded
  useLayoutEffect(() => {
    if (plan) {
      navigation.setOptions({ title: plan.title });
    }
  }, [plan, navigation]);

  const handleToggle = useCallback(
    async (
      exerciseIndex: number,
      done: boolean,
      weightKg: string,
      weightLbs: string,
      userNote: string,
    ) => {
      if (!planId) return;
      await apiFetch(`/api/plans/${planId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          exerciseIndex,
          done,
          weightKg: weightKg || undefined,
          weightLbs: weightLbs || undefined,
          userNote: userNote || undefined,
        }),
      });
      await refresh();
    },
    [planId, refresh],
  );

  if (!plans) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (!plan) {
    return (
      <View style={styles.center}>
        <Text style={{ color: colors.textMuted }}>Plan not found.</Text>
      </View>
    );
  }

  const done = plan.exercises.filter((e) => e.done).length;
  const total = plan.exercises.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  // Group by supersetId for visual rendering
  const supersets = new Set(plan.exercises.map((e) => e.supersetId).filter(Boolean));

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      {/* Stats header */}
      <View style={styles.statsCard}>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{done}/{total}</Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.stat}>
            <Text style={styles.statValue}>{pct}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          <Badge
            label={done === total && total > 0 ? '✓ Done' : 'In Progress'}
            variant={done === total && total > 0 ? 'success' : 'warning'}
          />
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
        </View>
      </View>

      {/* Exercises */}
      <Text style={styles.sectionTitle}>Exercises</Text>

      {plan.exercises.length === 0 ? (
        <EmptyState message="No exercises in this plan." />
      ) : (
        plan.exercises.map((exercise, index) => (
          <ExerciseItem
            key={`${plan.id}-${index}`}
            exercise={exercise}
            index={index}
            planId={plan.id}
            onToggleDone={handleToggle}
          />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  statsCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stat: { flex: 1 },
  statValue: { color: colors.text, fontSize: 22, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  progressBar: {
    height: 5,
    backgroundColor: colors.borderSubtle,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: 5,
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
});
