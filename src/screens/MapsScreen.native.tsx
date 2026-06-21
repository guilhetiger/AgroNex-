import { MaterialIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { GlassCard } from '@components/ui/GlassCard';
import { SectionHeader } from '@components/ui/SectionHeader';
import { TabScreenScroll } from '@components/ui/TabScreenScroll';
import { useTheme } from '@theme/ThemeProvider';
import { useCurrentWeather, useFlightRecommendation } from '@hooks/useWeather';
import { useFlights, useClients } from '@hooks/useData';
import type { AppStackParamList } from '@navigation/types';

type Coordinate = {
  latitude: number;
  longitude: number;
};

const extra = (Constants.expoConfig?.extra ?? {}) as Record<string, string | undefined>;
const androidMapsKey = process.env.EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY || extra.expoPublicGoogleMapsAndroidApiKey || '';

function parseCoordinates(value: unknown): Coordinate[] {
  try {
    const raw = typeof value === 'string' ? JSON.parse(value) : value;
    if (!Array.isArray(raw)) return [];
    return raw.filter((item): item is Coordinate =>
      Number.isFinite(item?.latitude) && Number.isFinite(item?.longitude)
    );
  } catch {
    return [];
  }
}

export function MapsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { colors, radii } = useTheme();
  const farmLocation = { latitude: -16.4897, longitude: -68.1193 };
  const { data: weather, isLoading: weatherLoading } = useCurrentWeather(farmLocation.latitude, farmLocation.longitude);
  const { recommendation } = useFlightRecommendation(farmLocation.latitude, farmLocation.longitude);
  const { data: flights } = useFlights();
  const { data: clients } = useClients();

  const totalArea = flights?.reduce((sum, flight) => sum + flight.area_covered, 0) || 0;
  const totalMinutes = flights?.reduce((sum, flight) => sum + flight.duration, 0) || 0;
  const canRenderNativeMap = Platform.OS !== 'android' || !!androidMapsKey;
  const clientMarkers = useMemo(
    () => (clients || []).filter((client) => Number.isFinite(client.latitude) && Number.isFinite(client.longitude)),
    [clients]
  );
  const fieldPolygons = useMemo(
    () => (clients || []).map((client) => ({ id: client.id, coordinates: parseCoordinates(client.field_polygon) })).filter((item) => item.coordinates.length >= 3),
    [clients]
  );
  const flightRoutes = useMemo(
    () => (flights || []).map((flight) => ({ id: flight.id, coordinates: parseCoordinates(flight.route_coordinates) })).filter((item) => item.coordinates.length >= 2),
    [flights]
  );

  return (
    <TabScreenScroll>
      <SectionHeader title="Mapas" subtitle="GPS, rutas y zonas atendidas" />

      <View style={[styles.mapPreview, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        {canRenderNativeMap ? (
          <MapView
            provider={Platform.OS === 'android' ? PROVIDER_GOOGLE : undefined}
            style={styles.nativeMap}
            initialRegion={{
              ...farmLocation,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            showsUserLocation
            showsMyLocationButton
          >
            {clientMarkers.map((client) => (
              <Marker
                key={client.id}
                coordinate={{ latitude: client.latitude!, longitude: client.longitude! }}
                title={client.name}
                description={client.location}
              />
            ))}
            {fieldPolygons.map((field) => (
              <Polygon
                key={field.id}
                coordinates={field.coordinates}
                strokeColor={colors.primary}
                fillColor={colors.primary + '25'}
                strokeWidth={2}
              />
            ))}
            {flightRoutes.map((route) => (
              <Polyline key={route.id} coordinates={route.coordinates} strokeColor={colors.accent} strokeWidth={4} />
            ))}
          </MapView>
        ) : (
          <View style={[styles.mapGrid, { borderColor: colors.border }]}>
            <View style={[styles.zone, { backgroundColor: colors.primary + '20', borderColor: colors.primary }]} />
            <View style={[styles.route, { backgroundColor: colors.accent }]} />
            <View style={[styles.pin, { backgroundColor: colors.primary }]} />
          </View>
        )}
        <Text style={[styles.previewTitle, { color: colors.text }]}>
          {canRenderNativeMap ? 'Mapa operativo' : 'Mapa nativo pendiente de API key'}
        </Text>
        <Text style={[styles.previewText, { color: colors.textSecondary }]}>
          {canRenderNativeMap
            ? 'Clientes, polígonos y rutas de vuelo se muestran sobre el mapa nativo.'
            : 'Configura EXPO_PUBLIC_GOOGLE_MAPS_ANDROID_API_KEY o GOOGLE_MAPS_ANDROID_API_KEY para activar Google Maps en Android.'}
        </Text>
      </View>

      <View style={styles.statsGrid}>
        <StatCard icon="flight" label="Vuelos" value={`${flights?.length || 0}`} />
        <StatCard icon="groups" label="Clientes" value={`${clients?.length || 0}`} />
        <StatCard icon="crop-free" label="Área cubierta" value={`${totalArea} ha`} />
        <StatCard icon="timer" label="Tiempo total" value={`${totalMinutes} min`} />
      </View>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Historial geográfico</Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary, marginBottom: 12 }]}>
          Lista de vuelos con fechas y cobertura. En móvil verás mapas y rutas completas.
        </Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('GeoHistory')}
          style={[styles.historyBtn, { borderColor: colors.primary, backgroundColor: colors.primaryMuted, borderRadius: radii.md }]}
        >
          <Text style={{ color: colors.primary, fontWeight: '900', textAlign: 'center' }}>Abrir historial →</Text>
        </TouchableOpacity>
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Condiciones actuales</Text>
        {weatherLoading ? (
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Cargando condiciones...</Text>
        ) : weather ? (
          <View style={styles.infoRows}>
            <Info label="Temperatura" value={`${Math.round(weather.temperature)}°C`} />
            <Info label="Viento" value={`${Math.round(weather.windSpeed)} km/h`} />
            <Info label="Humedad" value={`${Math.round(weather.humidity)}%`} />
            <Info label="Coordenadas" value={`${farmLocation.latitude}, ${farmLocation.longitude}`} />
          </View>
        ) : (
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>Datos de clima no disponibles.</Text>
        )}
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Recomendación de vuelo</Text>
        <Text style={[styles.bodyText, { color: colors.textSecondary }]}>
          {recommendation?.reason || 'No hay recomendaciones disponibles.'}
        </Text>
      </GlassCard>
    </TabScreenScroll>
  );

  function StatCard({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
    return (
      <GlassCard style={styles.statCard}>
        <MaterialIcons name={icon} size={22} color={colors.primary} />
        <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
        <Text style={[styles.statLabel, { color: colors.textSecondary }]}>{label}</Text>
      </GlassCard>
    );
  }

  function Info({ label, value }: { label: string; value: string }) {
    return (
      <View style={styles.infoRow}>
        <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
        <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  mapPreview: { minHeight: 260, borderWidth: 1, borderRadius: 8, padding: 12, overflow: 'hidden', width: '100%' },
  nativeMap: { minHeight: 250, borderRadius: 8, marginBottom: 16, width: '100%' },
  mapGrid: { flex: 1, minHeight: 150, borderWidth: 1, borderRadius: 8, position: 'relative', marginBottom: 16, overflow: 'hidden' },
  zone: { position: 'absolute', width: '55%', height: '55%', borderWidth: 2, borderRadius: 8, left: '12%', top: '16%', transform: [{ rotate: '-8deg' }] },
  route: { position: 'absolute', width: '58%', height: 4, left: '20%', top: '52%', transform: [{ rotate: '16deg' }], borderRadius: 8 },
  pin: { position: 'absolute', width: 18, height: 18, borderRadius: 9, right: '22%', top: '44%' },
  previewTitle: { fontSize: 20, fontWeight: '900' },
  previewText: { marginTop: 6, fontSize: 13, lineHeight: 20, fontWeight: '700' },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  statCard: { flexGrow: 1, flexBasis: '45%', minWidth: 0, minHeight: 120, gap: 8 },
  statValue: { fontSize: 24, fontWeight: '900' },
  statLabel: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase' },
  card: { gap: 12 },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  bodyText: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  infoRows: { gap: 10 },
  infoRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 14 },
  infoLabel: { fontSize: 13, fontWeight: '800' },
  infoValue: { fontSize: 13, fontWeight: '900' },
  historyBtn: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
});
