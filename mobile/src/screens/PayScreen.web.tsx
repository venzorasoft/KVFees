import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStack } from '../../App';
import { api } from '../api';
import { PORTAL_URL } from '../autofill';
import { rememberChild } from '../launch';
import { colors } from '../theme';
import { Button, Card, IconCircle } from '../ui';

// Browser preview. A web page can't fill another site's form, so the API opens the portal in a
// real browser window on this PC and fills the details; you only type the captcha and pay.
// (On a phone, PayScreen's WebView does the same thing inside the app.)
const STEPS = [
  { icon: 'checkmark-done-outline', t: 'Details filled for you', d: 'Unique ID and date of birth go in automatically' } as const,
  { icon: 'keypad-outline', t: 'You enter the captcha', d: 'We never touch the captcha' } as const,
  { icon: 'card-outline', t: 'Complete the payment', d: 'On the bank\'s own secure page' } as const,
];

export default function PayScreen({ route }: NativeStackScreenProps<RootStack, 'Pay'>) {
  const { child } = route.params;
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    rememberChild(child.id);
  }, [child.id]);

  const pay = async () => {
    setBusy(true);
    setFailed(false);
    try {
      await api.post('/portal/launch', { child_id: child.id });
      setMsg('A browser window is opening with the details filled in. Type the captcha and press Login there.');
    } catch {
      setFailed(true);
      setMsg('Could not open the portal automatically. Open it manually and enter the details below.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={s.c}>
      <Card style={s.top}>
        <IconCircle name="school" size={64} />
        <Text style={s.name}>{child.alias_name}</Text>
        <Text style={s.sub}>ID ••••{child.unique_id.slice(-3)}</Text>
        <View style={{ alignSelf: 'stretch', marginTop: 8 }}>
          <Button title={busy ? 'Opening…' : 'Pay Fees'} icon="arrow-forward" onPress={pay} disabled={busy} />
        </View>
        {!!msg && <Text style={s.msg}>{msg}</Text>}
        {failed && (
          <View style={{ alignSelf: 'stretch', gap: 8 }}>
            <Text style={s.v}>Unique ID: {child.unique_id}</Text>
            <Text style={s.v}>DOB: {child.dob.split('-').reverse().join('/')}</Text>
            <Button title="Open fee portal" variant="ghost" onPress={() => Linking.openURL(PORTAL_URL)} />
          </View>
        )}
      </Card>

      <Card style={{ gap: 14 }}>
        <Text style={s.section}>How it works</Text>
        {STEPS.map((x, i) => (
          <View key={i} style={s.step}>
            <IconCircle name={x.icon} size={40} />
            <View style={{ flex: 1 }}>
              <Text style={s.stepT}>{x.t}</Text>
              <Text style={s.stepD}>{x.d}</Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { padding: 16, gap: 14, maxWidth: 520, width: '100%', alignSelf: 'center' },
  top: { alignItems: 'center', gap: 6 },
  name: { fontSize: 22, fontWeight: '700', color: colors.text, marginTop: 6 },
  sub: { color: colors.muted },
  msg: { color: colors.text, textAlign: 'center', marginTop: 8, lineHeight: 20 },
  v: { fontSize: 15, fontWeight: '600', color: colors.text },
  section: { fontSize: 15, fontWeight: '700', color: colors.text },
  step: { flexDirection: 'row', gap: 12, alignItems: 'center' },
  stepT: { fontSize: 15, fontWeight: '600', color: colors.text },
  stepD: { fontSize: 12, color: colors.muted, marginTop: 2 },
});
