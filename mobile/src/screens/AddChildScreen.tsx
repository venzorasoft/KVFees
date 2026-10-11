import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import type { RootStack } from '../../App';
import { Alert } from '../alert';
import { addChild, deleteChild, updateChild } from '../api';
import { colors } from '../theme';
import { Button, Card, Field } from '../ui';

// The portal wants DD/MM/YYYY; the API stores ISO (YYYY-MM-DD).
const toIso = (dmy: string) => {
  const m = dmy.trim().match(/^(\d{2})[/-](\d{2})[/-](\d{4})$/);
  return m ? `${m[3]}-${m[2]}-${m[1]}` : null;
};
const toDmy = (iso: string) => iso.split('-').reverse().join('/');

export default function AddChildScreen({ navigation, route }: NativeStackScreenProps<RootStack, 'AddChild'>) {
  const editing = route.params?.child;
  const [alias, setAlias] = useState(editing?.alias_name ?? '');
  const [uid, setUid] = useState(editing?.unique_id ?? '');
  const [dob, setDob] = useState(editing ? toDmy(editing.dob) : '');
  const [busy, setBusy] = useState(false);

  const save = async () => {
    const iso = toIso(dob);
    if (!iso) return Alert.alert('Date of birth must be DD/MM/YYYY');
    setBusy(true);
    try {
      const body = { alias_name: alias.trim(), unique_id: uid.trim(), dob: iso };
      if (editing) await updateChild(editing.id, body);
      else await addChild(body);
      navigation.goBack();
    } catch (e: any) {
      Alert.alert('Failed', e?.response?.data?.detail?.toString?.() ?? 'Could not save');
      setBusy(false);
    }
  };

  const remove = () =>
    Alert.alert('Delete', `Remove ${editing?.alias_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChild(editing!.id).then(() => navigation.goBack()) },
    ]);

  return (
    <ScrollView contentContainerStyle={s.c} keyboardShouldPersistTaps="handled">
      <Card style={{ gap: 14 }}>
        <Text style={s.hint}>Enter the details exactly as on the fee portal. They're stored encrypted.</Text>
        <Field icon="happy-outline">
          <TextInput style={s.input} placeholder="Nickname (e.g. Riya)" placeholderTextColor={colors.muted} value={alias} onChangeText={setAlias} />
        </Field>
        <Field icon="id-card-outline">
          <TextInput style={s.input} placeholder="Student Unique ID" placeholderTextColor={colors.muted} autoCapitalize="characters" value={uid} onChangeText={setUid} />
        </Field>
        <Field icon="calendar-outline">
          <TextInput style={s.input} placeholder="Date of birth (DD/MM/YYYY)" placeholderTextColor={colors.muted} keyboardType="numbers-and-punctuation" maxLength={10} value={dob} onChangeText={setDob} />
        </Field>
        <Button title={editing ? 'Save changes' : 'Save child'} onPress={save} disabled={busy || !alias.trim() || !uid.trim() || dob.length < 10} />
        {editing && <Button title="Delete child" variant="danger" icon="trash-outline" onPress={remove} />}
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  c: { padding: 16 },
  hint: { color: colors.muted, lineHeight: 20 },
  input: { flex: 1, fontSize: 16, color: colors.text, outlineStyle: 'none' } as any,
});
