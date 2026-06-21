import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Text, View } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { PressableScale } from '@components/ui/PressableScale';
import type { AuthStackParamList } from '@navigation/types';

export function WelcomeScreen() {
  const { colors, radii } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<AuthStackParamList, 'Welcome'>>();

  return (
    <View style={{ flex: 1, backgroundColor: colors.background, padding: 24, justifyContent: 'flex-end' }}>
      <View
        style={{
          backgroundColor: colors.surfaceGlass,
          padding: 26,
          borderRadius: radii.xl,
          borderWidth: 1,
          borderColor: colors.borderSubtle,
        }}
      >
        <Text style={{ color: colors.primary, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 }}>AGRONEX</Text>
        <Text style={{ color: colors.text, fontSize: 34, fontWeight: '900', marginBottom: 14, letterSpacing: -0.5 }}>
          Operaciones aéreas con precisión de producto SaaS.
        </Text>
        <Text style={{ color: colors.textSecondary, fontSize: 15, marginBottom: 28, lineHeight: 23, fontWeight: '600' }}>
          Clientes, vuelos, mapas, costos e IA agrícola — listo para escalar como startup real.
        </Text>
        <PressableScale
          onPress={() => navigation.navigate('Onboarding')}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: radii.lg,
            marginBottom: 12,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#06110C', textAlign: 'center', fontWeight: '900', fontSize: 15 }}>Descubrir la plataforma</Text>
        </PressableScale>
        <PressableScale
          onPress={() => navigation.navigate('SignIn')}
          style={{
            borderColor: colors.border,
            borderWidth: 1,
            paddingVertical: 16,
            borderRadius: radii.lg,
            alignItems: 'center',
            backgroundColor: colors.surfaceMuted,
          }}
        >
          <Text style={{ color: colors.text, textAlign: 'center', fontWeight: '900', fontSize: 15 }}>Iniciar sesión</Text>
        </PressableScale>
      </View>
    </View>
  );
}
