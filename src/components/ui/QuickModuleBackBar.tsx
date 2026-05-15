import { MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

export function QuickModuleBackBar() {
  const navigation = useNavigation();
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      activeOpacity={0.84}
      onPress={() => navigation.goBack()}
      style={[styles.backButton, { borderColor: colors.border, backgroundColor: colors.surface }]}
    >
      <MaterialIcons name="arrow-back" size={20} color={colors.text} />
      <Text style={[styles.backButtonText, { color: colors.text }]}>Volver</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  backButton: {
    alignSelf: 'flex-start',
    minHeight: 44,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0,
  },
});
