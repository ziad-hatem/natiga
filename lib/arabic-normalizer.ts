export function normalizeArabicText(text: string): string {
  if (!text) return ""

  return (
    text
      // Remove diacritics (تشكيل)
      .replace(/[\u064B-\u0652\u0670\u0640]/g, "")
      // Normalize Alef variations
      .replace(/[أإآ]/g, "ا")
      // Normalize Yeh variations
      .replace(/[ىئ]/g, "ي")
      // Normalize Teh Marbuta
      .replace(/ة/g, "ه")
      // Remove extra spaces and trim
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase()
  )
}
