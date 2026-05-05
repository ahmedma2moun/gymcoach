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
import { useAuth } from '@/src/auth/AuthContext';
import { usePlans } from '@/src/hooks/usePlans';
import { colors } from '@/src/theme/colors';
import type { Plan } from '@/src/types/api';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
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
        <Text style={s.heading}>Calendar</Text>
        <Text style={s.sub}>Your scheduled workouts</Text>

        {/* Month navigation */}
        <View style={s.navRow}>
          <TouchableOpacity
            onPress={() => setCurrent(new Date(year, month - 1, 1))}
            style={s.navBtn}
          >
            <Text style={s.navArrow}>‹</Text>
          </TouchableOpacity>
          <Text style={s.monthTitle}>{MONTHS[month]} {year}</Text>
          <TouchableOpacity
            onPress={() => setCurrent(new Date(year, month + 1, 1))}
            style={s.navBtn}
          >
            <Text style={s.navArrow}>›</Text>
          </TouchableOpacity>
        </View>

        {/* Day labels */}
        <View style={s.dayLabels}>
          {DAYS.map(d => (
            <Text key={d} style={[s.dayLabel, { width: CELL_W }]}>{d}</Text>
          ))}
        </View>

        {/* Calendar grid */}
        <View style={s.grid}>
          {cells.map((day, i) => {
            if (!day) return <View key={`e-${i}`} style={{ width: CELL_W, height: 48 }} />;
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

        {/* Legend */}
        <View style={s.legend}>
          {[
            { color: colors.success, label: 'Completed' },
            { color: colors.danger, label: 'Missed' },
            { color: colors.warning, label: 'Upcoming' },
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

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={s.planRow}
                  onPress={() => {
                    setSelectedDate(null);
                    router.push(`/plans/${plan.id}?userId=${user?.id}`);
                  }}
                  activeOpacity={0.8}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={s.planTitle}>{plan.title}</Text>
                    <Text style={s.planMeta}>
                      {doneCount}/{plan.exercises.length} exercises done
                    </Text>
                  </View>
                  <View style={[s.statusBadge, { backgroundColor: statusColor }]}>
                    <Text style={s.statusText}>
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
  heading: { color: colors.text, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2, marginBottom: 20 },
  navRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navBtn: { padding: 8 },
  navArrow: { color: colors.primary, fontSize: 28, fontWeight: '300', lineHeight: 32 },
  monthTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },
  dayLabels: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: { color: colors.textMuted, fontSize: 11, fontWeight: '600', textAlign: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  dayCell: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  todayCell: { backgroundColor: colors.primary + '22', borderRadius: 8 },
  dayNum: { color: colors.text, fontSize: 14, fontWeight: '500' },
  todayNum: { color: colors.primary, fontWeight: '700' },
  dot: { width: 6, height: 6, borderRadius: 3 },
  legend: { flexDirection: 'row', justifyContent: 'center', gap: 20, marginTop: 24 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendLabel: { color: colors.textMuted, fontSize: 12 },
  overlay: { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 10,
    paddingBottom: 40,
  },
  sheetTitle: { color: colors.text, fontSize: 17, fontWeight: '700', marginBottom: 4 },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  planTitle: { color: colors.text, fontWeight: '600', fontSize: 15 },
  planMeta: { color: colors.textMuted, fontSize: 12, marginTop: 2 },
  statusBadge: { borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  statusText: { color: '#fff', fontSize: 12, fontWeight: '600' },
  closeBtn: { marginTop: 4, alignItems: 'center', padding: 12 },
  closeTxt: { color: colors.primary, fontWeight: '600', fontSize: 15 },
});
