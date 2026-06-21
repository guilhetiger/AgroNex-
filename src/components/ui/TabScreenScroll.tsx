import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, type StyleProp, type ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTabBarPadding } from '@hooks/useTabBarPadding';
import { useTheme } from '@theme/ThemeProvider';

type Props = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  horizontalPadding?: number;
  gap?: number;
};

export function TabScreenScroll({
  children,
  contentContainerStyle,
  horizontalPadding = 20,
  gap = 14,
}: Props) {
  const { colors } = useTheme();
  const paddingBottom = useTabBarPadding();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          {
            flexGrow: 1,
            paddingHorizontal: horizontalPadding,
            paddingTop: horizontalPadding,
            paddingBottom,
            gap,
          },
          contentContainerStyle,
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  scroll: { flex: 1 },
});
