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
      activeOpacity={0.85}
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
  // Tinted backgrounds derived from the foreground color for a cohesive look.
  const bg: Record<BadgeVariant, string> = {
    default: colors.surface2,
    success: colors.success + '22',
    warning: colors.warning + '22',
    danger: colors.danger + '22',
    info: colors.info + '22',
  };
  const fg: Record<BadgeVariant, string> = {
    default: colors.textMuted,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
    info: colors.info,
  };
  const bd: Record<BadgeVariant, string> = {
    default: colors.borderSubtle,
    success: colors.success + '40',
    warning: colors.warning + '40',
    danger: colors.danger + '40',
    info: colors.info + '40',
  };
  return (
    <View style={[styles.badge, { backgroundColor: bg[variant], borderColor: bd[variant] }]}>
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
      <View style={styles.emptyDot} />
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
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  button: {
    borderRadius: 14,
    paddingVertical: 15,
    paddingHorizontal: 22,
    alignItems: 'center',
    justifyContent: 'center',
    // subtle elevation on Android, soft shadow on iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 8,
    elevation: 2,
  },
  buttonDisabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
    letterSpacing: 0.2,
  },
  badge: {
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
    borderWidth: 1,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  muted: {
    color: colors.textMuted,
    fontSize: 13,
  },
  sectionHeader: {
    color: colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 10,
    marginTop: 4,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 56,
    gap: 10,
  },
  emptyDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.surface2,
    borderWidth: 1,
    borderColor: colors.borderSubtle,
  },
  emptyStateText: {
    color: colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  separator: {
    height: 1,
    backgroundColor: colors.borderSubtle,
    marginVertical: 12,
  },
});
