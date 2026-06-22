import { useEffect, useState } from 'react';
import { Alert, Text, TouchableOpacity, View } from 'react-native';
import { FormTextInput } from '@components/ui/FormTextInput';
import { GlassCard } from '@components/ui/GlassCard';
import { useTheme } from '@theme/ThemeProvider';
import {
  DEFAULT_WEATHER_WIND_SETTINGS,
  getWeatherWindSettings,
  saveWeatherWindSettings,
} from '@services/weatherSettingsStore';

export function WeatherWindSettingsCard() {
  const { colors } = useTheme();
  const [safeLimit, setSafeLimit] = useState(String(DEFAULT_WEATHER_WIND_SETTINGS.safeWindLimitKmh));
  const [dangerLimit, setDangerLimit] = useState(String(DEFAULT_WEATHER_WIND_SETTINGS.dangerWindLimitKmh));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getWeatherWindSettings().then((settings) => {
      setSafeLimit(String(settings.safeWindLimitKmh));
      setDangerLimit(String(settings.dangerWindLimitKmh));
    });
  }, []);

  const handleSave = async () => {
    const safe = Number(safeLimit);
    const danger = Number(dangerLimit);

    if (!Number.isFinite(safe) || safe <= 0) {
      Alert.alert('Límite inválido', 'El límite seguro debe ser un número mayor a 0.');
      return;
    }

    if (!Number.isFinite(danger) || danger <= safe) {
      Alert.alert('Límite inválido', 'El límite de peligro debe ser mayor que el límite seguro.');
      return;
    }

    setSaving(true);
    try {
      await saveWeatherWindSettings({ safeWindLimitKmh: safe, dangerWindLimitKmh: danger });
      Alert.alert('Guardado', 'Límites de viento actualizados para recomendaciones de fumigación.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <GlassCard style={{ gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900' }}>Límites de viento (admin)</Text>
      <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 20, fontWeight: '600' }}>
        Define umbrales para alertas de fumigación. Verde: por debajo del límite seguro. Amarillo: entre ambos. Rojo: sobre el límite de peligro.
      </Text>
      <FormTextInput
        label="Límite seguro (km/h)"
        value={safeLimit}
        onChangeText={setSafeLimit}
        keyboardType="decimal-pad"
      />
      <FormTextInput
        label="Límite de peligro (km/h)"
        value={dangerLimit}
        onChangeText={setDangerLimit}
        keyboardType="decimal-pad"
      />
      <TouchableOpacity
        activeOpacity={0.84}
        disabled={saving}
        onPress={handleSave}
        style={{
          minHeight: 46,
          borderRadius: 8,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          opacity: saving ? 0.7 : 1,
        }}
      >
        <Text style={{ color: '#F8FFF9', fontWeight: '900' }}>{saving ? 'Guardando...' : 'Guardar límites'}</Text>
      </TouchableOpacity>
    </GlassCard>
  );
}
