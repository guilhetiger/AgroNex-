import { Text, View } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

export function MetricBadge({ label, value }: { label: string; value: string }) {
  const { colors, radii } = useTheme();

  return (
    <View style={{ flex: 1, minWidth: 140, backgroundColor: colors.surfaceMuted, padding: 18, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border }}>
      <Text style={{ color: colors.onSurfaceSecondary, fontSize: 14, marginBottom: 8 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{value}</Text>
    </View>
  );
}
