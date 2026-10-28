import { router } from 'expo-router';
import { View } from 'react-native';
import { StepDot } from '../../components/motion';
import { Screen } from '../../components/Screen';
import { Button, Eyebrow, H, LinkText, Pill, Press, Txt } from '../../components/ui';
import { useStore } from '../../state/store';
import { pill } from '../../state/view';
import { C, R } from '../../theme';

const HOW = [
  ['Brief', ' — 3 short steps, about 2 minutes.'],
  ['Quote', ' — fixed price + timeline impact from your lead, within a working day.'],
  ['Accept', ' — in-app. Work is scheduled; 50% invoiced on acceptance.'],
] as const;

export default function Scope() {
  const { detail } = useStore();
  const requests = detail?.requests ?? [];
  const proposal = detail?.project.status === 'proposal';

  return (
    <Screen root>
      <H size={30}>Scope</H>
      <Txt size={14} lh={1.5} color={C.mu} style={{ marginTop: 6 }}>
        Need something that isn’t in the plan? Brief us here. You’ll get a fixed-price quote in the app within one working day.
      </Txt>
      <View style={{ marginTop: 16 }}>
        <Button disabled={proposal} onPress={() => router.push({ pathname: '/brief', params: { mode: 'scope' } })}>Request a scope change</Button>
        {proposal ? <Txt size={12} color={C.mu} style={{ marginTop: 8, textAlign: 'center' }}>Scope changes open once your proposal is accepted.</Txt> : null}
        <View style={{ marginTop: 10, alignItems: 'center', minHeight: 44, justifyContent: 'center' }}>
          <LinkText size={14} onPress={() => router.push({ pathname: '/brief', params: { mode: 'project' } })}>Start a new project</LinkText>
        </View>
      </View>

      {requests.length ? (
        <>
          <Eyebrow style={{ marginTop: 24 }}>Requests</Eyebrow>
          <View style={{ marginTop: 8, gap: 8 }}>
            {requests.map(r => {
              const p = pill(r.status);
              return (
                <Press key={r.id} onPress={() => router.push(`/quote/${r.id}`)} style={{
                  paddingVertical: 14, paddingHorizontal: 16, borderRadius: R.md, borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf, minHeight: 72,
                }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
                    <Txt w={500} size={15} style={{ flex: 1 }}>{r.title}</Txt>
                    <Pill label={p.label} bg={p.bg} color={p.color} />
                  </View>
                  <Txt size={13} lh={1.4} color={C.mu} style={{ marginTop: 6 }}>{r.summary}</Txt>
                </Press>
              );
            })}
          </View>
        </>
      ) : null}

      <View style={{ marginTop: 24, paddingVertical: 14, paddingHorizontal: 16, borderRadius: R.md, borderWidth: 1, borderColor: C.ln }}>
        <Txt f="mono" size={12} color={C.mu}>{'<how-it-works>'}</Txt>
        <View style={{ marginTop: 12 }}>
          {HOW.map(([b, rest], i) => (
            <View key={b} style={{ flexDirection: 'row', gap: 12 }}>
              <View style={{ width: 18, alignItems: 'center', paddingTop: 5 }}>
                <StepDot delay={i * 800} />
                {i < HOW.length - 1 ? <View style={{ flex: 1, width: 1, backgroundColor: C.ln }} /> : null}
              </View>
              <Txt size={13} lh={1.5} style={{ flex: 1, paddingBottom: i < HOW.length - 1 ? 14 : 0 }}>
                <Txt w={600} size={13}>{b}</Txt>{rest}
              </Txt>
            </View>
          ))}
        </View>
      </View>
    </Screen>
  );
}
