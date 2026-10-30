import { router } from 'expo-router';
import { View } from 'react-native';
import { ApprovalRow } from '../../components/ApprovalRow';
import { Float } from '../../components/motion';
import { Screen } from '../../components/Screen';
import { Card, Eyebrow, H, Mark, Pill, Press, Tag, Txt } from '../../components/ui';
import { decidedOn } from '../../lib/format';
import { useStore } from '../../state/store';
import { pill } from '../../state/view';
import { C, R } from '../../theme';

export default function Approvals() {
  const { detail } = useStore();
  const approvals = detail?.approvals ?? [];
  const pending = approvals.filter(a => a.status === 'pending');
  const decided = approvals.filter(a => a.status !== 'pending');

  return (
    <Screen root>
      <H size={30}>Approvals</H>
      <View style={{ marginTop: 6 }}><Tag tag="rule" size={12}>Nothing moves without you</Tag></View>

      <Eyebrow style={{ marginTop: 20 }}>Waiting on you · {pending.length}</Eyebrow>
      <View style={{ marginTop: 8, gap: 8 }}>
        {pending.map((a, i) => <ApprovalRow key={a.id} a={a} delay={i * 70} />)}
        {pending.length === 0 ? (
          <View style={{ paddingVertical: 28, paddingHorizontal: 16, borderRadius: R.md, borderWidth: 1, borderColor: C.ln, borderStyle: 'dashed', alignItems: 'center', gap: 12 }}>
            <Float amp={6} duration={4000}><Mark size={44} color={C.mint} /></Float>
            <Tag tag="inbox-zero" size={12}>Nothing waiting on you</Tag>
          </View>
        ) : null}
      </View>

      {decided.length ? (
        <>
          <Eyebrow style={{ marginTop: 24 }}>Decided</Eyebrow>
          <Card style={{ marginTop: 8, overflow: 'hidden' }}>
            {decided.map((a, i) => {
              const p = pill(a.status);
              return (
                <Press key={a.id} onPress={() => router.push(`/approval/${a.id}`)} style={{
                  flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 16,
                  borderBottomWidth: i < decided.length - 1 ? 1 : 0, borderBottomColor: C.ln,
                }}>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Txt size={15}>{a.title}</Txt>
                    <Txt size={12} color={C.mu} style={{ marginTop: 1 }}>{a.kind} · {decidedOn(a.decidedAt)}</Txt>
                  </View>
                  <Pill label={p.label} bg={p.bg} color={p.color} />
                </Press>
              );
            })}
          </Card>
        </>
      ) : null}
    </Screen>
  );
}
