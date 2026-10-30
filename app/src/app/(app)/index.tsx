import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { ApprovalRow } from '../../components/ApprovalRow';
import { FadeUp, Fill, Float, useCountUp } from '../../components/motion';
import { Sheet } from '../../components/overlays';
import { Screen } from '../../components/Screen';
import { Avatar, Card, Eyebrow, H, Icon, LinkText, Mark, Press, Tag, Txt } from '../../components/ui';
import { PHASE_KEYS, PHASE_NAMES, type Project } from '../../data/types';
import { dayMonth, greeting, money, weekday, weekLabel } from '../../lib/format';
import { useStore } from '../../state/store';
import { goTab } from '../../state/view';
import { C, R } from '../../theme';

export default function Home() {
  const { profile, projects, detail, cur, selectProject, error, refresh } = useStore();
  const [sheet, setSheet] = useState(false);
  const project = detail?.project;
  const proposal = project?.status === 'proposal';
  const pct = useCountUp(project && !proposal ? project.progress : 0, 900, project?.id);

  if (!project || !detail) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, backgroundColor: C.bg, padding: 28 }}>
        {error ? (
          <>
            <Txt size={14} color={C.mu} style={{ textAlign: 'center' }}>Couldn’t load your projects.{'\n'}{error}</Txt>
            <LinkText onPress={() => refresh()}>Try again</LinkText>
          </>
        ) : projects.length === 0 && profile ? (
          <Txt size={14} color={C.mu} style={{ textAlign: 'center' }}>No projects yet. Your Embed lead will add you to one.</Txt>
        ) : <ActivityIndicator color={C.mint} />}
      </View>
    );
  }

  const curIdx = PHASE_KEYS.indexOf(project.currentPhase);
  const curPhase = detail.phases.find(p => p.key === project.currentPhase);
  const pending = detail.approvals.filter(a => a.status === 'pending');
  const quoted = detail.requests.find(r => r.status === 'quoted');
  const sizing = detail.requests.find(r => r.status === 'reviewing');
  const accepted = detail.requests.filter(r => r.status === 'accepted').length;
  const dueInv = detail.invoices.find(i => i.status === 'due');
  const firstName = profile?.fullName.split(' ')[0] ?? '';

  return (
    <>
      <Screen root decor={
        <Float duration={8000} style={{ position: 'absolute', right: -70, top: 70, opacity: 0.07 }}>
          <View pointerEvents="none"><Mark size={260} color={C.mint} /></View>
        </Float>
      }>
        <View style={{ gap: 20 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <Press onPress={() => setSheet(true)} accessibilityLabel={`Project: ${project.name}. Switch project`} style={{
              flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingVertical: 6, paddingLeft: 6, paddingRight: 12,
              borderRadius: R.pill, borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf,
            }}>
              <Avatar label={project.name[0]} size={32} bg={C.mint} color={C.mi} display />
              <Txt w={500} size={14}>{project.name}</Txt>
              <Icon name="BasicsDownSmall" size={18} color={C.mu} />
            </Press>
            <Press onPress={() => router.push('/more')} accessibilityLabel="Account" style={{
              width: 44, height: 44, borderRadius: R.pill, borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf, alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon name="EssentialsUserCircle" size={22} />
            </Press>
          </View>

          <FadeUp delay={50} duration={500}>
            <Tag tag="hi">{greeting()}{firstName ? ', ' + firstName : ''}</Tag>
            <Txt f="mono" size={12} ls={0.02} color={C.mu} style={{ marginTop: 10 }}>
              {weekLabel(project.startOn, project.dueOn)} · due {project.dueOn ? dayMonth(project.dueOn) : 'TBC'}
            </Txt>
            <H size={30} style={{ marginTop: 6 }}>{project.subtitle}</H>
          </FadeUp>

          {proposal ? <ProposalCard project={project} /> : (
            <FadeUp delay={120} duration={500}>
              <Card style={{ padding: 16 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
                  <Eyebrow>Phase {curIdx + 1} of 5</Eyebrow>
                  <H size={28} ls={-0.03} lh={1.1} style={{ fontVariant: ['tabular-nums'] }}>
                    {Math.round(pct)}<H size={16} color={C.mu}>%</H>
                  </H>
                </View>
                <View style={{ marginTop: 12, flexDirection: 'row', gap: 4 }}>
                  {PHASE_KEYS.map((k, i) => {
                    const fill = i < curIdx ? 100 : i === curIdx ? Math.min(100, Math.max(8, Math.round(((project.progress / 100) * 5 - curIdx) * 100))) : 0;
                    return (
                      <Press key={k} onPress={() => router.push(`/phase/${k}`)} accessibilityLabel={PHASE_NAMES[k]}
                        style={{ flex: 1, height: 44, justifyContent: 'center', gap: 8 }}>
                        <View style={{ height: 6, borderRadius: 999, backgroundColor: C.ln, overflow: 'hidden' }}>
                          <Fill delay={120 + i * 90} width={`${fill}%`} color={i < curIdx ? C.tx : C.mint} sheen={i === curIdx} />
                        </View>
                        <Txt w={500} size={11} color={i <= curIdx ? C.tx : C.mu}>{PHASE_NAMES[k]}</Txt>
                      </Press>
                    );
                  })}
                </View>
                <Press onPress={() => router.push(`/phase/${project.currentPhase}`)} style={{
                  marginTop: 14, minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  borderTopWidth: 1, borderTopColor: C.ln, paddingTop: 12,
                }}>
                  <View style={{ flex: 1 }}>
                    <Txt w={500} size={15}>Now: {PHASE_NAMES[project.currentPhase]} — {curPhase?.nowLabel}</Txt>
                    <Txt size={13} color={C.mu} style={{ marginTop: 2 }}>{project.phaseSummary}</Txt>
                  </View>
                  <Icon name="BasicsRightSmall" size={20} color={C.mu} />
                </Press>
              </Card>
            </FadeUp>
          )}

          {pending.length > 0 && !proposal ? (
            <View>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <Tag tag="needs-you" size={12} attr={<>{' count="'}<Txt f="mono" size={12}>{pending.length}</Txt>{'"'}</>} />
                <LinkText onPress={() => goTab('/approvals')}>All approvals</LinkText>
              </View>
              <View style={{ gap: 8 }}>{pending.map((a, i) => <ApprovalRow key={a.id} a={a} delay={i * 70} />)}</View>
            </View>
          ) : null}

          {!proposal ? (
            <>
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Glance label="Scope" onPress={() => goTab('/scope')}
                  value={quoted ? '1 quote ready to accept' : sizing ? '1 brief being sized' : `${accepted} change${accepted === 1 ? '' : 's'} in plan`} />
                <Glance label="Billing" onPress={() => router.push('/invoices')}
                  value={dueInv ? `${money(dueInv.amountInr, cur)} due ${dueInv.dueOn ? dayMonth(dueInv.dueOn) : ''}` : 'Nothing due'} />
              </View>

              {detail.activity.length ? (
                <View>
                  <Txt f="mono" size={12} color={C.mu} style={{ marginBottom: 10 }}>{'<this-week>'}</Txt>
                  {detail.activity.slice(0, 4).map((ev, i) => (
                    <FadeUp key={ev.id} delay={300 + i * 60} duration={500} style={{ flexDirection: 'row', gap: 10, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.ln }}>
                      <Txt f="mono" size={11} color={C.mu} style={{ width: 44, paddingTop: 2 }}>{weekday(ev.createdAt)}</Txt>
                      <View style={{ flex: 1 }}>
                        <Txt size={14} lh={1.4}>{ev.body}</Txt>
                        <Txt size={12} color={C.mu} style={{ marginTop: 2 }}>{ev.actorName === profile?.fullName ? 'You' : ev.actorName}</Txt>
                      </View>
                    </FadeUp>
                  ))}
                </View>
              ) : null}
            </>
          ) : null}
        </View>
      </Screen>

      <Sheet open={sheet} onClose={() => setSheet(false)}>
        <H size={20} ls={-0.02}>Your projects</H>
        <View style={{ marginTop: 12, gap: 6 }}>
          {projects.map(p => {
            const on = p.id === project.id;
            return (
              <Press key={p.id} onPress={() => { setSheet(false); selectProject(p.id); }} accessibilityState={{ selected: on }} style={{
                flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64, paddingVertical: 12, paddingHorizontal: 14, borderRadius: R.md,
                borderWidth: 1, borderColor: on ? C.mint : C.ln, backgroundColor: on ? C.mintsoft : C.sf,
              }}>
                <Avatar label={p.name[0]} size={36} bg={C.mint} color={C.mi} display />
                <View style={{ flex: 1 }}>
                  <Txt w={500} size={15}>{p.name}</Txt>
                  <Txt size={12} color={C.mu}>{p.subtitle} · {p.status === 'proposal' ? 'Proposal in progress' : PHASE_NAMES[p.currentPhase]}</Txt>
                </View>
                <Txt f="mono" size={12} color={C.mu}>{p.status === 'proposal' ? '—' : p.progress + '%'}</Txt>
              </Press>
            );
          })}
          <Press onPress={() => { setSheet(false); router.push({ pathname: '/brief', params: { mode: 'project' } }); }} style={{
            flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 14, borderRadius: R.md,
            borderWidth: 1, borderColor: C.ln, borderStyle: 'dashed',
          }}>
            <View style={{ width: 36, height: 36, borderRadius: 999, borderWidth: 1, borderColor: C.ln, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="BasicsAdd" size={18} color={C.mu} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt w={500} size={15}>Start a new project</Txt>
              <Txt size={12} color={C.mu}>Brief us · proposal within 3 working days</Txt>
            </View>
          </Press>
        </View>
      </Sheet>
    </>
  );
}

function Glance({ label, value, onPress }: { label: string; value: string; onPress: () => void }) {
  return (
    <Press onPress={onPress} style={{ flex: 1, minHeight: 84, paddingVertical: 14, paddingHorizontal: 16, borderRadius: R.md, borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf }}>
      <Eyebrow>{label}</Eyebrow>
      <Txt w={500} size={15} lh={1.3} style={{ marginTop: 8 }}>{value}</Txt>
    </Press>
  );
}

function ProposalCard({ project }: { project: Project }) {
  return (
    <Card style={{ padding: 16 }}>
      <Eyebrow>Before Phase 1</Eyebrow>
      <H size={22} ls={-0.02} lh={1.1} style={{ marginTop: 6 }}>Brief received — we’re preparing your proposal</H>
      <View style={{ marginTop: 12, gap: 8 }}>
        <Step state="done">Brief sent · {project.budgetLabel} · {project.timing}</Step>
        <Step state="next">{project.leadName} books a 30-min discovery call</Step>
        <Step state="later">Fixed-price proposal here within 3 working days</Step>
      </View>
      <View style={{ marginTop: 14, paddingTop: 12, borderTopWidth: 1, borderTopColor: C.ln }}>
        <Txt size={13} color={C.mu}>Then: Research → Strategy → Ideation → Design → Handover</Txt>
      </View>
    </Card>
  );
}

function Step({ state, children }: { state: 'done' | 'next' | 'later'; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', gap: 10, alignItems: 'flex-start' }}>
      {state === 'done' ? (
        <View style={{ width: 20, height: 20, borderRadius: 999, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="BasicsTickSmall" size={12} color={C.mi} />
        </View>
      ) : <View style={{ width: 20, height: 20, borderRadius: 999, borderWidth: 1.5, borderColor: state === 'next' ? C.mint : C.ln }} />}
      <Txt size={14} lh={1.45} color={state === 'later' ? C.mu : C.tx} style={{ flex: 1 }}>{children}</Txt>
    </View>
  );
}
