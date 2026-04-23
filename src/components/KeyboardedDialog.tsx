import { useEffect, useState, type ComponentProps, type ReactNode } from "react"
import { Keyboard, Platform } from "react-native"
import { Dialog } from "react-native-paper"

type PaperDialogProps = ComponentProps<typeof Dialog>

interface Props extends PaperDialogProps {
  children: ReactNode
}

/**
 * Paper Dialog that shifts up when the keyboard opens so the action row stays visible.
 * Relies on `react-native-keyboard-controller`'s provider being mounted at the root so the
 * keyboard show/hide events fire reliably on both platforms. Uses RN's `Keyboard` API here
 * because Paper's Dialog only exposes a plain (non-animated) `style` prop.
 */
export function KeyboardedDialog({ style, children, ...rest }: Props) {
  const [kbHeight, setKbHeight] = useState(0)

  useEffect(() => {
    const showEvt =
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow"
    const hideEvt =
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide"
    const s1 = Keyboard.addListener(showEvt, (e) =>
      setKbHeight(e.endCoordinates.height),
    )
    const s2 = Keyboard.addListener(hideEvt, () => setKbHeight(0))
    return () => {
      s1.remove()
      s2.remove()
    }
  }, [])

  // A centered Paper dialog is effectively pushed "up" if we add bottom margin
  // equal to (roughly half) the keyboard height. Full height works too and keeps
  // the whole thing safely above; half keeps it closer to centered.
  const offset = kbHeight > 0 ? kbHeight / 2 : 0

  return (
    <Dialog {...rest} style={[style, { marginBottom: offset }]}>
      {children}
    </Dialog>
  )
}
