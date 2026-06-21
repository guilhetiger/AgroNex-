import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { QuickModuleBackBar } from '@components/ui/QuickModuleBackBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { useClients, useFlights } from '@hooks/useData';
import { useLocalization } from '@context/LocalizationContext';
import { parseRoutePolyline } from '@utils/geo';
import type { AppStackParamList } from '@navigation/types';
import type { Flight } from '../types/index';

export function GeoHistoryScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList, 'GeoHistory'>>();
  const { colors } = useTheme();
  const { formatDate } = useLocalization();
  const { data: flights } = useFlights();
  const { data: clients } = useClients();

  const sorted = [...(flights || [])].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const clientName = (id: string) => clients?.find((c) => c.id === id)?.name || 'Cliente';

  const renderItem = ({ item }: { item: Flight }) => {
    const hasRoute = !!parseRoutePolyline(item.route_coordinates);
    return (
      <TouchableOpacity activeOpacity={0.84} onPress={() => navigation.navigate('FlightDetail', { flightId: item.id })}>
        <GlassCard style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconWrap, { backgroundColor: colors.primaryMuted }]}>
              <MaterialIcons name="flight" size={22} color={colors.primary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: colors.text }]}>{item.farm_name || `Vuelo ${item.id.slice(-4)}`}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>{clientName(item.client_id)}</Text>
              <Text style={[styles.meta, { color: colors.textSecondary }]}>
                {formatDate(item.date)} · {item.area_covered} ha · {item.duration} min
              </Text>
              <View style={styles.tags}>
                <View style={[styles.tag, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
                  <Text style={[styles.tagText, { color: colors.textSecondary }]}>{hasRoute ? 'Ruta GPS' : 'Sin ruta'}</Text>
                </View>
                {item.drone ? (
                  <View style={[styles.tag, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}>
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>{item.drone}</Text>
                  </View>
                ) : null}
              </View>
            </View>
            <MaterialIcons name="chevron-right" size={26} color={colors.onSurfaceSecondary} />
          </View>
        </GlassCard>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.list, { paddingBottom: 120 }]}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 6 }}>
            <QuickModuleBackBar />
            <SectionHeader title="Historial geográfico" subtitle="Vuelos, rutas y cobertura" />
            <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '600', lineHeight: 20 }}>
              Lista cronológica de operaciones. Toca una fila para ver detalle, mapa y condiciones.
            </Text>
          </View>
        }
        renderItem={renderItem}
        ListEmptyComponent={
          <GlassCard>
            <Text style={{ color: colors.textSecondary, textAlign: 'center', fontWeight: '600' }}>No hay vuelos registrados.</Text>
          </GlassCard>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  list: { paddingHorizontal: 20, gap: 12 },
  card: { paddingVertical: 14 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontSize: 17, fontWeight: '900' },
  meta: { marginTop: 4, fontSize: 13, fontWeight: '600' },
  tags: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  tag: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4 },
  tagText: { fontSize: 11, fontWeight: '800' },
});
