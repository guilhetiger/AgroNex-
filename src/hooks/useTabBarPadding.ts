import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Altura estimada del PremiumTabBar (contenido interno, sin safe area). */
export const TAB_BAR_ESTIMATED_HEIGHT = 72;

/**
 * Padding inferior para pantallas con tab bar flotante.
 * Evita que el contenido quede oculto detrás de PremiumTabBar.
 */
export function useTabBarPadding(extraGap = 32) {
  const insets = useSafeAreaInsets();
  return TAB_BAR_ESTIMATED_HEIGHT + Math.max(insets.bottom, 10) + extraGap;
}
