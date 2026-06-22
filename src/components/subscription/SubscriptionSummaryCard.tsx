import { Linking } from 'react-native';
import { GlassCard } from '@components/ui/GlassCard';
import { useAuth } from '@hooks/useAuth';
import { useTheme } from '@theme/ThemeProvider';
import { getUserUsageSnapshot } from '@services/analyticsService';
import { Text, View } from 'react-native';
import { useEffect, useState } from 'react';

const PLAN_LABELS = {
  free: 'Prueba gratuita',
  pro: 'Pro',
  enterprise: 'Enterprise',
} as const;

const STATUS_LABELS = {
  admin: 'Administrador',
  trial: 'Prueba activa',
  active: 'Activa',
  expired: 'Vencida',
  cancelled: 'Cancelada',
} as const;

export function SubscriptionSummaryCard() {
  const { colors } = useTheme();
  const { access, user } = useAuth();
  const [usageLine, setUsageLine] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;
    getUserUsageSnapshot(user.id, access?.plan ?? 'free').then((snapshot) => {
      const aiLabel =
        snapshot.limits.aiDaily == null ? `${snapshot.aiToday} IA hoy · ilimitado` : `${snapshot.aiToday}/${snapshot.limits.aiDaily} IA hoy`;
      const ocrLabel =
        snapshot.limits.ocrMonthly == null
          ? `${snapshot.ocrThisMonth} OCR mes · ilimitado`
          : `${snapshot.ocrThisMonth}/${snapshot.limits.ocrMonthly} OCR mes`;
      setUsageLine(`${aiLabel} · ${ocrLabel}`);
    });
  }, [user?.id, access?.plan]);

  if (!access) return null;

  const planLabel = access.plan ? PLAN_LABELS[access.plan] : 'Sin plan';
  const statusLabel = STATUS_LABELS[access.status] ?? access.status;
  const expiryText = access.subscriptionEndsAt || access.trialEndsAt;

  return (
    <GlassCard style={{ gap: 12 }}>
      <Text style={{ color: colors.text, fontSize: 16, fontWeight: '900' }}>Mi Suscripción</Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
        <Metric label="Plan" value={planLabel} colors={colors} />
        <Metric label="Estado" value={statusLabel} colors={colors} />
        <Metric label="Días restantes" value={`${access.daysRemaining}`} colors={colors} />
      </View>
      {expiryText ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '600' }}>
          Vencimiento: {new Date(expiryText).toLocaleDateString()}
        </Text>
      ) : null}
      <Text style={{ color: colors.textSecondary, fontSize: 12, lineHeight: 18 }}>{access.message}</Text>
      {usageLine ? (
        <Text style={{ color: colors.textSecondary, fontSize: 11, lineHeight: 16, fontWeight: '700' }}>{usageLine}</Text>
      ) : null}
    </GlassCard>
  );
}

function Metric({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { text: string; textSecondary: string; surfaceMuted: string; borderSubtle: string };
}) {
  return (
    <View
      style={{
        minWidth: 100,
        flexGrow: 1,
        backgroundColor: colors.surfaceMuted,
        borderRadius: 12,
        padding: 12,
        borderWidth: 1,
        borderColor: colors.borderSubtle,
      }}
    >
      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '800' }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '900', marginTop: 4 }}>{value}</Text>
    </View>
  );
}

export const SUPPORT_EMAIL = 'soporte@agronex.app';

export async function contactSupport(subject = 'Renovación AgroNex') {
  const url = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}`;
  const canOpen = await Linking.canOpenURL(url);
  if (!canOpen) {
    throw new Error(`Escríbenos a ${SUPPORT_EMAIL}`);
  }
  await Linking.openURL(url);
}
