import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { Child, Payment, listChildren, listPayments } from '../api';
import { colors } from '../theme';
import { Card, GradientHeader, IconCircle } from '../ui';

const dayLabel = (iso: string) => {
  const d = new Date(iso);
  const today = new Date();
  const yest = new Date(Date.now() - 86400000);
  if (d.toDateString() === today.toDateString()) return 'TODAY';
  if (d.toDateString() === yest.toDateString()) return 'YESTERDAY';
  return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase();
};

const STATUS: Record<string, { color: string; icon: keyof typeof Ionicons.glyphMap; sign: string }> = {
  success: { color: colors.red, icon: 'checkmark-circle-outline', sign: '-' },
  pending: { color: colors.amber, icon: 'time-outline', sign: '' },
  failed: { color: colors.muted, icon: 'close-circle-outline', sign: '' },
};

export default function HistoryScreen() {
  const [rows, setRows] = useState<Payment[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [q, setQ] = useState('');

  useFocusEffect(useCallback(() => {
    listPayments().then(setRows).catch(() => {});
    listChildren().then(setChildren).catch(() => {});
  }, []));

  const groups = useMemo(() => {
    const alias = new Map(children.map((c) => [c.id, c.alias_name]));
    const needle = q.trim().toLowerCase();
    const out: { label: string; items: (Payment & { alias: string })[] }[] = [];
    for (const p of rows) {
      const a = alias.get(p.child_id) ?? 'Child';
      if (needle && !`${a} ${p.transaction_id ?? ''} ${p.status}`.toLowerCase().includes(needle)) continue;
      const label = dayLabel(p.timestamp);
      let g = out.find((x) => x.label === label);
      if (!g) out.push((g = { label, items: [] }));
      g.items.push({ ...p, alias: a });
    }
    return out;
  }, [rows, children, q]);

  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <GradientHeader title="Payment History" />
      <ScrollView style={s.sheet} contentContainerStyle={{ paddingBottom: 24 }}>
        <View style={s.search}>
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput style={s.searchInput} placeholder="Search" placeholderTextColor={colors.muted} value={q} onChangeText={setQ} />
        </View>
        {groups.length === 0 && (
          <Card style={s.empty}>
            <IconCircle name="receipt-outline" size={56} />
            <Text style={s.emptyTitle}>No payments yet</Text>
            <Text style={s.emptySub}>Payments you make through the app will show up here.</Text>
          </Card>
        )}
        {groups.map((g) => (
          <View key={g.label}>
            <Text style={s.day}>{g.label}</Text>
            <Card style={{ paddingVertical: 4 }}>
              {g.items.map((p, i) => {
                const st = STATUS[p.status] ?? STATUS.pending;
                return (
                  <View key={p.id} style={[s.row, i < g.items.length - 1 && s.line]}>
                    <IconCircle name={st.icon} tint={st.color} bg={colors.bg} />
                    <View style={{ flex: 1 }}>
                      <Text style={s.title}>{p.alias} · fee payment</Text>
                      <Text style={s.sub}>{new Date(p.timestamp).toLocaleString(undefined, { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                        {p.transaction_id ? ` · ${p.transaction_id}` : ''}</Text>
                    </View>
                    <Text style={[s.amt, { color: st.color }]}>{st.sign}₹{Number(p.amount).toLocaleString('en-IN')}</Text>
                  </View>
                );
              })}
            </Card>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  sheet: { marginTop: -36, paddingHorizontal: 16 },
  search: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, height: 48, marginBottom: 8 },
  searchInput: { flex: 1, fontSize: 15, color: colors.text, outlineStyle: 'none' } as any,
  day: { fontSize: 12, fontWeight: '600', color: colors.muted, marginTop: 16, marginBottom: 8, marginLeft: 4 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  line: { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.line },
  title: { fontSize: 15, fontWeight: '600', color: colors.text },
  sub: { fontSize: 12, color: colors.muted, marginTop: 2 },
  amt: { fontSize: 15, fontWeight: '700' },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 32, marginTop: 8 },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: colors.text },
  emptySub: { color: colors.muted, textAlign: 'center' },
});
