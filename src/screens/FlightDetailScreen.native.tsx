import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { useFlights, useClients } from '@hooks/useData';
import { useLocalization } from '@context/LocalizationContext';
import { parseRoutePolyline } from '@utils/geo';

type FlightDetailRoute = RouteProp<Record<string, { flightId: string }>, string>;

const fallbackPath = [
  { latitude: -16.4897, longitude: -68.1193 },
  { latitude: -16.4885, longitude: -68.118 },
  { latitude: -16.4875, longitude: -68.12 },
];

export function FlightDetailScreen() {
  const route = useRoute<FlightDetailRoute>();
  const navigation = useNavigation();
  const { colors, radii } = useTheme();
  const { formatDate } = useLocalization();
  const { data: flights, isLoading } = useFlights();
  const { data: clients } = useClients();
  const flight = flights?.find((item) => item.id === route.params.flightId);
  const client = clients?.find((c) => c.id === flight?.client_id);

  const path = parseRoutePolyline(flight?.route_coordinates) || fallbackPath;
  const mapsUrl =
    client?.latitude != null && client?.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${client.latitude},${client.longitude}`
      : null;

  const goBack = () => {
    if (navigation.canGoBack()) navigation.goBack();
    else navigation.navigate('MainTab' as never);
  };

  if (isLoading || !flights) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!flight) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: colors.background }]} edges={['top']}>
        <Text style={{ color: colors.text, textAlign: 'center' }}>Vuelo no encontrado.</Text>
        <TouchableOpacity onPress={goBack} style={[styles.backBtn, { borderColor: colors.border, marginTop: 16 }]}>
          <Text style={{ color: colors.primary, fontWeight: '800' }}>Volver</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <TouchableOpacity onPress={goBack} style={[styles.backRow, { borderColor: colors.border, borderRadius: radii.md }]}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Volver</Text>
        </TouchableOpacity>

        <SectionHeader title={`Vuelo ${flight.id.slice(-4).toUpperCase()}`} subtitle={flight.farm_name || 'Detalle operativo'} />

        <GlassCard>
          <Text style={[styles.k, { color: colors.textSecondary }]}>Cliente</Text>
          <Text style={[styles.v, { color: colors.text }]}>{client?.name || 'Cliente'}</Text>
          <Text style={[styles.k, { color: colors.textSecondary, marginTop: 12 }]}>Fecha</Text>
          <Text style={[styles.v, { color: colors.text }]}>{formatDate(flight.date)}</Text>
          {mapsUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(mapsUrl)} style={{ marginTop: 14 }}>
              <Text style={{ color: colors.accent, fontWeight: '800' }}>Abrir ubicación en Maps →</Text>
            </TouchableOpacity>
          ) : null}
        </GlassCard>

        <GlassCard>
          <Text style={[styles.k, { color: colors.textSecondary }]}>Rendimiento</Text>
          <Text style={[styles.v, { color: colors.text, marginTop: 8 }]}>Área: {flight.area_covered} ha</Text>
          <Text style={[styles.v, { color: colors.text, marginTop: 6 }]}>Tiempo: {flight.duration} min</Text>
          <Text style={[styles.v, { color: colors.text, marginTop: 6 }]}>Dron: {flight.drone || '—'}</Text>
          <Text style={[styles.v, { color: colors.text, marginTop: 6 }]}>Piloto: {flight.pilot || '—'}</Text>
        </GlassCard>

        <GlassCard>
          <Text style={[styles.k, { color: colors.textSecondary }]}>Condiciones</Text>
          <Text style={[styles.v, { color: colors.text, marginTop: 8 }]}>Clima: {flight.weather || 'N/A'}</Text>
          <Text style={[styles.v, { color: colors.text, marginTop: 6 }]}>Viento: {flight.wind || 'N/A'}</Text>
          <Text style={[styles.v, { color: colors.text, marginTop: 6 }]}>Batería: {flight.battery_usage || 'N/A'}</Text>
          <Text style={[styles.v, { color: colors.text, marginTop: 6 }]}>Consumo: {flight.consumption || 'N/A'}</Text>
        </GlassCard>

        <GlassCard style={{ height: 260, padding: 0, overflow: 'hidden', borderRadius: radii.lg }}>
          <MapView
            provider={PROVIDER_GOOGLE}
            style={{ flex: 1 }}
            initialRegion={{
              latitude: path[0].latitude,
              longitude: path[0].longitude,
              latitudeDelta: 0.006,
              longitudeDelta: 0.006,
            }}
          >
            <Polyline coordinates={path} strokeColor={colors.primary} strokeWidth={4} />
            <Marker coordinate={path[0]} title="Inicio" />
            <Marker coordinate={path[path.length - 1]} title="Fin" />
          </MapView>
        </GlassCard>

        {flight.notes ? (
          <GlassCard>
            <Text style={[styles.k, { color: colors.textSecondary }]}>Observaciones</Text>
            <Text style={[styles.v, { color: colors.text, marginTop: 10, lineHeight: 22 }]}>{flight.notes}</Text>
          </GlassCard>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 },
  scroll: { padding: 20, paddingBottom: 120, gap: 14 },
  backRow: {
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  backText: { fontSize: 14, fontWeight: '900' },
  backBtn: { borderWidth: 1, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  k: { fontSize: 11, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.6 },
  v: { fontSize: 15, fontWeight: '700' },
});
