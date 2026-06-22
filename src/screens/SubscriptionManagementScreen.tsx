import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { QuickModuleBackBar } from '@components/ui/QuickModuleBackBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@theme/ThemeProvider';
import { UserUsageDetailPanel } from '@components/analytics/UserUsageDetailPanel';
import {
  activatePlanForUser,
  cancelSubscriptionForUser,
  convertSubscriptionToEnterprise,
  extendSubscriptionDays,
  listSubscriptionsForAdmin,
  type AdminSubscriptionRow,
} from '@services/subscriptionAdminService';

export function SubscriptionManagementScreen() {
  const { colors } = useTheme();
  const { hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);
  const [rows, setRows] = useState<AdminSubscriptionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);

  const loadRows = useCallback(async () => {
    const data = await listSubscriptionsForAdmin();
    setRows(data);
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await loadRows();
    } catch (error) {
      Alert.alert('Suscripciones', error instanceof Error ? error.message : 'No se pudo cargar la lista.');
    } finally {
      setRefreshing(false);
      setLoading(false);
    }
  }, [loadRows]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const runAction = async (userId: string, action: () => Promise<void>, successMessage: string) => {
    setBusyUserId(userId);
    try {
      await action();
      await loadRows();
      Alert.alert('Listo', successMessage);
    } catch (error) {
      Alert.alert('Error', error instanceof Error ? error.message : 'No se pudo completar la acción.');
    } finally {
      setBusyUserId(null);
    }
  };

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
      <FlatList
        data={rows}
        keyExtractor={(item) => item.id}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />}
        contentContainerStyle={styles.content}
        ListHeaderComponent={
          <View style={{ gap: 14, marginBottom: 8 }}>
            <QuickModuleBackBar />
            <SectionHeader title="Subscription Management" subtitle="Activación manual vía Supabase" />
          </View>
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <GlassCard>
              <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No hay suscripciones registradas.</Text>
            </GlassCard>
          )
        }
        renderItem={({ item }) => {
          const busy = busyUserId === item.user_id;
          return (
            <GlassCard style={{ gap: 10, marginBottom: 12 }}>
              <TouchableOpacity activeOpacity={0.84} onPress={() => setExpandedUserId((prev) => (prev === item.user_id ? null : item.user_id))}>
                <Text style={{ color: colors.text, fontWeight: '900' }}>{item.email || item.user_id}</Text>
                <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 4 }}>
                  Plan: {item.plan.toUpperCase()} · Estado: {item.status} · Vence: {new Date(item.expires_at).toLocaleDateString()}
                </Text>
                <Text style={{ color: colors.primary, fontSize: 11, fontWeight: '800', marginTop: 6 }}>
                  {expandedUserId === item.user_id ? 'Ocultar métricas ▲' : 'Ver métricas de uso ▼'}
                </Text>
              </TouchableOpacity>
              {expandedUserId === item.user_id ? <UserUsageDetailPanel userId={item.user_id} /> : null}
              <View style={styles.actions}>
                <ActionButton
                  label="Activar Pro"
                  colors={colors}
                  disabled={busy}
                  onPress={() => runAction(item.user_id, () => activatePlanForUser(item.user_id, 'pro'), 'Plan Pro activado por 30 días.')}
                />
                <ActionButton
                  label="+30 días"
                  colors={colors}
                  disabled={busy}
                  onPress={() => runAction(item.user_id, () => extendSubscriptionDays(item.user_id), 'Suscripción extendida 30 días.')}
                />
                <ActionButton
                  label="Enterprise"
                  colors={colors}
                  disabled={busy}
                  onPress={() =>
                    runAction(item.user_id, () => convertSubscriptionToEnterprise(item.user_id), 'Plan convertido a Enterprise.')
                  }
                />
                <ActionButton
                  label="Cancelar"
                  colors={colors}
                  danger
                  disabled={busy}
                  onPress={() => runAction(item.user_id, () => cancelSubscriptionForUser(item.user_id), 'Suscripción cancelada.')}
                />
              </View>
              {busy ? <ActivityIndicator color={colors.primary} /> : null}
            </GlassCard>
          );
        }}
      />
    </SafeAreaView>
  );
}

function ActionButton({
  label,
  onPress,
  disabled,
  colors,
  danger,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  danger?: boolean;
  colors: { primary: string; error: string; border: string; surfaceMuted: string; text: string };
}) {
  return (
    <TouchableOpacity
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.actionBtn,
        {
          borderColor: danger ? colors.error : colors.border,
          backgroundColor: danger ? colors.error + '16' : colors.surfaceMuted,
          opacity: disabled ? 0.6 : 1,
        },
      ]}
    >
      <Text style={{ color: danger ? colors.error : colors.text, fontWeight: '800', fontSize: 11 }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 120 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  actions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  actionBtn: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
});
