import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, View } from 'react-native';
import { FadeUp } from '../../components/motion';
import { OutlinedNumeral } from '../../components/OutlinedNumeral';
import { useFeedback } from '../../components/overlays';
import { Screen } from '../../components/Screen';
import { BackRow, Button, Card, Eyebrow, Field, H, Icon, Press, Txt, sel } from '../../components/ui';
import { api } from '../../data/api';
import { quoteEta, type Currency } from '../../lib/format';
import { useStore } from '../../state/store';
import { goBack, goTab } from '../../state/view';
import { C, R } from '../../theme';

type Mode = 'scope' | 'project';
type Draft = { step: number; pname: string; types: string[]; desc: string; goal: string; prio: 'Low' | 'Normal' | 'Urgent'; budget: number | null; when: string };

const EMPTY: Draft = { step: 1, pname: '', types: [], desc: '', goal: '', prio: 'Normal', budget: null, when: '' };
const SCOPE_TYPES = ['New screens', 'New feature', 'Design system', 'Research & testing', 'Website'];
const SERVICES = ['UX research', 'Product UX & UI', 'Design system', 'AI product design', 'Website / Shopify', 'UX audit'];
const PRIOS = ['Low', 'Normal', 'Urgent'] as const;
const BUDGETS: Record<Currency, string[]> = { INR: ['< ₹5L', '₹5–15L', '₹15–40L', '₹40L+'], USD: ['< $6k', '$6–18k', '$18–48k', '$48k+'] };
const WHENS = [
  { name: 'As soon as possible', sub: 'We re-plan the current phase around it' },
  { name: 'Next phase', sub: 'Slots in without moving the due date' },
  { name: 'Flexible', sub: 'Usually the best price' },
];

// "Save & exit" keeps the draft for the session, per mode.
const drafts: Record<Mode, Draft> = { scope: EMPTY, project: EMPTY };

