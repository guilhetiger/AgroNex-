import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@theme/ThemeProvider';

export function SubscriptionScreen() {
  const { colors } = useTheme();
  const { access, activateSubscription, signOut } = useAuth();

  const handleActivate = async () => {
    await activateSubscription();
    Alert.alert('Suscripción activa', 'Se activó la suscripción mensual para esta cuenta.');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>Acceso bloqueado</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {access?.message || 'Tu prueba gratuita o suscripción mensual terminó.'}
        </Text>
        <TouchableOpacity activeOpacity={0.84} onPress={handleActivate} style={[styles.primary, { backgroundColor: colors.primary }]}>
          <Text style={styles.primaryText}>Activar suscripción mensual</Text>
        </TouchableOpacity>
        <TouchableOpacity activeOpacity={0.84} onPress={signOut} style={[styles.secondary, { borderColor: colors.border }]}>
          <Text style={[styles.secondaryText, { color: colors.text }]}>Cambiar cuenta</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, justifyContent: 'center', padding: 24 },
  card: { borderWidth: 1, borderRadius: 14, padding: 22, gap: 16 },
  title: { fontSize: 24, fontWeight: '900', textAlign: 'center' },
  body: { fontSize: 15, lineHeight: 22, fontWeight: '700', textAlign: 'center' },
  primary: { minHeight: 50, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  primaryText: { color: '#F8FFF9', fontWeight: '900' },
  secondary: { minHeight: 48, borderWidth: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  secondaryText: { fontWeight: '900' },
});
