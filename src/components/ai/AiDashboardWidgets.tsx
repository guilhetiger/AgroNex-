import { ActivityIndicator, Text, TouchableOpacity, View } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { GlassCard } from '@components/ui/GlassCard';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useAiDashboard } from '@hooks/useAiDashboard';
import { AiAlertCard } from './AiAlertCard';

function WidgetBox({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={{ minWidth: '45%', flexGrow: 1 }}>
      <Text style={{ color: '#94A3B8', fontSize: 11, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color, fontWeight: '900', fontSize: 20, marginTop: 4 }}>{value}</Text>
    </View>
  );
}

export function AiDashboardWidgets() {
  const { colors } = useTheme();
  const dashboard = useAiDashboard();

  if (dashboard.isLoading) {
    return (
      <GlassCard>
        <ActivityIndicator color={colors.primary} />
        <Text style={{ color: colors.textSecondary, marginTop: 10 }}>Cargando widgets AI...</Text>
      </GlassCard>
    );
  }

  if (dashboard.isError || !dashboard.data) {
    return (
      <GlassCard>
        <Text style={{ color: colors.error, fontWeight: '800' }}>Plataforma AI no disponible</Text>
        <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6 }}>
          Configura EXPO_PUBLIC_AI_API_URL y ejecuta el backend Next.js.
        </Text>
      </GlassCard>
    );
  }

  const { widgets, alerts, predictions, recommendations } = dashboard.data;

  return (
    <View style={{ gap: 14 }}>
      <SectionHeader title="Dashboard IA" subtitle="Métricas, alertas y predicciones" />
      <GlassCard style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
          <WidgetBox label="Gasto mensual (USD)" value={`$${widgets.monthlyExpenseUsd.toFixed(0)}`} color={colors.warning} />
          <WidgetBox label="Total vuelos" value={`${widgets.totalFlights}`} color={colors.primary} />
          <WidgetBox label="Clientes activos" value={`${widgets.activeClients}`} color={colors.success} />
          <WidgetBox label="Vuelos trimestre" value={`${widgets.quarterFlights}`} color={colors.accent} />
        </View>
        {widgets.topAgrochemical ? (
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>
            Agroquímico más usado: <Text style={{ color: colors.text, fontWeight: '800' }}>{widgets.topAgrochemical}</Text>
          </Text>
        ) : null}
      </GlassCard>

      <GlassCard style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontWeight: '900' }}>Alertas IA</Text>
        {(alerts.length ? alerts : dashboard.data.liveAnomalies).slice(0, 4).map((alert, index) => (
          <AiAlertCard
            key={'id' in alert ? alert.id : `live-${index}`}
            title={'title' in alert ? alert.title : String(alert.title ?? 'Alerta')}
            description={'description' in alert ? alert.description : String(alert.description ?? '')}
            severity={'severity' in alert ? alert.severity : 'medium'}
          />
        ))}
        {!alerts.length && !dashboard.data.liveAnomalies.length ? (
          <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Sin alertas detectadas.</Text>
        ) : null}
        <TouchableOpacity
          onPress={() => dashboard.refreshAnomalies.mutate()}
          disabled={dashboard.refreshAnomalies.isPending}
          style={{ alignSelf: 'flex-start', paddingVertical: 8 }}
        >
          <Text style={{ color: colors.primary, fontWeight: '800' }}>
            {dashboard.refreshAnomalies.isPending ? 'Analizando...' : 'Actualizar anomalias'}
          </Text>
        </TouchableOpacity>
      </GlassCard>

      <GlassCard style={{ gap: 8 }}>
        <Text style={{ color: colors.text, fontWeight: '900' }}>Predicciones</Text>
        {predictions.slice(0, 3).map((item, index) => (
          <Text key={item.id ?? index} style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>
            • {item.prediction_type}: {item.predicted_value} ({Math.round(item.confidence * 100)}% conf.) — {item.rationale}
          </Text>
        ))}
        {!predictions.length ? <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Sin predicciones aún.</Text> : null}
        <TouchableOpacity onPress={() => dashboard.refreshPredictions.mutate()} disabled={dashboard.refreshPredictions.isPending}>
          <Text style={{ color: colors.accent, fontWeight: '800' }}>
            {dashboard.refreshPredictions.isPending ? 'Calculando...' : 'Recalcular predicciones'}
          </Text>
        </TouchableOpacity>
      </GlassCard>

      {recommendations.length > 0 ? (
        <GlassCard style={{ gap: 6 }}>
          <Text style={{ color: colors.text, fontWeight: '900' }}>Recomendaciones</Text>
          {recommendations.map((tip) => (
            <Text key={tip} style={{ color: colors.textSecondary, fontSize: 12 }}>
              • {tip}
            </Text>
          ))}
        </GlassCard>
      ) : null}
    </View>
  );
}
