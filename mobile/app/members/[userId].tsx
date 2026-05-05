import { useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter, useNavigation } from 'expo-router';
import { useLayoutEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { usePlans } from '@/src/hooks/usePlans';
import { useLibrary } from '@/src/hooks/useLibrary';
import { useUsers } from '@/src/hooks/useUsers';
import { apiFetch } from '@/src/api/client';
import { PlanCard, } from '@/src/components/PlanCard';
import { EmptyState, Button } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import type { LibraryExercise } from '@/src/types/api';

type ExerciseForm = {
  name: string;
  sets: string;
  reps: string;
  coachNote: string;
  videoUrl: string;
};

const defaultEx = (): ExerciseForm => ({
  name: '',
  sets: '3',
  reps: '10',
  coachNote: '',
  videoUrl: '',
});

export default function MemberPlansScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const router = useRouter();
  const navigation = useNavigation();

  const { data: users } = useUsers();
  const member = users?.find((u) => u.id === userId);

  const { data: plans, isLoading, isRefreshing, refresh, reload } = usePlans(userId);
  const { data: library } = useLibrary();

  const [modalVisible, setModalVisible] = useState(false);
  const [planTitle, setPlanTitle] = useState('');
  const [exercises, setExercises] = useState<ExerciseForm[]>([defaultEx()]);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    if (member) navigation.setOptions({ title: member.username });
  }, [member, navigation]);

  function addExercise() {
    setExercises((prev) => [...prev, defaultEx()]);
  }

  function removeExercise(i: number) {
    setExercises((prev) => prev.filter((_, idx) => idx !== i));
  }

  function updateExercise(i: number, field: keyof ExerciseForm, value: string) {
    setExercises((prev) =>
      prev.map((ex, idx) => (idx === i ? { ...ex, [field]: value } : ex)),
    );
  }

  function pickFromLibrary(i: number, ex: LibraryExercise) {
    setExercises((prev) =>
      prev.map((e, idx) =>
        idx === i ? { ...e, name: ex.name, videoUrl: ex.videoUrl ?? '' } : e,
      ),
    );
  }

  async function handleCreate() {
    if (!planTitle.trim()) {
      Alert.alert('Validation', 'Plan title is required.');
      return;
    }
    const valid = exercises.filter((e) => e.name.trim());
    if (valid.length === 0) {
      Alert.alert('Validation', 'Add at least one exercise.');
      return;
    }
    setSaving(true);
    try {
      await apiFetch('/api/plans', {
        method: 'POST',
        body: JSON.stringify({
          userId,
          title: planTitle.trim(),
          exercises: valid.map((e) => ({
            name: e.name.trim(),
            sets: e.sets,
            reps: e.reps,
            coachNote: e.coachNote.trim() || undefined,
            videoUrl: e.videoUrl.trim() || undefined,
          })),
        }),
      });
      setModalVisible(false);
      setPlanTitle('');
      setExercises([defaultEx()]);
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
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await apiFetch(`/api/plans/${planId}`, { method: 'DELETE' });
          reload();
        },
      },
    ]);
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={plans ?? []}
        keyExtractor={(p) => p.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={styles.header}>
            <Text style={styles.heading}>{member?.username ?? 'Member'}'s Plans</Text>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => setModalVisible(true)}
            >
              <Ionicons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        }
        ListEmptyComponent={<EmptyState message="No plans yet. Tap + to create one." />}
        renderItem={({ item }) => (
          <View>
            <PlanCard
              plan={item}
              onPress={() => router.push(`/plans/${item.id}?userId=${userId}`)}
            />
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDeletePlan(item.id, item.title)}
            >
              <Ionicons name="trash-outline" size={14} color={colors.danger} />
              <Text style={styles.deleteBtnText}>Delete plan</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {/* Create plan modal */}
      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalTitle}>New Plan</Text>

              <Text style={styles.label}>Plan title</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Push Day A"
                placeholderTextColor={colors.textDim}
                value={planTitle}
                onChangeText={setPlanTitle}
              />

              <Text style={[styles.label, { marginTop: 16 }]}>Exercises</Text>

              {exercises.map((ex, i) => (
                <View key={i} style={styles.exBlock}>
                  <View style={styles.exHeader}>
                    <Text style={styles.exIndex}>Exercise {i + 1}</Text>
                    {exercises.length > 1 && (
                      <TouchableOpacity onPress={() => removeExercise(i)}>
                        <Ionicons name="close-circle-outline" size={20} color={colors.danger} />
                      </TouchableOpacity>
                    )}
                  </View>

                  {/* Quick-pick from library */}
                  {library && library.length > 0 && (
                    <ScrollView
                      horizontal
                      showsHorizontalScrollIndicator={false}
                      style={{ marginBottom: 8 }}
                    >
                      {library.slice(0, 20).map((le) => (
                        <TouchableOpacity
                          key={le.id}
                          style={[
                            styles.libChip,
                            ex.name === le.name && styles.libChipActive,
                          ]}
                          onPress={() => pickFromLibrary(i, le)}
                        >
                          <Text
                            style={[
                              styles.libChipText,
                              ex.name === le.name && { color: colors.primary },
                            ]}
                          >
                            {le.name}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}

                  <TextInput
                    style={styles.input}
                    placeholder="Name"
                    placeholderTextColor={colors.textDim}
                    value={ex.name}
                    onChangeText={(v) => updateExercise(i, 'name', v)}
                  />
                  <View style={styles.rowInputs}>
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Sets"
                      placeholderTextColor={colors.textDim}
                      value={ex.sets}
                      onChangeText={(v) => updateExercise(i, 'sets', v)}
                      keyboardType="number-pad"
                    />
                    <TextInput
                      style={[styles.input, { flex: 1 }]}
                      placeholder="Reps"
                      placeholderTextColor={colors.textDim}
                      value={ex.reps}
                      onChangeText={(v) => updateExercise(i, 'reps', v)}
                    />
                  </View>
                  <TextInput
                    style={styles.input}
                    placeholder="Coach note (optional)"
                    placeholderTextColor={colors.textDim}
                    value={ex.coachNote}
                    onChangeText={(v) => updateExercise(i, 'coachNote', v)}
                  />
                </View>
              ))}

              <TouchableOpacity style={styles.addExBtn} onPress={addExercise}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.addExText}>Add exercise</Text>
              </TouchableOpacity>

              <View style={styles.modalActions}>
                <Button label="Cancel" variant="ghost" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
                <Button label="Create Plan" onPress={handleCreate} loading={saving} style={{ flex: 1 }} />
              </View>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  heading: { color: colors.text, fontSize: 20, fontWeight: '700' },
  addBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-end',
    marginTop: -8,
    marginBottom: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  deleteBtnText: { color: colors.danger, fontSize: 12 },
  modalOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '90%',
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { color: colors.textSub, fontSize: 13, fontWeight: '600', marginBottom: 6 },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 8,
  },
  rowInputs: { flexDirection: 'row', gap: 8 },
  exBlock: {
    backgroundColor: colors.surface2,
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  exHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  exIndex: { color: colors.primary, fontWeight: '600', fontSize: 13 },
  libChip: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  libChipActive: { borderColor: colors.primary },
  libChipText: { color: colors.textSub, fontSize: 12 },
  addExBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'center',
    padding: 12,
    marginBottom: 12,
  },
  addExText: { color: colors.primary, fontWeight: '600', fontSize: 14 },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 4, marginBottom: 16 },
});
