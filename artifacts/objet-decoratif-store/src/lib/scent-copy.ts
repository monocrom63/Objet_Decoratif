import type { ScentOption } from "./catalog.ts";

type Translator = (text: string) => string;

function localizedText(
  englishText: string,
  germanText: string | null | undefined,
  locale: string,
  translate: Translator,
): string {
  if (locale.toLowerCase().startsWith("de") && germanText?.trim()) {
    return germanText;
  }
  return translate(englishText);
}

export function localizedScentNotes(
  scent: ScentOption,
  locale: string,
  translate: Translator,
): string {
  return localizedText(scent.notes, scent.notesDe, locale, translate);
}

export function localizedScentDescription(
  scent: ScentOption,
  locale: string,
  translate: Translator,
): string {
  return localizedText(
    scent.description,
    scent.descriptionDe,
    locale,
    translate,
  );
}
