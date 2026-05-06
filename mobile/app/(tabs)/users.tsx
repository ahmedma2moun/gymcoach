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
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUsers } from '@/src/hooks/useUsers';
import { useExerciseHistory } from '@/src/hooks/useExerciseHistory';
import { apiFetch } from '@/src/api/client';
import { EmptyState, Badge, Button } from '@/src/components/ui';
import { WeightChart } from '@/src/components/WeightChart';
import { colors } from '@/src/theme/colors';
import type { AuthUser } from '@/src/types/api';

function ActionBtn({
  icon,
  label,
  color,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[s.actionBtn, { borderColor: color + '40' }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Ionicons name={icon as any} size={13} color={color} />
      <Text style={[s.actionLabel, { color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function UserCard({
  user,
  onToggle,
  onPlans,
  onHistory,
  onAnalytics,
}: {
  user: AuthUser;
  onToggle: () => void;
  onPlans: () => void;
  onHistory: () => void;
  onAnalytics: () => void;
}) {
  return (
    <View style={s.card}>
      <View style={s.cardTop}>
        <View style={s.avatar}>
          <Text style={s.avatarText}>{user.username[0].toUpperCase()}</Text>
        </View>
        <View style={s.info}>
          <Text style={s.name}>{user.username}</Text>
          <View style={s.badges}>
            <Badge label="Member" variant="info" />
            {!user.isActive && <Badge label="Inactive" variant="danger" />}
          </View>
        </View>
      </View>

      <View style={s.actions}>
        <ActionBtn
          icon={user.isActive ? 'ban-outline' : 'checkmark-circle-outline'}
          label={user.isActive ? 'Deactivate' : 'Activate'}
          color={user.isActive ? colors.danger : colors.success}
          onPress={onToggle}
        />
        <ActionBtn
          icon="calendar-outline"
          label="Plans"
          color={colors.primary}
          onPress={onPlans}
        />
        <ActionBtn
          icon="stats-chart-outline"
          label="History"
          color={colors.info}
          onPress={onHistory}
        />
        <ActionBtn
          icon="bar-chart-outline"
          label="Analytics"
          color={colors.secondary}
          onPress={onAnalytics}
        />
      </View>
    </View>
  );
}

export default function UsersScreen() {
  const router = useRouter();
  const { data: users, isLoading, isRefreshing, refresh, reload } = useUsers();
  const [createVisible, setCreateVisible] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [saving, setSaving] = useState(false);
  const [historyUser, setHistoryUser] = useState<AuthUser | null>(null);

  const { data: history, isLoading: historyLoading } = useExerciseHistory(historyUser?.id);

  async function handleToggle(user: AuthUser) {
    try {
      await apiFetch(`/api/users/${user.id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: !user.isActive }),
      });
      reload();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    }
  }

  async function handleCreate() {
    if (!form.username.trim() || !form.password.trim()) return;
    setSaving(true);
    try {
      await apiFetch('/api/users', {
        method: 'POST',
        body: JSON.stringify({
          username: form.username.trim().toLowerCase(),
          password: form.password,
        }),
      });
      setCreateVisible(false);
      setForm({ username: '', password: '' });
      reload();
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSaving(false);
    }
  }

  if (isLoading) {
    return (
      <View style={s.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const members = (users ?? []).filter(u => u.role !== 'admin');

  return (
    <>
      <FlatList
        data={members}
        keyExtractor={u => String(u.id)}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <View style={s.headerRow}>
              <Text style={s.heading}>Users</Text>
              <TouchableOpacity style={s.addBtn} onPress={() => setCreateVisible(true)}>
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={s.sub}>
              {members.length} member{members.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyState message="No members yet. Tap + to create one." />}
        renderItem={({ item }) => (
          <UserCard
            user={item}
            onToggle={() => handleToggle(item)}
            onPlans={() => router.push(`/members/${item.id}`)}
            onHistory={() => setHistoryUser(item)}
            onAnalytics={() => router.push(`/members/${item.id}`)}
          />
        )}
      />

      {/* History bottom sheet */}
      <Modal
        visible={!!historyUser}
        animationType="slide"
        transparent
        onRequestClose={() => setHistoryUser(null)}
      >
        <View style={s.historyOverlay}>
          <View style={s.historySheet}>
            <View style={s.historyHeader}>
              <Text style={s.historyTitle}>{historyUser?.username}'s History</Text>
              <TouchableOpacity onPress={() => setHistoryUser(null)} hitSlop={12}>
                <Ionicons name="close" size={22} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            {historyLoading ? (
              <ActivityIndicator color={colors.primary} style={{ marginTop: 32, marginBottom: 40 }} />
            ) : (
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                {Object.keys(history ?? {}).length === 0 ? (
                  <EmptyState message="No weight history yet for this member." />
                ) : (
                  Object.keys(history ?? {}).map(name => (
                    <WeightChart key={name} name={name} history={(history ?? {})[name]} />
                  ))
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Create user modal */}
      <Modal
        visible={createVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setCreateVisible(false)}
      >
        <KeyboardAvoidingView
          style={s.modalOverlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={s.modalContent}>
            <Text style={s.modalTitle}>Create User</Text>

            <Text style={s.label}>Username</Text>
            <TextInput
              style={s.input}
              placeholder="username"
              placeholderTextColor={colors.textDim}
              value={form.username}
              onChangeText={v => setForm(f => ({ ...f, username: v }))}
              autoCapitalize="none"
              autoFocus
            />

            <Text style={s.label}>Password</Text>
            <TextInput
              style={s.input}
              placeholder="password"
              placeholderTextColor={colors.textDim}
              value={form.password}
              onChangeText={v => setForm(f => ({ ...f, password: v }))}
              secureTextEntry
            />

            <View style={s.modalActions}>
              <Button
                label="Cancel"
                variant="ghost"
                onPress={() => setCreateVisible(false)}
                style={{ flex: 1 }}
              />
              <Button label="Create" onPress={handleCreate} loading={saving} style={{ flex: 1 }} />
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },

  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2 },
  addBtn: {
    backgroundColor: colors.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    gap: 12,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center' },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 18 },
  info: { flex: 1 },
  name: { color: colors.text, fontWeight: '600', fontSize: 15 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4 },

  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    backgroundColor: colors.surface2,
  },
  actionLabel: { fontSize: 11, fontWeight: '600' },

  // History sheet
  historyOverlay: { flex: 1, backgroundColor: '#000000bb', justifyContent: 'flex-end' },
  historySheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 20,
    maxHeight: '85%',
  },
  historyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  historyTitle: { color: colors.text, fontSize: 18, fontWeight: '700' },

  // Create user modal
  modalOverlay: { flex: 1, backgroundColor: '#000000aa', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    gap: 8,
    paddingBottom: 40,
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
