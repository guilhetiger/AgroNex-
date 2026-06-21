import { ReactNode } from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

export function GlassCard({ children, style }: { children: ReactNode; style?: StyleProp<ViewStyle> }) {
  const { colors, radii } = useTheme();

  return (
    <View
      style={[
        styles.card,
        {
          borderRadius: radii.lg,
          backgroundColor: colors.surfaceGlass,
          borderColor: colors.borderSubtle,
          shadowColor: '#000',
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    maxWidth: '100%',
    shadowOpacity: 0.22,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
});
