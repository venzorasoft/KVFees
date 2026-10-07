import { LinearGradient } from 'expo-linear-gradient';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { RootStack } from '../../App';
import { Alert } from '../alert';
import { requestOtp, verifyOtp } from '../api';
import { resolveLaunchRoutes } from '../launch';
import { registerForPush } from '../notifications';
import { colors } from '../theme';
import { Button, Card, Field, IconCircle } from '../ui';

export default function LoginScreen({ navigation }: NativeStackScreenProps<RootStack, 'Login'>) {
  const insets = useSafeAreaInsets();
  const [identifier, setIdentifier] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  const fail = (e: any) => Alert.alert('Failed', e?.response?.data?.detail?.toString?.() ?? 'Could not reach the server');

  const send = async () => {
    setBusy(true);
    try {
      const res = await requestOtp(identifier.trim());
      if (res.dev_code) setCode(res.dev_code); // dev only: no SMS provider yet
      setSent(true);
    } catch (e) {
      fail(e);
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setBusy(true);
    try {
      await verifyOtp(identifier.trim(), code.trim());
      registerForPush().catch(() => {});
      const routes = await resolveLaunchRoutes();
      navigation.reset({ index: routes.length - 1, routes: routes as any });
    } catch (e) {
      fail(e);
      setBusy(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <LinearGradient colors={[colors.primary, colors.primaryDark]} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={[s.c, { paddingTop: insets.top + 40 }]} keyboardShouldPersistTaps="handled">
          <IconCircle name="school" size={72} tint={colors.primary} bg="#fff" />
          <Text style={s.h}>KV Fee Helper</Text>
          <Text style={s.sub}>Pay school fees in one tap.{'\n'}Log in once, stay signed in.</Text>

          <Card style={s.card}>
            <Text style={s.title}>{sent ? 'Enter the code' : 'Welcome'}</Text>
            <Text style={s.hint}>{sent ? `We sent a 6-digit code to ${identifier}` : 'Use your mobile number or email'}</Text>
            <Field icon="person-outline">
              <TextInput style={s.input} placeholder="Mobile number or email" placeholderTextColor={colors.muted}
                autoCapitalize="none" keyboardType="email-address" editable={!sent} value={identifier} onChangeText={setIdentifier} />
            </Field>
            {sent && (
              <Field icon="key-outline">
                <TextInput style={s.input} placeholder="6-digit code" placeholderTextColor={colors.muted} keyboardType="number-pad"
                  maxLength={8} textContentType="oneTimeCode" autoComplete="sms-otp" value={code} onChangeText={setCode} />
              </Field>
            )}
            {sent ? (
              <>
                <Button title="Verify & continue" onPress={verify} disabled={busy || code.length < 4} />
                <View style={s.links}>
                  <Text style={s.link} onPress={send}>Resend code</Text>
                  <Text style={s.link} onPress={() => { setSent(false); setCode(''); }}>Change number</Text>
                </View>
              </>
            ) : (
              <Button title="Send code" onPress={send} disabled={busy || identifier.trim().length < 5} />
            )}
          </Card>
          <Text style={s.note}>Unofficial helper. Not affiliated with KVS or Union Bank of India.</Text>
        </ScrollView>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  c: { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 40 },
  h: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 16 },
  sub: { color: '#DCE7FF', textAlign: 'center', marginTop: 8, lineHeight: 20 },
  card: { width: '100%', maxWidth: 440, marginTop: 32, gap: 14 },
  title: { fontSize: 20, fontWeight: '700', color: colors.text },
  hint: { color: colors.muted, marginTop: -8 },
  input: { flex: 1, fontSize: 16, color: colors.text, outlineStyle: 'none' } as any,
  links: { flexDirection: 'row', justifyContent: 'space-between' },
  link: { color: colors.primary, fontWeight: '600' },
  note: { color: '#B9CCFF', fontSize: 12, textAlign: 'center', marginTop: 20 },
});
