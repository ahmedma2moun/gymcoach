import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/src/theme/colors';
import type { PlanExercise } from '@/src/types/api';

type Props = {
  exercise: PlanExercise;
  index: number;
  planId: string;
  onToggleDone: (
    index: number,
    done: boolean,
    weightKg: string,
    weightLbs: string,
    userNote: string,
  ) => Promise<void>;
  disabled?: boolean;
};

export function ExerciseItem({ exercise, index, planId, onToggleDone, disabled }: Props) {
  const [weightKg, setWeightKg] = useState(exercise.weightKg ?? '');
  const [weightLbs, setWeightLbs] = useState(exercise.weightLbs ?? '');
  const [userNote, setUserNote] = useState(exercise.userNote ?? '');
  const [useKg, setUseKg] = useState(true);
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleToggle() {
    setSaving(true);
    try {
      await onToggleDone(index, !exercise.done, weightKg, weightLbs, userNote);
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  function openVideo() {
    if (exercise.videoUrl) Linking.openURL(exercise.videoUrl);
  }

  const isSupersetStart =
    exercise.supersetId &&
    index > 0;

  return (
    <View style={[styles.container, exercise.done && styles.containerDone]}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded((v) => !v)}
        activeOpacity={0.75}
      >
        <TouchableOpacity
          onPress={handleToggle}
          disabled={saving || disabled}
          style={[styles.checkbox, exercise.done && styles.checkboxDone]}
          activeOpacity={0.7}
        >
          {exercise.done && <Ionicons name="checkmark" size={15} color="#fff" />}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={[styles.name, exercise.done && styles.nameStrike]}>
            {exercise.name}
          </Text>
          <View style={styles.metaRow}>
            <View style={styles.chip}>
              <Text style={styles.chipText}>{exercise.sets} × {exercise.reps}</Text>
            </View>
            {(exercise.weightKg || exercise.weightLbs) ? (
              <View style={[styles.chip, styles.chipWeight]}>
                <Ionicons name="barbell-outline" size={11} color={colors.primary} />
                <Text style={[styles.chipText, { color: colors.primary }]}>
                  {exercise.weightKg ? `${exercise.weightKg} kg` : `${exercise.weightLbs} lbs`}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.actions}>
          {exercise.videoUrl && (
            <TouchableOpacity onPress={openVideo} style={styles.iconBtn} activeOpacity={0.7}>
              <Ionicons name="play-circle" size={24} color={colors.info} />
            </TouchableOpacity>
          )}
          <View style={styles.chevWrap}>
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textMuted}
            />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expanded}>
          {exercise.coachNote ? (
            <View style={styles.coachNote}>
              <Ionicons name="chatbubble-ellipses" size={13} color={colors.primary} />
              <Text style={styles.coachNoteText}>{exercise.coachNote}</Text>
            </View>
          ) : null}

          <View style={styles.weightRow}>
            <TouchableOpacity
              style={styles.unitToggle}
              onPress={() => setUseKg((v) => !v)}
              activeOpacity={0.75}
            >
              <Text style={styles.unitToggleText}>{useKg ? 'kg' : 'lbs'}</Text>
            </TouchableOpacity>
            <TextInput
              style={styles.weightInput}
              placeholder={useKg ? 'Weight (kg)' : 'Weight (lbs)'}
              placeholderTextColor={colors.textDim}
              keyboardType="decimal-pad"
              value={useKg ? weightKg : weightLbs}
              onChangeText={(v) => {
                if (useKg) {
                  setWeightKg(v);
                  const n = parseFloat(v);
                  if (!isNaN(n)) setWeightLbs((n * 2.20462).toFixed(1));
                } else {
                  setWeightLbs(v);
                  const n = parseFloat(v);
                  if (!isNaN(n)) setWeightKg((n / 2.20462).toFixed(1));
                }
              }}
            />
          </View>

          <TextInput
            style={styles.noteInput}
            placeholder="Your note…"
            placeholderTextColor={colors.textDim}
            value={userNote}
            onChangeText={setUserNote}
            multiline
          />

          <TouchableOpacity
            style={[styles.saveBtn, exercise.done && styles.saveBtnUndo, saving && styles.saveBtnDisabled]}
            onPress={handleToggle}
            disabled={saving || disabled}
            activeOpacity={0.85}
          >
            <Ionicons
              name={exercise.done ? 'refresh' : 'checkmark-circle'}
              size={16}
              color="#fff"
            />
            <Text style={styles.saveBtnText}>
              {saving ? 'Saving…' : exercise.done ? 'Mark Undone' : 'Mark Done'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    marginBottom: 10,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  containerDone: {
    borderColor: colors.success + '55',
    backgroundColor: colors.success + '08',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checkboxDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  info: {
    flex: 1,
  },
  name: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
    letterSpacing: -0.1,
  },
  nameStrike: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  chipWeight: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary + '40',
  },
  chipText: {
    color: colors.textSub,
    fontSize: 11,
    fontWeight: '600',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 2,
  },
  chevWrap: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  expanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    paddingTop: 4,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 10,
  },
  coachNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: colors.primary + '12',
    borderRadius: 10,
    padding: 12,
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.primary + '25',
  },
  coachNoteText: {
    color: colors.primaryLight,
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  unitToggle: {
    backgroundColor: colors.primary + '15',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  unitToggleText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.4,
  },
  weightInput: {
    flex: 1,
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 11,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteInput: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 64,
    textAlignVertical: 'top',
  },
  saveBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 13,
  },
  saveBtnUndo: {
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.border,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 0.2,
  },
});
