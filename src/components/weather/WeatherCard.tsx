import { ActivityIndicator, Text, View } from 'react-native';
import { GlassCard } from '@components/ui/GlassCard';
import { useAuth } from '@hooks/useAuth';
import { useUserLocation, useWeatherBundle } from '@hooks/useWeather';
import { useClients } from '@hooks/useData';
import { useTheme } from '@theme/ThemeProvider';
import { formatWeatherUpdatedLabel, windDirectionLabel } from '@services/weatherService';

const STATUS_COLORS = {
  green: '#22C55E',
  yellow: '#EAB308',
  red: '#EF4444',
} as const;

export function WeatherCard() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const { data: clients } = useClients();
  const { coords, fallbackCoords } = useUserLocation(true);

  const clientWithGps = clients?.find((client) => Number.isFinite(client.latitude) && Number.isFinite(client.longitude));
  const target = coords ?? (clientWithGps ? { latitude: clientWithGps.latitude!, longitude: clientWithGps.longitude! } : fallbackCoords);
  const locationLabel = coords ? 'Tu ubicación' : clientWithGps ? clientWithGps.name : 'Ubicación predeterminada';

  const { data: bundle, isLoading, error } = useWeatherBundle(target.latitude, target.longitude, {
    userId: user?.id,
    locationLabel,
  });

  const weather = bundle?.current;
  const spraying = bundle?.spraying;
  const statusColor = STATUS_COLORS[spraying?.status ?? 'green'];

  return (
    <GlassCard style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View>
          <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Clima operativo</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{locationLabel}</Text>
        </View>
        {spraying ? (
          <View style={{ alignItems: 'flex-end', gap: 4 }}>
            <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: statusColor }} />
            <Text style={{ color: statusColor, fontSize: 11, fontWeight: '900' }}>
              {spraying.status === 'green' ? 'Seguro' : spraying.status === 'yellow' ? 'Precaución' : 'No recomendado'}
            </Text>
          </View>
        ) : null}
      </View>

      {isLoading && !weather ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ActivityIndicator size="small" color={colors.primary} />
          <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>Consultando OpenWeather...</Text>
        </View>
      ) : weather ? (
        <>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <Stat label="Temperatura" value={`${Math.round(weather.temperature)}°C`} colors={colors} />
            <Stat label="Viento" value={`${Math.round(weather.windSpeed)} km/h`} colors={colors} />
            <Stat label="Dirección" value={windDirectionLabel(weather.windDirection)} colors={colors} />
            <Stat label="Humedad" value={`${Math.round(weather.humidity)}%`} colors={colors} />
            <Stat label="Lluvia" value={`${Math.round(spraying?.rainRiskPercent ?? weather.rainProbability)}%`} colors={colors} />
          </View>
          {spraying ? (
            <Text style={{ color: colors.text, fontWeight: '700', lineHeight: 20 }}>{spraying.recommendation}</Text>
          ) : null}
          <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '600' }}>
            {formatWeatherUpdatedLabel(weather)}
          </Text>
        </>
      ) : (
        <Text style={{ color: colors.error, fontWeight: '700' }}>
          {error instanceof Error ? error.message : 'No se pudo cargar el clima.'}
        </Text>
      )}
    </GlassCard>
  );
}

function Stat({
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
        minWidth: 100,
        flexGrow: 1,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </View>
  );
}
