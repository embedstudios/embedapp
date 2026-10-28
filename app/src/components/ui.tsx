import { useState, type ReactNode } from 'react';
import {
  Animated, Pressable, Text, TextInput, View,
  type PressableProps, type StyleProp, type TextInputProps, type TextProps, type TextStyle, type ViewStyle,
} from 'react-native';
import Svg, { Path, SvgXml } from 'react-native-svg';
import { C, F, R, em } from '../theme';
import { ICONS, type IconName } from './icon-data';
import { ND } from './motion';

// ---------------------------------------------------------------------------
// Text
// ---------------------------------------------------------------------------

type Face = 'display' | 'body' | 'mono';
type TxtProps = TextProps & {
  f?: Face; w?: 400 | 500 | 600 | 700; size?: number; color?: string;
  /** letter-spacing in em, like the CSS source */
  ls?: number; lh?: number; upper?: boolean; style?: StyleProp<TextStyle>;
};

const family = (f: Face, w: number) =>
  f === 'display' ? F.display : f === 'mono' ? F.mono : w >= 700 ? F.bodyBold : w >= 600 ? F.bodySemi : w >= 500 ? F.bodyMedium : F.body;

export function Txt({ f = 'body', w = 400, size = 14, color = C.tx, ls = 0, lh, upper, style, ...rest }: TxtProps) {
  return (
    <Text
      {...rest}
      style={[{
        fontFamily: family(f, w), fontSize: size, color, letterSpacing: em(size, ls),
        lineHeight: lh ? size * lh : undefined, textTransform: upper ? 'uppercase' : undefined,
      }, style]}
    />
  );
}

/** Display heading — Space Grotesk 500 with tight tracking. */
export const H = ({ size = 30, ls = -0.03, lh = 1.05, ...p }: TxtProps) => <Txt f="display" w={500} size={size} ls={ls} lh={lh} {...p} />;

/** Uppercase DM Mono section label. */
export const Eyebrow = ({ children, style, size = 11 }: { children: ReactNode; style?: StyleProp<TextStyle>; size?: number }) => (
  <Txt f="mono" size={size} ls={0.04} upper color={C.mu} style={style}>{children}</Txt>
);

/** The brand's code-tag voice: <tag> message </tag>. */
export function Tag({ tag, children, size = 13, attr }: { tag: string; children?: ReactNode; size?: number; attr?: ReactNode }) {
  return (
    <Txt f="mono" size={size} lh={1.44} color={C.mu}>
      {'<' + tag}{attr}{'>'}
      {children != null ? <>{' '}<Txt f="mono" size={size} color={C.tx}>{children}</Txt>{' </' + tag + '>'}</> : null}
    </Txt>
  );
}

// ---------------------------------------------------------------------------
// Glyphs
// ---------------------------------------------------------------------------

export function Icon({ name, size = 22, color = C.tx }: { name: IconName; size?: number; color?: string }) {
  const d = ICONS[name];
  return <SvgXml xml={`<svg viewBox="${d.viewBox}" fill="none">${d.body}</svg>`} width={size} height={size} color={color} />;
}

