import { useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { QuickModuleBackBar } from '@components/ui/QuickModuleBackBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { aiPlatformClient } from '@services/aiPlatformClient';
import { trackOCRUsage } from '@services/analyticsService';
import { useAuth } from '@hooks/useAuth';

export function OcrExpenseScreen() {
  const { colors } = useTheme();
  const { user } = useAuth();
  const [uri, setUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permiso requerido', 'Concede acceso a la galería para subir comprobantes.');
      return;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.85,
    });

    if (!picked.canceled && picked.assets[0]?.uri) {
      setUri(picked.assets[0].uri);
      setResult('');
      if (user?.id) void trackOCRUsage(user.id, 'upload');
    }
  };

  const processOcr = async () => {
    if (!uri) return;
    setLoading(true);
    try {
      const response = await aiPlatformClient.uploadExpenseImage(uri);
      setResult(
        `Gasto creado:\n• Categoría: ${response.expense.category}\n• Monto: $${response.expense.amount}\n• Proveedor: ${response.expense.vendor}\n• Fecha: ${response.expense.date}`
      );
      if (user?.id) {
        void trackOCRUsage(user.id, 'processed', { entityId: response.expense.id, jobId: response.jobId });
      }
      Alert.alert('Listo', 'Comprobante procesado y registrado en gastos.');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo procesar el comprobante.';
      Alert.alert('OCR', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content}>
        <QuickModuleBackBar />
        <SectionHeader title="OCR de gastos" subtitle="Factura → gasto automático (RLS)" />

        <GlassCard style={{ gap: 12 }}>
          <Text style={{ color: colors.textSecondary, lineHeight: 20 }}>
            Sube una foto de factura o recibo. Gemini (Vertex AI) extrae categoría, monto, proveedor y fecha, y crea el registro en
            `expenses` con tu usuario autenticado.
          </Text>

          <TouchableOpacity onPress={pickImage} style={[styles.btn, { backgroundColor: colors.primary }]}>
            <Text style={styles.btnText}>Seleccionar imagen</Text>
          </TouchableOpacity>

          {uri ? <Image source={{ uri }} style={styles.preview} resizeMode="contain" /> : null}

          <TouchableOpacity
            disabled={!uri || loading}
            onPress={processOcr}
            style={[styles.btn, { backgroundColor: colors.accent, opacity: !uri || loading ? 0.6 : 1 }]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Procesar con IA</Text>}
          </TouchableOpacity>

          {result ? (
            <View style={{ padding: 12, backgroundColor: colors.primaryMuted, borderRadius: 8 }}>
              <Text style={{ color: colors.text, lineHeight: 20 }}>{result}</Text>
            </View>
          ) : null}
        </GlassCard>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 14 },
  btn: { minHeight: 48, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#fff', fontWeight: '900' },
  preview: { width: '100%', height: 260, borderRadius: 8, backgroundColor: '#111827' },
});
