import { Redirect } from 'expo-router';
import { useAuth } from '@/src/auth/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '@/src/theme/colors';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return user ? <Redirect href="/(tabs)/plans" /> : <Redirect href="/login" />;
}
