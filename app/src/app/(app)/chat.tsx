import { useEffect, useRef, useState } from 'react';
import { FlatList, KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Float, Pop, PulseDot, ScreenIn, TypingDot } from '../../components/motion';
import { useFeedback } from '../../components/overlays';
import { Avatar, Icon, Press, Txt } from '../../components/ui';
import { api } from '../../data/api';
import type { Message } from '../../data/types';
import { msgTime } from '../../lib/format';
import { useStore } from '../../state/store';
import { teamInitial } from '../../state/view';
import { C, F } from '../../theme';

export default function Chat() {
  const insets = useSafeAreaInsets();
  const { detail, profile } = useStore();
  const { toast } = useFeedback();
  const [messages, setMessages] = useState<Message[]>([]);
  const [typing, setTyping] = useState(false);
  const [draft, setDraft] = useState('');
  const [focus, setFocus] = useState(false);
  const list = useRef<FlatList<Message>>(null);
  const projectId = detail?.project.id;

  useEffect(() => {
    if (!projectId) return;
    let alive = true;
    api.listMessages(projectId).then(m => alive && setMessages(m)).catch(() => {});
    const off = api.subscribeMessages(projectId, {
      onMessage: m => setMessages(xs => (xs.some(x => x.id === m.id) ? xs : [...xs, m])),
      onTyping: setTyping,
    });
    return () => { alive = false; off(); };
  }, [projectId]);

  useEffect(() => { requestAnimationFrame(() => list.current?.scrollToEnd({ animated: true })); }, [messages.length, typing]);

  if (!detail) return null;
  const send = async () => {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    try { await api.sendMessage(detail.project.id, t); } catch { setDraft(t); toast('Message not sent. Try again.'); }
  };
  const team = detail.team;

  return (
    <ScreenIn style={{ backgroundColor: C.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingTop: insets.top + 4, paddingHorizontal: 20, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: C.ln, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Avatar label={detail.project.name[0]} size={40} bg={C.mint} color={C.mi} display />
          <View style={{ flex: 1 }}>
            <Txt w={500} size={15}>{detail.project.name} · Embed</Txt>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 3 }}>
              <View style={{ flexDirection: 'row' }}>
                {team.slice(0, 3).map((m, i) => (
                  <Float key={m.id} amp={3} duration={1800} delay={i * 200} style={{ marginLeft: i ? -6 : 0 }}>
                    <View style={{ width: 18, height: 18, borderRadius: 999, backgroundColor: C.sf2, borderWidth: 2, borderColor: C.bg, alignItems: 'center', justifyContent: 'center' }}>
                      <Txt w={700} size={8}>{teamInitial(m.name, team)}</Txt>
                    </View>
                  </Float>
                ))}
              </View>
              <PulseDot size={6} />
              <Txt size={12} color={C.mu}>Online · replies within a working day</Txt>
            </View>
          </View>
        </View>

        <FlatList
          ref={list}
          data={messages}
          keyExtractor={m => m.id}
          style={{ flex: 1 }}
          contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 20, gap: 10 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          renderItem={({ item: m }) => {
            const me = !!m.authorId && m.authorId === profile?.id;
            return (
              <Pop duration={350} style={{ alignItems: me ? 'flex-end' : 'flex-start', transformOrigin: me ? 'bottom right' : 'bottom left' }}>
                <View style={{
                  maxWidth: '84%', paddingVertical: 10, paddingHorizontal: 14, borderRadius: 16,
                  [me ? 'borderBottomRightRadius' : 'borderBottomLeftRadius']: 4,
                  backgroundColor: me ? C.mint : C.sf, borderWidth: 1, borderColor: me ? C.mint : C.ln,
                }}>
                  <Txt size={14} lh={1.45} color={me ? C.mi : C.tx}>{m.body}</Txt>
                </View>
                <Txt f="mono" size={10} color={C.mu} style={{ marginTop: 4 }}>{me ? 'You' : m.authorName} · {msgTime(m.createdAt)}</Txt>
              </Pop>
            );
          }}
          ListFooterComponent={typing ? (
            <Pop duration={300} style={{ marginTop: 10, flexDirection: 'row', alignItems: 'center', gap: 4, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16, borderBottomLeftRadius: 4, backgroundColor: C.sf, borderWidth: 1, borderColor: C.ln, alignSelf: 'flex-start' }}>
              <TypingDot delay={0} /><TypingDot delay={200} /><TypingDot delay={400} />
            </Pop>
          ) : undefined}
        />

        <View style={{ paddingTop: 10, paddingHorizontal: 16, paddingBottom: focus ? 10 : 112, borderTopWidth: 1, borderTopColor: C.ln, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Press accessibilityLabel="Attach" onPress={() => toast('Attachments are coming soon. Share links for now.')} style={{ width: 44, height: 44, borderRadius: 999, borderWidth: 1, borderColor: C.ln, backgroundColor: C.sf, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="AuthoringAttach" size={18} color={C.mu} />
          </Press>
          <TextInput value={draft} onChangeText={setDraft} onSubmitEditing={send} returnKeyType="send" placeholder="Message the team" placeholderTextColor={C.mu}
            onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} accessibilityLabel="Message the team"
            style={{ flex: 1, minWidth: 0, height: 44, borderRadius: 999, borderWidth: 1, borderColor: focus ? C.mint : C.ln, backgroundColor: C.sf, paddingHorizontal: 16, fontSize: 15, fontFamily: F.body, color: C.tx }} />
          <Press onPress={send} accessibilityLabel="Send" style={{ width: 44, height: 44, borderRadius: 999, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="EssentialsSend" size={18} color={C.mi} />
          </Press>
        </View>
      </KeyboardAvoidingView>
    </ScreenIn>
  );
}
