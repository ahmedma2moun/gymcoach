import { useState } from 'react';
import {
  ScrollView,
  RefreshControl,
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  TextInput,
} from 'react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { useExerciseHistory } from '@/src/hooks/useExerciseHistory';
import { WeightChart } from '@/src/components/WeightChart';
import { EmptyState } from '@/src/components/ui';
import { colors } from '@/src/theme/colors';

export default function HistoryScreen() {
  const { user } = useAuth();
  const { data: history, isLoading, isRefreshing, refresh } = useExerciseHistory(user?.id);
  const [search, setSearch] = useState('');

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  const names = Object.keys(history ?? {}).filter((n) =>
    n.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <ScrollView
      style={styles.scroll}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={colors.primary} />
      }
    >
      <Text style={styles.heading}>Progress</Text>
      <Text style={styles.sub}>Weight lifted over time, per exercise</Text>

      <TextInput
        style={styles.search}
        placeholder="Search exercise…"
        placeholderTextColor={colors.textDim}
        value={search}
        onChangeText={setSearch}
      />

      {names.length === 0 ? (
        <EmptyState message="No weight history yet. Complete exercises and log weights to see charts." />
      ) : (
        names.map((name) => (
          <WeightChart key={name} name={name} history={(history ?? {})[name]} />
        ))
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 16, paddingBottom: 40 },
  heading: { color: colors.text, fontSize: 22, fontWeight: '700' },
  sub: { color: colors.textMuted, fontSize: 13, marginTop: 2, marginBottom: 16 },
  search: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    color: colors.text,
    fontSize: 14,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
});
