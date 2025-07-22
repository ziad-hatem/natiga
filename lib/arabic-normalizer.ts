// lib/arabic-normalizer.ts (Browser-compatible version)

/**
 * Browser-compatible Arabic text normalizer
 * Based on arabic-normalizer principles but without Node.js dependencies
 */

interface NormalizerOptions {
  alif?: boolean;
  diac?: boolean;
  tatweel?: boolean;
  digits?: boolean;
  punc?: boolean;
  s_digits?: boolean;
  normalize_diac?: boolean;
  remove_punc?: boolean;
}

class ArabicNormalizer {
  private options: Required<NormalizerOptions>;

  constructor(options: NormalizerOptions = {}) {
    this.options = {
      alif: true,
      diac: true,
      tatweel: true,
      digits: true,
      punc: false,
      s_digits: false,
      normalize_diac: true,
      remove_punc: false,
      ...options,
    };
  }

  normalize(text: string): string {
    if (!text || typeof text !== "string") return "";

    let result = text;

    // Remove/normalize diacritics
    if (this.options.diac) {
      result = result.replace(/[\u064B-\u065F\u0670]/g, "");
    }

    // Normalize diacritics to standard form
    if (this.options.normalize_diac) {
      result = result
        .replace(/\u064B/g, "\u064B") // Fathatan
        .replace(/\u064C/g, "\u064C") // Dammatan
        .replace(/\u064D/g, "\u064D") // Kasratan
        .replace(/\u064E/g, "\u064E") // Fatha
        .replace(/\u064F/g, "\u064F") // Damma
        .replace(/\u0650/g, "\u0650") // Kasra
        .replace(/\u0651/g, "\u0651") // Shadda
        .replace(/\u0652/g, "\u0652"); // Sukun
    }

    // Normalize Alif variations
    if (this.options.alif) {
      result = result.replace(/[أإآا]/g, "ا");
    }

    // Remove Tatweel (kashida)
    if (this.options.tatweel) {
      result = result.replace(/\u0640/g, "");
    }

    // Convert Arabic digits to English
    if (this.options.digits) {
      const arabicDigits = "٠١٢٣٤٥٦٧٨٩";
      const englishDigits = "0123456789";
      for (let i = 0; i < arabicDigits.length; i++) {
        result = result.replace(
          new RegExp(arabicDigits[i], "g"),
          englishDigits[i]
        );
      }
    }

    // Handle punctuation
    if (this.options.remove_punc) {
      result = result.replace(
        /[^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s]/g,
        ""
      );
    }

    if (this.options.punc) {
      // Add spaces around punctuation for tokenization
      result = result.replace(
        /([^\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF\w\s])/g,
        " $1 "
      );
    }

    if (this.options.s_digits) {
      // Add spaces around digits for segmentation
      result = result.replace(/(\d+)/g, " $1 ");
    }

    // Clean up multiple spaces
    result = result.replace(/\s+/g, " ").trim();

    return result;
  }
}

// Create normalizer instances with different configurations
const basicNormalizer = new ArabicNormalizer({
  alif: true,
  diac: true,
  tatweel: true,
  digits: true,
  punc: false,
  s_digits: false,
  normalize_diac: true,
  remove_punc: false,
});

const searchNormalizer = new ArabicNormalizer({
  alif: true,
  diac: true,
  tatweel: true,
  digits: true,
  punc: true,
  s_digits: true,
  normalize_diac: true,
  remove_punc: true,
});

/**
 * Simple and reliable Arabic text normalizer
 */
