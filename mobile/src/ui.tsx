import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, radius, shadow } from './theme';

export type IconName = keyof typeof Ionicons.glyphMap;

export function IconCircle({ name, size = 44, tint = colors.primary, bg = colors.primarySoft }: {
  name: IconName; size?: number; tint?: string; bg?: string;
}) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
      <Ionicons name={name} size={size * 0.46} color={tint} />
    </View>
  );
}

export function Avatar({ label, size = 72 }: { label: string; size?: number }) {
  return (
    <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center' }}>
      <Text style={{ fontSize: size * 0.4, fontWeight: '700', color: colors.primary }}>{(label || '?').charAt(0).toUpperCase()}</Text>
    </View>
  );
}

export function Card({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function Button({ title, onPress, disabled, variant = 'primary', icon }: {
  title: string; onPress: () => void; disabled?: boolean; variant?: 'primary' | 'ghost' | 'danger'; icon?: IconName;
}) {
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? colors.red : colors.primary;
  const bg = variant === 'primary' ? colors.primary : variant === 'danger' ? '#FEECEB' : colors.primarySoft;
  return (
    <Pressable onPress={onPress} disabled={disabled} style={({ pressed }) => [s.btn, { backgroundColor: bg, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 }]}>
      {icon && <Ionicons name={icon} size={18} color={fg} />}
      <Text style={[s.btnText, { color: fg }]}>{title}</Text>
    </Pressable>
  );
}

export function Row({ icon, title, subtitle, onPress, right, last }: {
  icon: IconName; title: string; subtitle?: string; onPress?: () => void; right?: ReactNode; last?: boolean;
}) {
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={[s.row, !last && s.rowLine]}>
      <IconCircle name={icon} size={40} />
      <View style={{ flex: 1 }}>
        <Text style={s.rowTitle}>{title}</Text>
        {!!subtitle && <Text style={s.rowSub}>{subtitle}</Text>}
      </View>
      {right ?? (onPress ? <Ionicons name="chevron-forward" size={18} color={colors.muted} /> : null)}
    </Pressable>
  );
}

/** Blue gradient header with a centred title, like the Savings screen in the reference. */
export function GradientHeader({ title, children, height }: { title?: string; children?: ReactNode; height?: number }) {
  const insets = useSafeAreaInsets();
  return (
    <LinearGradient colors={[colors.primary, colors.primaryDark]} style={[s.header, { paddingTop: insets.top + 12, minHeight: height }]}>
      {!!title && <Text style={s.headerTitle}>{title}</Text>}
      {children}
    </LinearGradient>
  );
}

export function RoundAction({ icon, label, onPress }: { icon: IconName; label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={{ alignItems: 'center', gap: 8, width: 90 }}>
      <View style={s.roundAction}>
        <Ionicons name={icon} size={22} color="#fff" />
      </View>
      <Text style={{ color: '#DCE7FF', fontSize: 13 }}>{label}</Text>
    </Pressable>
  );
}

export function Field({ icon, children }: { icon: IconName; children: ReactNode }) {
  return (
    <View style={s.field}>
      <Ionicons name={icon} size={18} color={colors.muted} />
      {children}
    </View>
  );
}

const s = StyleSheet.create({
  card: { backgroundColor: colors.card, borderRadius: radius.card, padding: 16, ...shadow },
  btn: { flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center', paddingVertical: 14, paddingHorizontal: 18, borderRadius: 14 },
  btnText: { fontSize: 15, fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  rowLine: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  rowTitle: { fontSize: 15, fontWeight: '600', color: colors.text },
  rowSub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  header: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 56 },
  headerTitle: { color: '#fff', fontSize: 17, fontWeight: '600', marginBottom: 18 },
  roundAction: { width: 50, height: 50, borderRadius: 25, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.bg, borderRadius: 14, paddingHorizontal: 14, height: 52 },
});
