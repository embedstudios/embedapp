import { router, useLocalSearchParams } from 'expo-router';
import { Linking, ScrollView, View } from 'react-native';
import { FadeUp, Pop } from '../../../components/motion';
import { OutlinedNumeral } from '../../../components/OutlinedNumeral';
import { Screen } from '../../../components/Screen';
import { Avatar, BackRow, Card, Eyebrow, H, Icon, Pill, Press, Txt, sel } from '../../../components/ui';
import { PHASE_KEYS, PHASE_NAMES, type PhaseKey } from '../../../data/types';
import { useStore } from '../../../state/store';
import { goBack, pill, teamInitial } from '../../../state/view';
import { C, R } from '../../../theme';

export default function PhaseDetail() {
  const { key } = useLocalSearchParams<{ key: PhaseKey }>();
  const { detail } = useStore();
  if (!detail) return null;
  const { project } = detail;
  const k: PhaseKey = PHASE_KEYS.includes(key) ? key : project.currentPhase;
  const idx = PHASE_KEYS.indexOf(k), cur = PHASE_KEYS.indexOf(project.currentPhase);
  const phase = detail.phases.find(p => p.key === k);
  const items = detail.deliverables.filter(d => d.phase === k);
  const files = detail.files.filter(f => f.phase === k);
  const no = '0' + (idx + 1);

  return (
    <Screen>
      <BackRow label={project.name} onBack={goBack} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 8, marginBottom: 14, marginHorizontal: -20 }}
        contentContainerStyle={{ gap: 6, paddingHorizontal: 20 }}>
        {PHASE_KEYS.map(p => {
          const s = sel(p === k);
          return (
            <Press key={p} onPress={() => router.setParams({ key: p })} accessibilityState={{ selected: p === k }}
              style={{ height: 36, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: s.borderColor, backgroundColor: s.backgroundColor, justifyContent: 'center' }}>
              <Txt w={500} size={13} color={s.color}>{PHASE_NAMES[p]}</Txt>
            </Press>
          );
        })}
      </ScrollView>

      <View>
        <FadeUp key={'no' + k} duration={700} style={{ position: 'absolute', right: -6, top: -30 }}>
          <OutlinedNumeral text={no} size={150} />
        </FadeUp>
        <Txt f="mono" size={12} color={C.mu}>{`<phase ${no}/05> `}{idx < cur ? 'Complete' : idx === cur ? 'In progress' : 'Upcoming'}</Txt>
        <H size={32} style={{ marginTop: 4 }}>{PHASE_NAMES[k]}</H>
      </View>
      <Txt size={14} lh={1.5} color={C.mu} style={{ marginTop: 10 }}>{phase?.blurb}</Txt>

      <Eyebrow style={{ marginTop: 20 }}>Deliverables</Eyebrow>
      <Card style={{ marginTop: 8, overflow: 'hidden' }}>
        {items.map((d, i) => {
          const p = pill(d.status);
          const done = d.status === 'done', review = d.status === 'review';
          return (
            <FadeUp key={d.id} delay={i * 70} duration={450}>
              <Press onPress={() => { if (review && d.approvalId) router.push(`/approval/${d.approvalId}`); }} disabled={!(review && d.approvalId)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: i < items.length - 1 ? 1 : 0, borderBottomColor: C.ln }}>
                <Pop delay={i * 70 + 150} style={{
                  width: 22, height: 22, borderRadius: 999, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5,
                  backgroundColor: done ? C.tx : review ? C.mint : 'transparent', borderColor: done ? C.tx : review ? C.mint : C.ln,
                }}>
                  {done ? <Icon name="BasicsTickSmall" size={14} color={C.bg} /> : null}
                </Pop>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt size={15}>{d.name}</Txt>
                  <Txt size={12} color={C.mu} style={{ marginTop: 1 }}>{d.note}</Txt>
                </View>
                <Pill label={p.label} bg={p.bg} color={p.color} />
              </Press>
            </FadeUp>
          );
        })}
      </Card>

      {files.length ? (
        <>
          <Eyebrow style={{ marginTop: 20 }}>Files</Eyebrow>
          <View style={{ marginTop: 8, gap: 8 }}>
            {files.map(f => (
              <Press key={f.id} disabled={!f.url} onPress={() => f.url && Linking.openURL(f.url)} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: R.md,
                borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf, minHeight: 56,
              }}>
                <View style={{ width: 36, height: 36, borderRadius: 8, backgroundColor: C.sf2, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt f="mono" size={10} color={C.mu}>{f.ext}</Txt>
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Txt w={500} size={14} numberOfLines={1}>{f.name}</Txt>
                  <Txt size={12} color={C.mu}>{f.meta}</Txt>
                </View>
                <Icon name="ArrowsExpand" size={18} color={C.mu} />
              </Press>
            ))}
          </View>
        </>
      ) : null}

      <Eyebrow style={{ marginTop: 20 }}>Your Embed team</Eyebrow>
      <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {detail.team.map(m => (
          <Press key={m.id} onPress={() => router.push('/chat')} accessibilityLabel={`Message ${m.name}, ${m.role}`} style={{
            flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, paddingLeft: 8, paddingRight: 14, borderRadius: R.pill,
            borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf, minHeight: 44,
          }}>
            <Avatar label={teamInitial(m.name, detail.team)} />
            <View>
              <Txt w={500} size={13}>{m.name}</Txt>
              <Txt size={11} color={C.mu}>{m.role}</Txt>
            </View>
          </Press>
        ))}
      </View>
    </Screen>
  );
}
