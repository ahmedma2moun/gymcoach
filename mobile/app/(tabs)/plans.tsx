import { FlatList, RefreshControl, View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';
import { usePlans } from '@/src/hooks/usePlans';
import { PlanCard } from '@/src/components/PlanCard';
import { EmptyState } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

export default function PlansScreen() {
  const { user } = useAuth();
  const router = useRouter();
  const { data: plans, isLoading, isRefreshing, refresh } = usePlans(user?.id);

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const total = plans?.length ?? 0;

  return (
    <FlatList
      style={styles.list}
      data={plans ?? []}
      keyExtractor={(p) => p.id}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={styles.content}
      ListHeaderComponent={
        <View style={styles.header}>
          <Text style={styles.eyebrow}>Your Training</Text>
          <Text style={styles.heading}>Plans</Text>
          <Text style={styles.sub}>
            {total} plan{total !== 1 ? 's' : ''} assigned
          </Text>
        </View>
      }
      ListEmptyComponent={<EmptyState message="No plans yet. Your coach will assign workouts here." />}
      renderItem={({ item }) => (
        <PlanCard
          plan={item}
          onPress={() => router.push(`/plans/${item.id}?userId=${user?.id}`)}
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
});
