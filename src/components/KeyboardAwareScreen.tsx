import type { ReactNode } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';
import { useTheme } from '@theme/ThemeProvider';
import { useTabBarPadding } from '@hooks/useTabBarPadding';

type Props = {
  children: ReactNode;
  contentContainerStyle?: StyleProp<ViewStyle>;
  edges?: Edge[];
  withTabBarPadding?: boolean;
};

export function KeyboardAwareScreen({
  children,
  contentContainerStyle,
  edges = ['top', 'bottom'],
  withTabBarPadding = false,
}: Props) {
  const { colors } = useTheme();
  const tabBarPadding = useTabBarPadding();

  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: colors.background }]} edges={edges}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 12 : 0}
        style={styles.keyboard}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <ScrollView
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[
              styles.content,
              withTabBarPadding ? { paddingBottom: tabBarPadding } : null,
              contentContainerStyle,
            ]}
            showsVerticalScrollIndicator={false}
          >
            {children}
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  keyboard: { flex: 1 },
  content: { flexGrow: 1, padding: 22 },
});
