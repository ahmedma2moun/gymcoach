import { FlatList, RefreshControl, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUsers } from '@/src/hooks/useUsers';
import { EmptyState, Badge } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import type { AuthUser } from '@/src/types/api';

function MemberRow({ user, onPress }: { user: AuthUser; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.8}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{user.username}</Text>
        <Badge
          label={user.role === 'admin' ? 'Coach' : 'Member'}
          variant={user.role === 'admin' ? 'info' : 'default'}
        />
      </View>
      {!user.isActive && <Badge label="Inactive" variant="danger" />}
      <Ionicons name="chevron-forward" size={18} color={colors.textMuted} style={{ marginLeft: 8 }} />
    </TouchableOpacity>
  );
}

export default function MembersScreen() {
  const router = useRouter();
  const { data: users, isLoading, isRefreshing, refresh } = useUsers();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const members = (users ?? []).filter((u) => u.role === 'user');

  return (
    <FlatList
      data={members}
      keyExtractor={(u) => u.id}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 12 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>Members</Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
            {members.length} member{members.length !== 1 ? 's' : ''}
          </Text>
        </View>
      }
      ListEmptyComponent={<EmptyState message="No members found." />}
      renderItem={({ item }) => (
        <MemberRow
          user={item}
          onPress={() => router.push(`/members/${item.id}`)}
        />
      )}
    />
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
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
  avatarText: {
    color: colors.primary,
    fontWeight: '700',
    fontSize: 17,
  },
  info: {
    flex: 1,
    gap: 4,
  },
  name: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 15,
  },
});
