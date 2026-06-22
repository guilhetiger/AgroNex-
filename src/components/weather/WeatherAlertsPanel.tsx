import { Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { GlassCard } from '@components/ui/GlassCard';
import { useWeatherAlerts } from '@hooks/useWeather';
import { useTheme } from '@theme/ThemeProvider';

const SEVERITY_COLORS = {
  low: '#64748B',
  medium: '#EAB308',
  high: '#EF4444',
} as const;

export function WeatherAlertsPanel() {
  const { colors } = useTheme();
  const { data: alerts = [], isLoading } = useWeatherAlerts();

  if (isLoading) {
    return (
      <GlassCard>
        <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cargando alertas climáticas...</Text>
      </GlassCard>
    );
  }

  if (!alerts.length) {
    return (
      <GlassCard style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Alertas climáticas</Text>
        <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Sin alertas activas. Condiciones estables.</Text>
      </GlassCard>
    );
  }

  return (
    <GlassCard style={{ gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Alertas climáticas</Text>
      {alerts.slice(0, 5).map((alert) => {
        const color = SEVERITY_COLORS[alert.severity];
        return (
          <View
            key={alert.id}
            style={{
              flexDirection: 'row',
              gap: 10,
              padding: 12,
              borderRadius: 10,
              backgroundColor: color + '12',
              borderWidth: 1,
              borderColor: color + '30',
            }}
          >
            <MaterialIcons name="warning-amber" size={20} color={color} />
            <View style={{ flex: 1, gap: 2 }}>
              <Text style={{ color: colors.text, fontWeight: '900' }}>{alert.title}</Text>
              <Text style={{ color: colors.textSecondary, fontWeight: '600', lineHeight: 18 }}>{alert.message}</Text>
              {alert.locationLabel ? (
                <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>{alert.locationLabel}</Text>
              ) : null}
            </View>
          </View>
        );
      })}
    </GlassCard>
  );
}