const MARK_PATH = 'M 39.138 0 C 17.523 0 0 17.523 0 39.138 C 0 46.547 2.058 53.474 5.635 59.381 C 6.393 60.839 7.347 62.222 8.497 63.491 C 10.304 65.761 12.358 67.826 14.618 69.644 L 45.709 100.736 L 39.249 100.736 C 17.572 100.736 0 118.308 0 139.985 C 0 161.662 17.572 179.234 39.249 179.234 L 165.102 179.234 L 145.928 198.408 C 144.91 199.427 144.027 200.529 143.28 201.694 L 39.138 201.694 C 17.523 201.694 0 219.217 0 240.832 C 0 262.448 17.523 279.97 39.138 279.97 L 204.585 279.97 C 226.201 279.97 243.723 262.448 243.723 240.832 C 243.723 219.217 226.201 201.694 204.585 201.694 L 197.991 201.694 L 229.294 170.392 C 231.413 168.66 233.347 166.711 235.064 164.579 C 235.991 163.544 236.788 162.434 237.456 161.27 C 241.421 155.138 243.723 147.831 243.723 139.985 C 243.723 118.308 226.151 100.736 204.474 100.736 L 100.339 100.736 C 99.563 99.489 98.633 98.31 97.55 97.227 L 78.599 78.276 L 204.585 78.276 C 226.201 78.276 243.723 60.753 243.723 39.138 C 243.723 17.523 226.201 0 204.585 0 L 39.138 0 Z M 78.599 78.276 L 39.138 78.276 C 29.855 78.276 21.327 75.044 14.618 69.644 L 9.168 64.194 C 8.937 63.964 8.714 63.729 8.497 63.491 C 7.459 62.186 6.502 60.813 5.635 59.381 C 1.802 52.008 2.98 42.707 9.168 36.52 C 16.81 28.877 29.2 28.877 36.842 36.52 L 78.599 78.276 Z M 237.456 161.27 C 236.715 162.415 235.917 163.52 235.064 164.579 C 234.822 164.85 234.571 165.115 234.311 165.375 L 229.294 170.392 C 222.531 175.919 213.89 179.234 204.474 179.234 L 165.102 179.234 L 206.636 137.7 C 214.278 130.058 226.668 130.058 234.311 137.7 C 240.698 144.088 241.747 153.793 237.456 161.27 Z M 197.991 201.694 L 173.603 226.083 C 165.961 233.725 153.57 233.725 145.928 226.083 C 139.305 219.459 138.422 209.269 143.28 201.694 L 197.991 201.694 Z M 100.339 100.736 C 105.039 108.286 104.109 118.343 97.55 124.902 C 89.908 132.544 77.517 132.544 69.875 124.902 L 45.709 100.736 L 100.339 100.736 Z';

/** The woven-E logo mark. `size` is its height. */
export function Mark({ size = 52, color = '#333333' }: { size?: number; color?: string }) {
  return (
    <Svg viewBox="0 0 243.723 279.97" width={size * (243.723 / 279.97)} height={size}>
      <Path d={MARK_PATH} fill={color} fillRule="evenodd" />
    </Svg>
  );
}

// ---------------------------------------------------------------------------
// Interaction
// ---------------------------------------------------------------------------

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

