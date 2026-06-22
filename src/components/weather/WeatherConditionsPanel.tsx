import { ActivityIndicator, Text, View } from 'react-native';
import { GlassCard } from '@components/ui/GlassCard';
import { useTheme } from '@theme/ThemeProvider';
import { formatWeatherUpdatedLabel, windDirectionLabel, type SprayingRecommendation, type WeatherData } from '@services/weatherService';

const STATUS_COLORS = {
  green: '#22C55E',
  yellow: '#EAB308',
  red: '#EF4444',
} as const;

const STATUS_LABELS = {
  green: 'Seguro',
  yellow: 'Precaución',
  red: 'No recomendado',
} as const;

type Props = {
  title?: string;
  weather?: WeatherData | null;
  spraying?: SprayingRecommendation | null;
  isLoading?: boolean;
  errorMessage?: string | null;
  compact?: boolean;
};

export function WeatherConditionsPanel({
  title = 'Condiciones climáticas',
  weather,
  spraying,
  isLoading,
  errorMessage,
  compact = false,
}: Props) {
  const { colors } = useTheme();
  const status = spraying?.status ?? 'green';
  const statusColor = STATUS_COLORS[status];

  return (
    <GlassCard style={{ gap: compact ? 10 : 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <Text style={{ color: colors.text, fontSize: compact ? 15 : 17, fontWeight: '900' }}>{title}</Text>
        {spraying ? (
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 6,
              backgroundColor: statusColor + '18',
              borderRadius: 999,
              paddingHorizontal: 10,
              paddingVertical: 5,
            }}
          >
            <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: statusColor }} />
            <Text style={{ color: statusColor, fontSize: 11, fontWeight: '900' }}>{STATUS_LABELS[status]}</Text>
          </View>
        ) : null}
      </View>

      {isLoading ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Cargando clima...</Text>
        </View>
      ) : errorMessage ? (
        <Text style={{ color: colors.error, fontWeight: '700' }}>{errorMessage}</Text>
      ) : weather ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Metric label="Temp." value={`${Math.round(weather.temperature)}°C`} colors={colors} />
            <Metric label="Viento" value={`${Math.round(weather.windSpeed)} km/h`} colors={colors} />
            <Metric label="Dirección" value={windDirectionLabel(weather.windDirection)} colors={colors} />
            <Metric label="Humedad" value={`${Math.round(weather.humidity)}%`} colors={colors} />
            <Metric label="Lluvia" value={`${Math.round(weather.rainProbability || spraying?.rainRiskPercent || 0)}%`} colors={colors} />
            {!compact ? (
              <Metric label="Nubes" value={`${Math.round(weather.cloudCoverage)}%`} colors={colors} />
            ) : null}
          </View>

          {spraying ? (
            <View style={{ gap: 4 }}>
              <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '800' }}>Recomendación de fumigación</Text>
              <Text style={{ color: colors.text, fontWeight: '700', lineHeight: 20 }}>{spraying.recommendation}</Text>
            </View>
          ) : null}

          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
            {formatWeatherUpdatedLabel(weather)}
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Datos de clima no disponibles.</Text>
      )}
    </GlassCard>
  );
}

function Metric({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { text: string; textSecondary: string; surfaceMuted: string; borderSubtle: string };
}) {
  return (
    <View
      style={{
        minWidth: 88,
        flexGrow: 1,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 10,
        padding: 10,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 10, fontWeight: '800', textTransform: 'uppercase' }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 15, fontWeight: '900', marginTop: 3 }}>{value}</Text>
    </View>
  );
}