export function normalizeArabicText(text: string): string {
  if (!text || typeof text !== "string") return "";

  try {
    return basicNormalizer.normalize(text).toLowerCase();
  } catch (error) {
    console.warn("Arabic normalization failed, using fallback:", error);
    // Fallback to basic normalization
    return text
      .replace(/[أإآا]/g, "ا")
      .replace(/[ىي]/g, "ي")
      .replace(/ة/g, "ه")
      .replace(/[\u064B-\u065F\u0670\u0640]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .toLowerCase();
  }
}

/**
 * Normalize Arabic text for search (more aggressive)
 */
export function normalizeArabicForSearch(text: string): string {
  if (!text || typeof text !== "string") return "";

  try {
    return searchNormalizer.normalize(text).toLowerCase();
  } catch (error) {
    console.warn("Arabic search normalization failed, using fallback:", error);
    return normalizeArabicText(text);
  }
}

/**
 * Generate Arabic name search variations
 */
export function generateArabicNameVariations(name: string): string[] {
  if (!name || typeof name !== "string") return [];

  const variations = new Set<string>();
  const cleanName = name.trim();

  // Add original
  variations.add(cleanName);

  // Add basic normalized version
  variations.add(normalizeArabicText(cleanName));

  // Add search normalized version
  variations.add(normalizeArabicForSearch(cleanName));

  try {
    // Generate variations using different normalizer configurations
    const configs: NormalizerOptions[] = [
      { alif: true, diac: false, tatweel: true, digits: true },
      { alif: false, diac: true, tatweel: true, digits: true },
      { alif: true, diac: true, tatweel: false, digits: true },
      { alif: true, diac: true, tatweel: true, digits: false },
    ];

    configs.forEach((config) => {
      const normalizer = new ArabicNormalizer({
        ...config,
        punc: false,
        s_digits: false,
        normalize_diac: true,
        remove_punc: false,
      });

      try {
        const normalized = normalizer.normalize(cleanName).toLowerCase();
        if (normalized && normalized.trim().length > 0) {
          variations.add(normalized);
        }
      } catch (error) {
        // Skip if this configuration fails
      }
    });
  } catch (error) {
    console.warn("Failed to generate advanced variations:", error);
  }

  // Add manual variations for common patterns
  const manualVariations = [
    cleanName.replace(/أ/g, "ا"),
    cleanName.replace(/إ/g, "ا"),
    cleanName.replace(/آ/g, "ا"),
    cleanName.replace(/ى/g, "ي"),
    cleanName.replace(/ي/g, "ى"),
    cleanName.replace(/ة/g, "ه"),
    cleanName.replace(/ه/g, "ة"),
    cleanName.replace(/على/g, "علي"),
    cleanName.replace(/علي/g, "على"),
    cleanName.replace(/محمد/g, "محمود"),
    cleanName.replace(/احمد/g, "أحمد"),
  ];

  manualVariations.forEach((variation) => {
    if (variation && variation.trim().length > 0) {
      variations.add(variation);
      variations.add(normalizeArabicText(variation));
    }
  });

  return Array.from(variations)
    .filter((v) => v && v.length > 0)
    .map((v) => v.trim())
    .filter((v) => v.length > 0);
}

/**
 * Create safe regex pattern for Arabic search
 */
export function createSafeArabicPattern(searchTerm: string): string {
  if (!searchTerm || typeof searchTerm !== "string") return "";

  const normalized = normalizeArabicForSearch(searchTerm);

  // Escape special regex characters
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Create flexible pattern that accounts for Arabic variations
  return escaped
    .replace(/ا/g, "[اأإآ]") // Alif variations
    .replace(/ي/g, "[يى]") // Ya variations
    .replace(/ه/g, "[هة]") // Ta Marbuta/Ha variations
    .replace(/\s+/g, "\\s*"); // Flexible whitespace
}

/**
 * Advanced Arabic search with fuzzy matching
 */
export function createFlexibleArabicPattern(searchTerm: string): string {
  if (!searchTerm || typeof searchTerm !== "string") return "";

  try {
    const searchNorm = new ArabicNormalizer({
      alif: true,
      diac: true,
      tatweel: true,
      digits: true,
      punc: true,
      s_digits: false,
      normalize_diac: true,
      remove_punc: true,
    });

    const normalized = searchNorm.normalize(searchTerm);
    const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

    return escaped
      .replace(/ا/g, "[اأإآ]?")
      .replace(/ي/g, "[يى]")
      .replace(/ه/g, "[هة]")
      .replace(/\s+/g, "\\s*");
  } catch (error) {
    // Fallback to simple pattern
    return createSafeArabicPattern(searchTerm);
  }
}

/**
 * Check if Arabic text matches search term
 */
export function arabicTextMatches(text: string, searchTerm: string): boolean {
  if (!text || !searchTerm) return false;

  try {
    const normalizedText = normalizeArabicForSearch(text);
    const normalizedSearch = normalizeArabicForSearch(searchTerm);

    // Direct match
    if (normalizedText.includes(normalizedSearch)) {
      return true;
    }

    // Pattern matching
    const pattern = createFlexibleArabicPattern(searchTerm);
    const regex = new RegExp(pattern, "gi");

    return regex.test(normalizedText);
  } catch (error) {
    // Fallback to simple string matching
    const normalizedText = normalizeArabicText(text);
    const normalizedSearch = normalizeArabicText(searchTerm);
    return normalizedText.includes(normalizedSearch);
  }
}

/**
 * Get word-level tokens from Arabic text
 */
export function tokenizeArabicText(text: string): string[] {
  if (!text || typeof text !== "string") return [];

  try {
    const tokenizer = new ArabicNormalizer({
      alif: true,
      diac: true,
      tatweel: true,
      digits: true,
      punc: true,
      s_digits: true,
      normalize_diac: true,
      remove_punc: true,
    });

    const normalized = tokenizer.normalize(text);
    return normalized.split(/\s+/).filter((token) => token.length > 0);
  } catch (error) {
    console.warn("Arabic tokenization failed, using fallback:", error);
    return normalizeArabicText(text)
      .split(/\s+/)
      .filter((token) => token.length > 0);
  }
}

// Export the normalizer class for advanced usage
export { ArabicNormalizer };
export type { NormalizerOptions };
