import Svg, { Text as SvgText } from 'react-native-svg';
import { C, F } from '../theme';

/** Giant stroke-only numeral that sits behind a header (CSS -webkit-text-stroke). */
export function OutlinedNumeral({ text, size }: { text: string; size: number }) {
  const w = size * 0.62 * text.length;
  return (
    <Svg width={w} height={size} pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <SvgText x={w} y={size * 0.8} textAnchor="end" fontFamily={F.display} fontSize={size} letterSpacing={-0.06 * size}
        fill="none" stroke={C.ln} strokeWidth={1.5}>{text}</SvgText>
    </Svg>
  );
}
