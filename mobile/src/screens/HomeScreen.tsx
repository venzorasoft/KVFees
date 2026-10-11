import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStack } from '../../App';
import { Alert } from '../alert';
import { CountUp, FadeInUp, PopIn, PressScale } from '../anim';
import { Child, Payment, deleteChild, getMe, listChildren, listPayments } from '../api';
import { CampusScene } from '../art';
import { colors, radius, shadow } from '../theme';
import { Card, GradientHeader, IconCircle, KVLogo, RoundAction } from '../ui';

// A distinct colour per child so tiles are easy to tell apart at a glance.
const TONES = [
  { fg: '#5B242C', bg: '#F5F1DE' },
  { fg: '#2F9E3D', bg: '#E5F4E3' },
  { fg: '#E0720A', bg: '#FFEBD6' },
  { fg: '#A9792A', bg: '#F8EDD2' },
  { fg: '#7A3A44', bg: '#F4E6E4' },
];

const STEPS = [
  { icon: 'hand-left-outline', t: 'Tap Pay Fees' },
  { icon: 'keypad-outline', t: 'Type captcha' },
  { icon: 'shield-checkmark-outline', t: 'Pay securely' },
] as const;

export default function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const [children, setChildren] = useState<Child[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState(false);
  const [active, setActive] = useState(0);

  const load = useCallback(() => {
    listChildren().then((c) => { setChildren(c); setError(false); }).catch(() => setError(true));
    listPayments().then(setPayments).catch(() => {});
    getMe().then((m) => setName(m.name)).catch(() => {});
  }, []);
  useFocusEffect(load);

  // Cycles the highlighted step in the "how it works" infographic.
  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % STEPS.length), 1600);
    return () => clearInterval(id);
  }, []);

  const remove = (c: Child) =>
    Alert.alert('Delete', `Remove ${c.alias_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChild(c.id).then(load) },
    ]);

  const paid = payments.filter((p) => p.status === 'success');
  const totalPaid = Math.round(paid.reduce((n, p) => n + Number(p.amount), 0));
  const stats = [
    { icon: 'people', label: 'Children', value: children.length, prefix: '', tone: TONES[0] },
    { icon: 'receipt', label: 'Payments', value: paid.length, prefix: '', tone: TONES[1] },
    { icon: 'wallet', label: 'Fees paid', value: totalPaid, prefix: '₹', tone: TONES[2] },
  ] as const;

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 28 }}>
      <GradientHeader title="KV Fee Helper" bottom={150} art={<CampusScene height={150} />}>
        <PopIn><KVLogo size={64} /></PopIn>
        <FadeInUp delay={150}><Text style={[s.hello, { marginTop: 12 }]}>{name ? `Hello, ${name}` : 'Hello'}</Text></FadeInUp>
        <FadeInUp delay={250}><Text style={s.big}>{children.length ? 'Fees made easy' : 'Welcome'}</Text></FadeInUp>
        <FadeInUp delay={350}>
          <View style={s.actions}>
            <RoundAction icon="add" label="Add Child" onPress={() => nav.navigate('AddChild')} />
            <RoundAction icon="time-outline" label="History" onPress={() => nav.navigate('Main' as any, { screen: 'History' })} />
          </View>
        </FadeInUp>
      </GradientHeader>

      {/* infographic: three stat cards */}
      <View style={s.stats}>
        {stats.map((st, i) => (
          <FadeInUp key={st.label} delay={300 + i * 120} style={{ flex: 1 }}>
            <View style={s.stat}>
              <View style={[s.statIcon, { backgroundColor: st.tone.bg }]}><Ionicons name={st.icon} size={16} color={st.tone.fg} /></View>
              <CountUp to={st.value} prefix={st.prefix} style={s.statNum} />
              <Text style={s.statLabel}>{st.label}</Text>
            </View>
          </FadeInUp>
        ))}
      </View>

      <View style={{ paddingHorizontal: 16, gap: 16, marginTop: 16 }}>
        <Card style={{ padding: 12, borderRadius: 24 }}>
          {error && <Text style={s.err}>Could not reach the server. Pull back and try again.</Text>}
          <View style={s.grid}>
            {children.map((c, i) => {
              const tone = TONES[i % TONES.length];
              return (
                <FadeInUp key={c.id} delay={500 + i * 100} style={s.tileWrap}>
                  <PressScale style={s.tile} onPress={() => nav.navigate('Pay', { child: c })} onLongPress={() => remove(c)}>
                    <View style={s.tileTop}>
                      <View style={[s.avatar, { backgroundColor: tone.bg }]}>
                        <Text style={[s.avatarText, { color: tone.fg }]}>{c.alias_name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={s.tileActions}>
                        <Pressable hitSlop={10} onPress={() => nav.navigate('AddChild', { child: c })}>
                          <Ionicons name="create-outline" size={18} color={colors.primary} />
                        </Pressable>
                        <Pressable hitSlop={10} onPress={() => remove(c)}>
                          <Ionicons name="trash-outline" size={17} color={colors.muted} />
                        </Pressable>
                      </View>
                    </View>
                    <Text style={s.tileName} numberOfLines={1}>{c.alias_name}</Text>
                    <Text style={s.tileSub}>ID ••••{c.unique_id.slice(-3)}</Text>
                    <View style={[s.payPill, { backgroundColor: tone.fg }]}>
                      <Text style={s.payText}>Pay Fees</Text>
                      <Ionicons name="arrow-forward" size={14} color="#fff" />
                    </View>
                  </PressScale>
                </FadeInUp>
              );
            })}
            <FadeInUp delay={500 + children.length * 100} style={s.tileWrap}>
              <PressScale style={[s.tile, s.addTile]} onPress={() => nav.navigate('AddChild')}>
                <IconCircle name="add" />
                <Text style={s.tileName}>{children.length ? 'Add another' : 'Add your child'}</Text>
                <Text style={s.tileSub}>Unique ID + date of birth</Text>
              </PressScale>
            </FadeInUp>
          </View>
        </Card>

        {/* infographic: how paying works, with a cycling highlight */}
        <FadeInUp delay={700}>
          <Card>
            <Text style={s.section}>How paying works</Text>
            <View style={s.steps}>
              <View style={s.stepLine} />
              {STEPS.map((st, i) => {
                const on = i === active;
                return (
                  <View key={st.t} style={s.step}>
                    <View style={[s.stepDot, on && s.stepDotOn]}>
                      <Ionicons name={st.icon} size={20} color={on ? '#fff' : colors.primary} />
                    </View>
                    <Text style={[s.stepText, on && { color: colors.primary, fontWeight: '700' }]}>{i + 1}. {st.t}</Text>
                  </View>
                );
              })}
            </View>
            <Text style={s.stepNote}>We fill in the ID and date of birth. You only type the captcha.</Text>
          </Card>
        </FadeInUp>
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hello: { color: colors.onHeader, fontSize: 14 },
  big: { color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 4, letterSpacing: -0.5 },
  actions: { flexDirection: 'row', gap: 28, marginTop: 16 },
  stats: { flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginTop: -44 },
  stat: { backgroundColor: '#fff', borderRadius: 18, padding: 12, alignItems: 'flex-start', gap: 2, ...shadow },
  statIcon: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  statNum: { fontSize: 22, fontWeight: '800', color: colors.text },
  statLabel: { fontSize: 11, color: colors.muted },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tileWrap: { flexGrow: 1, flexBasis: '46%' },
  tile: { backgroundColor: '#fff', borderRadius: radius.tile, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 4, ...shadow },
  addTile: { borderStyle: 'dashed', backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'flex-start', gap: 6, minHeight: 150 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 20, fontWeight: '800' },
  tileActions: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  tileName: { fontSize: 16, fontWeight: '700', color: colors.text },
  tileSub: { fontSize: 12, color: colors.muted },
  payPill: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 9, borderRadius: 12 },
  payText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  err: { color: colors.red, marginBottom: 8 },
  section: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 14 },
  steps: { flexDirection: 'row', justifyContent: 'space-between', position: 'relative' },
  stepLine: { position: 'absolute', top: 22, left: 40, right: 40, height: 2, backgroundColor: colors.line },
  step: { alignItems: 'center', width: '33%', gap: 8 },
  stepDot: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' },
  stepDotOn: { backgroundColor: colors.primary, transform: [{ scale: 1.12 }] },
  stepText: { fontSize: 12, color: colors.muted, textAlign: 'center' },
  stepNote: { marginTop: 14, color: colors.muted, fontSize: 12, textAlign: 'center' },
});
