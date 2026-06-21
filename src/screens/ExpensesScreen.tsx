import { MaterialIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Modal, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ResponsiveLineChart } from '@components/ui/ResponsiveLineChart';
import { FormTextInput } from '@components/ui/FormTextInput';
import { GlassCard } from '@components/ui/GlassCard';
import { QuickModuleBackBar } from '@components/ui/QuickModuleBackBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { useCreateExpense, useExpenses } from '@hooks/useData';
import { useLocalization } from '@context/LocalizationContext';
import { parseDecimalInput } from '@utils/number';
import { useTabBarPadding } from '@hooks/useTabBarPadding';

const categories = ['gasolina', 'aceite', 'mantenimiento', 'baterías', 'alimentación', 'hospedaje', 'salarios', 'transporte', 'repuestos', 'impuestos', 'otros'];

export function ExpensesScreen() {
  const { colors } = useTheme();
  const tabBarPadding = useTabBarPadding();
  const { formatCurrency, convertFromUsd, convertToUsd, currency } = useLocalization();
  const { data: expenses, isLoading } = useExpenses();
  const createExpense = useCreateExpense();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ category: 'gasolina', amount: '', description: '', vendor: '' });

  const total = expenses?.reduce((sum, expense) => sum + expense.amount, 0) || 0;
  const monthlyTotals = expenses?.reduce<Record<string, number>>((acc, expense) => {
    const month = new Date(expense.date).toLocaleString('default', { month: 'short' });
    acc[month] = (acc[month] || 0) + expense.amount;
    return acc;
  }, {}) || {};
  const labels = Object.keys(monthlyTotals);
  const values = Object.values(monthlyTotals);
  const chartData = {
    labels: labels.length ? labels : ['Mes'],
    datasets: [{ data: (values.length ? values : [0]).map((v) => convertFromUsd(v)) }],
  };

  const save = async () => {
    await createExpense.mutateAsync({
      category: form.category,
      amount: convertToUsd(parseDecimalInput(form.amount)),
      date: new Date().toISOString(),
      description: form.description || 'Gasto operativo',
      vendor: form.vendor || 'Proveedor no especificado',
    });
    setForm({ category: 'gasolina', amount: '', description: '', vendor: '' });
    setOpen(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={{ color: colors.text, marginTop: 16 }}>Cargando gastos...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
    <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingBottom: tabBarPadding }]} keyboardShouldPersistTaps="handled">
      <QuickModuleBackBar />
      <SectionHeader title="Gastos" subtitle="Flujo de caja y rentabilidad" />
      <GlassCard style={styles.heroCard}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Total gastos del período</Text>
        <Text style={[styles.total, { color: colors.text }]}>{formatCurrency(total)}</Text>
        <TouchableOpacity activeOpacity={0.84} onPress={() => setOpen(true)} style={[styles.createButton, { backgroundColor: colors.primary }]}>
          <MaterialIcons name="add-card" size={20} color="#F8FFF9" />
          <Text style={styles.createButtonText}>Registrar gasto</Text>
        </TouchableOpacity>
      </GlassCard>

      <GlassCard>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Tendencia mensual</Text>
        <ResponsiveLineChart
          data={chartData}
          height={220}
          chartConfig={{
            backgroundGradientFrom: colors.surface,
            backgroundGradientTo: colors.surface,
            decimalPlaces: 0,
            color: () => colors.primary,
            labelColor: () => colors.onSurfaceSecondary,
            propsForDots: { r: '5', fill: colors.primary },
          }}
          bezier
        />
      </GlassCard>

      <GlassCard style={{ gap: 12 }}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>Categorías recientes</Text>
        {expenses?.slice(0, 6).map((expense) => (
          <View key={expense.id} style={styles.expenseRow}>
            <View>
              <Text style={[styles.expenseTitle, { color: colors.text }]}>{expense.category}</Text>
              <Text style={[styles.expenseMeta, { color: colors.textSecondary }]}>{expense.vendor}</Text>
            </View>
            <Text style={[styles.expenseAmount, { color: colors.warning }]}>{formatCurrency(expense.amount)}</Text>
          </View>
        ))}
        {!expenses?.length && <Text style={{ color: colors.textSecondary }}>No hay registros de gastos.</Text>}
      </GlassCard>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <View style={styles.modalBackdrop}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo gasto</Text>
              <TouchableOpacity onPress={() => setOpen(false)}><MaterialIcons name="close" size={24} color={colors.text} /></TouchableOpacity>
            </View>
            <ScrollView contentContainerStyle={styles.modalContent} keyboardShouldPersistTaps="handled" nestedScrollEnabled>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Categoría</Text>
              <View style={styles.categoryWrap}>
                {categories.map((category) => {
                  const active = form.category === category;
                  return (
                    <TouchableOpacity key={category} onPress={() => setForm((current) => ({ ...current, category }))} style={[styles.categoryChip, { backgroundColor: active ? colors.primary : colors.background, borderColor: active ? colors.primary : colors.border }]}>
                      <Text style={[styles.categoryText, { color: active ? '#F8FFF9' : colors.text }]}>{category}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
              <FormTextInput label={`Monto (${currency})`} value={form.amount} onChangeText={(value) => setForm((current) => ({ ...current, amount: value }))} keyboardType="decimal-pad" />
              <FormTextInput label="Proveedor" value={form.vendor} onChangeText={(value) => setForm((current) => ({ ...current, vendor: value }))} />
              <FormTextInput label="Descripción" value={form.description} onChangeText={(value) => setForm((current) => ({ ...current, description: value }))} />
            </ScrollView>
            <TouchableOpacity activeOpacity={0.84} onPress={save} style={[styles.saveButton, { backgroundColor: colors.primary }]}>
              <Text style={styles.saveButtonText}>Guardar gasto</Text>
            </TouchableOpacity>
          </KeyboardAvoidingView>
        </View>
      </Modal>
    </ScrollView>
    </SafeAreaView>
  );

}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { flexGrow: 1, padding: 20, gap: 14 },
  heroCard: { gap: 14 },
  label: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  total: { fontSize: 36, fontWeight: '900' },
  createButton: { minHeight: 48, borderRadius: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  createButtonText: { color: '#F8FFF9', fontWeight: '900' },
  cardTitle: { fontSize: 18, fontWeight: '900' },
  expenseRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 12, alignItems: 'center' },
  expenseTitle: { fontSize: 15, fontWeight: '900', textTransform: 'capitalize' },
  expenseMeta: { marginTop: 3, fontSize: 12, fontWeight: '700' },
  expenseAmount: { fontSize: 15, fontWeight: '900' },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.42)' },
  modalCard: { borderTopLeftRadius: 8, borderTopRightRadius: 8, borderWidth: 1, padding: 20, gap: 12, maxHeight: '92%' },
  modalContent: { gap: 12, paddingBottom: 4 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  modalTitle: { fontSize: 22, fontWeight: '900' },
  inputLabel: { fontSize: 12, fontWeight: '900', textTransform: 'uppercase' },
  categoryWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  categoryChip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  categoryText: { fontSize: 12, fontWeight: '900', textTransform: 'capitalize' },
  saveButton: { minHeight: 50, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  saveButtonText: { color: '#F8FFF9', fontWeight: '900' },
});
