import { Slot, useRouter, useSegments } from 'expo-router';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/src/auth/AuthContext';

function AuthGate() {
  const { user, isLoading } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === '(tabs)' || segments[0] === 'plans' || segments[0] === 'members';
    if (!user && inAuthGroup) router.replace('/login');
    if (user && (segments[0] === 'login' || segments[0] === undefined)) {
      router.replace(user.role === 'admin' ? '/(tabs)/members' : '/(tabs)/calendar');
    }
  }, [user, isLoading, segments]);

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <AuthGate />
    </AuthProvider>
  );
}
