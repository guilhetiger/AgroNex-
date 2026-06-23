import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo } from 'react';
import { Platform, StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polygon, Polyline, UrlTile } from 'react-native-maps';
import { GlassCard } from '@components/ui/GlassCard';
import { SectionHeader } from '@components/ui/SectionHeader';
import { TabScreenScroll } from '@components/ui/TabScreenScroll';
import { WeatherConditionsPanel } from '@components/weather/WeatherConditionsPanel';
import { useTheme } from '@theme/ThemeProvider';
import { useAuth } from '@hooks/useAuth';
import { useUserLocation, useWeatherBundle } from '@hooks/useWeather';
import { useFlights, useClients } from '@hooks/useData';
import { parseRoutePolyline } from '@utils/geo';
import type { AppStackParamList } from '@navigation/types';

type Coordinate = {
  latitude: number;
  longitude: number;
};

const OSM_TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png';
const OSM_TILE_CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 30;

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

function WeatherAtLocation({
  title,
  latitude,
  longitude,
  locationLabel,
  userId,
}: {
  title: string;
  latitude: number;
  longitude: number;
  locationLabel: string;
  userId?: string;
}) {
  const { data, isLoading, error } = useWeatherBundle(latitude, longitude, {
    userId,
    locationLabel,
    notify: false,
  });

  return (
    <WeatherConditionsPanel
      title={title}
      weather={data?.current}
      spraying={data?.spraying}
      isLoading={isLoading}
      errorMessage={error instanceof Error ? error.message : null}
      compact
    />
  );
}

export function MapsScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { colors, radii } = useTheme();
  const { user } = useAuth();
  const { coords: userCoords, fallbackCoords } = useUserLocation(true);
  const { data: flights } = useFlights();
  const { data: clients } = useClients();

  const primaryClient = useMemo(
    () => clients?.find((client) => Number.isFinite(client.latitude) && Number.isFinite(client.longitude)),
    [clients]
  );
  const farmLocation = primaryClient
    ? { latitude: primaryClient.latitude!, longitude: primaryClient.longitude! }
    : fallbackCoords;

  const latestFlightRoute = useMemo(() => {
    const sorted = [...(flights || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    for (const flight of sorted) {
      const pts = parseRoutePolyline(flight.route_coordinates);
      if (pts?.[0]) return { point: pts[0], label: flight.farm_name || `Vuelo ${flight.id.slice(-4)}` };
    }
    return null;
  }, [flights]);

  const totalArea = flights?.reduce((sum, flight) => sum + flight.area_covered, 0) || 0;
  const totalMinutes = flights?.reduce((sum, flight) => sum + flight.duration, 0) || 0;
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
        <MapView
          provider={null}
          style={styles.nativeMap}
          initialRegion={{
            ...farmLocation,
            latitudeDelta: 0.08,
            longitudeDelta: 0.08,
          }}
          showsUserLocation={true}
          showsMyLocationButton
        >
          <UrlTile
            urlTemplate={OSM_TILE_URL}
            maximumZ={19}
            tileSize={256}
            shouldReplaceMapContent={true}
            {...(Platform.OS === 'android'
              ? { offlineMode: true, tileCacheMaxAge: OSM_TILE_CACHE_MAX_AGE_MS }
              : {})}
          />
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
        <Text style={[styles.previewTitle, { color: colors.text }]}>Mapa operativo</Text>
        <Text style={[styles.previewText, { color: colors.textSecondary }]}>
          Cartografía OpenStreetMap con caché de teselas. El GPS en tiempo real funciona sin conexión; las teselas ya visitadas se reutilizan offline.
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

      {userCoords ? (
        <WeatherAtLocation
          title="Clima · Tu ubicación"
          latitude={userCoords.latitude}
          longitude={userCoords.longitude}
          locationLabel="Tu ubicación"
          userId={user?.id}
        />
      ) : null}

      <WeatherAtLocation
        title={`Clima · ${primaryClient?.name ?? 'Finca principal'}`}
        latitude={farmLocation.latitude}
        longitude={farmLocation.longitude}
        locationLabel={primaryClient?.name ?? 'Finca principal'}
        userId={user?.id}
      />

      {latestFlightRoute ? (
        <WeatherAtLocation
          title={`Clima · ${latestFlightRoute.label}`}
          latitude={latestFlightRoute.point.latitude}
          longitude={latestFlightRoute.point.longitude}
          locationLabel={latestFlightRoute.label}
          userId={user?.id}
        />
      ) : null}
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
  historyBtn: { borderWidth: 1, paddingVertical: 12, paddingHorizontal: 14 },
});
