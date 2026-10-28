// Motion primitives mirroring the prototype's CSS keyframes (es-word, es-in, es-pop,
// es-float, es-pulse, es-blink, es-fill, es-sheen, es-step, es-wave, es-dot, es-stamp).

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Animated, Easing, Platform, View, type StyleProp, type ViewStyle } from 'react-native';
import { C } from '../theme';

export const EASE = Easing.bezier(0.2, 0.8, 0.2, 1);
export const ND = Platform.OS !== 'web';

type Box = { style?: StyleProp<ViewStyle>; children?: ReactNode };

function useOnce(delay: number, duration: number, easing = EASE) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration, delay, easing, useNativeDriver: ND });
    a.start();
    return () => a.stop();
  }, [v, delay, duration, easing]);
  return v;
}

function useLoop(build: (v: Animated.Value) => Animated.CompositeAnimation, deps: unknown[] = []) {
  const v = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const a = Animated.loop(build(v));
    a.start();
    return () => a.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return v;
}

/** es-word / es-in: fade in while rising. */
export function FadeUp({ delay = 0, dist = 14, duration = 600, style, children }: Box & { delay?: number; dist?: number; duration?: number }) {
  const v = useOnce(delay, duration);
  return (
    <Animated.View style={[style, { opacity: v, transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [dist, 0] }) }] }]}>
      {children}
    </Animated.View>
  );
}

/** Screen entrance (es-in .3s). */
export const ScreenIn = ({ style, children }: Box) => <FadeUp dist={8} duration={300} style={[{ flex: 1 }, style]}>{children}</FadeUp>;

/** es-pop: scale .4 → 1.08 → 1. */
export function Pop({ delay = 0, duration = 500, style, children }: Box & { delay?: number; duration?: number }) {
  const v = useOnce(delay, duration);
  return (
    <Animated.View style={[style, {
      opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0.4, 1.08, 1] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

/** es-mark: rotate in from -8deg. */
export function MarkIn({ style, children }: Box) {
  const v = useOnce(0, 700);
  return (
    <Animated.View style={[style, {
      opacity: v, transformOrigin: 'left center',
      transform: [{ rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['-8deg', '0deg'] }) }, { scale: v.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
    }]}>
      {children}
    </Animated.View>
  );
}

/** es-float / es-wave: gentle vertical bob. */
export function Float({ amp = 6, duration = 7000, delay = 0, style, children }: Box & { amp?: number; duration?: number; delay?: number }) {
  const v = useLoop(x => Animated.sequence([
    Animated.delay(delay),
    Animated.timing(x, { toValue: 1, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }),
    Animated.timing(x, { toValue: 0, duration: duration / 2, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }),
  ]));
  return <Animated.View style={[style, { transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -amp] }) }] }]}>{children}</Animated.View>;
}

/** Status dot with the es-pulse ring. */
export function PulseDot({ size = 8, color: dot = C.mint }: { size?: number; color?: string }) {
  const v = useLoop(x => Animated.sequence([
    Animated.timing(x, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: ND }),
    Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: ND }),
    Animated.delay(600),
  ]));
  const ring = (size + 16) / size;
  return (
    <View style={{ width: size, height: size }}>
      <Animated.View style={{
        position: 'absolute', width: size, height: size, borderRadius: 999, backgroundColor: C.pulse,
        opacity: v.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }),
        transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, ring] }) }],
      }} />
      <View style={{ width: size, height: size, borderRadius: 999, backgroundColor: dot }} />
    </View>
  );
}

/** Blinking mint caret (es-blink, steps(1)). */
export function Caret() {
  const [on, setOn] = useState(true);
  useEffect(() => { const t = setInterval(() => setOn(x => !x), 550); return () => clearInterval(t); }, []);
  return <View style={{ width: 7, height: 13, marginLeft: 4, backgroundColor: C.mint, opacity: on ? 1 : 0, transform: [{ translateY: 2 }] }} />;
}

/** Phase-rail fill: grows from the left (es-fill). */
export function Fill({ delay, width, color, sheen }: { delay: number; width: `${number}%`; color: string; sheen?: boolean }) {
  const v = useOnce(delay, 700);
  const [w, setW] = useState(0);
  return (
    <Animated.View
      onLayout={e => setW(e.nativeEvent.layout.width)}
      style={{
        height: '100%', width, borderRadius: 999, backgroundColor: color, overflow: 'hidden', transformOrigin: 'left center',
        transform: [{ scaleX: v }],
      }}>
      {sheen && w > 0 ? <Sheen width={w} /> : null}
    </Animated.View>
  );
}

/** Slow light sweep across the current phase bar (es-sheen). */
export function Sheen({ width }: { width: number }) {
  const v = useLoop(x => Animated.sequence([
    Animated.delay(1200),
    Animated.timing(x, { toValue: 1, duration: 2600, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }),
    Animated.timing(x, { toValue: 0, duration: 0, useNativeDriver: ND }),
  ]));
  const w = width * 0.3;
  return (
    <Animated.View style={{
      position: 'absolute', top: 0, bottom: 0, width: w, backgroundColor: 'rgba(255,255,255,0.55)',
      transform: [{ translateX: v.interpolate({ inputRange: [0, 1], outputRange: [-1.2 * w, 3.2 * w] }) }],
    }} />
  );
}

/** "How it works" step dot (es-step). */
export function StepDot({ delay }: { delay: number }) {
  const v = useLoop(x => Animated.sequence([
    Animated.delay(delay),
    Animated.timing(x, { toValue: 1, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }),
    Animated.timing(x, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: ND }),
  ]));
  return (
    <Animated.View style={{
      width: 10, height: 10, borderRadius: 999, backgroundColor: C.mint,
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
      transform: [{ scale: v.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
    }} />
  );
}

/** Typing indicator dot (es-dot). */
export function TypingDot({ delay }: { delay: number }) {
  const v = useLoop(x => Animated.sequence([
    Animated.delay(delay),
    Animated.timing(x, { toValue: 1, duration: 240, useNativeDriver: ND }),
    Animated.timing(x, { toValue: 0, duration: 240, useNativeDriver: ND }),
    Animated.delay(720 - delay),
  ]));
  return (
    <Animated.View style={{
      width: 6, height: 6, borderRadius: 999, backgroundColor: C.mu,
      opacity: v.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
      transform: [{ translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
    }} />
  );
}

/** PAID stamp slam (es-stamp). */
export function Stamp({ delay, children }: { delay: number; children: ReactNode }) {
  const v = useOnce(delay, 500);
  return (
    <Animated.View style={{
      opacity: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 1, 1] }),
      transform: [
        { rotate: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: ['-14deg', '-10deg', '-10deg'] }) },
        { scale: v.interpolate({ inputRange: [0, 0.6, 1], outputRange: [1.8, 0.96, 1] }) },
      ],
    }}>
      {children}
    </Animated.View>
  );
}

/**
 * Eased count-up toward `to`, replayed whenever `key` changes. The first run
 * starts at 0; later runs start at 98.5% of `to` when `nudge` is set (the
 * quote total re-animating on a currency switch) and at 0 otherwise.
 */
export function useCountUp(to: number, ms: number, key: unknown, nudge = false) {
  const [v, setV] = useState(0);
  const ran = useRef(false);
  useEffect(() => {
    const from = nudge && ran.current ? to * 0.985 : 0;
    ran.current = true;
    let raf = 0;
    const t0 = Date.now();
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / ms), e = 1 - Math.pow(1 - k, 3);
      setV(from + (to - from) * e);
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- replay only on these
  }, [to, ms, key]);
  return v;
}
