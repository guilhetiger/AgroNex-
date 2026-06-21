import { useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { GlassCard } from '@components/ui/GlassCard';
import { QuickModuleBackBar } from '@components/ui/QuickModuleBackBar';
import { SectionHeader } from '@components/ui/SectionHeader';
import { useAgroChat } from '@hooks/useAgroChat';
import { useTheme } from '@theme/ThemeProvider';
import type { AiRole } from "@services/aiPlatformTypes";

type LocalMessage = { id: string; role: AiRole; text: string };

const SUGGESTIONS = [
  '¿Cuánto gasté este mes?',
  '¿Cuántos vuelos hice este trimestre?',
  '¿Qué cliente tiene más actividad?',
  '¿Cuál es el agroquímico más utilizado?',
  '¿Qué anomalías existen en mis gastos?',
];

export function AgroChatScreen() {
  const { colors, radii } = useTheme();
  const chat = useAgroChat();
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<LocalMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      text: 'Hola, soy AgroNex AI. Pregúntame sobre gastos, vuelos, clientes o alertas de tu operación.',
    },
  ]);

  const canSend = input.trim().length > 0 && !chat.isPending;
  const ordered = useMemo(() => messages, [messages]);

  const send = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chat.isPending) return;

    setMessages((prev) => [...prev, { id: `u-${Date.now()}`, role: 'user', text: trimmed }]);
    setInput('');

    try {
      const response = await chat.mutateAsync({ conversationId, message: trimmed });
      setConversationId(response.conversationId);
      setMessages((prev) => [...prev, { id: `a-${Date.now()}`, role: "assistant", text: response.message }]);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'No se pudo completar la consulta.';
      setMessages((prev) => [...prev, { id: `e-${Date.now()}`, role: 'assistant', text: message }]);
    }
  };

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <QuickModuleBackBar />
        <SectionHeader title="AgroChat" subtitle="Asistente inteligente contextual" />

        <View style={styles.suggestions}>
          {SUGGESTIONS.map((item) => (
            <TouchableOpacity
              key={item}
              onPress={() => send(item)}
              style={[styles.chip, { borderColor: colors.border, backgroundColor: colors.surfaceMuted }]}
            >
              <Text style={{ color: colors.text, fontSize: 12, fontWeight: '700' }}>{item}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {ordered.map((msg) => {
          const isUser = msg.role === 'user';
          return (
            <GlassCard
              key={msg.id}
              style={{
                alignSelf: isUser ? 'flex-end' : 'flex-start',
                maxWidth: '92%',
                backgroundColor: isUser ? colors.primaryMuted : colors.surface,
              }}
            >
              <Text style={{ color: colors.text, lineHeight: 20 }}>{msg.text}</Text>
            </GlassCard>
          );
        })}
      </ScrollView>

      <View style={[styles.composer, { borderTopColor: colors.border, backgroundColor: colors.surface }]}>
        <TextInput
          value={input}
          onChangeText={setInput}
          placeholder="Escribe tu pregunta..."
          placeholderTextColor={colors.onSurfaceSecondary}
          style={[styles.input, { color: colors.text, borderColor: colors.border, borderRadius: radii.md }]}
          multiline
        />
        <TouchableOpacity
          disabled={!canSend}
          onPress={() => send(input)}
          style={[styles.sendBtn, { backgroundColor: colors.primary, opacity: canSend ? 1 : 0.6 }]}
        >
          {chat.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendText}>Enviar</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: 20, paddingBottom: 120, gap: 12 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 4 },
  chip: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 8 },
  composer: { borderTopWidth: 1, padding: 12, gap: 10 },
  input: { minHeight: 44, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  sendBtn: { minHeight: 44, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  sendText: { color: '#fff', fontWeight: '900' },
});
