import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Animated, Modal, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { C, R } from '../theme';
import { EASE, FadeUp, ND, Pop } from './motion';
import { H, Txt } from './ui';

// ---------------------------------------------------------------------------
// Bottom sheet
// ---------------------------------------------------------------------------

export function Sheet({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const fade = useState(() => new Animated.Value(0))[0];
  const up = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    if (!open) return;
    fade.setValue(0); up.setValue(0);
    Animated.parallel([
      Animated.timing(fade, { toValue: 1, duration: 250, useNativeDriver: ND }),
      Animated.timing(up, { toValue: 1, duration: 280, easing: EASE, useNativeDriver: ND }),
    ]).start();
  }, [open, fade, up]);
  return (
    <Modal visible={open} transparent animationType="none" onRequestClose={onClose} statusBarTranslucent>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: C.scrim, opacity: fade }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} accessibilityLabel="Close" />
      </Animated.View>
      <Animated.View style={{
        position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: C.sf, borderTopLeftRadius: R.lg, borderTopRightRadius: R.lg,
        paddingTop: 10, paddingHorizontal: 20, paddingBottom: Math.max(44, insets.bottom + 20),
        transform: [{ translateY: up.interpolate({ inputRange: [0, 1], outputRange: [600, 0] }) }],
      }}>
        <View style={{ width: 36, height: 4, borderRadius: 999, backgroundColor: C.ln, alignSelf: 'center', marginBottom: 14 }} />
        {children}
      </Animated.View>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Toast + celebration (app-wide feedback)
// ---------------------------------------------------------------------------

type Toast = { text: string; undo?: () => void } | null;
type Celebration = { title: string; tag: string; sub: string } | null;
type Feedback = {
  toast: (text: string, undo?: () => void) => void;
  /** Shows the full-screen check moment for 1.4s, then resolves. */
  celebrate: (title: string, tag: string, sub: string) => Promise<void>;
};

const FeedbackCtx = createContext<Feedback>({ toast: () => {}, celebrate: async () => {} });
export const useFeedback = () => useContext(FeedbackCtx);

export function FeedbackProvider({ children }: { children: ReactNode }) {
  const [toast, setToast] = useState<Toast>(null);
  const [cele, setCele] = useState<Celebration>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const showToast = useCallback((text: string, undo?: () => void) => {
    clearTimeout(timer.current);
    setToast({ text, undo });
    timer.current = setTimeout(() => setToast(null), undo ? 6000 : 3000);
  }, []);
  const celebrate = useCallback((title: string, tag: string, sub: string) => new Promise<void>(resolve => {
    setCele({ title, tag, sub });
    setTimeout(() => { setCele(null); resolve(); }, 1400);
  }), []);
  const value = useMemo(() => ({ toast: showToast, celebrate }), [showToast, celebrate]);

  return (
    <FeedbackCtx.Provider value={value}>
      {children}
      {toast ? <ToastView toast={toast} onUndo={() => { clearTimeout(timer.current); setToast(null); toast.undo?.(); }} /> : null}
      {cele ? <CelebrateView c={cele} /> : null}
    </FeedbackCtx.Provider>
  );
}

function ToastView({ toast, onUndo }: { toast: NonNullable<Toast>; onUndo: () => void }) {
  return (
    <FadeUp dist={8} duration={250} style={{
      position: 'absolute', left: 16, right: 16, bottom: 104, zIndex: 80, backgroundColor: C.tx, borderRadius: 12,
      paddingVertical: 12, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 12,
      shadowColor: '#000', shadowOpacity: 0.25, shadowRadius: 12, shadowOffset: { width: 0, height: 8 }, elevation: 8,
    }}>
      <Txt size={14} color={C.bg} style={{ flex: 1 }} accessibilityLiveRegion="polite">{toast.text}</Txt>
      {toast.undo ? (
        <Pressable onPress={onUndo} style={{ minHeight: 32, paddingHorizontal: 10, borderRadius: 999, backgroundColor: C.mint, justifyContent: 'center' }}>
          <Txt w={600} size={13} color={C.mi}>Undo</Txt>
        </Pressable>
      ) : null}
    </FadeUp>
  );
}

const BURST = Array.from({ length: 12 }, (_, i) => {
  const a = (i / 12) * Math.PI * 2, r = 70 + (i % 3) * 18;
  return {
    glyph: i % 2 ? '>' : '<', size: 12 + (i % 3) * 4, color: i % 3 === 0 ? C.tx : C.mint,
    dx: Math.round(Math.cos(a) * r), dy: Math.round(Math.sin(a) * r), rot: (i % 2 ? 1 : -1) * (40 + i * 15),
  };
});

/** Ring of < > glyphs flying out from the check (es-burst). */
function Burst() {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => { Animated.timing(v, { toValue: 1, duration: 1000, delay: 200, easing: EASE, useNativeDriver: ND }).start(); }, [v]);
  return (
    <>
      {BURST.map((b, i) => (
        <Animated.View key={i} pointerEvents="none" style={{
          position: 'absolute', left: 40, top: 34,
          opacity: v.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 1, 0] }),
          transform: [
            { translateX: v.interpolate({ inputRange: [0, 1], outputRange: [0, b.dx] }) },
            { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, b.dy] }) },
            { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', b.rot + 'deg'] }) },
            { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) },
          ],
        }}>
          <Txt f="mono" size={b.size} color={b.color}>{b.glyph}</Txt>
        </Animated.View>
      ))}
    </>
  );
}

function CelebrateView({ c }: { c: NonNullable<Celebration> }) {
  // Stroke offset is driven through state: animated SVG props don't update on web.
  const [dash, setDash] = useState(40);
  const fade = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    Animated.timing(fade, { toValue: 1, duration: 200, useNativeDriver: ND }).start();
    let raf = 0;
    const t0 = Date.now() + 250;
    const step = () => {
      const k = Math.min(1, Math.max(0, (Date.now() - t0) / 450));
      setDash(40 * (1 - k));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [fade]);
  return (
    <Animated.View style={[StyleSheet.absoluteFill, { zIndex: 90, backgroundColor: C.bg, alignItems: 'center', justifyContent: 'center', gap: 18, opacity: fade }]}>
      <View style={{ width: 96, height: 96 }}>
        <Burst />
        <Pop duration={600} style={{ width: 96, height: 96, borderRadius: 999, backgroundColor: C.mint, alignItems: 'center', justifyContent: 'center' }}>
          <Svg width={44} height={44} viewBox="0 0 44 44" fill="none">
            <Path d="M10 23l8 8 16-18" stroke={C.mi} strokeWidth={3.5} strokeLinecap="round" strokeLinejoin="round" strokeDasharray="40" strokeDashoffset={dash} />
          </Svg>
        </Pop>
      </View>
      <FadeUp delay={300} duration={500}><H size={24} ls={-0.03}>{c.title}</H></FadeUp>
      <FadeUp delay={400} duration={500} style={{ paddingHorizontal: 24 }}>
        <Txt f="mono" size={12} color={C.mu} style={{ textAlign: 'center' }}>{`<${c.tag}> ${c.sub} </${c.tag}>`}</Txt>
      </FadeUp>
    </Animated.View>
  );
}
