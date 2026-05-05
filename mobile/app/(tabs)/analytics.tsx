import { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { usePlans } from '@/src/hooks/usePlans';
import { colors } from '@/src/theme/colors';
import type { Plan } from '@/src/types/api';

function isCompleted(plan: Plan) {
  return plan.exercises.length > 0 && plan.exercises.every(e => e.done);
}

function monthKey(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

export default function AnalyticsScreen() {
  const { user } = useAuth();
  const { data: plans, isLoading, isRefreshing, refresh } = usePlans(user?.id);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    (plans ?? []).forEach(p => { if (p.date) set.add(monthKey(p.date)); });
    return [...set].sort((a, b) => b.localeCompare(a));
  }, [plans]);

  const activeMonth =
    selectedMonth && availableMonths.includes(selectedMonth)
      ? selectedMonth
      : availableMonths[0] ?? null;

  const stats = useMemo(() => {
    if (!activeMonth || !plans) return null;
    const [selYear, selMon] = activeMonth.split('-').map(Number);

    const monthPlans = plans.filter(p => {
      if (!p.date) return false;
      const d = new Date(p.date);
      return d.getFullYear() === selYear && d.getMonth() === selMon - 1;
    });
    const completedPlans = monthPlans.filter(isCompleted);
    const completionRate =
      monthPlans.length > 0
        ? Math.round((completedPlans.length / monthPlans.length) * 100)
        : 0;
    const totalExercises = monthPlans.reduce(
      (sum, p) => sum + p.exercises.filter(e => e.done).length,
      0,
    );

    const byType: Record<string, number> = {};
    completedPlans.forEach(p => {
      const t = p.title || 'Untitled';
      byType[t] = (byType[t] || 0) + 1;
    });
    const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]);
    const maxType = sortedTypes[0]?.[1] ?? 1;

    // All-time completed plans for streaks
    const allCompleted = plans.filter(isCompleted);
    const oneDay = 86400000;
    const completedDates = [
      ...new Set(
        allCompleted.map(p => {
          const d = new Date(p.date!);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        }),
      ),
    ].sort((a, b) => b - a);

    let currentStreak = 0;
    if (completedDates.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      let check = today.getTime();
      if (completedDates.includes(check)) {
        currentStreak = 1;
        check -= oneDay;
      } else {
        check -= oneDay;
        if (completedDates.includes(check)) {
          currentStreak = 1;
          check -= oneDay;
        }
      }
      while (completedDates.includes(check)) {
        currentStreak++;
        check -= oneDay;
      }
    }

    let bestStreak = 0;
    if (completedDates.length > 0) {
      const sorted = [...completedDates].sort((a, b) => a - b);
      let streak = 1;
      for (let i = 1; i < sorted.length; i++) {
        if (sorted[i] - sorted[i - 1] === oneDay) {
          streak++;
        } else {
          bestStreak = Math.max(bestStreak, streak);
          streak = 1;
        }
      }
      bestStreak = Math.max(bestStreak, streak);
    }

    const recentSessions = [...allCompleted]
      .sort((a, b) => new Date(b.date!).getTime() - new Date(a.date!).getTime())
      .slice(0, 5);

    return {
      monthPlans,
      completedPlans,
      completionRate,
      totalExercises,
      sortedTypes,
      maxType,
      currentStreak,
      bestStreak,
      allCompleted,
      recentSessions,
    };
  }, [activeMonth, plans]);

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const monthLabel = activeMonth
    ? new Date(
        Number(activeMonth.split('-')[0]),
        Number(activeMonth.split('-')[1]) - 1,
      ).toLocaleString('default', { month: 'long', year: 'numeric' })
    : '';

  return (
    <ScrollView
      style={s.scroll}
      contentContainerStyle={s.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <Text style={s.heading}>Analytics</Text>
      <Text style={s.sub}>Your performance over time</Text>

      {/* Month selector */}
      {availableMonths.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginBottom: 20 }}
          contentContainerStyle={{ gap: 8 }}
        >
          {availableMonths.map(m => {
            const [y, mo] = m.split('-').map(Number);
            const lbl = new Date(y, mo - 1).toLocaleString('default', {
              month: 'short',
              year: 'numeric',
            });
            return (
              <TouchableOpacity
                key={m}
                onPress={() => setSelectedMonth(m)}
                style={[s.monthBtn, m === activeMonth && s.monthBtnActive]}
              >
                <Text style={[s.monthBtnText, m === activeMonth && s.monthBtnTextActive]}>
                  {lbl}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {!stats ? (
        <Text style={s.empty}>No workout data yet. Complete sessions to see analytics.</Text>
      ) : (
        <>
          {/* Monthly Overview */}
          <Text style={s.sectionTitle}>{monthLabel} Overview</Text>
          <View style={s.statRow}>
            <View style={s.statCard}>
              <Text style={s.statValue}>{stats.completionRate}%</Text>
              <Text style={s.statLabel}>Completion Rate</Text>
              <View style={s.progressTrack}>
                <View
                  style={[
                    s.progressFill,
                    { width: `${stats.completionRate}%` as any },
                  ]}
                />
              </View>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>
                {stats.completedPlans.length}/{stats.monthPlans.length}
              </Text>
              <Text style={s.statLabel}>Sessions Done</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>{stats.totalExercises}</Text>
              <Text style={s.statLabel}>Exercises Done</Text>
            </View>
          </View>

          {/* Streaks */}
          <Text style={s.sectionTitle}>Streaks & Consistency</Text>
          <View style={s.statRow}>
            <View style={s.statCard}>
              <Text style={[s.statValue, { color: colors.primary }]}>
                {stats.currentStreak}
              </Text>
              <Text style={s.statLabel}>Current Streak</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>{stats.bestStreak}</Text>
              <Text style={s.statLabel}>Best Streak</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statValue}>{stats.allCompleted.length}</Text>
              <Text style={s.statLabel}>Total Sessions</Text>
            </View>
          </View>

          {/* Sessions by training type */}
          {stats.sortedTypes.length > 0 && (
            <>
              <Text style={s.sectionTitle}>Sessions by Training Type</Text>
              <View style={s.section}>
                {stats.sortedTypes.map(([title, count]) => (
                  <View key={title} style={s.barRow}>
                    <Text style={s.barLabel} numberOfLines={1}>
                      {title}
                    </Text>
                    <View style={s.barTrack}>
                      <View
                        style={[
                          s.barFill,
                          { width: `${Math.round((count / stats.maxType) * 100)}%` as any },
                        ]}
                      />
                    </View>
                    <Text style={s.barCount}>{count}</Text>
                  </View>
                ))}
              </View>
            </>
          )}

          {/* Recent activity */}
          <Text style={s.sectionTitle}>Recent Activity</Text>
          {stats.recentSessions.length === 0 ? (
            <Text style={s.empty}>No completed sessions yet.</Text>
          ) : (
            <View style={s.section}>
              {stats.recentSessions.map((plan, idx) => (
                <View
                  key={plan.id}
                  style={[
                    s.recentItem,
                    idx === stats.recentSessions.length - 1 && { borderBottomWidth: 0 },
                  ]}
                >
                  <Text style={s.recentDate}>
                    {new Date(plan.date!).toLocaleDateString('default', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })}
                  </Text>
                  <Text style={s.recentTitle}>{plan.title}</Text>
                  <Text style={s.recentCount}>{plan.exercises.length} exercises</Text>
                </View>
              ))}
            </View>
          )}
        </>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2, marginBottom: 16 },
  monthBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  monthBtnActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  monthBtnText: { color: colors.textMuted, fontSize: 13, fontWeight: '500' },
  monthBtnTextActive: { color: '#fff' },
  sectionTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 10,
    marginTop: 8,
  },
  statRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    gap: 4,
  },
  statValue: { color: colors.text, fontSize: 20, fontWeight: '700' },
  statLabel: { color: colors.textMuted, fontSize: 10, textAlign: 'center' },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border,
    borderRadius: 2,
    width: '100%',
    marginTop: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 4, backgroundColor: colors.primary, borderRadius: 2 },
  section: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 10,
    marginBottom: 16,
  },
  barRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  barLabel: { color: colors.text, fontSize: 12, width: 80 },
  barTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.border,
    borderRadius: 4,
    overflow: 'hidden',
  },
  barFill: { height: 8, backgroundColor: colors.primary, borderRadius: 4 },
  barCount: { color: colors.textMuted, fontSize: 12, width: 20, textAlign: 'right' },
  recentItem: {
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderSubtle,
  },
  recentDate: { color: colors.textMuted, fontSize: 11 },
  recentTitle: { color: colors.text, fontWeight: '600', fontSize: 14, marginTop: 1 },
  recentCount: { color: colors.textMuted, fontSize: 12, marginTop: 1 },
  empty: { color: colors.textMuted, fontSize: 14, textAlign: 'center', marginTop: 40 },
});
