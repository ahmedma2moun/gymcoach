import { useCallback } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/auth/AuthContext';
import { usePlans } from '@/src/hooks/usePlans';
import { apiFetch } from '@/src/api/client';
import { ExerciseItem } from '@/src/components/ExerciseItem';
import { Badge, EmptyState } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

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
  const allDone = done === total && total > 0;

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      {/* Stats hero */}
      <View style={[styles.statsCard, allDone && styles.statsCardDone]}>
        <View style={styles.statsRow}>
          <View style={styles.statBlock}>
            <Text style={styles.statValue}>{done}<Text style={styles.statValueSub}>/{total}</Text></Text>
            <Text style={styles.statLabel}>Exercises</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statBlock}>
            <Text style={[styles.statValue, allDone && { color: colors.success }]}>{pct}%</Text>
            <Text style={styles.statLabel}>Complete</Text>
          </View>
          <View style={styles.statBadgeWrap}>
            <Badge
              label={allDone ? '✓ Done' : 'In Progress'}
              variant={allDone ? 'success' : 'warning'}
            />
          </View>
        </View>

        {/* Progress bar */}
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${pct}%` as any, backgroundColor: allDone ? colors.success : colors.primary }]} />
        </View>
      </View>

      {/* Exercises */}
      <View style={styles.sectionHeader}>
        <Ionicons name="list-outline" size={14} color={colors.textMuted} />
        <Text style={styles.sectionTitle}>Exercises</Text>
      </View>

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
    borderRadius: 20,
    padding: 18,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 14,
  },
  statsCardDone: {
    borderColor: colors.success + '50',
    backgroundColor: colors.success + '08',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statBlock: { flex: 1 },
  statValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.8,
  },
  statValueSub: {
    color: colors.textMuted,
    fontSize: 18,
    fontWeight: '600',
  },
  statLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  divider: {
    width: 1,
    height: 36,
    backgroundColor: colors.borderSubtle,
  },
  statBadgeWrap: {
    alignItems: 'flex-end',
  },
  progressBar: {
    height: 8,
    backgroundColor: colors.surface2,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: 8,
    borderRadius: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  sectionTitle: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
});
