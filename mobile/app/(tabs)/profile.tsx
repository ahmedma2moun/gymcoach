import { View, Text, TouchableOpacity, Alert, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/src/auth/AuthContext';
import { colors } from '@/src/theme/colors';

function InfoRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Ionicons name={icon as any} size={18} color={colors.textMuted} style={{ width: 24 }} />
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
      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{user.username[0].toUpperCase()}</Text>
        </View>
        <Text style={styles.username}>{user.username}</Text>
        <View style={styles.rolePill}>
          <Text style={styles.roleText}>
            {user.role === 'admin' ? '⚡ Coach' : '🏋️ Member'}
          </Text>
        </View>
      </View>

      {/* Info card */}
      <View style={styles.card}>
        <InfoRow icon="person-outline" label="Username" value={user.username} />
        <View style={styles.divider} />
        <InfoRow icon="shield-outline" label="Role" value={user.role === 'admin' ? 'Coach / Admin' : 'Member'} />
        <View style={styles.divider} />
        <InfoRow
          icon="checkmark-circle-outline"
          label="Account Status"
          value={user.isActive ? 'Active' : 'Inactive'}
        />
      </View>

      {/* Sign out */}
      <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
        <Ionicons name="log-out-outline" size={20} color={colors.danger} />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>

      <Text style={styles.version}>Antigravity Gym · v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: colors.background },
  content: { padding: 24, alignItems: 'center', paddingBottom: 48 },
  avatarSection: { alignItems: 'center', marginBottom: 28, marginTop: 16 },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary + '25',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: colors.primary + '60',
  },
  avatarText: { color: colors.primary, fontWeight: '800', fontSize: 36 },
  username: { color: colors.text, fontSize: 22, fontWeight: '700' },
  rolePill: {
    marginTop: 8,
    backgroundColor: colors.surface2,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: colors.border,
  },
  roleText: { color: colors.textSub, fontSize: 13, fontWeight: '500' },
  card: {
    width: '100%',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 8,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    marginBottom: 24,
  },
  infoRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  infoLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '500', marginBottom: 2 },
  infoValue: { color: colors.text, fontSize: 15, fontWeight: '500' },
  divider: { height: 1, backgroundColor: colors.borderSubtle, marginHorizontal: 14 },
  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.danger + '15',
    borderRadius: 12,
    padding: 16,
    width: '100%',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.danger + '30',
  },
  signOutText: { color: colors.danger, fontWeight: '600', fontSize: 16 },
  version: { color: colors.textDim, fontSize: 12, marginTop: 32 },
});
