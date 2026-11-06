import { useEffect, useState } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop, SvgXml } from 'react-native-svg';
import { CLIENT_LOGOS } from '../assets/client-logos';
import { C } from '../theme';
import { ND } from './motion';

const CELL = 104, GAP = 10, STEP = CELL + GAP * 2;
const RUN = CLIENT_LOGOS.length * STEP;

// Equal visual weight: aim for a constant area (~1900px²), clamped to the 96×40 cell.
const logoH = (r: number) => Math.round(Math.min(40, Math.max(14, Math.min(Math.sqrt(1900 / r), 96 / r))));

/** Right-to-left client logo loop, edge-faded, in ink at 72% — as on the prototype's sign-in. */
export function LogoMarquee() {
  const x = useState(() => new Animated.Value(0))[0];
  useEffect(() => {
    const a = Animated.loop(Animated.timing(x, { toValue: -RUN, duration: 60000, easing: Easing.linear, useNativeDriver: ND }));
    a.start();
    return () => a.stop();
  }, [x]);
  return (
    <View style={{ height: 44, overflow: 'hidden' }} accessibilityLabel={'Clients: ' + CLIENT_LOGOS.map(l => l.name).join(', ')}>
      <Animated.View style={{ flexDirection: 'row', width: RUN * 2, transform: [{ translateX: x }] }}>
        {[...CLIENT_LOGOS, ...CLIENT_LOGOS].map((l, i) => {
          const h = logoH(l.ratio), w = Math.min(96, Math.round(h * l.ratio));
          return (
            <View key={i} style={{ width: CELL, height: 44, marginHorizontal: GAP, alignItems: 'center', justifyContent: 'center', opacity: 0.72 }}>
              <SvgXml xml={l.xml} width={w} height={h} color={C.tx} preserveAspectRatio="xMidYMid meet" />
            </View>
          );
        })}
      </Animated.View>
      {/* Edge fades (the CSS mask-image gradient), painted in the background colour. */}
      <Svg pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }} width="100%" height="100%">
        <Defs>
          <LinearGradient id="mq-fade" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0" stopColor={C.bg} stopOpacity={1} />
            <Stop offset="0.12" stopColor={C.bg} stopOpacity={0} />
            <Stop offset="0.88" stopColor={C.bg} stopOpacity={0} />
            <Stop offset="1" stopColor={C.bg} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="44" fill="url(#mq-fade)" />
      </Svg>
    </View>
  );
}
