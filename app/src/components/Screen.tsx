import type { ReactNode } from 'react';
import { ScrollView, View, type StyleProp, type ViewStyle } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { C } from '../theme';
import { ScreenIn } from './motion';

/**
 * Scrolling screen body. `root` screens (tab roots) sit 8pt lower than pushed
 * screens, which start with a back row; `tabs` reserves room for the tab bar.
 */
export function Screen({ root, tabs = true, fill, style, children, decor }: {
  root?: boolean; tabs?: boolean; fill?: boolean; style?: StyleProp<ViewStyle>; children: ReactNode; decor?: ReactNode;
}) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, backgroundColor: C.bg, overflow: 'hidden' }}>
      <ScreenIn>
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[{
            flexGrow: fill ? 1 : undefined,
            paddingTop: insets.top + (root ? 8 : 0) + (insets.top ? 0 : 16),
            paddingHorizontal: 20,
            paddingBottom: tabs ? 120 : Math.max(32, insets.bottom + 16),
          }, style]}>
          {decor}
          {children}
        </ScrollView>
      </ScreenIn>
    </View>
  );
}
