import { View, ActivityIndicator, Text, TouchableOpacity } from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { GlassCard } from '@components/ui/GlassCard';
import { MetricBadge } from '@components/ui/MetricBadge';
import { ResponsiveLineChart } from '@components/ui/ResponsiveLineChart';
import { SectionHeader } from '@components/ui/SectionHeader';
import { TabScreenScroll } from '@components/ui/TabScreenScroll';
import { AiDashboardWidgets } from '@components/ai/AiDashboardWidgets';
import { useTheme } from '@theme/ThemeProvider';
import { useClients, useFlights, useFarms, useExpenses } from '@hooks/useData';
import { useLocalization } from '@context/LocalizationContext';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSync } from '@context/SyncContext';
import { useAI } from '@hooks/useAI';
import type { AppStackParamList } from '@navigation/types';
import { getAppliedHectares, getExpensesUsd, getPipelineHectares, getProfitUsd, getRevenueUsd } from '@services/financial';

type QuickActionRoute = 'Reports' | 'Agrochemicals' | 'Expenses' | 'AgroChat' | 'IntelligentReports' | 'OcrExpense';

export function DashboardScreen() {
  const { colors, radii } = useTheme();
  const { formatCurrency, convertFromUsd, t, country, formatDate } = useLocalization();
  const { isSyncing, lastSyncedAt } = useSync();
  const navigation = useNavigation<NativeStackNavigationProp<AppStackParamList>>();
  const { data: clients, isLoading: clientsLoading } = useClients();
  const { data: flights, isLoading: flightsLoading } = useFlights();
  const { data: farms, isLoading: farmsLoading } = useFarms();
  const { data: expenses, isLoading: expensesLoading } = useExpenses();

  const isLoading = clientsLoading || flightsLoading || farmsLoading || expensesLoading;
  const totalHectares = getPipelineHectares(clients || []);
  const totalFlights = flights?.length || 0;
  const totalClients = clients?.length || 0;
  const totalFarms = farms?.length || 0;
  const totalFlightHa = getAppliedHectares(flights || []);
  const estimatedRevenue = getRevenueUsd(totalFlightHa);
  const estimatedCosts = getExpensesUsd(expenses || []);
  const netProfit = getProfitUsd(estimatedRevenue, estimatedCosts);

  const aiInsights = useAI(null, flights || [], expenses || [], country);

  const chartData = {
    labels: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
    datasets: [
      {
        data: [0.65, 0.72, 0.8, 0.9, 0.95, 1].map((factor) => convertFromUsd(estimatedRevenue * factor)),
      },
    ],
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Cargando dashboard...</Text>
      </View>
    );
  }

  return (
    <TabScreenScroll horizontalPadding={24} gap={18}>
      <Animated.View entering={FadeInDown.duration(420).delay(40)}>
        <SectionHeader title={t('dashboard')} subtitle="Visión general de cada operación" />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(80)}>
        <GlassCard>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <MetricBadge label={t('totalHectares')} value={`${totalHectares.toFixed(0)} ha`} />
            <MetricBadge label={t('monthlyRevenue')} value={formatCurrency(estimatedRevenue)} />
            <MetricBadge label={t('totalExpenses')} value={formatCurrency(estimatedCosts)} />
            <MetricBadge label={t('netProfit')} value={formatCurrency(netProfit)} />
          </View>
          <View style={{ marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: colors.borderSubtle, gap: 6 }}>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '800' }}>Sincronización</Text>
            <Text style={{ color: colors.text, fontSize: 13, fontWeight: '700' }}>
              {isSyncing ? 'Sincronizando con la nube…' : 'Listo · '}
              {!isSyncing && (lastSyncedAt ? formatDate(lastSyncedAt) : 'Sin registro previo')}
            </Text>
            <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
              Cobertura de vuelos: {totalFlightHa.toFixed(0)} ha · {totalFlights} operaciones
            </Text>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(120)}>
        <GlassCard>
          <Text style={{ color: colors.textSecondary, marginBottom: 16, fontWeight: '800' }}>Tendencia de facturación</Text>
          <ResponsiveLineChart
            data={chartData}
            height={210}
            chartConfig={{
              backgroundGradientFrom: colors.surfaceMuted,
              backgroundGradientTo: colors.surfaceMuted,
              decimalPlaces: 0,
              color: () => colors.primary,
              labelColor: () => colors.onSurfaceSecondary,
              propsForDots: { r: '5', fill: colors.primary },
            }}
            bezier
            style={{ borderRadius: radii.lg }}
          />
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(160)}>
        <GlassCard>
          <Text style={{ color: colors.primary, marginBottom: 16, fontSize: 18, fontWeight: '800' }}>Asistente IA</Text>
          <View style={{ gap: 14 }}>
            <View
              style={{
                backgroundColor: colors.accentMuted,
                borderRadius: radii.lg,
                padding: 18,
                borderLeftWidth: 4,
                borderLeftColor: colors.accent,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>
                Eficiencia operativa: {aiInsights.insights.efficiencyScore}/100
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{aiInsights.insights.quickTips[0]}</Text>
              <Text style={{ color: colors.textSecondary, marginTop: 10, fontSize: 13, lineHeight: 20 }}>{aiInsights.insights.quickTips[1]}</Text>
            </View>

            <View
              style={{
                backgroundColor: colors.surfaceMuted,
                borderRadius: radii.lg,
                padding: 18,
                borderWidth: 1,
                borderColor: colors.borderSubtle,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 8, fontSize: 13 }}>Proyección financiera</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20 }}>{aiInsights.insights.financialOutlook}</Text>
            </View>

            {aiInsights.insights.riskAlerts.length > 0 && (
              <View
                style={{
                  backgroundColor: colors.error + '14',
                  borderRadius: radii.lg,
                  padding: 18,
                  borderLeftWidth: 4,
                  borderLeftColor: colors.error,
                }}
              >
                <Text style={{ color: colors.error, fontWeight: '700', marginBottom: 10, fontSize: 14 }}>Alertas</Text>
                {aiInsights.insights.riskAlerts.map((alert, index) => (
                  <Text
                    key={index}
                    style={{ color: colors.error, fontSize: 13, marginBottom: index < aiInsights.insights.riskAlerts.length - 1 ? 6 : 0 }}
                  >
                    • {alert}
                  </Text>
                ))}
              </View>
            )}

            <View
              style={{
                backgroundColor: colors.primaryMuted,
                borderRadius: radii.lg,
                padding: 18,
                borderLeftWidth: 4,
                borderLeftColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.text, fontWeight: '700', marginBottom: 8, fontSize: 14 }}>Precio recomendado</Text>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12 }}>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Por hectárea</Text>
                  <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 20, marginTop: 4 }}>
                    {formatCurrency(aiInsights.price?.suggestedPricePerHectare || 0)}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 6, lineHeight: 16 }}>
                    {aiInsights.price?.explanation}
                  </Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 4 }}>
                    Costo estimado/ha: {formatCurrency(aiInsights.price?.estimatedCostPerHectare || 0)}
                  </Text>
                </View>
                <View
                  style={{
                    backgroundColor: colors.primary + '22',
                    paddingHorizontal: 12,
                    paddingVertical: 8,
                    borderRadius: radii.md,
                    flexShrink: 0,
                  }}
                >
                  <Text style={{ color: colors.primary, fontWeight: '700' }}>+{aiInsights.price?.margin || 0}%</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11 }}>margen</Text>
                </View>
              </View>
            </View>
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(180)}>
        <AiDashboardWidgets />
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(200)}>
        <GlassCard>
          <Text style={{ color: colors.text, marginBottom: 14, fontSize: 16, fontWeight: '800' }}>Accesos rápidos</Text>
          <View style={{ gap: 12 }}>
            {([
              { title: 'Reportes automáticos', screen: 'Reports', emoji: '📈' },
              { title: 'AgroChat inteligente', screen: 'AgroChat', emoji: '🤖' },
              { title: 'Reportes IA avanzados', screen: 'IntelligentReports', emoji: '🧠' },
              { title: 'OCR de gastos', screen: 'OcrExpense', emoji: '🧾' },
              { title: 'Inventario de agroquímicos', screen: 'Agrochemicals', emoji: '🧪' },
              { title: 'Control de gastos', screen: 'Expenses', emoji: '💸' },
            ] satisfies Array<{ title: string; screen: QuickActionRoute; emoji: string }>).map((item) => (
              <TouchableOpacity
                key={item.title}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
                style={{
                  backgroundColor: colors.surfaceMuted,
                  borderRadius: radii.lg,
                  padding: 16,
                  borderWidth: 1,
                  borderColor: colors.border,
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                  <View style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                    <Text style={{ fontSize: 12, marginBottom: 4 }}>{item.emoji}</Text>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 14 }}>{item.title}</Text>
                    <Text style={{ color: colors.textSecondary, marginTop: 4, fontSize: 12 }}>Módulo completo</Text>
                  </View>
                  <Text style={{ color: colors.primary, fontSize: 18 }}>→</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>
      </Animated.View>

      <Animated.View entering={FadeInDown.duration(420).delay(240)}>
        <GlassCard>
          <Text style={{ color: colors.textSecondary, marginBottom: 12, fontWeight: '800' }}>Métricas operativas</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
            <View
              style={{
                flexGrow: 1,
                flexBasis: '45%',
                minWidth: 0,
                backgroundColor: colors.surfaceMuted,
                borderRadius: radii.md,
                padding: 14,
                borderLeftWidth: 3,
                borderLeftColor: colors.primary,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Clientes activos</Text>
              <Text style={{ color: colors.primary, fontSize: 28, fontWeight: '800', marginTop: 6 }}>{totalClients}</Text>
            </View>
            <View
              style={{
                flexGrow: 1,
                flexBasis: '45%',
                minWidth: 0,
                backgroundColor: colors.surfaceMuted,
                borderRadius: radii.md,
                padding: 14,
                borderLeftWidth: 3,
                borderLeftColor: colors.accent,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Fincas gestionadas</Text>
              <Text style={{ color: colors.accent, fontSize: 28, fontWeight: '800', marginTop: 6 }}>{totalFarms}</Text>
            </View>
            <View
              style={{
                flexGrow: 1,
                flexBasis: '45%',
                minWidth: 0,
                backgroundColor: colors.surfaceMuted,
                borderRadius: radii.md,
                padding: 14,
                borderLeftWidth: 3,
                borderLeftColor: colors.success,
              }}
            >
              <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Vuelos registrados</Text>
              <Text style={{ color: colors.success, fontSize: 28, fontWeight: '800', marginTop: 6 }}>{totalFlights}</Text>
            </View>
          </View>
        </GlassCard>
      </Animated.View>
    </TabScreenScroll>
  );
}
