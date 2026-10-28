import { Stack, usePathname, type Href } from 'expo-router';
import { useEffect, useState } from 'react';
import { Animated, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { IconName } from '../../components/icon-data';
import { Icon, Txt } from '../../components/ui';
import { StoreProvider, useStore } from '../../state/store';
import { goTab } from '../../state/view';
import { C } from '../../theme';

export default function AppLayout() {
  return (
    <StoreProvider>
      <View style={{ flex: 1, backgroundColor: C.bg }}>
        <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg }, animation: 'slide_from_right' }}>
          {['index', 'approvals', 'scope', 'more'].map(n => <Stack.Screen key={n} name={n} options={{ animation: 'none' }} />)}
          <Stack.Screen name="brief" options={{ gestureEnabled: false }} />
        </Stack>
        <TabBar />
      </View>
    </StoreProvider>
  );
}

const TABS: { href: Href; match: RegExp; label: string; icon: IconName }[] = [
  { href: '/', match: /^\/(phase\/.*|invoices)?$/, label: 'Home', icon: 'EssentialsHome' },
  { href: '/approvals', match: /^\/approvals?(\/.*)?$/, label: 'Approvals', icon: 'BasicsTick' },
  { href: '/scope', match: /^\/(scope|quote)(\/.*)?$/, label: 'Scope', icon: 'BasicsPlusCircle' },
  { href: '/chat', match: /^\/chat$/, label: 'Chat', icon: 'EssentialsChat' },
  { href: '/more', match: /^\/more$/, label: 'More', icon: 'InterfaceMoreHorizontal' },
];
// The bar shows on tab roots plus phase detail and billing; detail flows hide it.
const SHOW = /^\/(approvals|scope|chat|more|invoices|phase\/[^/]+)?$/;

function TabBar() {
  const path = usePathname();
  const insets = useSafeAreaInsets();
  const { detail } = useStore();
  const pending = detail?.approvals.filter(a => a.status === 'pending').length ?? 0;
  if (!SHOW.test(path)) return null;
  return (
    <View style={{
      position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 8, paddingHorizontal: 12, paddingBottom: insets.bottom > 0 ? 30 : 12,
      backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.ln, flexDirection: 'row',
    }}>
      {TABS.map(t => <Tab key={t.label} {...t} on={t.match.test(path)} badge={t.label === 'Approvals' ? pending : 0} />)}
    </View>
  );
}

function Tab({ href, label, icon, on, badge }: { href: Href; label: string; icon: IconName; on: boolean; badge: number }) {
  const w = useState(() => new Animated.Value(on ? 20 : 0))[0];
  useEffect(() => { Animated.timing(w, { toValue: on ? 20 : 0, duration: 250, useNativeDriver: false }).start(); }, [on, w]);
  const color = on ? C.mint : C.mu;
  return (
    <Pressable onPress={() => goTab(href)} accessibilityRole="tab" accessibilityState={{ selected: on }} accessibilityLabel={badge ? `${label}, ${badge} waiting` : label}
      style={{ flex: 1, minHeight: 48, alignItems: 'center', justifyContent: 'center', gap: 4, transform: [{ translateY: on ? -1 : 0 }] }}>
      <Animated.View style={{ position: 'absolute', top: -9, left: '50%', marginLeft: -10, width: w, height: 3, borderRadius: 999, backgroundColor: C.mint }} />
      <Icon name={icon} size={22} color={color} />
      <Txt w={500} size={10} ls={0.01} color={color}>{label}</Txt>
      {badge > 0 ? (
        <View style={{ position: 'absolute', top: 4, left: '50%', marginLeft: 6, minWidth: 16, height: 16, paddingHorizontal: 4, borderRadius: 999, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Txt w={700} size={10} color={C.mi}>{badge}</Txt>
        </View>
      ) : null}
    </Pressable>
  );
}
