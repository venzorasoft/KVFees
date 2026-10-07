import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import type { RootStack } from '../../App';
import { Alert } from '../alert';
import { Child, deleteChild, getMe, listChildren } from '../api';
import { colors, radius, shadow } from '../theme';
import { Card, GradientHeader, IconCircle, RoundAction } from '../ui';

export default function HomeScreen() {
  const nav = useNavigation<NativeStackNavigationProp<RootStack>>();
  const [children, setChildren] = useState<Child[]>([]);
  const [name, setName] = useState('');
  const [error, setError] = useState(false);

  const load = useCallback(() => {
    listChildren().then((c) => { setChildren(c); setError(false); }).catch(() => setError(true));
    getMe().then((m) => setName(m.name)).catch(() => {});
  }, []);
  useFocusEffect(load);

  const remove = (c: Child) =>
    Alert.alert('Delete', `Remove ${c.alias_name}?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteChild(c.id).then(load) },
    ]);

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.bg }} contentContainerStyle={{ paddingBottom: 24 }}>
      <GradientHeader title="KV Fee Helper">
        <Text style={s.hello}>{name ? `Hello, ${name}` : 'Hello'}</Text>
        <Text style={s.big}>{children.length} {children.length === 1 ? 'child' : 'children'}</Text>
        <Text style={s.caption}>Tap a child to pay fees</Text>
        <View style={s.actions}>
          <RoundAction icon="add" label="Add Child" onPress={() => nav.navigate('AddChild')} />
          <RoundAction icon="time-outline" label="History" onPress={() => nav.navigate('Main' as any, { screen: 'History' })} />
        </View>
      </GradientHeader>

      <Card style={s.sheet}>
        {error && <Text style={s.err}>Could not reach the server. Pull back and try again.</Text>}
        <View style={s.grid}>
          {children.map((c) => (
            <Pressable key={c.id} style={s.tile} onPress={() => nav.navigate('Pay', { child: c })} onLongPress={() => remove(c)}>
              <View style={s.tileTop}>
                <IconCircle name="school-outline" />
                <Pressable hitSlop={10} onPress={() => remove(c)}>
                  <Ionicons name="trash-outline" size={16} color={colors.muted} />
                </Pressable>
              </View>
              <Text style={s.tileName} numberOfLines={1}>{c.alias_name}</Text>
              <Text style={s.tileSub}>ID ••••{c.unique_id.slice(-3)}</Text>
              <View style={s.payPill}>
                <Text style={s.payText}>Pay Fees</Text>
                <Ionicons name="arrow-forward" size={14} color="#fff" />
              </View>
            </Pressable>
          ))}
          <Pressable style={[s.tile, s.addTile]} onPress={() => nav.navigate('AddChild')}>
            <IconCircle name="add" />
            <Text style={s.tileName}>{children.length ? 'Add another' : 'Add your child'}</Text>
            <Text style={s.tileSub}>Unique ID + date of birth</Text>
          </Pressable>
        </View>
      </Card>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  hello: { color: '#DCE7FF', fontSize: 14 },
  big: { color: '#fff', fontSize: 34, fontWeight: '700', marginTop: 4 },
  caption: { color: '#B9CCFF', fontSize: 13, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 28, marginTop: 22 },
  sheet: { marginTop: -36, marginHorizontal: 16, padding: 12, borderRadius: 24 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  tile: { flexGrow: 1, flexBasis: '46%', backgroundColor: '#fff', borderRadius: radius.tile, padding: 14, borderWidth: 1, borderColor: colors.line, gap: 4, ...shadow },
  addTile: { borderStyle: 'dashed', backgroundColor: colors.bg, justifyContent: 'center', alignItems: 'flex-start', gap: 6 },
  tileTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 },
  tileName: { fontSize: 16, fontWeight: '700', color: colors.text },
  tileSub: { fontSize: 12, color: colors.muted },
  payPill: { marginTop: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: colors.primary, paddingVertical: 9, borderRadius: 12 },
  payText: { color: '#fff', fontWeight: '600', fontSize: 13 },
  err: { color: colors.red, marginBottom: 8 },
});
