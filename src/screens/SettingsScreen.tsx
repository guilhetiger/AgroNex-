import { MaterialIcons } from '@expo/vector-icons';
import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@theme/ThemeProvider';
import { useLocalization } from '@context/LocalizationContext';
import { useSync } from '@context/SyncContext';
import { CountryOption, CurrencyOption, LanguageOption } from '../types/index';
import { useTabBarPadding } from '@hooks/useTabBarPadding';

const countries: Array<{ value: CountryOption; label: string; helper: string }> = [
  { value: 'BO', label: 'Bolivia', helper: 'BOB · Español' },
  { value: 'US', label: 'Estados Unidos', helper: 'USD · English' },
  { value: 'BR', label: 'Brasil', helper: 'BRL · Português' },
  { value: 'AR', label: 'Argentina', helper: 'ARS · Español' },
  { value: 'EU', label: 'Europa', helper: 'EUR · English' },
];

const currencies: CurrencyOption[] = ['BOB', 'USD', 'BRL', 'ARS', 'EUR'];
const languages: Array<{ value: LanguageOption; label: string }> = [
  { value: 'es', label: 'Español' },
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Português' },
];

export function SettingsScreen() {
  const { colors, mode, setThemeMode } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const { signOut, hasRole } = useAuth();
  const isAdmin = hasRole(['admin']);
  const { setLanguage, setCurrency, setCountry, language, currency, country, t, formatDate } = useLocalization();
  const { isSyncing, lastSyncedAt, syncNow } = useSync();

  const handleRequestPermissions = async () => {
    Alert.alert('No disponible', 'Las notificaciones estarán disponibles en una próxima versión estable.');
  };

  const handleClearNotifications = async () => {
    Alert.alert('No disponible', 'No hay notificaciones activas en esta versión estable.');
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding }]}>
        <SectionHeader title={t('settings')} subtitle="Centro de control" />

        <View style={[styles.hero, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + '18' }]}>
            <MaterialIcons name="workspace-premium" size={28} color={colors.primary} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.heroTitle, { color: colors.text }]}>Preferencias Pro</Text>
            <Text style={[styles.heroText, { color: colors.textSecondary }]}>
              País, idioma, moneda y apariencia quedan guardados en este dispositivo.
            </Text>
          </View>
        </View>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Mercado principal</Text>
          <Text style={[styles.cardHint, { color: colors.textSecondary }]}>
            Al cambiar país ajustamos idioma y moneda recomendados. Luego puedes modificar la moneda manualmente.
          </Text>
          <View style={styles.optionGrid}>
            {countries.map((item) => {
              const active = country === item.value;
              return (
                <TouchableOpacity
                  key={item.value}
                  activeOpacity={0.84}
                  onPress={() => setCountry(item.value)}
                  style={[
                    styles.countryOption,
                    {
                      backgroundColor: active ? colors.primary + '18' : colors.background,
                      borderColor: active ? colors.primary : colors.border,
                    },
                  ]}
                >
                  <Text style={[styles.optionTitle, { color: active ? colors.primary : colors.text }]}>{item.label}</Text>
                  <Text style={[styles.optionHelper, { color: colors.textSecondary }]}>{item.helper}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Idioma</Text>
          <View style={styles.segmentRow}>
            {languages.map((item) => (
              <SegmentButton
                key={item.value}
                label={item.label}
                active={language === item.value}
                onPress={() => setLanguage(item.value)}
              />
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Moneda</Text>
          <View style={styles.currencyWrap}>
            {currencies.map((value) => (
              <SegmentButton
                key={value}
                label={value}
                active={currency === value}
                onPress={() => setCurrency(value)}
              />
            ))}
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Apariencia</Text>
          <View style={styles.segmentRow}>
            <SegmentButton label="Premium oscuro" active={mode === 'dark'} onPress={() => setThemeMode('dark')} />
            <SegmentButton label="Campo suave" active={mode === 'light'} onPress={() => setThemeMode('light')} />
          </View>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Sincronización</Text>
          <View style={styles.infoLine}>
            <MaterialIcons name={isSyncing ? 'sync' : 'cloud-done'} size={22} color={colors.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>{isSyncing ? 'Sincronizando...' : 'Datos al día'}</Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                Última sincronización: {lastSyncedAt ? formatDate(lastSyncedAt) : 'Sin historial'}
              </Text>
            </View>
          </View>
          <TouchableOpacity activeOpacity={0.84} onPress={syncNow} style={[styles.secondaryButton, { borderColor: colors.border }]}>
            <Text style={[styles.secondaryButtonText, { color: colors.primary }]}>Sincronizar ahora</Text>
          </TouchableOpacity>
        </GlassCard>

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Notificaciones</Text>
          <View style={styles.infoLine}>
            <MaterialIcons name="notifications-active" size={22} color={colors.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>
                Desactivadas temporalmente
              </Text>
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                0 recordatorios programados
              </Text>
            </View>
          </View>
          <View style={styles.actionRow}>
            <TouchableOpacity activeOpacity={0.84} onPress={handleRequestPermissions} style={[styles.primaryButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.primaryButtonText}>Revisar</Text>
            </TouchableOpacity>
            <TouchableOpacity activeOpacity={0.84} onPress={handleClearNotifications} style={[styles.dangerButton, { backgroundColor: colors.error + '16' }]}>
              <Text style={[styles.dangerButtonText, { color: colors.error }]}>Limpiar</Text>
            </TouchableOpacity>
          </View>
        </GlassCard>

        {isAdmin && (
          <GlassCard style={styles.card}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Configuración administrativa</Text>
            <Text style={[styles.cardHint, { color: colors.textSecondary }]}>Solo disponible para usuarios con rol Administrador.</Text>
          </GlassCard>
        )}

        <GlassCard style={styles.card}>
          <Text style={[styles.cardTitle, { color: colors.text }]}>Cuenta</Text>
          <TouchableOpacity
            activeOpacity={0.84}
            onPress={signOut}
            style={[styles.logoutButton, { backgroundColor: colors.error + '16', borderColor: colors.error + '35' }]}
          >
            <MaterialIcons name="logout" size={20} color={colors.error} />
            <Text style={[styles.logoutText, { color: colors.error }]}>Cerrar sesión</Text>
          </TouchableOpacity>
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );

  function SegmentButton({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
    return (
      <TouchableOpacity
        activeOpacity={0.84}
        onPress={onPress}
        style={[
          styles.segmentButton,
          {
            backgroundColor: active ? colors.primary : colors.background,
            borderColor: active ? colors.primary : colors.border,
          },
        ]}
      >
        <Text style={[styles.segmentLabel, { color: active ? '#F8FFF9' : colors.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 20,
    gap: 14,
  },
  hero: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    flexDirection: 'row',
    gap: 14,
    alignItems: 'center',
  },
  heroIcon: {
    width: 50,
    height: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  heroText: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  card: {
    gap: 14,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  cardHint: {
    fontSize: 13,
    lineHeight: 20,
    fontWeight: '600',
  },
  optionGrid: {
    gap: 10,
  },
  countryOption: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  optionHelper: {
    marginTop: 4,
    fontSize: 12,
    fontWeight: '700',
  },
  segmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  currencyWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  segmentButton: {
    minHeight: 42,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentLabel: {
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 0,
  },
  infoLine: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0,
  },
  infoText: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
  },
  secondaryButton: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    color: '#F8FFF9',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  dangerButton: {
    borderRadius: 8,
    paddingHorizontal: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  logoutButton: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  logoutText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
