import { ActivityIndicator, Text, View } from 'react-native';
import { useEffect, useState } from 'react';
import { useTheme } from '@theme/ThemeProvider';
import { fetchUserUsageStats, type AdminUserUsageStats } from '@services/analyticsAdminService';

export function UserUsageDetailPanel({ userId }: { userId: string }) {
  const { colors } = useTheme();
  const [stats, setStats] = useState<AdminUserUsageStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    fetchUserUsageStats(userId)
      .then((data) => {
        if (!cancelled) setStats(data);
      })
      .catch(() => {
        if (!cancelled) setStats(null);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  if (loading) {
    return <ActivityIndicator color={colors.primary} style={{ marginTop: 8 }} />;
  }

  if (!stats) {
    return (
      <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 8 }}>
        No se pudieron cargar métricas de uso.
      </Text>
    );
  }

  return (
    <View
      style={{
        marginTop: 10,
        padding: 12,
        borderRadius: 10,
        backgroundColor: colors.surfaceMuted,
        gap: 4,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '900' }}>MÉTRICAS DE USO</Text>
      <Text style={{ color: colors.text, fontSize: 12 }}>Consultas IA: {stats.ai_queries}</Text>
      <Text style={{ color: colors.text, fontSize: 12 }}>OCR utilizados: {stats.ocr_used}</Text>
      <Text style={{ color: colors.text, fontSize: 12 }}>Reportes generados: {stats.reports_generated}</Text>
      <Text style={{ color: colors.text, fontSize: 12 }}>Vuelos creados: {stats.flights_created}</Text>
      <Text style={{ color: colors.text, fontSize: 12 }}>
        Último acceso: {stats.last_access ? new Date(stats.last_access).toLocaleString() : 'Sin actividad'}
      </Text>
    </View>
  );
}
