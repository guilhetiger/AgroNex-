import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@theme/ThemeProvider';

export function ForgotPasswordScreen() {
  const { colors } = useTheme();
  const { resetPassword } = useAuth();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setSubmitting] = useState(false);

  const handleReset = async () => {
    setError('');
    setMessage('');
    setSubmitting(true);
    try {
      await resetPassword(email);
      setMessage('Si el correo existe, recibirás instrucciones para recuperar tu acceso.');
    } catch (err: any) {
      setError(err.message || 'No se pudo enviar la recuperación.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <View style={styles.content}>
        <TouchableOpacity activeOpacity={0.84} onPress={() => navigation.goBack()} style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}>
          <MaterialIcons name="arrow-back" size={20} color={colors.text} />
          <Text style={[styles.backText, { color: colors.text }]}>Volver</Text>
        </TouchableOpacity>

        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.icon, { backgroundColor: colors.primary + '18' }]}>
            <MaterialIcons name="lock-reset" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.text }]}>Recuperar contraseña</Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Te enviaremos un enlace seguro para volver a entrar a tu cuenta.
          </Text>

          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="Correo electrónico"
            placeholderTextColor={colors.onSurfaceSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
          />

          {!!error && <Text style={[styles.feedback, { color: colors.error }]}>{error}</Text>}
          {!!message && <Text style={[styles.feedback, { color: colors.success }]}>{message}</Text>}

          <TouchableOpacity activeOpacity={0.84} disabled={isSubmitting} onPress={handleReset} style={[styles.button, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.7 : 1 }]}>
            {isSubmitting ? <ActivityIndicator color="#F8FFF9" /> : <Text style={styles.buttonText}>Enviar enlace</Text>}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { flex: 1, padding: 22, justifyContent: 'center', gap: 18 },
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backText: { fontWeight: '900' },
  card: { borderWidth: 1, borderRadius: 8, padding: 20, gap: 14 },
  icon: { width: 58, height: 58, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 30, fontWeight: '900' },
  subtitle: { fontSize: 14, lineHeight: 21, fontWeight: '700' },
  input: { minHeight: 52, borderWidth: 1, borderRadius: 8, paddingHorizontal: 14, fontWeight: '700' },
  feedback: { fontSize: 13, lineHeight: 19, fontWeight: '800' },
  button: { minHeight: 52, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  buttonText: { color: '#F8FFF9', fontWeight: '900' },
});
