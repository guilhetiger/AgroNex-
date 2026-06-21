import { Text, View } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

export function MetricBadge({ label, value }: { label: string; value: string }) {
  const { colors, radii } = useTheme();

  return (
    <View
      style={{
        flexGrow: 1,
        flexShrink: 1,
        flexBasis: '45%',
        minWidth: 0,
        maxWidth: '100%',
        backgroundColor: colors.surfaceMuted,
        padding: 18,
        borderRadius: radii.lg,
        borderWidth: 1,
        borderColor: colors.border,
      }}
    >
      <Text style={{ color: colors.onSurfaceSecondary, fontSize: 14, marginBottom: 8 }} numberOfLines={2}>
        {label}
      </Text>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }} numberOfLines={1} adjustsFontSizeToFit>
        {value}
      </Text>
    </View>
  );
}