export default function Brief() {
  const { mode: m } = useLocalSearchParams<{ mode?: string }>();
  const mode: Mode = m === 'project' ? 'project' : 'scope';
  const isProj = mode === 'project';
  const { detail, cur, refresh } = useStore();
  const { toast, celebrate } = useFeedback();
  const [b, setB] = useState<Draft>({ ...drafts[mode], step: 1 });
  const [err1, setErr1] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (patch: Partial<Draft>) => setB(x => ({ ...x, ...patch }));
  const projectName = detail?.project.name ?? '';
  const lead = detail?.project.leadName ?? 'Arnav';
  const budgetLabel = b.budget == null ? 'Not sure yet' : BUDGETS[cur][b.budget];

  const next = () => {
    if (b.step === 1 && (b.types.length === 0 || b.desc.trim().length < 10 || (isProj && !b.pname.trim()))) return setErr1(true);
    set({ step: Math.min(4, b.step + 1) });
  };
  const back = () => (b.step > 1 ? set({ step: b.step - 1 }) : goBack());
  const saveExit = () => {
    drafts[mode] = b;
    goBack();
    toast(isProj ? 'Draft saved. Pick it up from Your projects.' : 'Draft saved. Pick it up any time from Scope.');
  };

  const submit = async () => {
    setBusy(true);
    try {
      if (isProj) {
        const name = b.pname.trim();
        const id = await api.submitProjectBrief({ name, services: b.types, brief: b.desc.trim(), goal: b.goal, budgetLabel, timing: b.when || 'Flexible' });
        drafts.project = EMPTY;
        await refresh(id);
        await celebrate('Brief sent', 'new', name);
        goTab('/');
        toast(lead + ' will reach out to book discovery.');
      } else {
        if (!detail) return;
        await api.submitScopeRequest(detail.project.id, { types: b.types, description: b.desc, goal: b.goal, priority: b.prio, timing: b.when || 'Flexible' });
        drafts.scope = EMPTY;
        await refresh();
        await celebrate('Brief sent', 'scope', 'quote by ' + quoteEta());
        goTab('/scope');
        toast('We’ll notify you when the quote lands.');
      }
    } catch (e) {
      toast('Couldn’t send the brief: ' + (e as Error).message);
    } finally { setBusy(false); }
  };

  const review: [string, string, number][] = isProj
    ? [['Project', b.pname || '—', 1], ['Services', b.types.join(', ') || '—', 1], ['Brief', b.desc || '—', 1], ['Goal', b.goal || 'Not specified', 2], ['Budget', budgetLabel, 2], ['When', b.when || 'Flexible', 3]]
    : [['What', (b.types.join(', ') || '—') + (b.desc ? ' — ' + b.desc : ''), 1], ['Goal', b.goal || 'Not specified', 2], ['Priority', b.prio, 2], ['When', b.when || 'Flexible', 3]];

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen tabs={false} fill>
        <BackRow onBack={back} right={
          <Press onPress={saveExit} style={{ minHeight: 44, paddingHorizontal: 6, justifyContent: 'center' }}>
            <Txt size={14} color={C.mu}>Save & exit</Txt>
          </Press>
        } />
        <View style={{ flexDirection: 'row', gap: 4, marginTop: 4 }} accessibilityLabel={`Step ${b.step} of 4`}>
          {[1, 2, 3, 4].map(n => <View key={n} style={{ flex: 1, height: 3, borderRadius: 999, backgroundColor: n <= b.step ? C.mint : C.ln }} />)}
        </View>
        <View style={{ marginTop: 16 }}>
          <FadeUp key={'n' + b.step} style={{ position: 'absolute', right: -6, top: -22 }}>
            <OutlinedNumeral text={'0' + b.step} size={120} />
          </FadeUp>
          <Txt f="mono" size={12} color={C.mu}>{isProj ? 'New project' : 'Scope change · ' + projectName} · step {b.step} of 4</Txt>
        </View>

        {b.step === 1 ? (
          <>
            <H size={28} lh={1.08} style={{ marginTop: 4 }}>{isProj ? 'Tell us about the project' : 'What do you need?'}</H>
            {isProj ? (
              <View style={{ marginTop: 16 }}>
                <Field label="Project name" value={b.pname} onChangeText={t => { set({ pname: t }); setErr1(false); }} placeholder="e.g. Lending dashboard redesign" />
                <Eyebrow style={{ marginTop: 16 }}>Services you need</Eyebrow>
              </View>
            ) : null}
            <View style={{ marginTop: 10, flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {(isProj ? SERVICES : SCOPE_TYPES).map(t => {
                const on = b.types.includes(t), s = sel(on);
                return (
                  <Press key={t} onPress={() => { set({ types: on ? b.types.filter(x => x !== t) : [...b.types, t] }); setErr1(false); }}
                    accessibilityRole="checkbox" accessibilityState={{ checked: on }}
                    style={{ minHeight: 40, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: s.borderColor, backgroundColor: s.backgroundColor, justifyContent: 'center' }}>
                    <Txt w={500} size={14} color={s.color}>{t}</Txt>
                  </Press>
                );
              })}
            </View>
            <View style={{ marginTop: 20 }}>
              <Field label="Describe it" value={b.desc} multiline numberOfLines={5} style={{ minHeight: 128 }}
                onChangeText={t => { set({ desc: t }); setErr1(false); }}
                placeholder={isProj ? 'e.g. Redesign our B2B lending dashboard. 4 user roles, web first, launch in Q2.' : 'e.g. Add a referral screen so users can invite friends and see rewards earned.'} />
            </View>
            {err1 ? <Txt size={13} color={C.warn} style={{ marginTop: 8 }}>{isProj ? 'Name it, pick at least one service and add a sentence or two.' : 'Pick at least one type and add a sentence or two.'}</Txt> : null}
          </>
        ) : null}

        {b.step === 2 ? (
          <>
            <H size={28} lh={1.08} style={{ marginTop: 4 }}>What should it achieve?</H>
            <Txt size={14} lh={1.5} color={C.mu} style={{ marginTop: 8 }}>Outcomes help us size it right — and say no to what won’t move the needle.</Txt>
            <View style={{ marginTop: 16 }}>
              <Field label="Goal" value={b.goal} onChangeText={t => set({ goal: t })} multiline numberOfLines={3} style={{ minHeight: 88 }} placeholder="e.g. Lift activation from 31% to 40% in Q1." />
            </View>
            {isProj ? (
              <>
                <Eyebrow style={{ marginTop: 16 }}>Budget range · optional</Eyebrow>
                <View style={{ marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {BUDGETS[cur].map((label, i) => <Choice key={label} label={label} on={b.budget === i} onPress={() => set({ budget: b.budget === i ? null : i })} basis="48%" />)}
                </View>
                <Txt size={12} lh={1.5} color={C.mu} style={{ marginTop: 8 }}>A range helps us propose the right depth of work. It is not a commitment.</Txt>
              </>
            ) : (
              <>
                <Eyebrow style={{ marginTop: 16 }}>Priority</Eyebrow>
                <View style={{ marginTop: 8, flexDirection: 'row', gap: 6 }}>
                  {PRIOS.map(p => <Choice key={p} label={p} on={b.prio === p} onPress={() => set({ prio: p })} />)}
                </View>
              </>
            )}
          </>
        ) : null}

        {b.step === 3 ? (
          <>
            <H size={28} lh={1.08} style={{ marginTop: 4 }}>When do you need it?</H>
            <View style={{ marginTop: 16, gap: 6 }} accessibilityRole="radiogroup">
              {WHENS.map(w => {
                const on = b.when === w.name;
                return (
                  <Press key={w.name} onPress={() => set({ when: w.name })} accessibilityRole="radio" accessibilityState={{ checked: on }} style={{
                    minHeight: 56, paddingVertical: 12, paddingHorizontal: 16, borderRadius: R.md, borderWidth: 1, borderColor: on ? C.mint : C.ln,
                    backgroundColor: on ? C.mintsoft : C.sf, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10,
                  }}>
                    <View style={{ flex: 1 }}>
                      <Txt w={500} size={15}>{w.name}</Txt>
                      <Txt size={13} color={C.mu} style={{ marginTop: 2 }}>{w.sub}</Txt>
                    </View>
                    <View style={{ width: 20, height: 20, borderRadius: 999, borderWidth: 1.5, borderColor: on ? C.mint : C.ln, backgroundColor: on ? C.mint : 'transparent' }} />
                  </Press>
                );
              })}
            </View>
            <Press onPress={() => toast('Send files to ' + lead + ' in Chat — attachments are coming to briefs soon.')} style={{
              marginTop: 16, minHeight: 52, borderRadius: R.md, borderWidth: 1, borderColor: C.ln, borderStyle: 'dashed',
              flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}>
              <Icon name="AuthoringAttach" size={18} color={C.mu} />
              <Txt size={14} color={C.mu}>Attach references (optional)</Txt>
            </Press>
          </>
        ) : null}

        {b.step === 4 ? (
          <>
            <H size={28} lh={1.08} style={{ marginTop: 4 }}>{isProj ? 'Review your project brief' : 'Review your brief'}</H>
            <Card style={{ marginTop: 16, overflow: 'hidden' }}>
              {review.map(([k, v, step], i) => (
                <Press key={k} onPress={() => set({ step })} accessibilityLabel={`Edit ${k}`} style={{
                  flexDirection: 'row', gap: 12, paddingVertical: 12, paddingHorizontal: 16, minHeight: 48,
                  borderBottomWidth: i < review.length - 1 ? 1 : 0, borderBottomColor: C.ln,
                }}>
                  <Txt f="mono" size={11} ls={0.04} upper color={C.mu} style={{ width: 72, paddingTop: 3 }}>{k}</Txt>
                  <Txt size={14} lh={1.45} style={{ flex: 1 }}>{v}</Txt>
                  <Txt size={12} color={C.mu} style={{ textDecorationLine: 'underline' }}>Edit</Txt>
                </Press>
              ))}
            </Card>
            <View style={{ marginTop: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: R.md, backgroundColor: C.mintsoft }}>
              <Txt size={13} lh={1.5}>
                <Txt w={600} size={13}>What happens next:</Txt> {lead}{' '}
                {isProj
                  ? 'reviews it and books a 30-min discovery call; you get a fixed-price proposal here within 3 working days.'
                  : <>reviews it and sends a fixed-price quote here by <Txt w={600} size={13}>{quoteEta()}</Txt>.</>}
                {' '}Nothing is billed until you accept.
              </Txt>
            </View>
          </>
        ) : null}

        <View style={{ flex: 1, minHeight: 20 }} />
        {b.step < 4
          ? <Button onPress={next}>Continue</Button>
          : <Button onPress={submit} disabled={busy}>{isProj ? 'Send project brief' : 'Send brief'}</Button>}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Choice({ label, on, onPress, basis }: { label: string; on: boolean; onPress: () => void; basis?: `${number}%` }) {
  const s = sel(on);
  return (
    <Press onPress={onPress} accessibilityRole="radio" accessibilityState={{ checked: on }} style={{
      flexGrow: 1, flexBasis: basis ?? 0, minHeight: 44, borderRadius: R.md, borderWidth: 1, borderColor: s.borderColor, backgroundColor: s.backgroundColor,
      alignItems: 'center', justifyContent: 'center',
    }}>
      <Txt w={500} size={14} color={s.color}>{label}</Txt>
    </Press>
  );
}
