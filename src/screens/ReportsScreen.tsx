import { MaterialIcons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { QuickModuleBackBar } from '@components/ui/QuickModuleBackBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { useLocalization } from '@context/LocalizationContext';
import { useAgrochemicals, useClients, useExpenses, useFlights } from '@hooks/useData';
import { buildReportCsv, buildReportHtml, shareCsvFile, sharePdfFromHtml, sharePlainMessage, type ReportExportPayload } from '@services/reportExport';

export function ReportsScreen() {
  const { colors } = useTheme();
  const { t, formatCurrency } = useLocalization();
  const { data: clients } = useClients();
  const { data: flights } = useFlights();
  const { data: expenses } = useExpenses();
  const { data: chemicals } = useAgrochemicals();

  const totalExpenses = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const totalHectares = flights?.reduce((sum, flight) => sum + flight.area_covered, 0) || 0;
  const estimatedRevenue = totalHectares * 110;
  const profit = estimatedRevenue - totalExpenses;
  const mostUsedProduct = chemicals?.sort((a, b) => b.total_used - a.total_used)[0]?.product || 'Sin datos';
  const bestClient = clients?.sort((a, b) => b.area - a.area)[0]?.name || 'Sin datos';
  const efficiency = flights?.length ? Math.round(totalHectares / flights.length) : 0;

  const handleExport = async (type: string) => {
    const payload: ReportExportPayload = {
      profitUsd: profit,
      expensesUsd: totalExpenses,
      totalHectares,
      flightCount: flights?.length || 0,
      bestClient,
      topProduct: mostUsedProduct,
      efficiencyHaPerFlight: efficiency,
      generatedAtIso: new Date().toISOString(),
    };

    try {
      if (type === 'PDF') {
        await sharePdfFromHtml(buildReportHtml(payload));
      } else if (type === 'Excel') {
        await shareCsvFile(buildReportCsv(payload));
      } else {
        const body = `${buildReportCsv(payload)}\n\nResumen: ${formatCurrency(profit)} estimado.`;
        await sharePlainMessage(`AgroNex · ${type}`, body);
      }
    } catch {
      Alert.alert('Exportar', 'No se pudo completar la exportación en este dispositivo.');
    }
  };

  const reports = [
    { icon: 'account-balance-wallet', title: 'Lucro por cliente', value: bestClient, detail: `Rentabilidad estimada total: ${formatCurrency(profit)}` },
    { icon: 'calendar-month', title: 'Gastos por mes', value: formatCurrency(totalExpenses), detail: 'Consolidado de flujo de caja operativo.' },
    { icon: 'science', title: 'Productos más usados', value: mostUsedProduct, detail: 'Basado en total usado y stock restante.' },
    { icon: 'flight', title: 'Histórico de aplicaciones', value: `${totalHectares} ha`, detail: `${flights?.length || 0} vuelos registrados.` },
    { icon: 'speed', title: 'Eficiencia operacional', value: `${efficiency} ha/vuelo`, detail: 'Promedio de cobertura por operación.' },
    { icon: 'trending-up', title: 'Rentabilidad por dron', value: formatCurrency(profit / Math.max(1, flights?.length || 1)), detail: 'Estimación por operación registrada.' },
  ] as const;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.content}>
      <QuickModuleBackBar />
      <SectionHeader title={t('reports')} subtitle="Reportes automáticos y exportables" />

      <GlassCard style={styles.hero}>
        <Text style={[styles.kicker, { color: colors.accent }]}>Resumen ejecutivo</Text>
        <Text style={[styles.heroValue, { color: profit >= 0 ? colors.success : colors.error }]}>{formatCurrency(profit)}</Text>
        <Text style={[styles.heroText, { color: colors.textSecondary }]}>
          Ganancia estimada cruzando hectáreas aplicadas, gastos operativos y actividad reciente.
        </Text>
      </GlassCard>

      {reports.map((item) => (
        <GlassCard key={item.title} style={styles.reportCard}>
          <View style={[styles.reportIcon, { backgroundColor: colors.primary + '14' }]}>
            <MaterialIcons name={item.icon} size={22} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reportTitle, { color: colors.text }]}>{item.title}</Text>
            <Text style={[styles.reportValue, { color: colors.primary }]}>{item.value}</Text>
            <Text style={[styles.reportDetail, { color: colors.textSecondary }]}>{item.detail}</Text>
          </View>
        </GlassCard>
      ))}

      <GlassCard style={styles.exportCard}>
        <Text style={[styles.reportTitle, { color: colors.text }]}>Exportar y compartir</Text>
        <View style={styles.exportRow}>
          {['PDF', 'Excel', 'WhatsApp', 'Email'].map((item) => (
            <TouchableOpacity key={item} activeOpacity={0.84} onPress={() => handleExport(item)} style={[styles.exportButton, { backgroundColor: colors.background, borderColor: colors.border }]}>
              <Text style={[styles.exportText, { color: colors.text }]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </GlassCard>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { flexGrow: 1, padding: 20, paddingBottom: 96, gap: 14 },
  hero: { gap: 8 },
  kicker: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  heroValue: { fontSize: 36, fontWeight: '900' },
  heroText: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  reportCard: { flexDirection: 'row', gap: 14, alignItems: 'center' },
  reportIcon: { width: 46, height: 46, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  reportTitle: { fontSize: 16, fontWeight: '900' },
  reportValue: { marginTop: 5, fontSize: 18, fontWeight: '900' },
  reportDetail: { marginTop: 4, fontSize: 13, lineHeight: 19, fontWeight: '700' },
  exportCard: { gap: 14 },
  exportRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  exportButton: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 12 },
  exportText: { fontWeight: '900' },
});
