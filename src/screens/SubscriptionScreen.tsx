import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { contactSupport, SUPPORT_EMAIL } from '@components/subscription/SubscriptionSummaryCard';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@theme/ThemeProvider';

export function SubscriptionScreen() {
  const { colors } = useTheme();
  const { access, refreshAccess, signOut } = useAuth();

  const handleRenew = async () => {
    try {
      await contactSupport('Renovación de suscripción AgroNex');
    } catch {
      Alert.alert('Renovar suscripción', `Escríbenos a ${SUPPORT_EMAIL} para activar tu plan.`);
    }
  };

  const handleSupport = async () => {
    try {
      await contactSupport('Soporte AgroNex');
    } catch {
      Alert.alert('Contactar soporte', `Escríbenos a ${SUPPORT_EMAIL}`);
    }
  };

  const handleRefresh = async () => {
    await refreshAccess();
    Alert.alert('Estado actualizado', 'Revisa tu acceso nuevamente.');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Acceso expirado</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {access?.message || 'Tu prueba gratuita o suscripción finalizó.'}
        </Text>
        {access?.plan ? (
          <Text style={[styles.meta, { color: colors.textSecondary }]}>
            Plan: {access.plan.toUpperCase()} · Estado: {access.status}
          </Text>
        ) : null}

        <TouchableOpacity activeOpacity={0.84} onPress={handleRenew} style={[styles.primary, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryText}>Renovar suscripción</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.84} onPress={handleSupport} style={[styles.secondary, { borderColor: colors.border }]}>
          <Text style={[styles.secondaryText, { color: colors.text }]}>Contactar soporte</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.84} onPress={handleRefresh} style={[styles.secondary, { borderColor: colors.border }]}>
          <Text style={[styles.secondaryText, { color: colors.primary }]}>Verificar estado</Text>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.84} onPress={signOut} style={[styles.secondary, { borderColor: colors.border }]}>
          <Text style={[styles.secondaryText, { color: colors.text }]}>Cerrar sesión</Text>
        </TouchableOpacity>

        <Text style={[styles.footer, { color: colors.textSecondary }]}>
          Las renovaciones se gestionan manualmente por el equipo AgroNex mientras preparamos pagos automáticos.
        </Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 14, padding: 22, gap: 14 },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  meta: { fontSize: 13, fontWeight: '700', textAlign: 'center' },
  primary: { minHeight: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#F8FFF9', fontWeight: '900' },
  secondary: { minHeight: 48, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontWeight: '900' },
  footer: { fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 4 },
});
