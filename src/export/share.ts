import { File, Paths } from "expo-file-system"
import * as Sharing from "expo-sharing"

export async function shareCsv(
  filename: string,
  content: string,
): Promise<boolean> {
  if (!(await Sharing.isAvailableAsync())) return false
  const file = new File(Paths.cache, filename)
  if (file.exists) file.delete()
  file.create()
  file.write(content)
  await Sharing.shareAsync(file.uri, {
    mimeType: "text/csv",
    dialogTitle: filename,
    UTI: "public.comma-separated-values-text",
  })
  return true
}
