import { TouchableOpacity, Text, StyleSheet, ViewStyle, StyleProp } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

type PrimaryButtonProps = {
  label: string;
  onPress: () => void;
  style?: StyleProp<ViewStyle>;
};

export function PrimaryButton({ label, onPress, style }: PrimaryButtonProps) {
  const { colors } = useTheme();

  return (
    <TouchableOpacity 
      onPress={onPress} 
      activeOpacity={0.7}
      style={[
        styles.button, 
        { 
          backgroundColor: colors.primary,
          shadowColor: colors.primary
        }, 
        style
      ]}
    >
      <Text style={[styles.label, { color: '#FFFFFF' }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 8,
  },
  label: {
    fontWeight: '700',
    fontSize: 16,
    letterSpacing: 0.5,
  },
});
