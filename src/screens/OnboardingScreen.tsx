import { useNavigation } from '@react-navigation/native';
import { Text, View, ScrollView } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';
import { GlassCard } from '@components/ui/GlassCard';
import { PressableScale } from '@components/ui/PressableScale';

export function OnboardingScreen() {
  const navigation = useNavigation();
  const { colors, radii } = useTheme();

  const featureList = [
    'Dashboard de inteligencia con métricas financieras y operativas.',
    'Mapas de vuelo con rutas, polígonos y áreas aplicadas.',
    'Gestión de clientes, vuelos, agroquímicos y gastos.',
    'IA integrada para scoring, recomendaciones y predicciones.',
    'Sincronización offline/online automática.',
  ];

  return (
    <ScrollView style={{ flex: 1, backgroundColor: colors.background }} contentContainerStyle={{ padding: 24, paddingBottom: 48 }}>
      <Text style={{ color: colors.accent, fontSize: 12, fontWeight: '900', letterSpacing: 1.2, marginBottom: 10 }}>AGRONEX</Text>
      <Text style={{ color: colors.text, fontSize: 32, fontWeight: '900', marginBottom: 12, letterSpacing: -0.5 }}>
        Plataforma SaaS para drones agrícolas.
      </Text>
      <Text style={{ color: colors.textSecondary, fontSize: 16, marginBottom: 28, lineHeight: 24, fontWeight: '600' }}>
        Experiencia enterprise: datos por usuario, mapas, IA operativa y control financiero en un solo lugar.
      </Text>

      <View style={{ gap: 12 }}>
        {featureList.map((feature) => (
          <GlassCard key={feature}>
            <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
              <View
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  marginTop: 6,
                  backgroundColor: colors.primary,
                }}
              />
              <Text style={{ color: colors.textSecondary, lineHeight: 22, fontWeight: '600', flex: 1 }}>{feature}</Text>
            </View>
          </GlassCard>
        ))}
      </View>

      <View style={{ marginTop: 32, gap: 12 }}>
        <PressableScale
          onPress={() => navigation.navigate('SignIn' as never)}
          style={{
            backgroundColor: colors.primary,
            paddingVertical: 16,
            borderRadius: radii.lg,
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#06110C', textAlign: 'center', fontWeight: '900', fontSize: 15 }}>Iniciar sesión</Text>
        </PressableScale>
        <PressableScale
          onPress={() => navigation.navigate('SignUp' as never)}
          style={{
            borderColor: colors.border,
            borderWidth: 1,
            paddingVertical: 16,
            borderRadius: radii.lg,
            alignItems: 'center',
            backgroundColor: colors.surfaceMuted,
          }}
        >
          <Text style={{ color: colors.text, textAlign: 'center', fontWeight: '900', fontSize: 15 }}>Crear cuenta</Text>
        </PressableScale>
      </View>
    </ScrollView>
  );
}
