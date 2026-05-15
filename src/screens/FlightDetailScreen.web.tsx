import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { useFlights, useClients } from '@hooks/useData';
import { useLocalization } from '@context/LocalizationContext';
import { parseRoutePolyline } from '@utils/geo';

type FlightDetailRoute = RouteProp<Record<string, { flightId: string }>, string>;

export function FlightDetailScreen() {
  const route = useRoute<FlightDetailRoute>();
  const navigation = useNavigation();
  const { colors, radii } = useTheme();
  const { formatDate } = useLocalization();
  const { data: flights, isLoading } = useFlights();
  const { data: clients } = useClients();
  const flight = flights?.find((item) => item.id === route.params.flightId);
  const client = clients?.find((c) => c.id === flight?.client_id);
  const pts = parseRoutePolyline(flight?.route_coordinates);

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
        <Text style={{ color: colors.text }}>Vuelo no encontrado.</Text>
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

        <SectionHeader title={`Vuelo ${flight.id.slice(-4).toUpperCase()}`} subtitle={flight.farm_name || 'Detalle del vuelo'} />

        <GlassCard>
          <Text style={[styles.k, { color: colors.textSecondary }]}>Cliente</Text>
          <Text style={[styles.v, { color: colors.text }]}>{client?.name || 'Cliente'}</Text>
          <Text style={[styles.k, { color: colors.textSecondary, marginTop: 12 }]}>Fecha</Text>
          <Text style={[styles.v, { color: colors.text }]}>{formatDate(flight.date)}</Text>
          {pts ? (
            <Text style={{ color: colors.textSecondary, marginTop: 10, fontWeight: '600' }}>
              Ruta GPS: {pts.length} puntos registrados (mapa en app móvil).
            </Text>
          ) : null}
          {mapsUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(mapsUrl)} style={{ marginTop: 12 }}>
              <Text style={{ color: colors.accent, fontWeight: '800' }}>Abrir finca en Maps →</Text>
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
