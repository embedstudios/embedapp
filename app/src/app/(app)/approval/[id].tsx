import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, View } from 'react-native';
import { useFeedback } from '../../../components/overlays';
import { Screen } from '../../../components/Screen';
import { BackRow, Button, Field, H, Icon, Press, Txt } from '../../../components/ui';
import { api } from '../../../data/api';
import { PHASE_NAMES } from '../../../data/types';
import { decidedOn } from '../../../lib/format';
import { useStore } from '../../../state/store';
import { goBack, pill } from '../../../state/view';
import { C, R } from '../../../theme';

export default function ApprovalDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { detail, refresh } = useStore();
  const { toast, celebrate } = useFeedback();
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [feedbackError, setFeedbackError] = useState(false);
  const [busy, setBusy] = useState(false);

  const a = detail?.approvals.find(x => x.id === id);
  if (!a) return null;
  const p = pill(a.status);

  const approve = async () => {
    setBusy(true);
    try {
      await api.approve(a.id);
      await refresh();
      await celebrate('Approved', 'approved', a.title);
      goBack();
      toast('Approved “' + a.title + '”', async () => {
        try { await api.undoApproval(a.id); await refresh(); } catch { toast('Too late to undo — message the team instead.'); }
      });
    } catch (e) {
      toast('Couldn’t approve: ' + (e as Error).message);
    } finally { setBusy(false); }
  };

  const sendChanges = async () => {
    if (feedback.trim().length < 12) return setFeedbackError(true);
    setBusy(true);
    try {
      await api.requestChanges(a.id, feedback.trim());
      await refresh();
      goBack();
      toast('Sent to ' + a.ownerName + '. Tracked in Chat.');
    } catch (e) {
      toast('Couldn’t send: ' + (e as Error).message);
    } finally { setBusy(false); }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Screen tabs={false} fill>
        <BackRow label="Approvals" onBack={goBack} />
        <Txt f="mono" size={12} color={C.mu} style={{ marginTop: 8 }}>{a.kind} · {PHASE_NAMES[a.phase]}</Txt>
        <H size={28} lh={1.08} style={{ marginTop: 4 }}>{a.title}</H>

        <View style={{ marginTop: 16, aspectRatio: 16 / 10, borderRadius: R.md, backgroundColor: C.sf2, borderWidth: 1, borderColor: C.ln, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: 14, bottom: 14, left: 14, right: 14, flexDirection: 'row', gap: 8 }}>
            {[0, 1, 2, 3].map(i => <View key={i} style={{ flex: 1, borderRadius: 6, backgroundColor: C.sf, borderWidth: 1, borderColor: C.ln }} />)}
          </View>
          <View style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999, backgroundColor: C.bg, borderWidth: 1, borderColor: C.ln }}>
            <Txt f="mono" size={11}>Preview · {a.meta}</Txt>
          </View>
        </View>
        <Txt size={14} lh={1.55} style={{ marginTop: 14 }}>{a.note}</Txt>

        <View style={{ marginTop: 12, flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {a.figmaUrl ? <Chip icon="ArrowsExpand" label="Open in Figma" onPress={() => Linking.openURL(a.figmaUrl!)} /> : null}
          <Chip icon="EssentialsChat" label={'Ask ' + a.ownerName} onPress={() => router.push('/chat')} />
        </View>

        <View style={{ flex: 1, minHeight: 16 }} />

        {a.status === 'pending' ? (
          <View style={{ gap: 10 }}>
            {feedbackOpen ? (
              <>
                <View style={{ marginBottom: 2 }}>
                  <Field label="What should change?" value={feedback} multiline numberOfLines={3} autoFocus style={{ minHeight: 88 }}
                    onChangeText={t => { setFeedback(t); setFeedbackError(false); }}
                    placeholder="Be specific — screen, element, and why. We’ll turn it into tickets." />
                  {feedbackError ? <Txt size={13} color={C.warn} style={{ marginTop: 8 }}>Add at least a sentence so the team can act on it.</Txt> : null}
                </View>
                <Button onPress={sendChanges} disabled={busy}>Send change request</Button>
                <Button variant="link" size="sm" onPress={() => { setFeedbackOpen(false); setFeedbackError(false); }}>Cancel</Button>
              </>
            ) : (
              <>
                <Button onPress={approve} disabled={busy}>Approve</Button>
                <Button variant="secondary" onPress={() => setFeedbackOpen(true)} disabled={busy}>Request changes</Button>
              </>
            )}
          </View>
        ) : (
          <View style={{ paddingVertical: 14, paddingHorizontal: 16, borderRadius: R.md, backgroundColor: p.bg }}>
            <Txt w={500} size={14} color={p.color}>{p.label} · {decidedOn(a.decidedAt)}</Txt>
          </View>
        )}
      </Screen>
    </KeyboardAvoidingView>
  );
}

function Chip({ icon, label, onPress }: { icon: 'ArrowsExpand' | 'EssentialsChat'; label: string; onPress: () => void }) {
  return (
    <Press onPress={onPress} style={{
      minHeight: 40, paddingHorizontal: 14, borderRadius: R.pill, borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf,
      flexDirection: 'row', alignItems: 'center', gap: 8,
    }}>
      <Icon name={icon} size={16} />
      <Txt size={13}>{label}</Txt>
    </Press>
  );
}
