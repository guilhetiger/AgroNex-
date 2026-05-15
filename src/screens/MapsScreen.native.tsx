import { useMemo, useState } from 'react';
import { ActivityIndicator, Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polygon, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useNavigation } from '@react-navigation/native';
import { GlassCard } from '@components/ui/GlassCard';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { useCurrentWeather, useFlightRecommendation } from '@hooks/useWeather';
import { useFlights, useClients } from '@hooks/useData';
import { parseFieldPolygon, parseRoutePolyline } from '@utils/geo';

const { height } = Dimensions.get('window');

const fallbackPolygon = [
  { latitude: -16.486, longitude: -68.122 },
  { latitude: -16.491, longitude: -68.117 },
  { latitude: -16.492, longitude: -68.123 },
  { latitude: -16.486, longitude: -68.122 },
];

export function MapsScreen() {
  const navigation = useNavigation<any>();
  const { colors, radii } = useTheme();
  const farmLocation = { latitude: -16.4897, longitude: -68.1193 };
  const { data: weather, isLoading: weatherLoading } = useCurrentWeather(farmLocation.latitude, farmLocation.longitude);
  const { recommendation } = useFlightRecommendation(farmLocation.latitude, farmLocation.longitude);
  const { data: flights } = useFlights();
  const { data: clients } = useClients();

  const [mapType, setMapType] = useState<'standard' | 'satellite' | 'mutedStandard'>('mutedStandard');
  const [showRoutes, setShowRoutes] = useState(true);
  const [showZones, setShowZones] = useState(true);

  const totalArea = flights?.reduce((sum, flight) => sum + flight.area_covered, 0) || 0;
  const totalMinutes = flights?.reduce((sum, flight) => sum + flight.duration, 0) || 0;

  const flightPaths = useMemo(() => {
    if (!flights?.length) return [] as { id: string; coordinates: { latitude: number; longitude: number }[]; color: string }[];
    return flights
      .map((f) => {
        const coords = parseRoutePolyline(f.route_coordinates);
        if (!coords) return null;
        return { id: f.id, coordinates: coords, color: colors.primary };
      })
      .filter(Boolean) as { id: string; coordinates: { latitude: number; longitude: number }[]; color: string }[];
  }, [flights, colors.primary]);

  const clientPolygons = useMemo(() => {
    if (!clients?.length) return [] as { id: string; coordinates: { latitude: number; longitude: number }[] }[];
    return clients
      .map((c) => {
        const ring = parseFieldPolygon(c.field_polygon);
        if (!ring) return null;
        return { id: c.id, coordinates: ring };
      })
      .filter(Boolean) as { id: string; coordinates: { latitude: number; longitude: number }[] }[];
  }, [clients]);

  const polygonsToRender =
    showZones && clientPolygons.length > 0
      ? clientPolygons
      : showZones
        ? [{ id: 'fallback', coordinates: fallbackPolygon }]
        : [];

  const getRiskColor = (riskLevel: string) => {
    if (riskLevel === 'high') return colors.error;
    if (riskLevel === 'medium') return colors.warning;
    return colors.success;
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: farmLocation.latitude,
          longitude: farmLocation.longitude,
          latitudeDelta: 0.12,
          longitudeDelta: 0.1,
        }}
        mapType={mapType}
        showsUserLocation
        showsMyLocationButton
        showsCompass
        showsScale
        zoomEnabled
        rotateEnabled
        scrollEnabled
      >
        {clients?.map((client, index) => {
          const hasGps = client.latitude != null && client.longitude != null;
          const coordinate = hasGps
            ? { latitude: client.latitude as number, longitude: client.longitude as number }
            : {
                latitude: farmLocation.latitude + (index + 1) * 0.004,
                longitude: farmLocation.longitude - (index + 1) * 0.003,
              };
          return (
            <Marker
              key={client.id}
              coordinate={coordinate}
              title={client.name}
              description={`${client.crop} · ${client.area} ha${hasGps ? ' · GPS' : ''}`}
              pinColor={colors.primary}
            />
          );
        })}

        {polygonsToRender.map((poly) => (
          <Polygon
            key={poly.id}
            coordinates={poly.coordinates}
            strokeColor={colors.accent}
            fillColor={colors.accent + '22'}
            strokeWidth={2}
          />
        ))}

        {showRoutes &&
          flightPaths.map((path) => (
            <Polyline key={path.id} coordinates={path.coordinates} strokeColor={path.color} strokeWidth={4} />
          ))}
      </MapView>

      <ScrollView style={styles.overlay} contentContainerStyle={styles.overlayContent} showsVerticalScrollIndicator={false}>
        <GlassCard>
          <SectionHeader title="Mapas" subtitle="GPS, polígonos y rutas" />
          <Text style={{ color: colors.textSecondary, fontWeight: '700', marginBottom: 12 }}>
            Datos desde clientes (polígonos) y vuelos (rutas). Filtros abajo.
          </Text>
          <TouchableOpacity
            onPress={() => navigation.navigate('GeoHistory')}
            style={[styles.historyBtn, { backgroundColor: colors.primaryMuted, borderColor: colors.primary, borderRadius: radii.md }]}
          >
            <Text style={{ color: colors.primary, fontWeight: '900' }}>Historial geográfico →</Text>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Estadísticas" subtitle="Operación geográfica" />
          <View style={styles.statsGrid}>
            <Stat label="Vuelos" value={`${flights?.length || 0}`} />
            <Stat label="Clientes" value={`${clients?.length || 0}`} />
            <Stat label="Área" value={`${totalArea} ha`} />
            <Stat label="Tiempo" value={`${totalMinutes} min`} />
          </View>
        </GlassCard>

        <GlassCard>
          <SectionHeader title="Condiciones" subtitle="Clima actual" />
          {weatherLoading ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : weather ? (
            <View style={{ gap: 8 }}>
              <Text style={{ color: colors.text, fontWeight: '900' }}>
                {Math.round(weather.temperature)}°C · {weather.condition}
              </Text>
              <Text style={{ color: colors.textSecondary }}>Viento: {Math.round(weather.windSpeed)} km/h</Text>
              <Text style={{ color: colors.textSecondary }}>Humedad: {Math.round(weather.humidity)}%</Text>
            </View>
          ) : (
            <Text style={{ color: colors.textSecondary }}>Datos de clima no disponibles.</Text>
          )}
        </GlassCard>

        {recommendation && (
          <GlassCard>
            <SectionHeader title="Recomendación" subtitle="Decisión de vuelo" />
            <View
              style={[
                styles.recommendation,
                { backgroundColor: getRiskColor(recommendation.riskLevel) + '18', borderColor: getRiskColor(recommendation.riskLevel) },
              ]}
            >
              <Text style={{ color: getRiskColor(recommendation.riskLevel), fontWeight: '900' }}>
                {recommendation.recommended ? 'Vuelo recomendado' : 'No recomendado'}
              </Text>
              <Text style={{ color: colors.textSecondary, marginTop: 6 }}>{recommendation.reason}</Text>
            </View>
          </GlassCard>
        )}

        <View style={styles.controlPanel}>
          <TouchableOpacity
            onPress={() => setMapType((m) => (m === 'satellite' ? 'mutedStandard' : 'satellite'))}
            style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            <Text style={{ color: colors.primary, fontWeight: '900' }}>{mapType === 'satellite' ? 'Mapa' : 'Satélite'}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowRoutes((v) => !v)}
            style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border, opacity: showRoutes ? 1 : 0.55 }]}
          >
            <Text style={{ color: colors.primary, fontWeight: '900' }}>Rutas</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowZones((v) => !v)}
            style={[styles.controlButton, { backgroundColor: colors.surface, borderColor: colors.border, opacity: showZones ? 1 : 0.55 }]}
          >
            <Text style={{ color: colors.primary, fontWeight: '900' }}>Zonas</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );

  function Stat({ label, value }: { label: string; value: string }) {
    return (
      <View style={[styles.statBox, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.primary, fontSize: 20, fontWeight: '900' }}>{value}</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '800' }}>{label}</Text>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  map: { flex: 1 },
  overlay: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 92,
    maxHeight: height * 0.62,
  },
  overlayContent: {
    gap: 12,
    paddingBottom: 20,
  },
  historyBtn: {
    borderWidth: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statBox: {
    width: '47%',
    borderRadius: 8,
    padding: 12,
  },
  recommendation: {
    borderLeftWidth: 4,
    borderRadius: 8,
    padding: 12,
  },
  controlPanel: {
    flexDirection: 'row',
    gap: 8,
  },
  controlButton: {
    flex: 1,
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
