import { View, Text } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

export function SectionHeader({ title, subtitle }: { title: string; subtitle: string }) {
  const { colors } = useTheme();

  return (
    <View style={{ marginBottom: 18 }}>
      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800', letterSpacing: 0, marginBottom: 8 }}>{subtitle.toUpperCase()}</Text>
      <Text style={{ color: colors.text, fontSize: 34, fontWeight: '900', letterSpacing: 0 }}>{title}</Text>
    </View>
  );
}
