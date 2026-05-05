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
        activeOpacity={0.7}
      >
        <TouchableOpacity
          onPress={handleToggle}
          disabled={saving || disabled}
          style={[styles.checkbox, exercise.done && styles.checkboxDone]}
        >
          {exercise.done && <Ionicons name="checkmark" size={14} color="#fff" />}
        </TouchableOpacity>

        <View style={styles.info}>
          <Text style={[styles.name, exercise.done && styles.nameStrike]}>
            {exercise.name}
          </Text>
          <Text style={styles.meta}>
            {exercise.sets} sets · {exercise.reps} reps
            {(exercise.weightKg || exercise.weightLbs) &&
              ` · ${exercise.weightKg ? exercise.weightKg + ' kg' : exercise.weightLbs + ' lbs'}`}
          </Text>
        </View>

        <View style={styles.actions}>
          {exercise.videoUrl && (
            <TouchableOpacity onPress={openVideo} style={styles.iconBtn}>
              <Ionicons name="play-circle-outline" size={22} color={colors.info} />
            </TouchableOpacity>
          )}
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={colors.textMuted}
          />
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expanded}>
          {exercise.coachNote ? (
            <View style={styles.coachNote}>
              <Ionicons name="chatbubble-outline" size={13} color={colors.primary} />
              <Text style={styles.coachNoteText}>{exercise.coachNote}</Text>
            </View>
          ) : null}

          <View style={styles.weightRow}>
            <TouchableOpacity
              style={styles.unitToggle}
              onPress={() => setUseKg((v) => !v)}
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
            style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
            onPress={handleToggle}
            disabled={saving || disabled}
          >
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
    backgroundColor: colors.surface2,
    borderRadius: 12,
    marginBottom: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  containerDone: {
    borderColor: colors.success + '40',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: colors.border,
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
    fontSize: 14,
  },
  nameStrike: {
    textDecorationLine: 'line-through',
    color: colors.textMuted,
  },
  meta: {
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconBtn: {
    padding: 2,
  },
  expanded: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    borderTopWidth: 1,
    borderTopColor: colors.borderSubtle,
    gap: 10,
  },
  coachNote: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
    backgroundColor: colors.primary + '15',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
  },
  coachNoteText: {
    color: colors.primaryLight,
    fontSize: 13,
    flex: 1,
  },
  weightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  unitToggle: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: colors.border,
  },
  unitToggleText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 13,
  },
  weightInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  noteInput: {
    backgroundColor: colors.surface,
    borderRadius: 8,
    padding: 10,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    minHeight: 60,
    textAlignVertical: 'top',
  },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
});
