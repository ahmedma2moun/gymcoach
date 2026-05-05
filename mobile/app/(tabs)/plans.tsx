import { FlatList, RefreshControl, View, Text, ActivityIndicator } from 'react-native';
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
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={plans ?? []}
      keyExtractor={(p) => p.id}
      refreshControl={
        <RefreshControl
          refreshing={isRefreshing}
          onRefresh={refresh}
          tintColor={colors.primary}
        />
      }
      contentContainerStyle={{ padding: 16, paddingBottom: 32, flexGrow: 1 }}
      ListHeaderComponent={
        <View style={{ marginBottom: 8 }}>
          <Text style={{ color: colors.text, fontSize: 22, fontWeight: '700' }}>
            Your Plans
          </Text>
          <Text style={{ color: colors.textMuted, fontSize: 13, marginTop: 2 }}>
            {plans?.length ?? 0} plan{(plans?.length ?? 0) !== 1 ? 's' : ''} assigned
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
