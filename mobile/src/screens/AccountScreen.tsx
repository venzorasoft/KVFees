import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import type { RootStack } from '../../App';
import { Alert } from '../alert';
import { Child, Me, getMe, listChildren, logout, updateName } from '../api';
import { colors } from '../theme';
import { Avatar, Button, Card, Field, GradientHeader, Row } from '../ui';

export default function AccountScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const [me, setMe] = useState<Me | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState('');

  useFocusEffect(useCallback(() => {
    getMe().then((m) => { setMe(m); setName(m.name); }).catch(() => {});
    listChildren().then(setChildren).catch(() => {});
  }, []));

  const save = async () => {
    try {
      setMe(await updateName(name));
      Alert.alert('Saved');
    } catch {
      Alert.alert('Could not save');
    }
  };

  const signOut = () =>
    Alert.alert('Log out', 'You will need a new code to log in again.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Log out', style: 'destructive', onPress: async () => { await logout(); nav.reset({ index: 0, routes: [{ name: 'Login' }] }); } },
    ]);

  const contact = me?.email ?? (me?.mobile ? `+91 ${me.mobile}` : '');

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GradientHeader title="Account">
        <Avatar label={me?.name || contact} />
        <Text style={s.name}>{me?.name || 'Parent'}</Text>
        <Text style={s.contact}>{contact}</Text>
      </GradientHeader>
      <ScrollView style={s.sheet} contentContainerStyle={{ paddingBottom: 24, gap: 14 }}>
        <Card>
          <Text style={s.section}>Profile</Text>
          <Field icon="person-outline">
            <TextInput style={s.input} placeholder="Your name" placeholderTextColor={colors.muted} value={name} onChangeText={setName} />
          </Field>
          <View style={{ height: 10 }} />
          <Button title="Save name" variant="ghost" onPress={save} disabled={!name.trim() || name.trim() === me?.name} />
        </Card>

        <Card>
          <Text style={s.section}>Children</Text>
          {children.map((c) => (
            <Row key={c.id} icon="school-outline" title={c.alias_name} subtitle={`ID ••••${c.unique_id.slice(-3)}`} onPress={() => nav.navigate('Pay', { child: c })} />
          ))}
          <Row icon="add-circle-outline" title="Add a child" onPress={() => nav.navigate('AddChild')} last />
        </Card>

        <Card>
          <Text style={s.section}>Security</Text>
          <Row icon="lock-closed-outline" title="Stay signed in" subtitle="This phone remembers you until you log out" right={<View />} />
          <Row icon="shield-checkmark-outline" title="Captcha stays with you" subtitle="We never read or bypass the bank's captcha" right={<View />} last />
        </Card>

        <Button title="Log out" variant="danger" icon="log-out-outline" onPress={signOut} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  name: { color: '#fff', fontSize: 18, fontWeight: '700', marginTop: 10 },
  contact: { color: '#DCE7FF', fontSize: 13, marginTop: 2 },
  sheet: { marginTop: -28, paddingHorizontal: 16 },
  section: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8 },
  input: { flex: 1, fontSize: 16, color: colors.text, outlineStyle: 'none' } as any,
});
