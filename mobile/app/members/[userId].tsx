import { useState, useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePlans } from '@/src/hooks/usePlans';
import { useLibrary } from '@/src/hooks/useLibrary';
import { useUsers } from '@/src/hooks/useUsers';
import { apiFetch } from '@/src/api/client';
import { PlanCard } from '@/src/components/PlanCard';
import { EmptyState, Button } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import type { LibraryExercise, Plan } from '@/src/types/api';

const DAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];
const SCREEN_W = Dimensions.get('window').width;
const CELL_W = Math.floor((SCREEN_W - 80) / 7);

type ExerciseForm = {
  name: string;
  sets: string;
  reps: string;
  coachNote: string;
  videoUrl: string;
  supersetId?: string | null;
};

const defaultEx = (): ExerciseForm => ({
  name: '', sets: '3', reps: '10', coachNote: '', videoUrl: '', supersetId: null,
});

// ── Date helper ───────────────────────────────────────────────────────────────
function toLocalISO(year: number, month: number, day: number) {
  const mm = String(month + 1).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${year}-${mm}-${dd}`;
}

// ── Calendar step ─────────────────────────────────────────────────────────────
function CalendarPicker({
  planDates,
  onSelect,
  onClose,
}: {
  planDates: Set<string>;
  onSelect: (iso: string) => void;
  onClose: () => void;
}) {
  const [current, setCurrent] = useState(() => {
    const d = new Date(); d.setDate(1); return d;
  });
  const today = new Date(); today.setHours(0, 0, 0, 0);
  const year = current.getFullYear();
  const month = current.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();

  const cells: (number | null)[] = [
    ...Array(firstDay).fill(null),
    ...Array.from({ length: daysInMonth }, (_, i) => i + 1),
  ];

  return (
    <View>
      <View style={cs.navRow}>
        <TouchableOpacity onPress={() => setCurrent(new Date(year, month - 1, 1))} style={cs.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-back" size={18} color={colors.primary} />
        </TouchableOpacity>
        <Text style={cs.monthTitle}>{MONTHS[month]} {year}</Text>
        <TouchableOpacity onPress={() => setCurrent(new Date(year, month + 1, 1))} style={cs.navBtn} activeOpacity={0.7}>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </TouchableOpacity>
      </View>

      <View style={cs.dayLabels}>
        {DAYS.map((d, i) => <Text key={`${d}-${i}`} style={[cs.dayLabel, { width: CELL_W }]}>{d}</Text>)}
      </View>

      <View style={cs.grid}>
        {cells.map((day, i) => {
          if (!day) return <View key={`e-${i}`} style={{ width: CELL_W, height: 44 }} />;

          const iso = toLocalISO(year, month, day);
          const cellDate = new Date(year, month, day);
          const isPast = cellDate < today;
          const hasPlan = planDates.has(iso);
          const isToday = cellDate.getTime() === today.getTime();

          return (
            <TouchableOpacity
              key={iso}
              style={[
                cs.cell,
                { width: CELL_W },
                isToday && cs.todayCell,
                isPast && cs.pastCell,
              ]}
              onPress={() => { if (!isPast) onSelect(iso); }}
              activeOpacity={isPast ? 1 : 0.7}
            >
              <Text style={[cs.dayNum, isToday && cs.todayNum, isPast && cs.pastNum]}>{day}</Text>
              {hasPlan && <View style={[cs.dot, { backgroundColor: colors.primary }]} />}
            </TouchableOpacity>
          );
        })}
      </View>

      <TouchableOpacity style={cs.cancelBtn} onPress={onClose}>
        <Text style={cs.cancelTxt}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Searchable exercise row ───────────────────────────────────────────────────
function ExerciseRow({
  ex,
  index,
  library,
  onUpdate,
  onRemove,
  canRemove,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  isSelected,
  onToggleSelect,
  inSuperset,
}: {
  ex: ExerciseForm;
  index: number;
  library: LibraryExercise[];
  onUpdate: (field: keyof ExerciseForm, value: string) => void;
  onRemove: () => void;
  canRemove: boolean;
  isFirst: boolean;
  isLast: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isSelected: boolean;
  onToggleSelect: () => void;
  inSuperset?: boolean;
}) {
  const [focused, setFocused] = useState(false);

  const suggestions = useMemo(() => {
    if (!ex.name.trim()) return library.slice(0, 8);
    return library
      .filter(l => l.name.toLowerCase().includes(ex.name.toLowerCase()))
      .slice(0, 8);
  }, [ex.name, library]);

  const showDropdown = focused && suggestions.length > 0;

  return (
    <View style={[es.block, inSuperset && es.blockInSuperset, isSelected && es.blockSelected]}>
      <View style={es.header}>
        {!inSuperset && (
          <TouchableOpacity
            onPress={onToggleSelect}
            style={[es.selectBtn, isSelected && es.selectBtnActive]}
            hitSlop={8}
            activeOpacity={0.7}
          >
            {isSelected && <Ionicons name="checkmark" size={11} color="#fff" />}
          </TouchableOpacity>
        )}

        <View style={es.indexBadge}>
          <Text style={es.indexBadgeTxt}>{index + 1}</Text>
        </View>
        <Text style={es.indexLabel}>Exercise {index + 1}</Text>

        {!inSuperset && (
          <>
            <TouchableOpacity
              onPress={onMoveUp}
              disabled={isFirst}
              hitSlop={8}
              style={[es.moveBtn, isFirst && es.moveBtnDisabled]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-up" size={16} color={isFirst ? colors.textDim : colors.textSub} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onMoveDown}
              disabled={isLast}
              hitSlop={8}
              style={[es.moveBtn, isLast && es.moveBtnDisabled]}
              activeOpacity={0.7}
            >
              <Ionicons name="chevron-down" size={16} color={isLast ? colors.textDim : colors.textSub} />
            </TouchableOpacity>
          </>
        )}

        <View style={{ flex: 1 }} />
        {canRemove && (
          <TouchableOpacity onPress={onRemove} hitSlop={8}>
            <Ionicons name="close-circle" size={20} color={colors.danger} />
          </TouchableOpacity>
        )}
      </View>

      {/* Searchable name */}
      <TextInput
        style={es.input}
        placeholder="Search or type exercise name…"
        placeholderTextColor={colors.textDim}
        value={ex.name}
        onChangeText={v => onUpdate('name', v)}
        onFocus={() => setFocused(true)}
        onBlur={() => setTimeout(() => setFocused(false), 150)}
      />

      {showDropdown && (
        <View style={es.dropdown}>
          {suggestions.map(lib => (
            <TouchableOpacity
              key={lib.id}
              style={es.dropItem}
              onPress={() => {
                onUpdate('name', lib.name);
                onUpdate('videoUrl', lib.videoUrl ?? '');
                setFocused(false);
              }}
            >
              <Text style={es.dropText}>{lib.name}</Text>
              {lib.videoUrl ? (
                <Ionicons name="play-circle-outline" size={14} color={colors.textMuted} />
              ) : null}
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View style={es.row}>
        <TextInput
          style={[es.input, { flex: 1 }]}
          placeholder="Sets"
          placeholderTextColor={colors.textDim}
          value={ex.sets}
          onChangeText={v => onUpdate('sets', v)}
          keyboardType="number-pad"
        />
        <TextInput
          style={[es.input, { flex: 1 }]}
          placeholder="Reps"
          placeholderTextColor={colors.textDim}
          value={ex.reps}
          onChangeText={v => onUpdate('reps', v)}
        />
      </View>
      <TextInput
        style={es.input}
        placeholder="Coach note (optional)"
        placeholderTextColor={colors.textDim}
        value={ex.coachNote}
        onChangeText={v => onUpdate('coachNote', v)}
      />
    </View>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────
export default function MemberPlansScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const { data: users } = useUsers();
  const member = users?.find(u => String(u.id) === userId);

  const { data: plans, isLoading, isRefreshing, refresh, reload } = usePlans(userId);
  const { data: library } = useLibrary();

  const [step, setStep] = useState<'closed' | 'calendar' | 'form'>('closed');
  const [planDate, setPlanDate] = useState<string | null>(null);
  const [planTitle, setPlanTitle] = useState('');
  const [exercises, setExercises] = useState<ExerciseForm[]>([defaultEx()]);
  const [saving, setSaving] = useState(false);
  const [selectedExercises, setSelectedExercises] = useState<number[]>([]);

  const [cloningPlan, setCloningPlan] = useState<Plan | null>(null);
  const [cloneToUserPlan, setCloneToUserPlan] = useState<Plan | null>(null);
  const [cloneUserStep, setCloneUserStep] = useState<'select' | 'date'>('select');
  const [cloneTargetUserId, setCloneTargetUserId] = useState('');
  const [cloning, setCloning] = useState(false);

  useLayoutEffect(() => {
    if (member) navigation.setOptions({ title: member.username });
  }, [member, navigation]);

  const planDates = useMemo(() => {
    const set = new Set<string>();
    (plans ?? []).forEach(p => {
      if (p.date) set.add(p.date.slice(0, 10));
    });
    return set;
  }, [plans]);

  // ── Superset / reorder helpers ─────────────────────────────────────────────

  function getLogicalUnit(index: number) {
    const ex = exercises[index];
    if (!ex) return { indices: [] as number[], supersetId: null as string | null };
    if (!ex.supersetId) return { indices: [index], supersetId: null };

    const indices: number[] = [];
    exercises.forEach((e, idx) => {
      if (e.supersetId === ex.supersetId) indices.push(idx);
    });
    return { indices: indices.sort((a, b) => a - b), supersetId: ex.supersetId };
  }

  function getAllLogicalUnits() {
    const units: { startIndex: number; endIndex: number; supersetId: string | null }[] = [];
    const processed = new Set<number>();

    exercises.forEach((_, idx) => {
      if (processed.has(idx)) return;
      const unit = getLogicalUnit(idx);
      unit.indices.forEach(i => processed.add(i));
      units.push({
        startIndex: Math.min(...unit.indices),
        endIndex: Math.max(...unit.indices),
        supersetId: unit.supersetId,
      });
    });

    return units;
  }

  function isFirstUnit(index: number) {
    const allUnits = getAllLogicalUnits();
    if (allUnits.length === 0) return true;
    const unit = getLogicalUnit(index);
    return unit.indices.includes(allUnits[0].startIndex);
  }

  function isLastUnit(index: number) {
    const allUnits = getAllLogicalUnits();
    if (allUnits.length === 0) return true;
    const unit = getLogicalUnit(index);
    return unit.indices.includes(allUnits[allUnits.length - 1].startIndex);
  }

  function moveExerciseUp(index: number) {
    const currentUnit = getLogicalUnit(index);
    const allUnits = getAllLogicalUnits();
    const currentUnitIndex = allUnits.findIndex(u => currentUnit.indices.includes(u.startIndex));
    if (currentUnitIndex === 0) return;

    const previousUnit = allUnits[currentUnitIndex - 1];
    const currentExercises = currentUnit.indices.map(i => exercises[i]);
    const previousExercises: ExerciseForm[] = [];
    for (let i = previousUnit.startIndex; i <= previousUnit.endIndex; i++) {
      previousExercises.push(exercises[i]);
    }

    const newExercises: ExerciseForm[] = [];
    for (let i = 0; i < previousUnit.startIndex; i++) newExercises.push(exercises[i]);
    currentExercises.forEach(e => newExercises.push(e));
    previousExercises.forEach(e => newExercises.push(e));
    for (let i = currentUnit.indices[currentUnit.indices.length - 1] + 1; i < exercises.length; i++) {
      newExercises.push(exercises[i]);
    }

    setExercises(newExercises);
    setSelectedExercises([]);
  }

  function moveExerciseDown(index: number) {
    const currentUnit = getLogicalUnit(index);
    const allUnits = getAllLogicalUnits();
    const currentUnitIndex = allUnits.findIndex(u => currentUnit.indices.includes(u.startIndex));
    if (currentUnitIndex === allUnits.length - 1) return;

    const nextUnit = allUnits[currentUnitIndex + 1];
    const currentExercises = currentUnit.indices.map(i => exercises[i]);
    const nextExercises: ExerciseForm[] = [];
    for (let i = nextUnit.startIndex; i <= nextUnit.endIndex; i++) {
      nextExercises.push(exercises[i]);
    }

    const newExercises: ExerciseForm[] = [];
    for (let i = 0; i < currentUnit.indices[0]; i++) newExercises.push(exercises[i]);
    nextExercises.forEach(e => newExercises.push(e));
    currentExercises.forEach(e => newExercises.push(e));
    for (let i = nextUnit.endIndex + 1; i < exercises.length; i++) newExercises.push(exercises[i]);

    setExercises(newExercises);
    setSelectedExercises([]);
  }

  function handleCreateSuperset() {
    if (selectedExercises.length < 2) return;
    const supersetId = 'ss-' + Date.now();
    const sortedIndices = [...selectedExercises].sort((a, b) => a - b);
    const insertIndex = sortedIndices[0];
    const exercisesToGroup = sortedIndices.map(idx => exercises[idx]);

    const newOrder: ExerciseForm[] = [];
    let groupInserted = false;

    for (let i = 0; i < exercises.length; i++) {
      if (i === insertIndex && !groupInserted) {
        exercisesToGroup.forEach(e => newOrder.push({ ...e, supersetId }));
        groupInserted = true;
      }
      if (!selectedExercises.includes(i)) {
        newOrder.push(exercises[i]);
      }
    }

    setExercises(newOrder);
    setSelectedExercises([]);
  }

  function handleUngroupSuperset(supersetId: string) {
    setExercises(prev =>
      prev.map(e => e.supersetId === supersetId ? { ...e, supersetId: null } : e)
    );
  }

  function toggleSelectExercise(idx: number) {
    setSelectedExercises(prev =>
      prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]
    );
  }

  // ── Exercises rendering (groups supersets) ─────────────────────────────────
  function renderExercisesWithSupersets() {
    const result: React.ReactNode[] = [];
    let i = 0;

    while (i < exercises.length) {
      const ex = exercises[i];

      if (ex.supersetId) {
        const sid = ex.supersetId;
        const group: { ex: ExerciseForm; idx: number }[] = [];

        while (i < exercises.length && exercises[i].supersetId === sid) {
          group.push({ ex: exercises[i], idx: i });
          i++;
        }

        const firstIdx = group[0].idx;
        const groupIsFirst = isFirstUnit(firstIdx);
        const groupIsLast = isLastUnit(firstIdx);

        result.push(
          <View key={`ss-${sid}`} style={es.supersetGroup}>
            <View style={es.supersetHeader}>
              <Ionicons name="link-outline" size={12} color={colors.warning} />
              <Text style={es.supersetTitle}>Superset</Text>
              <View style={{ flex: 1 }} />
              <TouchableOpacity
                onPress={() => moveExerciseUp(firstIdx)}
                disabled={groupIsFirst}
                hitSlop={8}
                style={[es.moveBtn, groupIsFirst && es.moveBtnDisabled]}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-up" size={16} color={groupIsFirst ? colors.textDim : colors.textSub} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => moveExerciseDown(firstIdx)}
                disabled={groupIsLast}
                hitSlop={8}
                style={[es.moveBtn, groupIsLast && es.moveBtnDisabled]}
                activeOpacity={0.7}
              >
                <Ionicons name="chevron-down" size={16} color={groupIsLast ? colors.textDim : colors.textSub} />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleUngroupSuperset(sid)}
                hitSlop={8}
                style={es.ungroupBtn}
                activeOpacity={0.7}
              >
                <Text style={es.ungroupTxt}>Ungroup</Text>
              </TouchableOpacity>
            </View>

            {group.map(({ ex: item, idx }) => (
              <ExerciseRow
                key={idx}
                ex={item}
                index={idx}
                library={library ?? []}
                onUpdate={(field, value) => updateExercise(idx, field, value)}
                onRemove={() => removeExercise(idx)}
                canRemove={exercises.length > 1}
                isFirst={false}
                isLast={false}
                onMoveUp={() => {}}
                onMoveDown={() => {}}
                isSelected={false}
                onToggleSelect={() => {}}
                inSuperset
              />
            ))}
          </View>
        );
      } else {
        const idx = i;
        result.push(
          <ExerciseRow
            key={idx}
            ex={ex}
            index={idx}
            library={library ?? []}
            onUpdate={(field, value) => updateExercise(idx, field, value)}
            onRemove={() => removeExercise(idx)}
            canRemove={exercises.length > 1}
            isFirst={isFirstUnit(idx)}
            isLast={isLastUnit(idx)}
            onMoveUp={() => moveExerciseUp(idx)}
            onMoveDown={() => moveExerciseDown(idx)}
            isSelected={selectedExercises.includes(idx)}
            onToggleSelect={() => toggleSelectExercise(idx)}
          />
        );
        i++;
      }
    }

    return result;
  }

  // ── Form actions ───────────────────────────────────────────────────────────

  function openCalendar() {
    setCloningPlan(null);
    setPlanDate(null);
    setPlanTitle('');
    setExercises([defaultEx()]);
    setSelectedExercises([]);
    setStep('calendar');
  }

  function handleDateSelect(iso: string) {
    if (cloningPlan) {
      executeCloneToSameUser(iso);
    } else {
      setPlanDate(iso);
      setStep('form');
    }
  }

  async function executeCloneToSameUser(iso: string) {
    if (!cloningPlan) return;
    setCloning(true);
    try {
      await apiFetch('/api/plans', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          title: cloningPlan.title,
          date: iso,
          exercises: cloningPlan.exercises.map(e => ({
            name: e.name,
            videoUrl: e.videoUrl || undefined,
            sets: e.sets,
            reps: e.reps,
            coachNote: e.coachNote || undefined,
            supersetId: e.supersetId || null,
            done: false,
          })),
        }),
      });
      setCloningPlan(null);
      setStep('closed');
      reload();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCloning(false);
    }
  }

  async function executeCloneToUser(iso: string) {
    if (!cloneToUserPlan || !cloneTargetUserId) return;
    setCloning(true);
    try {
      await apiFetch('/api/plans/clone', {
        method: 'POST',
        body: JSON.stringify({
          planId: cloneToUserPlan.id,
          targetUserId: cloneTargetUserId,
          date: iso,
        }),
      });
      setCloneToUserPlan(null);
      setCloneTargetUserId('');
      setCloneUserStep('select');
      Alert.alert('Success', 'Plan cloned successfully!');
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setCloning(false);
    }
  }

  function addExercise() {
    setExercises(prev => [...prev, defaultEx()]);
  }

  function removeExercise(i: number) {
    setExercises(prev => prev.filter((_, idx) => idx !== i));
    setSelectedExercises(prev => prev.filter(idx => idx !== i).map(idx => idx > i ? idx - 1 : idx));
  }

  function updateExercise(i: number, field: keyof ExerciseForm, value: string) {
    setExercises(prev => prev.map((ex, idx) => idx === i ? { ...ex, [field]: value } : ex));
  }

  async function handleCreate() {
    if (!planTitle.trim()) { Alert.alert('Validation', 'Plan title is required.'); return; }
    const valid = exercises.filter(e => e.name.trim());
    if (valid.length === 0) { Alert.alert('Validation', 'Add at least one exercise.'); return; }
    setSaving(true);
    try {
      await apiFetch('/api/plans', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          title: planTitle.trim(),
          date: planDate,
          exercises: valid.map(e => ({
            name: e.name.trim(),
            sets: e.sets,
            reps: e.reps,
            coachNote: e.coachNote.trim() || undefined,
            videoUrl: e.videoUrl.trim() || undefined,
            supersetId: e.supersetId || null,
          })),
        }),
      });
      setStep('closed');
      setPlanTitle('');
      setExercises([defaultEx()]);
      setSelectedExercises([]);
      reload();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function handleDeletePlan(planId: string, title: string) {
    Alert.alert('Delete plan', `Delete "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          await apiFetch(`/api/plans/${planId}`, { method: 'DELETE' });
          reload();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        style={s.list}
        data={plans ?? []}
        keyExtractor={p => String(p.id)}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        contentContainerStyle={s.content}
        ListHeaderComponent={
          <View style={s.header}>
            <View>
              <Text style={s.eyebrow}>Member</Text>
              <Text style={s.heading}>{member?.username ?? 'Member'}</Text>
              <Text style={s.sub}>Plans assigned</Text>
            </View>
            <TouchableOpacity style={s.addBtn} onPress={openCalendar} activeOpacity={0.85}>
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={<EmptyState message="No plans yet. Tap + to create one." />}
        renderItem={({ item }) => (
          <View>
            <PlanCard plan={item} onPress={() => router.push(`/plans/${item.id}?userId=${userId}`)} />
            <View style={s.planActions}>
              <TouchableOpacity
                style={[s.actionPill, { borderColor: colors.info + '40', backgroundColor: colors.info + '10' }]}
                onPress={() => { setCloningPlan(item as any); setStep('calendar'); }}
                activeOpacity={0.8}
              >
                <Ionicons name="copy-outline" size={13} color={colors.info} />
                <Text style={[s.actionPillTxt, { color: colors.info }]}>Clone</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionPill, { borderColor: colors.secondary + '40', backgroundColor: colors.secondary + '10' }]}
                onPress={() => { setCloneToUserPlan(item as any); setCloneUserStep('select'); setCloneTargetUserId(''); }}
                activeOpacity={0.8}
              >
                <Ionicons name="people-outline" size={13} color={colors.secondary} />
                <Text style={[s.actionPillTxt, { color: colors.secondary }]}>To user</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.actionPill, { borderColor: colors.danger + '40', backgroundColor: colors.danger + '10' }]}
                onPress={() => handleDeletePlan(String(item.id), item.title)}
                activeOpacity={0.8}
              >
                <Ionicons name="trash-outline" size={13} color={colors.danger} />
                <Text style={[s.actionPillTxt, { color: colors.danger }]}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      {/* ── Step 1: Calendar date picker ── */}
      <Modal visible={step === 'calendar'} animationType="slide" transparent onRequestClose={() => { setStep('closed'); setCloningPlan(null); }}>
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { paddingBottom: 24 }]}>
            <View style={s.modalHandle} />
            {cloningPlan ? (
              <>
                <Text style={s.modalTitle}>Clone Plan</Text>
                <View style={s.cloneBanner}>
                  <Ionicons name="copy-outline" size={14} color={colors.info} />
                  <Text style={s.cloneBannerTxt} numberOfLines={1}>"{cloningPlan.title}" → pick a new date</Text>
                </View>
              </>
            ) : (
              <>
                <Text style={s.modalTitle}>Pick a Date</Text>
                <Text style={s.modalSub}>Select the date for this plan</Text>
              </>
            )}
            {cloning ? (
              <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
            ) : (
              <CalendarPicker
                planDates={planDates}
                onSelect={handleDateSelect}
                onClose={() => { setStep('closed'); setCloningPlan(null); }}
              />
            )}
          </View>
        </View>
      </Modal>

      {/* ── Clone to another user ── */}
      <Modal
        visible={!!cloneToUserPlan}
        animationType="slide"
        transparent
        onRequestClose={() => { setCloneToUserPlan(null); setCloneUserStep('select'); }}
      >
        <View style={s.modalOverlay}>
          <View style={[s.modalContent, { paddingBottom: 32 }]}>
            <View style={s.modalHandle} />
            <View style={s.formHeader}>
              {cloneUserStep === 'date' ? (
                <TouchableOpacity onPress={() => setCloneUserStep('select')} style={s.backRow}>
                  <Ionicons name="chevron-back" size={18} color={colors.primary} />
                  <Text style={s.backTxt}>Back</Text>
                </TouchableOpacity>
              ) : <View />}
              <TouchableOpacity onPress={() => { setCloneToUserPlan(null); setCloneUserStep('select'); }} style={s.closeIcon}>
                <Ionicons name="close" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={s.modalTitle}>Clone to User</Text>
            <View style={s.cloneBanner}>
              <Ionicons name="copy-outline" size={14} color={colors.secondary} />
              <Text style={s.cloneBannerTxt} numberOfLines={1}>"{cloneToUserPlan?.title}"</Text>
            </View>

            {cloneUserStep === 'select' ? (
              <>
                <Text style={[s.label, { marginTop: 12 }]}>Select member</Text>
                <ScrollView style={{ maxHeight: 320 }} showsVerticalScrollIndicator={false}>
                  {(users ?? []).filter(u => u.role !== 'admin').map(u => {
                    const selected = String(u.id) === cloneTargetUserId;
                    return (
                      <TouchableOpacity
                        key={String(u.id)}
                        style={[s.userRow, selected && s.userRowSelected]}
                        onPress={() => setCloneTargetUserId(String(u.id))}
                        activeOpacity={0.85}
                      >
                        <View style={s.userAvatar}>
                          <Text style={s.userAvatarTxt}>{u.username[0].toUpperCase()}</Text>
                        </View>
                        <Text style={[s.userRowName, selected && { color: colors.primary }]}>{u.username}</Text>
                        {selected && <Ionicons name="checkmark-circle" size={20} color={colors.primary} />}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <Button
                  label="Next: Pick Date"
                  onPress={() => { if (cloneTargetUserId) setCloneUserStep('date'); }}
                  style={{ marginTop: 16 }}
                />
              </>
            ) : (
              <>
                <Text style={[s.label, { marginTop: 12 }]}>Select date</Text>
                {cloning ? (
                  <ActivityIndicator color={colors.primary} style={{ marginVertical: 40 }} />
                ) : (
                  <CalendarPicker
                    planDates={new Set()}
                    onSelect={executeCloneToUser}
                    onClose={() => setCloneUserStep('select')}
                  />
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ── Step 2: Plan form ── */}
      <Modal visible={step === 'form'} animationType="slide" transparent onRequestClose={() => setStep('calendar')}>
        <KeyboardAvoidingView style={s.modalOverlay} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.modalContent}>
            <View style={s.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <View style={s.formHeader}>
                <TouchableOpacity onPress={() => setStep('calendar')} style={s.backRow}>
                  <Ionicons name="chevron-back" size={18} color={colors.primary} />
                  <Text style={s.backTxt}>Change date</Text>
                </TouchableOpacity>
                <View style={s.dateBadge}>
                  <Ionicons name="calendar" size={12} color={colors.primary} />
                  <Text style={s.dateBadgeTxt}>{planDate}</Text>
                </View>
              </View>

              <Text style={s.modalTitle}>New Plan</Text>

              <Text style={s.label}>Plan title</Text>
              <TextInput
                style={s.input}
                placeholder="e.g. Push Day A"
                placeholderTextColor={colors.textDim}
                value={planTitle}
                onChangeText={setPlanTitle}
              />

              <View style={es.exercisesHeader}>
                <Text style={s.label}>Exercises</Text>
                {selectedExercises.length >= 2 && (
                  <TouchableOpacity
                    style={es.supersetBtn}
                    onPress={handleCreateSuperset}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="link-outline" size={13} color={colors.warning} />
                    <Text style={es.supersetBtnTxt}>Create Superset ({selectedExercises.length})</Text>
                  </TouchableOpacity>
                )}
              </View>

              {renderExercisesWithSupersets()}

              <TouchableOpacity style={s.addExBtn} onPress={addExercise} activeOpacity={0.7}>
                <Ionicons name="add-circle" size={18} color={colors.primary} />
                <Text style={s.addExText}>Add exercise</Text>
              </TouchableOpacity>

              <View style={s.modalActions}>
                <Button label="Cancel" variant="ghost" onPress={() => { setStep('closed'); setSelectedExercises([]); }} style={{ flex: 1 }} />
                <Button label="Create Plan" onPress={handleCreate} loading={saving} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  list: { backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40, flexGrow: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eyebrow: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.4,
    textTransform: 'uppercase',
  },
  heading: { color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 4, fontWeight: '500' },
  addBtn: {
    backgroundColor: colors.primary,
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 4,
  },
  planActions: {
    flexDirection: 'row', gap: 6,
    marginTop: -4, marginBottom: 14, paddingHorizontal: 2,
  },
  actionPill: {
    flex: 1,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionPillTxt: { fontSize: 11, fontWeight: '700', letterSpacing: 0.2 },

  cloneBanner: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface2, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    marginBottom: 8, borderWidth: 1, borderColor: colors.borderSubtle,
  },
  cloneBannerTxt: { color: colors.textSub, fontSize: 13, flex: 1, fontWeight: '500' },

  userRow: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.surface2, borderRadius: 12,
    padding: 12, marginBottom: 6,
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  userRowSelected: { borderColor: colors.primary, backgroundColor: colors.primary + '14' },
  userAvatar: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: colors.primary + '22',
    borderWidth: 1, borderColor: colors.primary + '40',
    alignItems: 'center', justifyContent: 'center',
  },
  userAvatarTxt: { color: colors.primary, fontWeight: '800', fontSize: 14 },
  userRowName: { flex: 1, color: colors.text, fontWeight: '600', fontSize: 14 },

  modalOverlay: { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 28, borderTopRightRadius: 28,
    padding: 24, maxHeight: '92%',
    borderTopWidth: 1, borderColor: colors.borderSubtle,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: colors.border,
    alignSelf: 'center',
    marginTop: -8,
    marginBottom: 14,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '800', marginBottom: 6, letterSpacing: -0.3 },
  modalSub: { color: colors.textMuted, fontSize: 13, marginBottom: 16, fontWeight: '500' },

  formHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  backRow: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  backTxt: { color: colors.primary, fontSize: 14, fontWeight: '700' },
  closeIcon: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  dateBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.primary + '18', borderRadius: 999,
    paddingHorizontal: 12, paddingVertical: 5,
    borderWidth: 1, borderColor: colors.primary + '40',
  },
  dateBadgeTxt: { color: colors.primary, fontSize: 12, fontWeight: '800' },

  label: {
    color: colors.textSub,
    fontSize: 11,
    fontWeight: '700',
    marginBottom: 8,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface2, borderRadius: 10,
    padding: 12, color: colors.text, fontSize: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 8,
  },
  addExBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 12 },
  addExText: { color: colors.primary, fontWeight: '700', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 16, marginBottom: 8 },
});

// Calendar picker styles
const cs = StyleSheet.create({
  navRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  navBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: colors.surface2,
    alignItems: 'center', justifyContent: 'center',
  },
  monthTitle: { color: colors.text, fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  dayLabels: { flexDirection: 'row', marginBottom: 4 },
  dayLabel: {
    color: colors.textMuted, fontSize: 11, fontWeight: '700',
    textAlign: 'center', letterSpacing: 0.4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 8 },
  cell: { height: 44, alignItems: 'center', justifyContent: 'center', gap: 3 },
  todayCell: {
    backgroundColor: colors.primary + '22', borderRadius: 10,
    borderWidth: 1, borderColor: colors.primary + '50',
  },
  pastCell: { opacity: 0.3 },
  dayNum: { color: colors.text, fontSize: 13, fontWeight: '600' },
  todayNum: { color: colors.primary, fontWeight: '800' },
  pastNum: { color: colors.textMuted },
  dot: { width: 5, height: 5, borderRadius: 3 },
  cancelBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  cancelTxt: { color: colors.textMuted, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },
});

// Exercise row styles
const es = StyleSheet.create({
  block: {
    backgroundColor: colors.surface2, borderRadius: 14,
    padding: 14, marginBottom: 10,
    borderWidth: 1, borderColor: colors.borderSubtle,
  },
  blockInSuperset: {
    borderRadius: 10,
    marginBottom: 6,
    borderColor: colors.warning + '30',
    backgroundColor: colors.warning + '06',
  },
  blockSelected: {
    borderColor: colors.primary + '80',
    backgroundColor: colors.primary + '08',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  selectBtn: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  selectBtnActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  moveBtn: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  moveBtnDisabled: {
    opacity: 0.3,
  },
  indexBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
  },
  indexBadgeTxt: {
    color: colors.primary,
    fontSize: 11,
    fontWeight: '800',
  },
  indexLabel: { color: colors.textSub, fontWeight: '600', fontSize: 13 },
  input: {
    backgroundColor: colors.background, borderRadius: 10,
    padding: 11, color: colors.text, fontSize: 14,
    borderWidth: 1, borderColor: colors.border, marginBottom: 6,
  },
  row: { flexDirection: 'row', gap: 8 },
  dropdown: {
    backgroundColor: colors.surface,
    borderRadius: 10, borderWidth: 1, borderColor: colors.border,
    marginBottom: 6, overflow: 'hidden',
  },
  dropItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 12, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: colors.borderSubtle,
  },
  dropText: { color: colors.text, fontSize: 14 },

  // Exercises section header (label + create superset btn)
  exercisesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 0,
  },
  supersetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: colors.warning + '18',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.warning + '50',
  },
  supersetBtnTxt: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
  },

  // Superset group container
  supersetGroup: {
    borderWidth: 1.5,
    borderColor: colors.warning + '50',
    borderRadius: 14,
    borderStyle: 'dashed',
    padding: 10,
    marginBottom: 10,
    backgroundColor: colors.warning + '04',
  },
  supersetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  supersetTitle: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },
  ungroupBtn: {
    backgroundColor: colors.danger + '15',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: colors.danger + '40',
  },
  ungroupTxt: {
    color: colors.danger,
    fontSize: 11,
    fontWeight: '700',
  },
});
