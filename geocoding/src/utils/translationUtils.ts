import type { TFunction } from 'i18next';

/**
 * Get translated text for plant types and categories using translation_key
 * Falls back to the original name if translation is not found
 */
export const getTranslatedText = (
  t: TFunction,
  translationKey: string | undefined | null,
  fallbackText: string
): string => {
  if (!translationKey) {
    return fallbackText;
  }

  try {
    const translated = t(translationKey);
    // If translation returns the same key, it means no translation was found
    if (translated === translationKey) {
      return fallbackText;
    }
    return translated;
  } catch (error) {
    console.warn(`Translation failed for key: ${translationKey}`, error);
    return fallbackText;
  }
};

/**
 * Get translated plant type name
 */
export const getTranslatedPlantType = (
  t: TFunction,
  plantTypeName: string,
  translationKey?: string | null
): string => {
  return getTranslatedText(t, translationKey, plantTypeName);
};

/**
 * Get translated category name
 */
export const getTranslatedCategory = (
  t: TFunction,
  categoryName: string,
  translationKey?: string | null
): string => {
  return getTranslatedText(t, translationKey, categoryName);
};
