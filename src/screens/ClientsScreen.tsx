import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Modal, RefreshControl, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useTheme } from '@theme/ThemeProvider';
import { useClients, useCreateClient, useDeleteClient, useExpenses, useFlights } from '@hooks/useData';
import { getClientScore } from '@services/aiService';

export function ClientsScreen() {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { data: clients, isLoading, error, refetch } = useClients();
  const { data: flights } = useFlights();
  const { data: expenses } = useExpenses();
  const createClientMutation = useCreateClient();
  const deleteClientMutation = useDeleteClient();
  const [isCreateOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({
    name: '',
    manager: '',
    phone: '',
    whatsapp: '',
    crop: '',
    area: '',
    location: '',
    latitude: '',
    longitude: '',
    field_polygon: '',
    internal_notes: '',
  });

  const handleCreateClient = async () => {
    await createClientMutation.mutateAsync({
      name: form.name.trim() || 'Nueva finca',
      manager: form.manager.trim(),
      phone: form.phone.trim(),
      whatsapp: form.whatsapp.trim(),
      crop: form.crop.trim() || 'Cultivo general',
      area: Number(form.area) || 0,
      location: form.location.trim() || 'Ubicación pendiente',
      status: 'active',
      latitude: form.latitude.trim() ? Number(form.latitude) : null,
      longitude: form.longitude.trim() ? Number(form.longitude) : null,
      field_polygon: form.field_polygon.trim() || null,
      internal_notes: form.internal_notes.trim() || null,
    });
    setForm({ name: '', manager: '', phone: '', whatsapp: '', crop: '', area: '', location: '', latitude: '', longitude: '', field_polygon: '', internal_notes: '' });
    setCreateOpen(false);
  };

  const confirmDeleteClient = (clientId: string, clientName: string) => {
    Alert.alert('Eliminar cliente', `¿Seguro que quieres eliminar ${clientName}? También se ocultarán sus vuelos asociados.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Eliminar',
        style: 'destructive',
        onPress: () => deleteClientMutation.mutate(clientId),
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Cargando clientes...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background, padding: 24 }]}>
        <Text style={{ color: colors.error, textAlign: 'center' }}>
          Error al cargar clientes: {error.message}
        </Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <FlatList
        data={clients || []}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={colors.primary} />}
        ListHeaderComponent={
          <View>
            <SectionHeader title="Clientes" subtitle="Cartera activa" />
            <View style={[styles.summaryPanel, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <View>
                <Text style={[styles.summaryLabel, { color: colors.textSecondary }]}>Total en cartera</Text>
                <Text style={[styles.summaryValue, { color: colors.text }]}>{clients?.length || 0}</Text>
              </View>
              <View style={[styles.summaryIcon, { backgroundColor: colors.primary + '18' }]}>
                <MaterialIcons name="verified-user" size={24} color={colors.primary} />
              </View>
            </View>
            <TouchableOpacity
              activeOpacity={0.84}
              onPress={() => setCreateOpen(true)}
              style={[styles.createButton, { backgroundColor: colors.primary }]}
            >
              <MaterialIcons name="add-business" size={20} color="#F8FFF9" />
              <Text style={styles.createButtonText}>Nuevo cliente</Text>
            </TouchableOpacity>
          </View>
        }
        renderItem={({ item }) => {
          const clientFlights = flights?.filter((flight) => flight.client_id === item.id) || [];
          const clientScore = getClientScore(item, clientFlights, expenses || []);
          const scoreColor =
            clientScore.category === 'good' ? colors.success : clientScore.category === 'average' ? colors.warning : colors.error;
          const statusColor = item.status === 'at-risk' ? colors.warning : item.status === 'paused' ? colors.accent : colors.success;
          const statusText = item.status === 'at-risk' ? 'Riesgo comercial' : item.status === 'paused' ? 'En pausa' : 'Activo';

          return (
            <TouchableOpacity
              activeOpacity={0.84}
              onPress={() => navigation.navigate('ClientDetail' as never, { clientId: item.id } as never)}
            >
              <GlassCard style={styles.clientCard}>
                <View style={styles.cardHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.clientName, { color: colors.text }]}>{item.name}</Text>
                    <Text style={[styles.clientMeta, { color: colors.textSecondary }]}>{item.crop} en {item.location}</Text>
                  </View>
                  <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor + '40' }]}>
                    <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
                  </View>
                </View>

                <View style={styles.metricsRow}>
                  <View style={[styles.metricBox, { backgroundColor: colors.primary + '10' }]}>
                    <Text style={[styles.metricValue, { color: colors.primary }]}>{item.area}</Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>hectáreas</Text>
                  </View>
                  <View style={[styles.metricBox, { backgroundColor: scoreColor + '12' }]}>
                    <Text style={[styles.metricValue, { color: scoreColor }]}>{clientScore.score}</Text>
                    <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>score IA</Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.84}
                    onPress={(event) => {
                      event.stopPropagation();
                      confirmDeleteClient(item.id, item.name);
                    }}
                    style={[styles.deleteButton, { backgroundColor: colors.error + '14' }]}
                  >
                    <MaterialIcons name="delete-outline" size={22} color={colors.error} />
                  </TouchableOpacity>
                  <MaterialIcons name="chevron-right" size={24} color={colors.onSurfaceSecondary} />
                </View>
              </GlassCard>
            </TouchableOpacity>
          );
        }}
        ListEmptyComponent={
          <GlassCard style={styles.emptyCard}>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>Sin clientes todavía</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Agrega tu primera finca para comenzar a organizar servicios, vuelos y rentabilidad.
            </Text>
          </GlassCard>
        }
      />
      <Modal visible={isCreateOpen} animationType="slide" transparent onRequestClose={() => setCreateOpen(false)}>
        <View style={styles.modalBackdrop}>
          <View style={[styles.modalCard, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>Nuevo cliente</Text>
              <TouchableOpacity onPress={() => setCreateOpen(false)}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>
            <View style={styles.formGrid}>
              <Input label="Finca/Hacienda" value={form.name} onChangeText={(value) => setForm((current) => ({ ...current, name: value }))} />
              <Input label="Responsable" value={form.manager} onChangeText={(value) => setForm((current) => ({ ...current, manager: value }))} />
              <Input label="Teléfono" value={form.phone} onChangeText={(value) => setForm((current) => ({ ...current, phone: value }))} keyboardType="phone-pad" />
              <Input label="WhatsApp" value={form.whatsapp} onChangeText={(value) => setForm((current) => ({ ...current, whatsapp: value }))} keyboardType="phone-pad" />
              <Input label="Cultivo" value={form.crop} onChangeText={(value) => setForm((current) => ({ ...current, crop: value }))} />
              <Input label="Hectáreas" value={form.area} onChangeText={(value) => setForm((current) => ({ ...current, area: value }))} keyboardType="numeric" />
              <Input label="Ubicación (texto)" value={form.location} onChangeText={(value) => setForm((current) => ({ ...current, location: value }))} />
              <Input label="Latitud (opcional)" value={form.latitude} onChangeText={(value) => setForm((current) => ({ ...current, latitude: value }))} keyboardType="numeric" />
              <Input label="Longitud (opcional)" value={form.longitude} onChangeText={(value) => setForm((current) => ({ ...current, longitude: value }))} keyboardType="numeric" />
              <Input
                label="Polígono del lote (JSON)"
                value={form.field_polygon}
                onChangeText={(value) => setForm((current) => ({ ...current, field_polygon: value }))}
              />
              <Input label="Notas internas" value={form.internal_notes} onChangeText={(value) => setForm((current) => ({ ...current, internal_notes: value }))} />
            </View>
            <TouchableOpacity
              activeOpacity={0.84}
              disabled={createClientMutation.isPending}
              onPress={handleCreateClient}
              style={[styles.saveButton, { backgroundColor: colors.primary, opacity: createClientMutation.isPending ? 0.7 : 1 }]}
            >
              <Text style={styles.saveButtonText}>{createClientMutation.isPending ? 'Guardando...' : 'Guardar cliente'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );

  function Input({ label, value, onChangeText, keyboardType }: { label: string; value: string; onChangeText: (value: string) => void; keyboardType?: 'default' | 'numeric' | 'phone-pad' }) {
    return (
      <View style={styles.inputBlock}>
        <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>{label}</Text>
        <TextInput
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType || 'default'}
          placeholder={label}
          placeholderTextColor={colors.onSurfaceSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border, backgroundColor: colors.background }]}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 15,
    fontWeight: '700',
  },
  listContent: {
    flexGrow: 1,
    gap: 14,
    padding: 20,
    paddingBottom: 168,
  },
  summaryPanel: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 18,
    marginBottom: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  summaryLabel: {
    fontSize: 12,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0,
  },
  summaryValue: {
    marginTop: 4,
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: 0,
  },
  summaryIcon: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createButton: {
    minHeight: 48,
    borderRadius: 8,
    marginTop: 14,
    marginBottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  createButtonText: {
    color: '#F8FFF9',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
  clientCard: {
    gap: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-start',
  },
  clientName: {
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 0,
  },
  clientMeta: {
    marginTop: 6,
    fontSize: 13,
    lineHeight: 19,
    fontWeight: '600',
  },
  statusPill: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0,
  },
  metricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  metricBox: {
    flex: 1,
    minHeight: 72,
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 0,
  },
  metricLabel: {
    marginTop: 3,
    fontSize: 12,
    fontWeight: '700',
  },
  deleteButton: {
    width: 42,
    height: 42,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyCard: {
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0,
  },
  emptyText: {
    marginTop: 8,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '600',
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.42)',
  },
  modalCard: {
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  formGrid: {
    gap: 12,
  },
  inputBlock: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '900',
    textTransform: 'uppercase',
  },
  input: {
    minHeight: 48,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    fontSize: 14,
    fontWeight: '700',
  },
  saveButton: {
    minHeight: 50,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#F8FFF9',
    fontWeight: '900',
  },
});
