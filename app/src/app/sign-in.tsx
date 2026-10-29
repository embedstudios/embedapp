import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LogoMarquee } from '../components/Marquee';
import { Caret, FadeUp, Float, MarkIn } from '../components/motion';
import { Button, Eyebrow, Field, H, LinkText, Mark, Txt } from '../components/ui';
import { api } from '../data/api';
import { useSession } from '../state/session';
import { C } from '../theme';

const ENTER = { duration: 600 };

export default function SignIn() {
  const insets = useSafeAreaInsets();
  const { linkError } = useSession();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [codeError, setCodeError] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);

  const send = async () => {
    const e = email.trim();
    if (!/.+@.+\..+/.test(e)) return setError('Enter the email your project invite was sent to.');
    setSending(true);
    try {
      await api.sendMagicLink(e);
      if (api.mode === 'live') { setSentTo(e); setCode(''); setCodeError(null); }
    } catch (err) {
      const msg = String((err as Error).message);
      setError(/signup|not allowed|not found/i.test(msg)
        ? 'We couldn’t find an invite for that email. Ask your Embed project lead to add you.'
        : /rate limit|security purposes|after \d+ seconds/i.test(msg)
          ? 'A link was sent recently. Use the latest email, or try again in a few minutes.'
          : 'Couldn’t send the link. Check your connection and try again.');
    } finally {
      setSending(false);
    }
  };

  const verify = async () => {
    const c = code.replace(/\D/g, '');
    if (!sentTo || c.length < 6) return setCodeError('Enter the code from the email.');
    setVerifying(true);
    try {
      await api.verifyCode(sentTo, c);
    } catch (err) {
      setCodeError(/expired|invalid/i.test(String((err as Error).message))
        ? 'That code is wrong or has expired. Check the latest email, or send a new one.'
        : 'Couldn’t check the code. Check your connection and try again.');
    } finally {
      setVerifying(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + 66, paddingHorizontal: 28, paddingBottom: Math.max(48, insets.bottom + 24) }}
        keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} style={{ overflow: 'hidden' }}>
        <Float duration={7000} style={{ position: 'absolute', right: -90, top: 60, opacity: 0.08 }}>
          <View pointerEvents="none"><Mark size={360} color={C.mint} /></View>
        </Float>

        <MarkIn><Mark size={52} color="#333333" /></MarkIn>
        <View style={{ marginTop: 36 }}>
          <FadeUp delay={150} {...ENTER}><H size={36} lh={1.02} ls={-0.035}>Your project,</H></FadeUp>
          <FadeUp delay={280} {...ENTER}>
            <H size={36} lh={1.02} ls={-0.035}>always in <H size={36} lh={1.02} ls={-0.035} color={C.mint}>view</H>.</H>
          </FadeUp>
        </View>
        <FadeUp delay={420} {...ENTER} style={{ marginTop: 14 }}>
          <Txt f="mono" size={13} lh={1.44} color={C.mu}>
            {'<hi> '}<Txt f="mono" size={13} color={C.tx}>We embed user experience with your digital products</Txt>{' </hi>'}
            <Caret />
          </Txt>
        </FadeUp>

        <View style={{ flex: 1, minHeight: 32 }} />

        <FadeUp delay={500} {...ENTER} style={{ marginHorizontal: -28, marginBottom: 22 }}>
          <Eyebrow style={{ paddingHorizontal: 28 }}>Trusted by product teams across industries</Eyebrow>
          <View style={{ marginTop: 12 }}><LogoMarquee /></View>
        </FadeUp>

        {sentTo ? (
          <FadeUp dist={8} duration={300} style={{ gap: 12 }}>
            <View style={{ padding: 16, borderRadius: 10, backgroundColor: C.mintsoft, gap: 6 }}>
              <Txt w={600} size={15}>Check your inbox</Txt>
              <Txt size={14} lh={1.5}>We sent a sign-in code to <Txt w={600} size={14}>{sentTo}</Txt>. Enter it below, or tap the link in the email on this phone.</Txt>
            </View>
            <Field label="Code" value={code} onChangeText={t => { setCode(t); setCodeError(null); }} placeholder="123456"
              keyboardType="number-pad" textContentType="oneTimeCode" autoComplete="one-time-code" maxLength={8} autoFocus
              returnKeyType="done" onSubmitEditing={verify} height={52} style={{ fontSize: 20, paddingHorizontal: 16, letterSpacing: 4 }} />
            {codeError || error ? (
              <Txt size={13} color={C.warn} accessibilityLiveRegion="polite">{codeError ?? error}</Txt>
            ) : null}
            <Button onPress={verify} disabled={verifying}>{verifying ? 'Signing in…' : 'Sign in'}</Button>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 20 }}>
              <LinkText onPress={send}>Send a new code</LinkText>
              <LinkText onPress={() => { setSentTo(null); setEmail(''); }}>Use a different email</LinkText>
            </View>
          </FadeUp>
        ) : (
          <>
            <FadeUp delay={550} {...ENTER}>
              <Field label="Work email" value={email} onChangeText={t => { setEmail(t); setError(null); }} placeholder="you@company.com"
                keyboardType="email-address" autoCapitalize="none" autoComplete="email" autoCorrect={false} textContentType="emailAddress"
                returnKeyType="send" onSubmitEditing={send} height={52} style={{ fontSize: 16, paddingHorizontal: 16 }} />
            </FadeUp>
            {error || linkError ? (
              <Txt size={13} color={C.warn} style={{ marginTop: 8 }} accessibilityLiveRegion="polite">
                {error ?? 'That sign-in link has expired or was already used. Send a new one.'}
              </Txt>
            ) : null}
            <FadeUp delay={650} {...ENTER} style={{ marginTop: 16, gap: 12 }}>
              <Button onPress={send} disabled={sending}>{sending ? 'Sending link…' : 'Send magic link'}</Button>
              <Txt size={13} lh={1.5} color={C.mu} style={{ textAlign: 'center' }}>
                No password. We’ll email a one-tap link.{'\n'}Access is by invite from your Embed project lead.
              </Txt>
            </FadeUp>
          </>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
