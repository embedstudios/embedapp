import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { View } from 'react-native';
import { FadeUp, useCountUp } from '../../../components/motion';
import { Sheet, useFeedback } from '../../../components/overlays';
import { Screen } from '../../../components/Screen';
import { Avatar, BackRow, Button, Card, Eyebrow, H, Pill, Segmented, Txt } from '../../../components/ui';
import { api } from '../../../data/api';
import { dayMonth, money, moneyAlt, quoteEta } from '../../../lib/format';
import { useStore } from '../../../state/store';
import { goBack, pill } from '../../../state/view';
import { C, R } from '../../../theme';

export default function Quote() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, cur, setCur, refresh } = useStore();
  const { toast, celebrate } = useFeedback();
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const r = detail?.requests.find(x => x.id === id);
  const price = r?.priceInr ?? 0;
  const total = useCountUp(price, 800, cur, true);
  if (!r || !detail) return null;

  const p = pill(r.status);
  const hasQuote = r.status === 'quoted' || r.status === 'accepted';
  const lead = detail.project.leadName;

  const accept = async () => {
    setBusy(true);
    try {
      await api.acceptQuote(r.id);
      setConfirm(false);
      await refresh();
      await celebrate('Scheduled', 'accepted', money(price, cur) + ' · ' + r.timeline);
      toast('Quote accepted. Work scheduled.', async () => {
        try { await api.undoAcceptQuote(r.id); await refresh(); } catch { toast('Too late to undo — message ' + lead + ' instead.'); }
      });
    } catch (e) {
      setConfirm(false);
      toast('Couldn’t accept: ' + (e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <>
      <Screen tabs={false} fill>
        <BackRow label="Scope" onBack={goBack} />
        <View style={{ marginTop: 8, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <Txt f="mono" size={12} color={C.mu}>{r.ref}</Txt>
          <Pill label={p.label} bg={p.bg} color={p.color} />
        </View>
        <H size={28} lh={1.08} style={{ marginTop: 4 }}>{r.title}</H>
        <Txt size={14} lh={1.5} color={C.mu} style={{ marginTop: 8 }}>{r.summary}</Txt>

        {hasQuote ? (
          <>
            <Card style={{ marginTop: 18, padding: 16 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Eyebrow>Fixed price</Eyebrow>
                <Segmented options={['INR', 'USD'] as const} value={cur} onChange={setCur} />
              </View>
              <H size={44} ls={-0.04} lh={1} style={{ marginTop: 8, fontVariant: ['tabular-nums'] }}>{money(total, cur)}</H>
              <Txt size={12} color={C.mu} style={{ marginTop: 6 }}>
                ≈ {moneyAlt(price, cur)} · excl. taxes{r.validUntil ? ' · valid until ' + dayMonth(r.validUntil) : ''}
              </Txt>
              <View style={{ marginTop: 14, borderTopWidth: 1, borderTopColor: C.ln }}>
                {r.lines.map((l, i) => (
                  <FadeUp key={l.id} delay={200 + i * 70} duration={450} style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: C.ln }}>
                    <View style={{ flex: 1 }}>
                      <Txt size={14}>{l.name}</Txt>
                      {l.qty ? <Txt size={12} color={C.mu} style={{ marginTop: 1 }}>{l.qty}</Txt> : null}
                    </View>
                    <Txt f="mono" size={13}>{money(l.amountInr, cur)}</Txt>
                  </FadeUp>
                ))}
              </View>
              <View style={{ marginTop: 12, flexDirection: 'row', gap: 8 }}>
                <Stat label="Timeline" value={r.timeline ?? '—'} />
                <Stat label="New due date" value={r.newDueOn ? dayMonth(r.newDueOn) : '—'} />
              </View>
            </Card>
            {r.quoteNote ? (
              <View style={{ marginTop: 12, flexDirection: 'row', gap: 12, alignItems: 'flex-start', paddingVertical: 12, paddingHorizontal: 14, borderRadius: R.md, borderWidth: 1, borderColor: C.ln }}>
                <Avatar label={lead[0]} size={32} />
                <Txt size={13} lh={1.5} style={{ flex: 1 }}><Txt w={600} size={13}>{lead}:</Txt> {r.quoteNote}</Txt>
              </View>
            ) : null}
          </>
        ) : null}

        {r.status === 'reviewing' ? (
          <View style={{ marginTop: 18, paddingVertical: 20, paddingHorizontal: 16, borderRadius: R.md, borderWidth: 1, borderColor: C.ln, borderStyle: 'dashed', alignItems: 'center' }}>
            <H size={20} ls={-0.02}>We’re sizing it</H>
            <Txt size={13} lh={1.5} color={C.mu} style={{ marginTop: 6, textAlign: 'center' }}>
              {lead} will post a fixed-price quote here by {quoteEta()}. You’ll get a notification.
            </Txt>
          </View>
        ) : null}

        <View style={{ flex: 1, minHeight: 20 }} />

        {r.status === 'quoted' ? (
          <View style={{ gap: 10 }}>
            <Button onPress={() => setConfirm(true)}>Accept quote</Button>
            <Button variant="secondary" onPress={() => router.push('/chat')}>Discuss first</Button>
          </View>
        ) : null}
        {r.status === 'accepted' ? (
          <View style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: R.md, backgroundColor: C.mintsoft }}>
            <Txt size={14} lh={1.5}><Txt w={600} size={14}>Accepted.</Txt> Added to the plan. 50% invoice issued — see Billing.</Txt>
          </View>
        ) : null}
      </Screen>

      <Sheet open={confirm} onClose={() => setConfirm(false)}>
        <H size={22} ls={-0.02} lh={1.1}>Accept {money(price, cur)} for “{r.title}”?</H>
        <View style={{ marginTop: 12, gap: 2 }}>
          <Bullet>Adds <Txt w={500} size={14}>{r.timeline}</Txt>{r.newDueOn ? '; new due date ' + dayMonth(r.newDueOn) : ''}.</Bullet>
          <Bullet>50% ({money(price / 2, cur)}) invoiced now, 50% on delivery.</Bullet>
          <Bullet>You can undo for a few seconds after accepting; after that, message {lead}.</Bullet>
        </View>
        <View style={{ marginTop: 18, gap: 10 }}>
          <Button onPress={accept} disabled={busy}>Yes, accept</Button>
          <Button variant="link" size="sm" onPress={() => setConfirm(false)}>Not yet</Button>
        </View>
      </Sheet>
    </>
  );
}

const Stat = ({ label, value }: { label: string; value: string }) => (
  <View style={{ flex: 1, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8, backgroundColor: C.sf2 }}>
    <Eyebrow size={10}>{label}</Eyebrow>
    <Txt w={500} size={14} style={{ marginTop: 4 }}>{value}</Txt>
  </View>
);

const Bullet = ({ children }: { children: React.ReactNode }) => (
  <View style={{ flexDirection: 'row', gap: 8, paddingLeft: 4 }}>
    <Txt size={14} lh={1.6} color={C.mu}>•</Txt>
    <Txt size={14} lh={1.6} color={C.mu} style={{ flex: 1 }}>{children}</Txt>
  </View>
);
