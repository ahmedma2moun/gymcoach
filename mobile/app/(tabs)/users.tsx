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
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUsers } from '@/src/hooks/useUsers';
import { apiFetch } from '@/src/api/client';
import { EmptyState, Badge, Button } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import type { AuthUser } from '@/src/types/api';

function UserRow({
  user,
  onToggle,
  onPress,
}: {
  user: AuthUser;
  onToggle: () => void;
  onPress?: () => void;
}) {
  return (
    <TouchableOpacity
      style={s.row}
      onPress={onPress}
      activeOpacity={onPress ? 0.8 : 1}
    >
      <View style={s.avatar}>
        <Text style={s.avatarText}>{user.username[0].toUpperCase()}</Text>
      </View>
      <View style={s.info}>
        <Text style={s.name}>{user.username}</Text>
        <View style={s.badges}>
          <Badge
            label={user.role === 'admin' ? 'Coach' : 'Member'}
            variant={user.role === 'admin' ? 'info' : 'default'}
          />
          {!user.isActive && <Badge label="Inactive" variant="danger" />}
        </View>
      </View>
      <Switch
        value={!!user.isActive}
        onValueChange={onToggle}
        trackColor={{ false: colors.border, true: colors.primary + '80' }}
        thumbColor={user.isActive ? colors.primary : colors.textMuted}
      />
      {user.role === 'user' && (
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textMuted}
          style={{ marginLeft: 6 }}
        />
      )}
    </TouchableOpacity>
  );
}

export default function UsersScreen() {
  const router = useRouter();
  const { data: users, isLoading, isRefreshing, refresh, reload } = useUsers();
  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState({ username: '', password: '' });
  const [saving, setSaving] = useState(false);

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
      setModalVisible(false);
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

  const allUsers = users ?? [];

  return (
    <>
      <FlatList
        data={allUsers}
        keyExtractor={u => u.id}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
        contentContainerStyle={{ padding: 16, paddingBottom: 40, flexGrow: 1 }}
        ListHeaderComponent={
          <View style={{ marginBottom: 12 }}>
            <View style={s.headerRow}>
              <Text style={s.heading}>Users</Text>
              <TouchableOpacity style={s.addBtn} onPress={() => setModalVisible(true)}>
                <Ionicons name="add" size={22} color="#fff" />
              </TouchableOpacity>
            </View>
            <Text style={s.sub}>
              {allUsers.length} account{allUsers.length !== 1 ? 's' : ''}
            </Text>
          </View>
        }
        ListEmptyComponent={<EmptyState message="No users found." />}
        renderItem={({ item }) => (
          <UserRow
            user={item}
            onToggle={() => handleToggle(item)}
            onPress={
              item.role === 'user'
                ? () => router.push(`/members/${item.id}`)
                : undefined
            }
          />
        )}
      />

      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
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
                onPress={() => setModalVisible(false)}
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
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary + '30',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: colors.primary, fontWeight: '700', fontSize: 17 },
  info: { flex: 1 },
  name: { color: colors.text, fontWeight: '600', fontSize: 15 },
  badges: { flexDirection: 'row', gap: 6, marginTop: 4 },
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
