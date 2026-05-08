import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
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
          paddingTop: 6,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          height: Platform.OS === 'ios' ? 84 : 64,
        },
        tabBarItemStyle: {
          paddingVertical: 4,
        },
        headerStyle: {
          backgroundColor: colors.background,
          borderBottomWidth: 0,
        },
        headerTintColor: colors.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
          letterSpacing: -0.2,
        },
        headerShadowVisible: false,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          letterSpacing: 0.2,
        },
      }}
    >
      {/* ── Member tabs ──────────────────────────────────────────── */}

      <Tabs.Screen
        name="calendar"
        options={{
          href: isAdmin ? null : undefined,
          title: 'Calendar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="calendar-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="analytics"
        options={{
          href: isAdmin ? null : undefined,
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="history"
        options={{
          href: isAdmin ? null : undefined,
          title: 'History',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="stats-chart-outline" color={color} size={size} />
          ),
        }}
      />

      {/* ── Admin tabs ───────────────────────────────────────────── */}

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

      <Tabs.Screen
        name="exercises"
        options={{
          href: !isAdmin ? null : undefined,
          title: 'Exercises',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="barbell-outline" color={color} size={size} />
          ),
        }}
      />

      <Tabs.Screen
        name="users"
        options={{
          href: !isAdmin ? null : undefined,
          title: 'Users',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-circle-outline" color={color} size={size} />
          ),
        }}
      />

      {/* ── Hidden legacy screens (still routable, not shown as tabs) ── */}

      <Tabs.Screen name="plans" options={{ href: null }} />
      <Tabs.Screen name="library" options={{ href: null }} />
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
