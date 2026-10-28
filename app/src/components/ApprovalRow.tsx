import { router } from 'expo-router';
import { View } from 'react-native';
import type { Approval } from '../data/types';
import { daysUntil, dueIn } from '../lib/format';
import { C, R } from '../theme';
import { FadeUp, PulseDot } from './motion';
import { Press, Txt } from './ui';

/** A pending approval: pulsing dot, title, kind · meta, and due date. */
export function ApprovalRow({ a, delay }: { a: Approval; delay: number }) {
  const urgent = a.dueOn != null && daysUntil(a.dueOn) < 3;
  return (
    <FadeUp delay={delay} duration={500}>
      <Press onPress={() => router.push(`/approval/${a.id}`)} style={{
        flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 64, paddingVertical: 14, paddingHorizontal: 16,
        borderRadius: R.md, borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf,
      }}>
        <PulseDot />
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt w={500} size={15}>{a.title}</Txt>
          <Txt size={13} color={C.mu} style={{ marginTop: 2 }}>{a.kind} · {a.meta}</Txt>
        </View>
        <Txt f="mono" size={11} color={urgent ? C.warn : C.mu}>{dueIn(a.dueOn)}</Txt>
      </Press>
    </FadeUp>
  );
}
