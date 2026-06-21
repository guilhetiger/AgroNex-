import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, FlatList, Modal, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FormTextInput } from '@components/ui/FormTextInput';
import { GlassCard } from '@components/ui/GlassCard';
import { QuickModuleBackBar } from '@components/ui/QuickModuleBackBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { useAgrochemicals, useCreateAgrochemical } from '@hooks/useData';
import { useLocalization } from '@context/LocalizationContext';
import { parseDecimalInput } from '@utils/number';
import { useTabBarPadding } from '@hooks/useTabBarPadding';

export function AgrochemicalsScreen() {
  const { colors } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const { formatDate, formatCurrency } = useLocalization();
  const { data: chemicals, isLoading, refetch } = useAgrochemicals();
  const createChemical = useCreateAgrochemical();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    product: '',
    application_rate: '',
    total_used: '',
    batch: '',
    expiry_date: '',
    mixture: '',
    stock: '',
    unit_cost_usd: '',
  });

  const save = async () => {
    await createChemical.mutateAsync({
      product: form.product || 'Producto agrícola',
      application_rate: parseDecimalInput(form.application_rate),
      total_used: parseDecimalInput(form.total_used),
      batch: form.batch || 'Sin lote',
      expiry_date: form.expiry_date || new Date().toISOString(),
      mixture: form.mixture || 'Mezcla pendiente',
      stock: parseDecimalInput(form.stock),
      unit_cost_usd: form.unit_cost_usd.trim() ? parseDecimalInput(form.unit_cost_usd) : null,
    });
    setForm({ product: '', application_rate: '', total_used: '', batch: '', expiry_date: '', mixture: '', stock: '', unit_cost_usd: '' });
    setOpen(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Cargando inventario...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={chemicals || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding }]}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View style={{ gap: 14 }}>
            <QuickModuleBackBar />
            <SectionHeader title="Agroquímicos" subtitle="Insumos, stock y alertas" />
            <View style={styles.summaryRow}>
              <GlassCard style={styles.summaryCard}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Productos</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{chemicals?.length || 0}</Text>
              </GlassCard>
              <GlassCard style={styles.summaryCard}>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Stock crítico</Text>
                <Text style={[styles.summaryValue, { color: colors.warning }]}>{chemicals?.filter((item) => item.stock < 10).length || 0}</Text>
              </GlassCard>
            </View>
            <TouchableOpacity activeOpacity={0.84} onPress={() => setOpen(true)} style={[styles.createButton, { backgroundColor: colors.primary }]}>
              <MaterialIcons name="science" size={20} color="#F8FFF9" />
              <Text style={styles.createButtonText}>Agregar producto</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => (
          <GlassCard style={styles.itemCard}>
            <View style={styles.itemHeader}>
              <Text style={[styles.itemTitle, { color: colors.text }]}>{item.product}</Text>
              <Text style={[styles.stockBadge, { color: item.stock < 10 ? colors.warning : colors.success }]}>{item.stock} stock</Text>
            </View>
            <Text style={[styles.itemText, { color: colors.textSecondary }]}>{item.mixture}</Text>
            <Text style={[styles.itemText, { color: colors.textSecondary }]}>Aplicación: {item.application_rate} L/ha · Usado: {item.total_used}</Text>
            <Text style={[styles.itemText, { color: colors.textSecondary }]}>Lote: {item.batch} · Vence: {formatDate(item.expiry_date)}</Text>
            {item.unit_cost_usd != null && item.unit_cost_usd > 0 ? (
              <Text style={[styles.itemText, { color: colors.accent, fontWeight: '900' }]}>
                Valor stock ref.: {formatCurrency(item.stock * item.unit_cost_usd)} · {formatCurrency(item.unit_cost_usd)}/u
              </Text>
            ) : null}
          </GlassCard>
        )}
        ListEmptyComponent={
          <GlassCard>
            <Text style={{ color: colors.textSecondary, textAlign: 'center' }}>No hay productos registrados.</Text>
          </GlassCard>
        }
      />
      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo producto</Text>
              <TouchableOpacity onPress={() => setOpen(false)}><MaterialIcons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.formGrid} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              {[
                ['Producto', 'product'],
                ['Cantidad por hectárea', 'application_rate'],
                ['Total usado', 'total_used'],
                ['Lote', 'batch'],
                ['Vencimiento YYYY-MM-DD', 'expiry_date'],
                ['Mezcla aplicada', 'mixture'],
                ['Stock restante', 'stock'],
                ['Costo unitario (USD)', 'unit_cost_usd'],
              ].map(([label, key]) => (
                <FormTextInput
                  key={key}
                  label={label}
                  value={(form as Record<string, string>)[key]}
                  onChangeText={(value) => setForm((current) => ({ ...current, [key]: value }))}
                  keyboardType={key === 'unit_cost_usd' || key === 'application_rate' || key === 'total_used' || key === 'stock' ? 'decimal-pad' : 'default'}
                />
              ))}
            </ScrollView>
            <TouchableOpacity activeOpacity={0.84} onPress={save} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveButtonText}>Guardar producto</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, padding: 20, gap: 14 },
  summaryRow: { flexDirection: 'row', gap: 12 },
  summaryCard: { flex: 1 },
  summaryLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  summaryValue: { marginTop: 8, fontSize: 28, fontWeight: '900' },
  createButton: { minHeight: 48, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  createButtonText: { color: '#F8FFF9', fontWeight: '900' },
  itemCard: { gap: 10 },
  itemHeader: { flexDirection: 'row', justifyContent: 'space-between', gap: 12 },
  itemTitle: { flex: 1, fontSize: 18, fontWeight: '900' },
  stockBadge: { fontSize: 13, fontWeight: '900' },
  itemText: { fontSize: 13, lineHeight: 19, fontWeight: '700' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  modalCard: { borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1, padding: 20, gap: 12, maxHeight: '92%' },
  formGrid: { gap: 12, paddingBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  saveButton: { minHeight: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#F8FFF9', fontWeight: '900' },
});
