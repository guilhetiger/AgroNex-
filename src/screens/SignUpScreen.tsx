import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@theme/ThemeProvider';

export function SignUpScreen() {
  const { colors } = useTheme();
  const { signUp } = useAuth();
  const navigation = useNavigation<any>();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSignUp = async () => {
    setFormError('');
    setIsSubmitting(true);
    try {
      await signUp(email, password, name);
    } catch (error: any) {
      setFormError(error.message || 'No se pudo crear la cuenta. Revisa los datos.');
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
              <MaterialIcons name="workspace-premium" size={30} color={colors.primary} />
            </View>
            <Text style={[styles.eyebrow, { color: colors.accent }]}>Nueva operación</Text>
            <Text style={[styles.title, { color: colors.text }]}>Crear cuenta</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Configura tu espacio para clientes, vuelos, gastos y reportes profesionales.
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.fieldWrapper}>
              <FieldIcon name="business" />
              <TextInput
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  if (formError) setFormError('');
                }}
                placeholder="Nombre o empresa"
                placeholderTextColor={colors.onSurfaceSecondary}
                style={[styles.input, { color: colors.text, borderColor: colors.border }]}
                autoCapitalize="words"
                textContentType="name"
              />
            </View>

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
                textContentType="newPassword"
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
                <MaterialIcons name="verified-user" size={17} color={colors.primary} />
                <Text style={[styles.securityText, { color: colors.textSecondary }]}>Usa una contraseña de al menos 6 caracteres.</Text>
              </View>
            )}

            <TouchableOpacity
              activeOpacity={0.84}
              disabled={isSubmitting}
              onPress={handleSignUp}
              style={[styles.submitButton, { backgroundColor: colors.primary, opacity: isSubmitting ? 0.72 : 1 }]}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#F8FFF9" />
              ) : (
                <Text style={styles.submitText}>Crear cuenta</Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity activeOpacity={0.84} onPress={() => navigation.navigate('SignIn' as never)}>
              <Text style={[styles.linkText, { color: colors.accent }]}>Ya tengo cuenta</Text>
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
  fieldWrapper: {
    position: 'relative',
  },
  fieldIcon: {
    position: 'absolute',
    zIndex: 1,
    left: 14,
    top: 15,
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
});
