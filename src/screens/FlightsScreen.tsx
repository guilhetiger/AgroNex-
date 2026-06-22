import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useMemo, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, KeyboardAvoidingView, Modal, Platform, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Location from 'expo-location';
import { FormTextInput } from '@components/ui/FormTextInput';
import { GlassCard } from '@components/ui/GlassCard';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { useCreateFlight, useFlights, useClients } from '@hooks/useData';
import { useAuth } from '@hooks/useAuth';
import { trackFlightUsage, trackWeatherUsage } from '@services/analyticsService';
import { WeatherConditionsPanel } from '@components/weather/WeatherConditionsPanel';
import { useWeatherBundle } from '@hooks/useWeather';
import { parseRoutePolyline } from '@utils/geo';
import type { AppStackParamList } from '@navigation/types';
import { parseDecimalInput } from '@utils/number';
import { useTabBarPadding } from '@hooks/useTabBarPadding';

export function FlightsScreen() {
  const { colors } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: flights, isLoading: flightsLoading, error: flightsError, refetch: refetchFlights } = useFlights();
  const { data: clients } = useClients();
  const createFlightMutation = useCreateFlight();
  const { user } = useAuth();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    client_id: '',
    farm_name: '',
    route_coordinates: '' as string,
    area_covered: '',
    duration: '',
    drone: '',
    pilot: '',
    weather: '',
    wind: '',
    battery_usage: '',
    consumption: '',
    notes: '',
  });

  const isLoading = flightsLoading;
  const error = flightsError;

  const getClientName = (clientId: string) => {
    const client = clients?.find((c) => c.id === clientId);
    return client?.name || 'Cliente desconocido';
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Cargando vuelos...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24 }]}>
        <Text style={{ color: colors.error, textAlign: 'center' }}>
          Error al cargar vuelos: {error.message}
        </Text>
      </View>
    );
  }

  const totalArea = flights?.reduce((sum, flight) => sum + flight.area_covered, 0) || 0;
  const totalMinutes = flights?.reduce((sum, flight) => sum + flight.duration, 0) || 0;
  const selectedClientId = form.client_id || clients?.[0]?.id || '';
  const selectedClient = clients?.find((client) => client.id === selectedClientId);

  const flightWeatherCoords = useMemo(() => {
    const routePts = parseRoutePolyline(form.route_coordinates || null);
    if (routePts?.[0]) {
      return { lat: routePts[0].latitude, lon: routePts[0].longitude, label: form.farm_name || 'Ruta GPS' };
    }
    if (selectedClient?.latitude != null && selectedClient.longitude != null) {
      return { lat: selectedClient.latitude, lon: selectedClient.longitude, label: selectedClient.name };
    }
    return null;
  }, [form.route_coordinates, form.farm_name, selectedClient]);

  const {
    data: flightWeatherBundle,
    isLoading: flightWeatherLoading,
    error: flightWeatherError,
  } = useWeatherBundle(flightWeatherCoords?.lat ?? 0, flightWeatherCoords?.lon ?? 0, {
    enabled: isCreateOpen && !!flightWeatherCoords,
    userId: user?.id,
    locationLabel: flightWeatherCoords?.label,
    notify: false,
  });

  const captureGpsRoute = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Ubicación', 'Concede permiso de ubicación para guardar la ruta del vuelo.');
        return;
      }
      const loc =
        (await Location.getLastKnownPositionAsync()) ??
        (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }));
      const lat = loc.coords.latitude;
      const lng = loc.coords.longitude;
      const coords = JSON.stringify([
        { latitude: lat - 0.00028, longitude: lng - 0.00028 },
        { latitude: lat, longitude: lng },
        { latitude: lat + 0.00028, longitude: lng + 0.00028 },
      ]);
      setForm((c) => ({ ...c, route_coordinates: coords }));
      Alert.alert('Listo', 'Se capturó la ruta GPS del punto actual.');
    } catch {
      Alert.alert('Ubicación', 'No se pudo capturar la ubicación. Revisa permisos y GPS.');
    }
  };

  const handleCreateFlight = async () => {
    if (!selectedClientId) return;
    const created = await createFlightMutation.mutateAsync({
      client_id: selectedClientId,
      area_covered: parseDecimalInput(form.area_covered),
      duration: parseDecimalInput(form.duration),
      date: new Date().toISOString(),
      farm_name: form.farm_name.trim() || null,
      route_coordinates: form.route_coordinates.trim() || null,
      drone: form.drone.trim() || 'Dron no asignado',
      pilot: form.pilot.trim() || 'Piloto no asignado',
      weather: form.weather.trim() || 'Sin reporte',
      wind: form.wind.trim(),
      battery_usage: form.battery_usage.trim(),
      consumption: form.consumption.trim(),
      notes: form.notes.trim(),
      route: form.route_coordinates ? 'Ruta GPS registrada' : 'Ruta GPS pendiente',
    });
    if (user?.id) {
      void trackFlightUsage(user.id, 'created', { flightId: created.id });
      void trackFlightUsage(user.id, 'completed', { flightId: created.id });
      if (flightWeatherBundle?.spraying?.status === 'red') {
        void trackWeatherUsage(user.id, 'unsafe_flight', {
          flightId: created.id,
          wind: flightWeatherBundle.spraying.windSpeedKmh,
          rainRisk: flightWeatherBundle.spraying.rainRiskPercent,
          ignoredWarning: true,
        });
      }
    }
    setForm({
      client_id: '',
      farm_name: '',
      route_coordinates: '',
      area_covered: '',
      duration: '',
      drone: '',
      pilot: '',
      weather: '',
      wind: '',
      battery_usage: '',
      consumption: '',
      notes: '',
    });
    setCreateOpen(false);
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={flights || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding }]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetchFlights} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <SectionHeader title="Vuelos" subtitle="Operación aérea" />

            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Cobertura</Text>
                <Text style={[styles.summaryValue, { color: colors.primary }]}>{totalArea} ha</Text>
              </View>
              <View style={[styles.summaryCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Tiempo</Text>
                <Text style={[styles.summaryValue, { color: colors.accent }]}>{formatDuration(totalMinutes)}</Text>
              </View>
            </View>
            <TouchableOpacity activeOpacity={0.84} onPress={() => setCreateOpen(true)} style={[styles.createButton, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="add-location-alt" size={20} color="#F8FFF9" />
              <Text style={styles.createButtonText}>Registrar vuelo</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item: flight }) => (
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={() => navigation.navigate('FlightDetail', { flightId: flight.id })}
          >
            <GlassCard style={styles.flightCard}>
              <View style={styles.flightTop}>
                <View style={[styles.flightIcon, { backgroundColor: colors.primary + '16' }]}>
                  <MaterialIcons name="flight-takeoff" size={24} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.flightTitle, { color: colors.text }]}>Vuelo {flight.id.slice(-4).toUpperCase()}</Text>
                  <Text style={[styles.flightClient, { color: colors.textSecondary }]}>{getClientName(flight.client_id)}</Text>
                  {flight.farm_name ? (
                    <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '800', marginTop: 4 }}>{flight.farm_name}</Text>
                  ) : null}
                </View>
                <MaterialIcons name="chevron-right" size={28} color={colors.onSurfaceSecondary} />
              </View>

              <View style={styles.flightMetrics}>
                <View>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Área</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{flight.area_covered} ha</Text>
                </View>
                <View>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Duración</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{formatDuration(flight.duration)}</Text>
                </View>
                <View>
                  <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>Clima</Text>
                  <Text style={[styles.metricValue, { color: colors.text }]}>{flight.weather || 'Sin dato'}</Text>
                </View>
              </View>

              <Text style={[styles.flightDate, { color: colors.accent }]}>{formatDate(flight.date)}</Text>
            </GlassCard>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin vuelos registrados</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Registra un vuelo para comenzar a ver rutas, cobertura y métricas operativas.
            </Text>
          </GlassCard>
        }
      />
      <Modal visible={isCreateOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Registrar vuelo</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formGrid} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Cliente</Text>
              <View style={styles.clientPicker}>
                {(clients || []).map((client) => {
                  const active = selectedClientId === client.id;
                  return (
                    <TouchableOpacity
                      key={client.id}
                      activeOpacity={0.84}
                      onPress={() => setForm((current) => ({ ...current, client_id: client.id }))}
                      style={[styles.clientChip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}
                    >
                      <Text style={[styles.clientChipText, { color: active ? '#F8FFF9' : colors.text }]}>{client.name}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <FormTextInput label="Finca / talhão" value={form.farm_name} onChangeText={(value) => setForm((current) => ({ ...current, farm_name: value }))} />
              <TouchableOpacity
                activeOpacity={0.84}
                onPress={captureGpsRoute}
                style={[styles.gpsButton, { borderColor: colors.accent, backgroundColor: colors.accentMuted }]}
              >
                <Text style={[styles.gpsButtonText, { color: colors.accent }]}>Capturar ruta GPS actual</Text>
              </TouchableOpacity>
              <FormTextInput label="Área cubierta ha" value={form.area_covered} onChangeText={(value) => setForm((current) => ({ ...current, area_covered: value }))} keyboardType="decimal-pad" />
              <FormTextInput label="Tiempo de vuelo min" value={form.duration} onChangeText={(value) => setForm((current) => ({ ...current, duration: value }))} keyboardType="decimal-pad" />
              <FormTextInput label="Dron utilizado" value={form.drone} onChangeText={(value) => setForm((current) => ({ ...current, drone: value }))} />
              <FormTextInput label="Piloto responsable" value={form.pilot} onChangeText={(value) => setForm((current) => ({ ...current, pilot: value }))} />
              {flightWeatherCoords ? (
                <WeatherConditionsPanel
                  title="Condiciones climáticas"
                  weather={flightWeatherBundle?.current}
                  spraying={flightWeatherBundle?.spraying}
                  isLoading={flightWeatherLoading}
                  errorMessage={flightWeatherError instanceof Error ? flightWeatherError.message : null}
                  compact
                />
              ) : (
                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                  Captura la ruta GPS o selecciona un cliente con coordenadas para validar el clima.
                </Text>
              )}
              <FormTextInput label="Clima" value={form.weather} onChangeText={(value) => setForm((current) => ({ ...current, weather: value }))} placeholder="Opcional · se puede autocompletar" />
              <FormTextInput label="Viento" value={form.wind} onChangeText={(value) => setForm((current) => ({ ...current, wind: value }))} />
              <FormTextInput label="Batería utilizada" value={form.battery_usage} onChangeText={(value) => setForm((current) => ({ ...current, battery_usage: value }))} />
              <FormTextInput label="Consumo" value={form.consumption} onChangeText={(value) => setForm((current) => ({ ...current, consumption: value }))} />
              <FormTextInput label="Observaciones" value={form.notes} onChangeText={(value) => setForm((current) => ({ ...current, notes: value }))} multiline />
            </ScrollView>
            <TouchableOpacity activeOpacity={0.84} disabled={createFlightMutation.isPending || !selectedClientId} onPress={handleCreateFlight} style={[styles.saveButton, { backgroundColor: colors.primary, opacity: createFlightMutation.isPending ? 0.7 : 1 }]}>
              <Text style={styles.saveButtonText}>{createFlightMutation.isPending ? 'Guardando...' : 'Guardar vuelo'}</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '700',
  },
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 14,
  },
  summaryGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  summaryCard: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  createButton: {
    minHeight: 48,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#F8FFF9',
    fontWeight: '900',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  summaryValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  flightCard: {
    gap: 18,
  },
  flightTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  flightIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  flightTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: 0,
  },
  flightClient: {
    marginTop: 4,
    fontSize: 13,
    fontWeight: '700',
  },
  flightMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  metricLabel: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  metricValue: {
    marginTop: 5,
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0,
  },
  flightDate: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  modalCard: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    maxHeight: '92%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  formGrid: {
    gap: 12,
  },
  clientPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  clientChip: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  clientChipText: {
    fontSize: 12,
    fontWeight: '900',
  },
  inputBlock: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#F8FFF9',
    fontWeight: '900',
  },
  gpsButton: {
    minHeight: 48,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gpsButtonText: {
    fontSize: 14,
    fontWeight: '900',
  },
});
