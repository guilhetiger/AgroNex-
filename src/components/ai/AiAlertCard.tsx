import { Text, View } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

type Props = {
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical' | string;
};

export function AiAlertCard({ title, description, severity }: Props) {
  const { colors, radii } = useTheme();
  const color =
    severity === 'critical' || severity === 'high'
      ? colors.error
      : severity === 'medium'
        ? colors.warning
        : colors.accent;

  return (
    <View
      style={{
        borderWidth: 1,
        borderColor: color + '40',
        backgroundColor: color + '12',
        borderRadius: radii.md,
        padding: 12,
        gap: 4,
      }}
    >
      <Text style={{ color, fontWeight: '900', fontSize: 13 }}>{title}</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>{description}</Text>
    </View>
  );
}
