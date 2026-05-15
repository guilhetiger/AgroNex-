import { MaterialIcons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { ActivityIndicator, Alert, DimensionValue, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { useTheme } from '@theme/ThemeProvider';
import { useClients, useDeleteClient, useExpenses, useFlights } from '@hooks/useData';
import { parseFieldPolygon } from '@utils/geo';
import { useLocalization } from '@context/LocalizationContext';
import { useAI } from '@hooks/useAI';

type ClientDetailRoute = RouteProp<Record<string, { clientId: string }>, string>;

export function ClientDetailScreen() {
  const route = useRoute<ClientDetailRoute>();
  const navigation = useNavigation<any>();
  const { colors } = useTheme();
  const { country, formatCurrency, formatDate } = useLocalization();
  const { data: clients, isLoading } = useClients();
  const { data: flights } = useFlights();
  const { data: expenses } = useExpenses();
  const deleteClientMutation = useDeleteClient();
  const client = clients?.find((item) => item.id === route.params.clientId);

  const clientFlights = flights?.filter((flight) => flight.client_id === client?.id) || [];
  const clientExpenses = expenses || [];
  const aiAnalysis = useAI(client || null, clientFlights, clientExpenses, country);

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.navigate('MainTab' as never);
  };

  const confirmDelete = () => {
    if (!client) return;
    Alert.alert('Eliminar cliente', `¿Seguro que quieres eliminar ${client.name}? Esta acción quitará el cliente de la cartera.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: async () => {
          await deleteClientMutation.mutateAsync(client.id);
          goBack();
        },
      },
    ]);
  };

  if (isLoading || !clients) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  if (!client) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.notFound}>
          <TouchableOpacity activeOpacity={0.84} onPress={goBack} style={[styles.backButton, { borderColor: colors.border }]}>
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.backButtonText, { color: colors.text }]}>Volver</Text>
          </TouchableOpacity>
          <Text style={{ color: colors.text, textAlign: 'center' }}>Cliente no encontrado.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const mapsUrl =
    client.latitude != null && client.longitude != null
      ? `https://www.google.com/maps/search/?api=1&query=${client.latitude},${client.longitude}`
      : null;
  const fieldPolygon = parseFieldPolygon(client.field_polygon);
  const score = aiAnalysis.clientScore?.score || 0;
  const category = aiAnalysis.clientScore?.category || 'average';
  const categoryColor = category === 'good' ? colors.success : category === 'average' ? colors.warning : colors.error;
  const categoryText = category === 'good' ? 'Excelente' : category === 'average' ? 'En observación' : 'Riesgo';
  const breakdown = aiAnalysis.clientScore?.breakdown;

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topBar}>
          <TouchableOpacity activeOpacity={0.84} onPress={goBack} style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
            <MaterialIcons name="arrow-back" size={20} color={colors.text} />
            <Text style={[styles.backButtonText, { color: colors.text }]}>Volver</Text>
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.84} onPress={confirmDelete} style={[styles.deleteDetailButton, { backgroundColor: colors.error + '14', borderColor: colors.error + '35' }]}>
            <MaterialIcons name="delete-outline" size={20} color={colors.error} />
            <Text style={[styles.deleteDetailText, { color: colors.error }]}>Eliminar</Text>
          </TouchableOpacity>
        </View>

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary + '18' }]}>
            <MaterialIcons name="business" size={30} color={colors.primary} />
          </View>
          <Text style={[styles.heroLabel, { color: colors.accent }]}>Perfil de cliente</Text>
          <Text style={[styles.heroTitle, { color: colors.text }]}>{client.name}</Text>
          <Text style={[styles.heroSubtitle, { color: colors.textSecondary }]}>{client.crop} en {client.location}</Text>
        </View>

        <GlassCard style={styles.scoreCard}>
          <View style={styles.scoreHeader}>
            <View>
              <Text style={[styles.sectionKicker, { color: colors.accent }]}>Puntuación IA</Text>
              <Text style={[styles.scoreNumber, { color: categoryColor }]}>{score}</Text>
            </View>
            <View style={[styles.statusPill, { borderColor: categoryColor + '40', backgroundColor: categoryColor + '16' }]}>
              <Text style={[styles.statusText, { color: categoryColor }]}>{categoryText}</Text>
            </View>
          </View>
          <Text style={[styles.scoreSummary, { color: colors.textSecondary }]}>
            Esta nota combina actividad, salud financiera y confiabilidad operativa. Es el mismo score que ves en la lista de clientes.
          </Text>
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Desglose de la puntuación</Text>
          <ScoreBar label="Actividad" value={breakdown?.activity || 0} color={colors.primary} />
          <ScoreBar label="Finanzas" value={breakdown?.financial || 0} color={colors.accent} />
          <ScoreBar label="Confiabilidad" value={breakdown?.reliability || 0} color={colors.warning} />
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Por qué obtuvo esa nota</Text>
          {(aiAnalysis.clientScore?.reasons || []).map((reason) => (
            <View key={reason} style={styles.reasonRow}>
              <MaterialIcons name="check-circle" size={18} color={colors.primary} />
              <Text style={[styles.reasonText, { color: colors.textSecondary }]}>{reason}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ubicación GPS</Text>
          {mapsUrl ? (
            <TouchableOpacity onPress={() => Linking.openURL(mapsUrl)} activeOpacity={0.84}>
              <Text style={{ color: colors.accent, fontWeight: '900', marginBottom: 8 }}>Abrir en Google Maps →</Text>
              <Text style={[styles.aiText, { color: colors.textSecondary }]}>
                {client.latitude?.toFixed(5)}, {client.longitude?.toFixed(5)}
              </Text>
            </TouchableOpacity>
          ) : (
            <Text style={[styles.aiText, { color: colors.textSecondary }]}>Sin coordenadas. Añádelas al editar el cliente.</Text>
          )}
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Polígono del lote</Text>
          <Text style={[styles.aiText, { color: colors.textSecondary, marginBottom: 8 }]}> 
            {fieldPolygon
              ? `${fieldPolygon.length} puntos detectados en el polígono.`
              : client.field_polygon
                ? 'Formato inválido o incompleto. Debe ser JSON de coordenadas con latitude y longitude.'
                : 'Aún no se ha definido el polígono del lote.'}
          </Text>
          {fieldPolygon ? (
            <Text style={[styles.aiText, { color: colors.textSecondary }]}>Primer punto: {fieldPolygon[0].latitude.toFixed(5)}, {fieldPolygon[0].longitude.toFixed(5)}</Text>
          ) : null}
          {client.field_polygon ? (
            <Text style={[styles.infoValue, { color: colors.textSecondary, marginTop: 8, fontSize: 12 }]}>Guardado como JSON: {client.field_polygon.length > 120 ? `${client.field_polygon.slice(0, 120)}…` : client.field_polygon}</Text>
          ) : null}
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Recomendación comercial</Text>
          <View style={[styles.aiPanel, { backgroundColor: colors.primary + '10', borderColor: colors.primary + '25' }]}>
            <Text style={[styles.aiLabel, { color: colors.primary }]}>Siguiente acción</Text>
            <Text style={[styles.aiText, { color: colors.textSecondary }]}>
              {aiAnalysis.clientScore?.recommendation || 'Mantener seguimiento operativo y actualizar actividad del cliente.'}
            </Text>
          </View>
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Tarifa sugerida</Text>
          <View style={[styles.pricePanel, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '25' }]}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.aiLabel, { color: colors.accent }]}>Por hectárea</Text>
              <Text style={[styles.priceValue, { color: colors.text }]}>
                {formatCurrency(aiAnalysis.price?.suggestedPricePerHectare || 0)}
              </Text>
              <Text style={[styles.priceExplanation, { color: colors.textSecondary }]}>{aiAnalysis.price?.explanation}</Text>
            </View>
            <View style={[styles.marginBadge, { backgroundColor: colors.accent + '18' }]}>
              <Text style={[styles.marginValue, { color: colors.accent }]}>+{aiAnalysis.price?.margin || 0}%</Text>
              <Text style={[styles.marginLabel, { color: colors.textSecondary }]}>margen</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Historial</Text>
          <InfoRow icon="flight" label="Vuelos registrados" value={`${clientFlights.length}`} />
          <InfoRow icon="event" label="Último servicio" value={formatDate(clientFlights[0]?.date || new Date().toISOString())} />
          <InfoRow icon="payments" label="Rentabilidad estimada" value={formatCurrency((client.area || 0) * 55)} />
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );

  function InfoRow({ icon, label, value }: { icon: keyof typeof MaterialIcons.glyphMap; label: string; value: string }) {
    return (
      <View style={styles.infoRow}>
        <View style={[styles.infoIcon, { backgroundColor: colors.primary + '12' }]}>
          <MaterialIcons name={icon} size={18} color={colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.infoLabel, { color: colors.textSecondary }]}>{label}</Text>
          <Text style={[styles.infoValue, { color: colors.text }]}>{value}</Text>
        </View>
      </View>
    );
  }

  function ScoreBar({ label, value, color }: { label: string; value: number; color: string }) {
    const width = `${Math.max(0, Math.min(100, value))}%` as DimensionValue;
    return (
      <View style={styles.scoreBarBlock}>
        <View style={styles.scoreBarHeader}>
          <Text style={[styles.scoreBarLabel, { color: colors.text }]}>{label}</Text>
          <Text style={[styles.scoreBarValue, { color }]}>{value}/100</Text>
        </View>
        <View style={[styles.scoreTrack, { backgroundColor: colors.background }]}>
          <View style={[styles.scoreFill, { backgroundColor: color, width }]} />
        </View>
      </View>
    );
  }
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
  notFound: {
    flex: 1,
    padding: 20,
    gap: 24,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    paddingBottom: 96,
    gap: 14,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  backButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  deleteDetailButton: {
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteDetailText: {
    fontSize: 14,
    fontWeight: '900',
  },
  hero: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 22,
  },
  avatar: {
    width: 58,
    height: 58,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  heroLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  heroTitle: {
    marginTop: 8,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroSubtitle: {
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '700',
  },
  scoreCard: {
    gap: 12,
  },
  scoreHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 14,
    alignItems: 'flex-start',
  },
  sectionKicker: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  scoreNumber: {
    marginTop: 4,
    fontSize: 52,
    fontWeight: '900',
    letterSpacing: 0,
  },
  scoreSummary: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '700',
  },
  statusPill: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0,
    textTransform: 'uppercase',
  },
  sectionCard: {
    gap: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  scoreBarBlock: {
    gap: 8,
  },
  scoreBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  scoreBarLabel: {
    fontSize: 13,
    fontWeight: '900',
  },
  scoreBarValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  scoreTrack: {
    height: 9,
    borderRadius: 8,
    overflow: 'hidden',
  },
  scoreFill: {
    height: '100%',
    borderRadius: 8,
  },
  reasonRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  reasonText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  infoIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  infoValue: {
    marginTop: 3,
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0,
  },
  aiPanel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
  },
  aiLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  aiText: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    fontWeight: '600',
  },
  pricePanel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  priceValue: {
    marginTop: 8,
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  priceExplanation: {
    marginTop: 8,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: '700',
  },
  marginBadge: {
    minWidth: 74,
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  marginValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 0,
  },
  marginLabel: {
    marginTop: 2,
    fontSize: 11,
    fontWeight: '800',
  },
});
