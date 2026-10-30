import { router } from 'expo-router';
import { Linking, Pressable, View } from 'react-native';
import { Screen } from '../../components/Screen';
import { Card, Eyebrow, H, Icon, LinkText, Press, Segmented, Txt } from '../../components/ui';
import { api } from '../../data/api';
import { PHASE_NAMES } from '../../data/types';
import { initials } from '../../lib/format';
import { useStore } from '../../state/store';
import { goTab } from '../../state/view';
import { C, R } from '../../theme';

export default function More() {
  const { profile, projects, cur, setCur, setNotify, selectProject } = useStore();
  const name = profile?.fullName || 'You';

  return (
    <Screen root>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <View style={{ width: 52, height: 52, borderRadius: 999, backgroundColor: C.sf2, borderWidth: 1, borderColor: C.ln, alignItems: 'center', justifyContent: 'center' }}>
          <H size={18} ls={0} lh={1.2}>{initials(name)}</H>
        </View>
        <View style={{ flex: 1 }}>
          <H size={22} ls={-0.02} lh={1.2}>{name}</H>
          <Txt size={13} color={C.mu}>{[profile?.title, profile?.email].filter(Boolean).join(' · ')}</Txt>
        </View>
      </View>

      <Eyebrow style={{ marginTop: 24 }}>Preferences</Eyebrow>
      <Card style={{ marginTop: 8, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.ln }}>
          <Txt size={15}>Currency</Txt>
          <Segmented options={['INR', 'USD'] as const} value={cur} onChange={setCur} minWidth={56} height={30} />
        </View>
        <Pressable onPress={() => setNotify(!profile?.notify)} accessibilityRole="switch" accessibilityState={{ checked: !!profile?.notify }}
          style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 16 }}>
          <View style={{ flex: 1 }}>
            <Txt size={15}>Notify me when something needs me</Txt>
            <Txt size={12} color={C.mu}>Approvals, quotes, invoices — never progress noise</Txt>
          </View>
          <View style={{ width: 46, height: 28, borderRadius: 999, backgroundColor: profile?.notify ? C.mint : C.ln }}>
            <View style={{
              position: 'absolute', top: 3, left: profile?.notify ? 21 : 3, width: 22, height: 22, borderRadius: 999, backgroundColor: '#FFFFFF',
              shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 3, shadowOffset: { width: 0, height: 1 }, elevation: 2,
            }} />
          </View>
        </Pressable>
      </Card>

      <Eyebrow style={{ marginTop: 24 }}>Projects</Eyebrow>
      <Card style={{ marginTop: 8, overflow: 'hidden' }}>
        {projects.map(p => (
          <Press key={p.id} onPress={() => { selectProject(p.id); goTab('/'); }} style={{
            flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 16, borderBottomWidth: 1, borderBottomColor: C.ln,
          }}>
            <View style={{ flex: 1 }}>
              <Txt w={500} size={15}>{p.name}</Txt>
              <Txt size={12} color={C.mu}>{p.subtitle} · {p.status === 'proposal' ? 'Proposal in progress' : PHASE_NAMES[p.currentPhase]}</Txt>
            </View>
            <Txt f="mono" size={12} color={C.mu}>{p.status === 'proposal' ? '—' : p.progress + '%'}</Txt>
          </Press>
        ))}
        <Press onPress={() => router.push({ pathname: '/brief', params: { mode: 'project' } })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, paddingVertical: 12, paddingHorizontal: 16 }}>
          <Icon name="BasicsAdd" size={18} color={C.mu} />
          <Txt w={500} size={15}>Start a new project</Txt>
        </Press>
      </Card>

      <View style={{ marginTop: 24, gap: 4 }}>
        <View style={{ minHeight: 44, justifyContent: 'center', alignItems: 'flex-start' }}>
          <LinkText size={14} onPress={() => Linking.openURL('mailto:hello@embed.design')}>hello@embed.design</LinkText>
        </View>
        <Pressable onPress={() => api.signOut()} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 8, minHeight: 44, borderRadius: R.sm }}>
          <Icon name="ArrowsLogout" size={18} color={C.mu} />
          <Txt size={14} color={C.mu}>Sign out</Txt>
        </Pressable>
      </View>
    </Screen>
  );
}
