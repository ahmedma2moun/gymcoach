import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/auth/AuthContext';
import { colors } from '@/src/theme/colors';

export default function TabLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textMuted,
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderSubtle,
          borderTopWidth: 1,
        },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
        tabBarLabelStyle: { fontSize: 11 },
      }}
    >
      {/* Member: My Plans */}
      <Tabs.Screen
        name="plans"
        options={{
          href: isAdmin ? null : undefined,
          title: 'My Plans',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Member: History */}
      <Tabs.Screen
        name="history"
        options={{
          href: isAdmin ? null : undefined,
          title: 'Progress',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Admin: Members */}
      <Tabs.Screen
        name="members"
        options={{
          href: !isAdmin ? null : undefined,
          title: 'Members',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="people-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Admin: Exercise Library */}
      <Tabs.Screen
        name="library"
        options={{
          href: !isAdmin ? null : undefined,
          title: 'Library',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="list-outline" color={color} size={size} />
          ),
        }}
      />

      {/* Both: Profile */}
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
