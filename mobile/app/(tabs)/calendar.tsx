import { useState, useMemo } from 'react';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
  RefreshControl,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/auth/AuthContext';
import { usePlans } from '@/src/hooks/usePlans';
import { colors } from '@/src/theme/colors';
import type { Plan } from '@/src/types/api';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SCREEN_W = Dimensions.get('window').width;
const CELL_W = Math.floor((SCREEN_W - 32) / 7);

function planStatus(plan: Plan, today: Date): 'done' | 'missed' | 'pending' {
  if (plan.exercises.length > 0 && plan.exercises.every(e => e.done)) return 'done';
  const planDay = new Date(plan.date!);
  planDay.setHours(0, 0, 0, 0);
  const todayMid = new Date(today);
  todayMid.setHours(0, 0, 0, 0);
  return planDay < todayMid ? 'missed' : 'pending';
}

export default function CalendarScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: plans, isLoading, isRefreshing, refresh } = usePlans(user?.id);
  const today = new Date();

  const [current, setCurrent] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const plansByDate = useMemo(() => {
    const map: Record<string, Plan[]> = {};
    (plans ?? []).forEach(p => {
      if (!p.date) return;
      const d = new Date(p.date);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(p);
    });
    return map;
  }, [plans]);

  const selectedPlans = useMemo(() => {
    if (!selectedDate) return [];
    const d = new Date(selectedDate);
    return plansByDate[`${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`] ?? [];
  }, [selectedDate, plansByDate]);

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={s.content}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <Text style={s.eyebrow}>Schedule</Text>
        <Text style={s.heading}>Calendar</Text>
        <Text style={s.sub}>Your scheduled workouts</Text>

        {/* Month navigation */}
        <View style={s.calendarCard}>
          <View style={s.navRow}>
            <TouchableOpacity
              onPress={() => setCurrent(new Date(year, month - 1, 1))}
              style={s.navBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-back" size={20} color={colors.primary} />
            </TouchableOpacity>
            <Text style={s.monthTitle}>{MONTHS[month]} {year}</Text>
            <TouchableOpacity
              onPress={() => setCurrent(new Date(year, month + 1, 1))}
              style={s.navBtn}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            </TouchableOpacity>
          </View>

          {/* Day labels */}
          <View style={s.dayLabels}>
            {DAYS.map((d, i) => (
              <Text key={`${d}-${i}`} style={[s.dayLabel, { width: CELL_W }]}>{d}</Text>
            ))}
          </View>

          {/* Calendar grid */}
          <View style={s.grid}>
            {cells.map((day, i) => {
              if (!day) return <View key={`e-${i}`} style={{ width: CELL_W, height: 50 }} />;
              const key = `${year}-${month}-${day}`;
              const dayPlans = plansByDate[key] ?? [];
              const isToday =
                today.getDate() === day &&
                today.getMonth() === month &&
                today.getFullYear() === year;

              const hasMissed = dayPlans.some(p => planStatus(p, today) === 'missed');
              const hasDone = dayPlans.some(p => planStatus(p, today) === 'done');
              const hasPending = dayPlans.some(p => planStatus(p, today) === 'pending');

              let dotColor = colors.primary;
              if (hasMissed) dotColor = colors.danger;
              else if (hasDone) dotColor = colors.success;
              else if (hasPending) dotColor = colors.warning;

              return (
                <TouchableOpacity
                  key={key}
                  style={[s.dayCell, { width: CELL_W }, isToday && s.todayCell]}
                  onPress={() => {
                    if (dayPlans.length > 0) {
                      setSelectedDate(new Date(year, month, day).toISOString());
                    }
                  }}
                  activeOpacity={dayPlans.length > 0 ? 0.7 : 1}
                >
                  <Text style={[s.dayNum, isToday && s.todayNum]}>{day}</Text>
                  {dayPlans.length > 0 && (
                    <View style={[s.dot, { backgroundColor: dotColor }]} />
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Legend */}
        <View style={s.legend}>
          {[
            { color: colors.success, label: 'Completed' },
            { color: colors.warning, label: 'Upcoming' },
            { color: colors.danger, label: 'Missed' },
          ].map(({ color, label }) => (
            <View key={label} style={s.legendItem}>
              <View style={[s.legendDot, { backgroundColor: color }]} />
              <Text style={s.legendLabel}>{label}</Text>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Day plans bottom sheet */}
      <Modal
        visible={!!selectedDate}
        animationType="slide"
        transparent
        onRequestClose={() => setSelectedDate(null)}
      >
        <View style={s.overlay}>
          <View style={s.sheet}>
            <View style={s.handle} />
            <Text style={s.sheetTitle}>
              {selectedDate
                ? new Date(selectedDate).toLocaleDateString('default', {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })
                : ''}
            </Text>

            {selectedPlans.map(plan => {
              const status = planStatus(plan, today);
              const doneCount = plan.exercises.filter(e => e.done).length;
              const statusColor =
                status === 'done' ? colors.success :
                status === 'missed' ? colors.danger : colors.primary;
              const statusBg =
                status === 'done' ? colors.success + '20' :
                status === 'missed' ? colors.danger + '20' : colors.primary + '20';

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={s.planRow}
                  onPress={() => {
                    setSelectedDate(null);
                    router.push(`/plans/${plan.id}?userId=${user?.id}`);
                  }}
                  activeOpacity={0.85}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.planTitle}>{plan.title}</Text>
                    <Text style={s.planMeta}>
                      {doneCount}/{plan.exercises.length} exercises done
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusBg, borderColor: statusColor + '50' }]}>
                    <Text style={[s.statusText, { color: statusColor }]}>
                      {status === 'done' ? 'Done' : status === 'missed' ? 'Missed' : 'Open'}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity style={s.closeBtn} onPress={() => setSelectedDate(null)}>
              <Text style={s.closeTxt}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heading: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    marginTop: 4,
    letterSpacing: -0.6,
  },
  sub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 18,
    fontWeight: '500',
  },
  calendarCard: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    padding: 12,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
    paddingHorizontal: 4,
  },
  navBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  monthTitle: { color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  dayLabels: { flexDirection: 'row', marginBottom: 6 },
  dayLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  todayCell: {
    backgroundColor: colors.primary + '22',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '50',
  },
  dayNum: { color: colors.text, fontSize: 14, fontWeight: '600' },
  todayNum: { color: colors.primary, fontWeight: '800' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 20 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '500' },
  overlay: { flex: 1, backgroundColor: '#000000cc', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    gap: 10,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderColor: colors.borderSubtle,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginBottom: 8,
  },
  sheetTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 4,
    letterSpacing: -0.3,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface2,
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  planTitle: { color: colors.text, fontWeight: '700', fontSize: 15 },
  planMeta: { color: colors.textMuted, fontSize: 12, marginTop: 3 },
  statusBadge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
  },
  statusText: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
  closeBtn: { marginTop: 8, alignItems: 'center', padding: 12 },
  closeTxt: { color: colors.primary, fontWeight: '700', fontSize: 15 },
});
