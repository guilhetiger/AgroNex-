import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@theme/ThemeProvider';

export function SignInScreen() {
  const { colors } = useTheme();
  const { signIn } = useAuth();
  const navigation = useNavigation<any>();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSignIn = async () => {
    setFormError('');
    setIsSubmitting(true);
    try {
      await signIn(email, password);
    } catch (error: any) {
      setFormError(error.message || 'No se pudo iniciar sesión. Revisa tus datos.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.keyboard}>
        <View style={styles.content}>
          <View style={styles.brandBlock}>
            <View style={[styles.brandIcon, { backgroundColor: colors.primary + '18' }]}>
              <MaterialIcons name="flight-takeoff" size={30} color={colors.primary} />
            </View>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>AgroNex Pro</Text>
            <Text style={[styles.title, { color: colors.text }]}>Inicia sesión</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Controla clientes, vuelos, costos y reportes con una experiencia de operación premium.
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.fieldWrapper}>
              <FieldIcon name="mail" />
              <TextInput
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  if (formError) setFormError('');
                }}
                placeholder="Correo electrónico"
                placeholderTextColor={colors.onSurfaceSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textContentType="emailAddress"
              />
            </View>

            <View style={styles.fieldWrapper}>
              <FieldIcon name="lock" />
              <TextInput
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  if (formError) setFormError('');
                }}
                placeholder="Contraseña"
                placeholderTextColor={colors.onSurfaceSecondary}
                secureTextEntry={!showPassword}
                style={[styles.input, styles.passwordInput, { color: colors.text, borderColor: colors.border }]}
                textContentType="password"
              />
              <TouchableOpacity
                activeOpacity={0.84}
                onPress={() => setShowPassword((value) => !value)}
                style={styles.eyeButton}
              >
                <MaterialIcons name={showPassword ? 'visibility-off' : 'visibility'} size={20} color={colors.onSurfaceSecondary} />
              </TouchableOpacity>
            </View>

            {formError ? (
              <View style={[styles.errorBox, { backgroundColor: colors.error + '14', borderColor: colors.error + '35' }]}>
                <MaterialIcons name="error-outline" size={18} color={colors.error} />
                <Text style={[styles.errorText, { color: colors.error }]}>{formError}</Text>
              </View>
            ) : (
              <View style={[styles.securityNote, { backgroundColor: colors.primary + '10' }]}>
                <MaterialIcons name="shield" size={17} color={colors.primary} />
                <Text style={[styles.securityText, { color: colors.textSecondary }]}>Sesión protegida y preferencias guardadas.</Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.84}
              disabled={isSubmitting}
              onPress={handleSignIn}
              style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.72 : 1 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#F8FFF9" />
              ) : (
                <Text style={styles.submitText}>Entrar</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.84} onPress={() => navigation.navigate('SignUp' as never)}>
              <Text style={[styles.linkText, { color: colors.accent }]}>Crear una cuenta nueva</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.84} onPress={() => navigation.navigate('ForgotPassword' as never)}>
              <Text style={[styles.secondaryLinkText, { color: colors.textSecondary }]}>Olvidé mi contraseña</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  function FieldIcon({ name }: { name: keyof typeof MaterialIcons.glyphMap }) {
    return (
      <View style={styles.fieldIcon}>
        <MaterialIcons name={name} size={18} color={colors.onSurfaceSecondary} />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 22,
    gap: 24,
  },
  brandBlock: {
    gap: 8,
  },
  brandIcon: {
    width: 58,
    height: 58,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  eyebrow: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  title: {
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: 0,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    fontWeight: '600',
  },
  formCard: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    gap: 14,
  },
  fieldIcon: {
    position: 'absolute',
    zIndex: 1,
    left: 14,
    top: 15,
  },
  fieldWrapper: {
    position: 'relative',
  },
  input: {
    minHeight: 52,
    borderWidth: 1,
    borderRadius: 8,
    paddingLeft: 46,
    paddingRight: 16,
    fontSize: 15,
    fontWeight: '700',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    top: 15,
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  errorText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '800',
    lineHeight: 18,
  },
  securityNote: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  securityText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  submitButton: {
    minHeight: 52,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitText: {
    color: '#F8FFF9',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  linkText: {
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  secondaryLinkText: {
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 0,
  },
});
