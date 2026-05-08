import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useAuth } from '@/src/auth/AuthContext';
import { colors } from '@/src/theme/colors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!username.trim() || !password) return;
    setLoading(true);
    try {
      await signIn(username.trim(), password);
    } catch (e: any) {
      Alert.alert('Login failed', e.message ?? 'Check your credentials and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.outer}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      {/* Decorative blurred orbs in the background */}
      <View pointerEvents="none" style={styles.orbsLayer}>
        <View style={[styles.orb, styles.orbPrimary]} />
        <View style={[styles.orb, styles.orbSecondary]} />
      </View>

      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        {/* Logo / brand */}
        <View style={styles.brand}>
          <View style={styles.logoWrap}>
            <Text style={styles.logo}>⚡</Text>
          </View>
          <Text style={styles.appName}>Gym Coach</Text>
          <Text style={styles.tagline}>TRAIN · TRACK · PROGRESS</Text>
        </View>

        {/* Form */}
        <View style={styles.formCard}>
          <Text style={styles.formTitle}>Welcome back</Text>
          <Text style={styles.formSub}>Sign in to continue your training</Text>

          <Text style={styles.label}>Username</Text>
          <TextInput
            style={styles.input}
            placeholder="your username"
            placeholderTextColor={colors.textDim}
            autoCapitalize="none"
            autoCorrect={false}
            value={username}
            onChangeText={setUsername}
            returnKeyType="next"
          />

          <Text style={styles.label}>Password</Text>
          <TextInput
            style={styles.input}
            placeholder="••••••••"
            placeholderTextColor={colors.textDim}
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            returnKeyType="done"
            onSubmitEditing={handleLogin}
          />

          <TouchableOpacity
            style={[styles.button, loading && styles.buttonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in…' : 'Sign In'}</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.footer}>v1.0 · Gym Coach</Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    backgroundColor: colors.background,
  },
  orbsLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  orb: {
    position: 'absolute',
    width: 280,
    height: 280,
    borderRadius: 140,
    opacity: 0.18,
  },
  orbPrimary: {
    backgroundColor: colors.primary,
    top: -120,
    right: -100,
  },
  orbSecondary: {
    backgroundColor: colors.secondary,
    bottom: -120,
    left: -100,
  },
  container: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  brand: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoWrap: {
    width: 72,
    height: 72,
    borderRadius: 22,
    backgroundColor: colors.primary + '20',
    borderWidth: 1,
    borderColor: colors.primary + '50',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logo: {
    fontSize: 38,
  },
  appName: {
    fontSize: 34,
    fontWeight: '800',
    color: colors.text,
    letterSpacing: -0.8,
  },
  tagline: {
    color: colors.primary,
    fontSize: 11,
    marginTop: 6,
    letterSpacing: 2.4,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: colors.surface,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.3,
    shadowRadius: 24,
    elevation: 8,
  },
  formTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  formSub: {
    color: colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    marginBottom: 20,
  },
  label: {
    color: colors.textSub,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 12,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: colors.surface2,
    color: colors.text,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border,
  },
  button: {
    backgroundColor: colors.primary,
    borderRadius: 14,
    padding: 17,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '800',
    fontSize: 16,
    letterSpacing: 0.4,
  },
  footer: {
    color: colors.textDim,
    fontSize: 11,
    textAlign: 'center',
    marginTop: 28,
    letterSpacing: 0.5,
  },
});
