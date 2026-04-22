import { StyleSheet, View } from 'react-native';
import { Text, TouchableRipple, useTheme } from 'react-native-paper';

interface Props {
  label: string;
  value: string;
  placeholder?: string;
  onPress: () => void;
  disabled?: boolean;
}

export function FieldRow({ label, value, placeholder, onPress, disabled }: Props) {
  const theme = useTheme();
  const shown = value || placeholder || '—';
  const isPlaceholder = !value;
  return (
    <TouchableRipple onPress={onPress} disabled={disabled}>
      <View
        style={[
          styles.row,
          { borderColor: theme.colors.outline, opacity: disabled ? 0.5 : 1 },
        ]}
      >
        <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
          {label}
        </Text>
        <Text
          variant="bodyLarge"
          style={{
            color: isPlaceholder ? theme.colors.onSurfaceVariant : theme.colors.onSurface,
          }}
        >
          {shown}
        </Text>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  row: {
    borderWidth: 1,
    borderRadius: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 2,
  },
});
