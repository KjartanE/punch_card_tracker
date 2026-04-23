import { ScrollView, View } from "react-native"
import { Button, Dialog, List, Portal, Text } from "react-native-paper"

interface Option {
  id: string
  title: string
  description?: string
}

interface Props {
  visible: boolean
  title: string
  options: Option[]
  selectedId?: string | null
  emptyHint?: string
  onSelect: (id: string) => void
  onDismiss: () => void
}

export function PickerDialog({
  visible,
  title,
  options,
  selectedId,
  emptyHint = "No options available.",
  onSelect,
  onDismiss,
}: Props) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.ScrollArea style={{ paddingHorizontal: 0 }}>
          {options.length === 0 ? (
            <View style={{ padding: 24 }}>
              <Text style={{ opacity: 0.6, textAlign: "center" }}>
                {emptyHint}
              </Text>
            </View>
          ) : (
            <ScrollView style={{ maxHeight: 360 }}>
              {options.map((opt) => (
                <List.Item
                  key={opt.id}
                  title={opt.title}
                  description={opt.description}
                  onPress={() => onSelect(opt.id)}
                  right={
                    selectedId === opt.id
                      ? (props) => <List.Icon {...props} icon="check" />
                      : undefined
                  }
                />
              ))}
            </ScrollView>
          )}
        </Dialog.ScrollArea>
        <Dialog.Actions>
          <Button onPress={onDismiss}>Cancel</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  )
}
