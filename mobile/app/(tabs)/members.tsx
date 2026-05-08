import { FlatList, RefreshControl, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useUsers } from '@/src/hooks/useUsers';
import { EmptyState, Badge } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';
import type { AuthUser } from '@/src/types/api';

function MemberRow({ user, onPress }: { user: AuthUser; onPress: () => void }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
      </View>
      <View style={styles.info}>
        <Text style={styles.name}>{user.username}</Text>
        <View style={styles.badges}>
          <Badge
            label={user.role === 'admin' ? 'Coach' : 'Member'}
            variant={user.role === 'admin' ? 'info' : 'default'}
          />
          {!user.isActive && <Badge label="Inactive" variant="danger" />}
        </View>
      </View>
      <View style={styles.chevWrap}>
        <Ionicons name="chevron-forward" size={16} color={colors.textMuted} />
      </View>
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
      style={styles.list}
      data={members}
      keyExtractor={(u) => u.id}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Coaching</Text>
          <Text style={styles.heading}>Members</Text>
          <Text style={styles.sub}>
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
  list: { backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 32, flexGrow: 1 },
  header: { marginBottom: 16 },
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
    fontWeight: '500',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.primary + '22',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 17,
  },
  info: {
    flex: 1,
    gap: 6,
  },
  name: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: -0.1,
  },
  badges: {
    flexDirection: 'row',
    gap: 6,
  },
  chevWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
