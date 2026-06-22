import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { QuickModuleBackBar } from '@components/ui/QuickModuleBackBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@theme/ThemeProvider';
import { FEATURE_LABELS } from '@services/analyticsService';
import {
  fetchAnalyticsSummary,
  fetchTopFeatures,
  type AnalyticsSummary,
  type TopFeatureRow,
} from '@services/analyticsAdminService';

function MetricCard({ label, value, colors }: { label: string; value: string | number; colors: { text: string; textSecondary: string; surfaceMuted: string; borderSubtle: string } }) {
  return (
    <View
      style={{
        flexGrow: 1,
        flexBasis: '45%',
        minWidth: 140,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
        padding: 14,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '900', marginTop: 6 }}>{value}</Text>
    </View>
  );
}

export function AnalyticsDashboardScreen() {
  const { colors } = useTheme();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);
  const [summary, setSummary] = useState<AnalyticsSummary | null>(null);
  const [topFeatures, setTopFeatures] = useState<TopFeatureRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setError(null);
      const [nextSummary, nextTop] = await Promise.all([fetchAnalyticsSummary(), fetchTopFeatures()]);
      setSummary(nextSummary);
      setTopFeatures(nextTop);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudieron cargar las métricas.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  if (!isAdmin) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
        <View style={styles.center}>
          <Text style={{ color: colors.text, fontWeight: '800' }}>Solo administradores.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              void load();
            }}
            tintColor={colors.primary}
          />
        }
      >
        <QuickModuleBackBar />
        <SectionHeader title="Analytics Dashboard" subtitle="Uso real antes de restricciones premium" />

        {loading ? (
          <GlassCard>
            <ActivityIndicator color={colors.primary} />
            <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Cargando métricas...</Text>
          </GlassCard>
        ) : null}

        {error ? (
          <GlassCard>
            <Text style={{ color: colors.error, fontWeight: '800' }}>{error}</Text>
          </GlassCard>
        ) : null}

        {summary ? (
          <>
            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Actividad de usuarios</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <MetricCard label="Activos 7 días" value={summary.activeUsers7d} colors={colors} />
                <MetricCard label="Activos 30 días" value={summary.activeUsers30d} colors={colors} />
              </View>
            </GlassCard>

            <GlassCard style={{ gap: 12 }}>
              <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Totales de producto</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
                <MetricCard label="Consultas IA" value={summary.totalAiQueries} colors={colors} />
                <MetricCard label="OCR procesados" value={summary.totalOcrProcessed} colors={colors} />
                <MetricCard label="Vuelos creados" value={summary.totalFlightsCreated} colors={colors} />
                <MetricCard label="PDFs exportados" value={summary.totalPdfExports} colors={colors} />
                <MetricCard label="Clientes creados" value={summary.totalClientsCreated} colors={colors} />
              </View>
            </GlassCard>
          </>
        ) : null}

        <GlassCard style={{ gap: 10 }}>
          <Text style={{ color: colors.text, fontWeight: '900', fontSize: 16 }}>Top features</Text>
          {topFeatures.length === 0 ? (
            <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Sin eventos registrados todavía.</Text>
          ) : (
            topFeatures.map((item) => (
              <View key={item.eventType} style={[styles.rankRow, { borderColor: colors.borderSubtle }]}>
                <Text style={{ color: colors.primary, fontWeight: '900', width: 28 }}>#{item.rank}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '800' }}>
                    {FEATURE_LABELS[item.eventType] ?? item.eventType}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 2 }}>{item.total} eventos</Text>
                </View>
              </View>
            ))
          )}
        </GlassCard>

        <GlassCard style={{ gap: 8 }}>
          <Text style={{ color: colors.text, fontWeight: '900' }}>Fase 2 · límites premium</Text>
          <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
            Los límites Free/Pro/Enterprise ya se calculan con getUsageLimits(). Para activar bloqueos, usa requireSubscription() y
            compara getUserUsageSnapshot() contra esos límites con enforce: true.
          </Text>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 14 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  rankRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 8, borderBottomWidth: 1 },
});
