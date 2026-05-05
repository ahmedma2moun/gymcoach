import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { colors } from '@/src/theme/colors';

// ── Card ──────────────────────────────────────────────────────────────────────

export function Card({
  children,
  style,
}: {
  children: React.ReactNode;
  style?: ViewStyle;
}) {
  return (
    <View style={[styles.card, style]}>{children}</View>
  );
}

// ── Button ────────────────────────────────────────────────────────────────────

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

export function Button({
  label,
  onPress,
  variant = 'primary',
  loading = false,
  disabled = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
}) {
  const bg: Record<ButtonVariant, string> = {
    primary: colors.primary,
    secondary: colors.secondary,
    danger: colors.danger,
    ghost: 'transparent',
  };
  const border: Record<ButtonVariant, string | undefined> = {
    primary: undefined,
    secondary: undefined,
    danger: undefined,
    ghost: colors.border,
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.75}
      style={[
        styles.button,
        { backgroundColor: bg[variant], borderColor: border[variant], borderWidth: border[variant] ? 1 : 0 },
        (disabled || loading) && styles.buttonDisabled,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'ghost' ? colors.primary : '#fff'} size="small" />
      ) : (
        <Text style={[styles.buttonText, variant === 'ghost' && { color: colors.textSub }]}>
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────

type BadgeVariant = 'default' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({ label, variant = 'default' }: { label: string; variant?: BadgeVariant }) {
  const bg: Record<BadgeVariant, string> = {
    default: '#2a2a40',
    success: '#064e3b',
    warning: '#7c2d12',
    danger: '#450a0a',
    info: '#0c2a4a',
  };
  const fg: Record<BadgeVariant, string> = {
    default: colors.textMuted,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
  };
  return (
    <View style={[styles.badge, { backgroundColor: bg[variant] }]}>
      <Text style={[styles.badgeText, { color: fg[variant] }]}>{label}</Text>
    </View>
  );
}

// ── Muted text ────────────────────────────────────────────────────────────────

export function Muted({ children, style }: { children: React.ReactNode; style?: TextStyle }) {
  return <Text style={[styles.muted, style]}>{children}</Text>;
}

// ── Section header ────────────────────────────────────────────────────────────

export function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

// ── Empty state ───────────────────────────────────────────────────────────────

export function EmptyState({ message }: { message: string }) {
  return (
    <View style={styles.emptyState}>
      <Text style={styles.emptyStateText}>{message}</Text>
    </View>
  );
}

// ── Separator ─────────────────────────────────────────────────────────────────

export function Separator() {
  return <View style={styles.separator} />;
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  button: {
    borderRadius: 10,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  badge: {
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 15,
    textAlign: 'center',
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 12,
  },
});
