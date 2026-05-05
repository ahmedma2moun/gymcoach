import { useState } from 'react';
import {
  FlatList,
  RefreshControl,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  StyleSheet,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLibrary } from '@/src/hooks/useLibrary';
import { apiFetch } from '@/src/api/client';
import { EmptyState, Button } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import type { LibraryExercise } from '@/src/types/api';

function ExerciseRow({
  ex,
  onEdit,
  onDelete,
}: {
  ex: LibraryExercise;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <View style={styles.row}>
      <Text style={styles.exName} numberOfLines={1}>
        {ex.name}
      </Text>
      {ex.videoUrl ? (
        <Ionicons name="play-circle-outline" size={18} color={colors.info} style={{ marginRight: 4 }} />
      ) : null}
      <TouchableOpacity onPress={onEdit} style={styles.iconBtn}>
        <Ionicons name="pencil-outline" size={18} color={colors.textMuted} />
      </TouchableOpacity>
      <TouchableOpacity onPress={onDelete} style={styles.iconBtn}>
        <Ionicons name="trash-outline" size={18} color={colors.danger} />
      </TouchableOpacity>
    </View>
  );
}

type ExForm = { name: string; videoUrl: string };

export default function LibraryScreen() {
  const { data: exercises, isLoading, isRefreshing, refresh, reload } = useLibrary();
  const [search, setSearch] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState<LibraryExercise | null>(null);
  const [form, setForm] = useState<ExForm>({ name: '', videoUrl: '' });
  const [saving, setSaving] = useState(false);

  function openCreate() {
    setEditing(null);
    setForm({ name: '', videoUrl: '' });
    setModalVisible(true);
  }

  function openEdit(ex: LibraryExercise) {
    setEditing(ex);
    setForm({ name: ex.name, videoUrl: ex.videoUrl ?? '' });
    setModalVisible(true);
  }

  function handleDelete(ex: LibraryExercise) {
    Alert.alert('Delete exercise', `Delete "${ex.name}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await apiFetch(`/api/exercises/${ex.id}`, { method: 'DELETE' });
          reload();
        },
      },
    ]);
  }

  async function handleSave() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      if (editing) {
        await apiFetch(`/api/exercises/${editing.id}`, {
          method: 'PUT',
          body: JSON.stringify({ name: form.name.trim(), videoUrl: form.videoUrl.trim() }),
        });
      } else {
        await apiFetch('/api/exercises', {
          method: 'POST',
          body: JSON.stringify({ name: form.name.trim(), videoUrl: form.videoUrl.trim() }),
        });
      }
      setModalVisible(false);
      reload();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const filtered = (exercises ?? []).filter((e) =>
    e.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <>
      <FlatList
        data={filtered}
        keyExtractor={(e) => e.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 12, gap: 10 }}>
            <View style={styles.headerRow}>
              <Text style={styles.heading}>Exercise Library</Text>
              <TouchableOpacity style={styles.addBtn} onPress={openCreate}>
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <TextInput
              style={styles.search}
              placeholder="Search…"
              placeholderTextColor={colors.textDim}
              value={search}
              onChangeText={setSearch}
            />
            <Text style={styles.count}>{filtered.length} exercise{filtered.length !== 1 ? 's' : ''}</Text>
          </View>
        }
        ListEmptyComponent={<EmptyState message="No exercises found." />}
        renderItem={({ item }) => (
          <ExerciseRow ex={item} onEdit={() => openEdit(item)} onDelete={() => handleDelete(item)} />
        )}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Exercise' : 'New Exercise'}</Text>

            <Text style={styles.label}>Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Bench Press"
              placeholderTextColor={colors.textDim}
              value={form.name}
              onChangeText={(v) => setForm((f) => ({ ...f, name: v }))}
              autoFocus
            />

            <Text style={styles.label}>Video URL (optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="https://youtube.com/…"
              placeholderTextColor={colors.textDim}
              value={form.videoUrl}
              onChangeText={(v) => setForm((f) => ({ ...f, videoUrl: v }))}
              autoCapitalize="none"
              keyboardType="url"
            />

            <View style={styles.modalActions}>
              <Button label="Cancel" variant="ghost" onPress={() => setModalVisible(false)} style={{ flex: 1 }} />
              <Button label="Save" onPress={handleSave} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700' },
  addBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  count: { color: colors.textMuted, fontSize: 13 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  exName: { color: colors.text, fontSize: 14, fontWeight: '500', flex: 1 },
  iconBtn: { padding: 6 },
  modalOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 8,
  },
  modalTitle: { color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: 8 },
  label: { color: colors.textSub, fontSize: 13, fontWeight: '600', marginTop: 4 },
  input: {
    backgroundColor: colors.surface2,
    borderRadius: 10,
    padding: 14,
    color: colors.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 12 },
});
