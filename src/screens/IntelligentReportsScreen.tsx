import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { QuickModuleBackBar } from '@components/ui/QuickModuleBackBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useAiReports } from '@hooks/useAiReports';
import { useTheme } from '@theme/ThemeProvider';
import type { AiReportType } from '@services/aiPlatformTypes';

const REPORT_TYPES: Array<{ type: AiReportType; label: string; emoji: string }> = [
  { type: 'expenses', label: 'PDF Gastos', emoji: '💸' },
  { type: 'flights', label: 'PDF Vuelos', emoji: '✈️' },
  { type: 'clients', label: 'PDF Clientes', emoji: '🌾' },
  { type: 'executive', label: 'Resumen ejecutivo', emoji: '📊' },
];

export function IntelligentReportsScreen() {
  const { colors } = useTheme();
  const reports = useAiReports();

  const handleGenerate = async (reportType: AiReportType) => {
    try {
      const report = await reports.generateReport.mutateAsync(reportType);
      await reports.downloadReportPdf.mutateAsync({ reportId: report.id, filename: `agronex-${reportType}.pdf` });
    } catch (error) {
      console.warn('Report error', error);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <QuickModuleBackBar />
        <SectionHeader title="Reportes IA" subtitle="Generación automática y exportación PDF" />

        <View style={{ gap: 10 }}>
          {REPORT_TYPES.map((item) => (
            <TouchableOpacity
              key={item.type}
              activeOpacity={0.84}
              disabled={reports.generateReport.isPending || reports.downloadReportPdf.isPending}
              onPress={() => handleGenerate(item.type)}
            >
              <GlassCard style={styles.cardRow}>
                <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '900' }}>{item.label}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                    Genera resumen AI + métricas + PDF exportable
                  </Text>
                </View>
                {(reports.generateReport.isPending || reports.downloadReportPdf.isPending) && <ActivityIndicator color={colors.primary} />}
              </GlassCard>
            </TouchableOpacity>
          ))}
        </View>

        <GlassCard style={{ gap: 10, marginTop: 8 }}>
          <Text style={{ color: colors.text, fontWeight: '900' }}>Historial reciente</Text>
          {reports.isLoading ? <ActivityIndicator color={colors.primary} /> : null}
          {(reports.data || []).slice(0, 8).map((report) => (
            <View key={report.id} style={styles.historyRow}>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>{report.title}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }} numberOfLines={2}>
                  {report.summary}
                </Text>
              </View>
              <TouchableOpacity onPress={() => reports.downloadReportPdf.mutate({ reportId: report.id })}>
                <Text style={{ color: colors.primary, fontWeight: '900' }}>PDF</Text>
              </TouchableOpacity>
            </View>
          ))}
          {!reports.isLoading && !reports.data?.length ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Aún no hay reportes generados.</Text>
          ) : null}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  historyRow: { flexDirection: 'row', gap: 12, alignItems: 'flex-start' },
});
