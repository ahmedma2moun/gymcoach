import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/auth/AuthContext';
import { colors } from '@/src/theme/colors';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <View style={styles.infoIcon}>
        <Ionicons name={icon as any} size={16} color={colors.primary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value}</Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const { user, signOut } = useAuth();

  function handleSignOut() {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign Out', style: 'destructive', onPress: signOut },
    ]);
  }

  if (!user) return null;

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
      {/* Hero / avatar */}
      <View style={styles.hero}>
        <View style={styles.heroBg} />
        <View style={styles.avatarRing}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
          </View>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <View style={styles.rolePill}>
          <Ionicons
            name={user.role === 'admin' ? 'flash' : 'barbell'}
            size={12}
            color={colors.primary}
          />
          <Text style={styles.roleText}>
            {user.role === 'admin' ? 'Coach' : 'Member'}
          </Text>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <InfoRow icon="person-outline" label="Username" value={user.username} />
        <View style={styles.divider} />
        <InfoRow icon="shield-checkmark-outline" label="Role" value={user.role === 'admin' ? 'Coach / Admin' : 'Member'} />
        <View style={styles.divider} />
        <InfoRow
          icon="checkmark-circle-outline"
          label="Account Status"
          value={user.isActive ? 'Active' : 'Inactive'}
        />
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.85}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Gym Coach · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 20, alignItems: 'center', paddingBottom: 48 },
  hero: {
    alignItems: 'center',
    marginBottom: 28,
    marginTop: 8,
    paddingVertical: 28,
    paddingHorizontal: 24,
    width: '100%',
    borderRadius: 24,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    overflow: 'hidden',
  },
  heroBg: {
    position: 'absolute',
    top: -60,
    width: 240,
    height: 240,
    borderRadius: 120,
    backgroundColor: colors.primary,
    opacity: 0.08,
  },
  avatarRing: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '40',
    marginBottom: 12,
  },
  avatar: {
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    color: colors.primary,
    fontWeight: '800',
    fontSize: 34,
    letterSpacing: -1,
  },
  username: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  rolePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    backgroundColor: colors.primary + '15',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.primary + '40',
  },
  roleText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 20,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: colors.primary + '15',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.4,
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  infoValue: { color: colors.text, fontSize: 15, fontWeight: '600' },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: 14 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger + '12',
    borderRadius: 14,
    padding: 16,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '35',
  },
  signOutText: { color: colors.danger, fontWeight: '700', fontSize: 15, letterSpacing: 0.2 },
  version: { color: colors.textDim, fontSize: 11, marginTop: 32, letterSpacing: 0.5 },
});