/** Pressable that presses to 0.97 scale, like every button in the prototype. */
export function Press({ style, children, ...rest }: Omit<PressableProps, 'style' | 'children'> & { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const s = useState(() => new Animated.Value(1))[0];
  const to = (v: number) => Animated.timing(s, { toValue: v, duration: 120, useNativeDriver: ND }).start();
  return (
    <AnimatedPressable
      accessibilityRole="button"
      {...rest}
      onPressIn={e => { to(0.97); rest.onPressIn?.(e); }}
      onPressOut={e => { to(1); rest.onPressOut?.(e); }}
      style={[style, { transform: [{ scale: s }] }]}>
      {children}
    </AnimatedPressable>
  );
}

/** Embed DS pill Button, with the light-theme dark-green accent. */
export function Button({ variant = 'primary', size = 'md', onPress, disabled, children, full = true }: {
  variant?: 'primary' | 'secondary' | 'link'; size?: 'sm' | 'md'; onPress?: () => void; disabled?: boolean; children: ReactNode; full?: boolean;
}) {
  const sz = size === 'md' ? { fontSize: 16, py: 13, px: 28 } : { fontSize: 14, py: 9, px: 20 };
  const look: ViewStyle =
    variant === 'primary' ? { backgroundColor: C.mint } :
    variant === 'secondary' ? { borderWidth: 2, borderColor: C.mint, paddingVertical: sz.py - 2 } :
    { borderRadius: 0, paddingHorizontal: 4 };
  const color = variant === 'primary' ? C.mi : variant === 'secondary' ? C.mint : '#333333';
  return (
    <Press onPress={onPress} disabled={disabled} style={[{
      alignSelf: full ? 'stretch' : 'flex-start', alignItems: 'center', justifyContent: 'center', borderRadius: R.pill,
      paddingVertical: sz.py, paddingHorizontal: sz.px, opacity: disabled ? 0.4 : 1,
    }, look]}>
      <Txt w={500} size={sz.fontSize} ls={-0.01} color={color} lh={1}
        style={variant === 'link' ? { textDecorationLine: 'underline' } : undefined}>{children}</Txt>
    </Press>
  );
}

/** Underlined text action. */
export const LinkText = ({ children, onPress, size = 13, color = C.tx }: { children: ReactNode; onPress?: () => void; size?: number; color?: string }) => (
  <Pressable onPress={onPress} hitSlop={8} style={{ minHeight: 32, justifyContent: 'center' }}>
    <Txt size={size} color={color} style={{ textDecorationLine: 'underline' }}>{children}</Txt>
  </Pressable>
);

// ---------------------------------------------------------------------------
// Surfaces
// ---------------------------------------------------------------------------

export const Card = ({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) => (
  <View style={[{ backgroundColor: C.sf, borderWidth: 1, borderColor: C.ln, borderRadius: R.md }, style]}>{children}</View>
);

export const Pill = ({ label, bg, color }: { label: string; bg: string; color: string }) => (
  <View style={{ paddingVertical: 4, paddingHorizontal: 8, borderRadius: R.pill, backgroundColor: bg }}>
    <Txt f="mono" size={11} ls={0.02} color={color}>{label}</Txt>
  </View>
);

export const Avatar = ({ label, size = 28, bg = C.sf2, color = C.tx, display }: { label: string; size?: number; bg?: string; color?: string; display?: boolean }) => (
  <View style={{ width: size, height: size, borderRadius: 999, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' }}>
    <Txt f={display ? 'display' : 'body'} w={display ? 500 : 600} size={display ? Math.round(size * 0.44) : 12} color={color}>{label}</Txt>
  </View>
);

/** Back chevron + caption row used at the top of pushed screens. */
export function BackRow({ label, onBack, right }: { label?: string; onBack: () => void; right?: ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginLeft: -10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
        <Press onPress={onBack} accessibilityLabel="Back" style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="BasicsArrowLeft" size={22} />
        </Press>
        {label ? <Txt size={13} color={C.mu}>{label}</Txt> : null}
      </View>
      {right}
    </View>
  );
}

/** Labelled input / textarea with the mint focus border. */
export function Field({ label, multiline, height = 48, style, ...rest }: TextInputProps & { label?: string; height?: number }) {
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ gap: 8 }}>
      {label ? <Eyebrow>{label}</Eyebrow> : null}
      <View>
        <TextInput
          placeholderTextColor={C.mu}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : 'center'}
          style={[{
            minHeight: multiline ? undefined : height, borderRadius: R.md, borderWidth: 1, borderColor: focus ? C.mint : C.ln, backgroundColor: C.sf,
            paddingHorizontal: 14, paddingVertical: multiline ? 12 : 0, fontSize: 15, lineHeight: multiline ? 15 * 1.45 : undefined,
            fontFamily: F.body, color: C.tx, outlineStyle: 'none',
          } as unknown as TextStyle, style]}
          {...rest}
          onFocus={e => { setFocus(true); rest.onFocus?.(e); }}
          onBlur={e => { setFocus(false); rest.onBlur?.(e); }}
        />
      </View>
    </View>
  );
}

/** INR / USD segmented toggle. */
export function Segmented<T extends string>({ options, value, onChange, minWidth = 44, height = 28 }: {
  options: readonly T[]; value: T; onChange: (v: T) => void; minWidth?: number; height?: number;
}) {
  return (
    <View style={{ flexDirection: 'row', padding: 2, borderRadius: 999, backgroundColor: C.sf2, borderWidth: 1, borderColor: C.ln }}>
      {options.map(o => (
        <Pressable key={o} onPress={() => onChange(o)} accessibilityRole="button" accessibilityState={{ selected: o === value }}
          style={{ minWidth, height, borderRadius: 999, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 8, backgroundColor: o === value ? C.tx : 'transparent' }}>
          <Txt w={600} size={12} color={o === value ? C.bg : C.mu}>{o}</Txt>
        </Pressable>
      ))}
    </View>
  );
}

/** Selectable chip / option colours. */
export const sel = (on: boolean) => on
  ? { borderColor: C.mint, backgroundColor: C.mint, color: C.mi }
  : { borderColor: C.ln, backgroundColor: C.sf, color: C.tx };
