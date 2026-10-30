import { DMMono_400Regular } from '@expo-google-fonts/dm-mono/400Regular';
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular';
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium';
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold';
import { Inter_700Bold } from '@expo-google-fonts/inter/700Bold';
import { SpaceGrotesk_500Medium } from '@expo-google-fonts/space-grotesk/500Medium';
import { useFonts } from 'expo-font';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useRef } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FeedbackProvider, useFeedback } from '../components/overlays';
import { api } from '../data/api';
import { SessionProvider, useSession } from '../state/session';
import { C } from '../theme';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({ SpaceGrotesk_500Medium, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, DMMono_400Regular });
  return (
    <SafeAreaProvider style={{ backgroundColor: C.bg }}>
      <StatusBar style="dark" />
      <SessionProvider>
        <FeedbackProvider>
          {fontsLoaded ? <Routes /> : null}
        </FeedbackProvider>
      </SessionProvider>
    </SafeAreaProvider>
  );
}

function Routes() {
  const { email } = useSession();
  const { celebrate } = useFeedback();
  const prev = useRef(email);

  useEffect(() => { if (email !== undefined) SplashScreen.hideAsync(); }, [email]);

  // A fresh sign-in (not a restored session) gets the "Link opened" moment.
  useEffect(() => {
    if (prev.current === null && email) {
      api.loadProfile()
        .then(p => p.fullName.split(' ')[0], () => '')
        .then(first => celebrate('Link opened', 'hi', first ? 'welcome back, ' + first : 'welcome back'));
    }
    prev.current = email;
  }, [email, celebrate]);

  if (email === undefined) return null;
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.bg } }}>
      <Stack.Protected guard={!!email}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
      <Stack.Protected guard={!email}>
        <Stack.Screen name="sign-in" options={{ animation: 'fade' }} />
      </Stack.Protected>
      <Stack.Screen name="auth-callback" options={{ animation: 'none' }} />
    </Stack>
  );
}
