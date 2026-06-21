import { Text, TextInput, type KeyboardTypeOptions, type TextInputProps, View } from 'react-native';
import { useTheme } from '@theme/ThemeProvider';

type Props = TextInputProps & {
  label?: string;
  error?: string;
  helperText?: string;
  keyboardType?: KeyboardTypeOptions;
};

export function FormTextInput({ label, error, helperText, keyboardType = 'default', multiline, style, ...props }: Props) {
  const { colors } = useTheme();

  return (
    <View style={{ gap: 6 }}>
      {label ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '900', textTransform: 'uppercase' }}>
          {label}
        </Text>
      ) : null}
      <TextInput
        keyboardType={keyboardType}
        multiline={multiline}
        textAlignVertical={multiline ? 'top' : 'center'}
        placeholder={props.placeholder ?? label}
        placeholderTextColor={colors.onSurfaceSecondary}
        accessibilityLabel={label ?? props.placeholder}
        style={[
          {
            minHeight: multiline ? 104 : 48,
            borderWidth: 1,
            borderRadius: 8,
            paddingHorizontal: 14,
            paddingTop: multiline ? 12 : 0,
            paddingBottom: multiline ? 12 : 0,
            fontWeight: '700',
            color: colors.text,
            borderColor: error ? colors.error : colors.border,
            backgroundColor: colors.background,
          },
          style,
        ]}
        {...props}
      />
      {error ? (
        <Text style={{ color: colors.error, fontSize: 12, fontWeight: '800' }}>{error}</Text>
      ) : helperText ? (
        <Text style={{ color: colors.textSecondary, fontSize: 12, fontWeight: '700' }}>{helperText}</Text>
      ) : null}
    </View>
  );
}
