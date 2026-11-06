import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useSession } from '../state/session';
import { C } from '../theme';

// Magic links open embed://auth-callback?code=… — SessionProvider exchanges the
// code; this screen just waits for the session, then hands off.
export default function AuthCallback() {
  const { email, linkError } = useSession();
  if (email) return <Redirect href="/" />;
  if (linkError) return <Redirect href="/sign-in" />;
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.bg }}>
      <ActivityIndicator color={C.mint} />
    </View>
  );
}
