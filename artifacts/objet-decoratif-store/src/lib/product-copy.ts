type ProductCopyFields = {
  description: string;
  descriptionDe?: string | null;
  explanation: string;
  explanationDe?: string | null;
};

type Translator = (text: string) => string;

function localizedText(
  englishText: string,
  germanText: string | null | undefined,
  locale: string,
  translate: Translator,
): string {
  const german = locale.toLowerCase().startsWith("de");
  return german && germanText?.trim() ? germanText : translate(englishText);
}

export function localizedProductDescription(
  product: ProductCopyFields,
  locale: string,
  translate: Translator,
): string {
  return localizedText(product.description, product.descriptionDe, locale, translate);
}

export function localizedProductExplanation(
  product: ProductCopyFields,
  locale: string,
  translate: Translator,
): string {
  return localizedText(product.explanation, product.explanationDe, locale, translate);
}
