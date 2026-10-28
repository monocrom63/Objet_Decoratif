import { useMemo } from "react";
import {
  useGetPageCopy,
  type PageCopy,
} from "@workspace/api-client-react";
import { useLanguage } from "@/lib/language";
import { translate } from "@/lib/translations";

export const PAGE_COPY_FIELDS = [
  { key: "about.hero.title.objects", page: "about", section: "Hero", label: "Headline · first line", source: "Objects" },
  { key: "about.hero.title.meaning", page: "about", section: "Hero", label: "Headline · second line", source: "with meaning." },
  { key: "about.hero.description", page: "about", section: "Hero", label: "Intro text", source: "A long-standing passion for interiors, transformed into handpicked objects that give a space character, permanence and quiet intention.", multiline: true },
  { key: "about.hero.note", page: "about", section: "Hero", label: "Side note", source: "Sculptural objects / Refillable by design", multiline: true },
  { key: "about.story.kicker", page: "about", section: "Our approach", label: "Section heading", source: "Curated with intention" },
  { key: "about.story.heading", page: "about", section: "Our approach", label: "Main headline", source: "We do not simply inhabit spaces. We fill them with meaning.", multiline: true },
  { key: "about.story.intro", page: "about", section: "Our approach", label: "First paragraph", source: "Objet Décoratif transforms a long-standing passion for interior design and decoration into handpicked, extraordinary objects. It is the result of a conscious decision: not just to inhabit spaces, but to fill them with meaning.", multiline: true },
  { key: "about.story.selection", page: "about", section: "Our approach", label: "Second paragraph", source: "Our selection follows a simple rule — we curate only what we truly love ourselves. Beautiful things belong together when they share the same care, clarity and intention.", multiline: true },
  { key: "about.principle.curated", page: "about", section: "Principles", label: "First principle", source: "Only objects we would choose for our own spaces — considered, distinctive and made with care.", multiline: true },
  { key: "about.principle.remain.title", page: "about", section: "Principles", label: "Second principle · title", source: "Designed to remain" },
  { key: "about.principle.remain", page: "about", section: "Principles", label: "Second principle · text", source: "Sculptural vessels that continue beyond the first flame: objects to keep, refill and return to.", multiline: true },
  { key: "about.principle.scents.title", page: "about", section: "Principles", label: "Third principle · title", source: "Scents from Grasse" },
  { key: "about.principle.scents", page: "about", section: "Principles", label: "Third principle · text", source: "Our candle perfumes are developed with specialists in Grasse and selected to complement every form.", multiline: true },
  { key: "about.facts.kicker", page: "about", section: "Made with intention", label: "Section heading", source: "Berlin / Grasse" },
  { key: "about.facts.heading", page: "about", section: "Made with intention", label: "Main headline", source: "From the atelier to the atmosphere." },
  { key: "about.facts.berlin.title", page: "about", section: "Made with intention", label: "Berlin · title", source: "Berlin atelier" },
  { key: "about.facts.berlin", page: "about", section: "Made with intention", label: "Berlin · text", source: "Each refill is hand-poured in our Berlin atelier and precisely tailored to our sculptures.", multiline: true },
  { key: "about.facts.grasse.title", page: "about", section: "Made with intention", label: "Grasse · title", source: "Fragrance from Grasse" },
  { key: "about.facts.grasse", page: "about", section: "Made with intention", label: "Grasse · text", source: "Grasse is considered the perfume capital of the world. This small town in the south of France, in Provence near the French Riviera, has been closely associated with the art of perfumery for centuries. Its significance lies in the combination of an ideal climate, precious fragrance ingredients, and an exceptional tradition of fragrance composition.", multiline: true },
  { key: "about.closing.title.object", page: "about", section: "Closing", label: "Headline · first line", source: "Keep the object." },
  { key: "about.closing.title.atmosphere", page: "about", section: "Closing", label: "Headline · second line", source: "Change the atmosphere." },
  { key: "about.closing.description", page: "about", section: "Closing", label: "Closing text", source: "Filling spaces with objects that genuinely make you want to have them — that is what we are all about. Not just for ourselves, but for everyone who knows that beauty and care in the details matter.", multiline: true },

  { key: "care.hero.title.first", page: "care", section: "Hero", label: "Headline · first line", source: "Care for" },
  { key: "care.hero.title.second", page: "care", section: "Hero", label: "Headline · second line", source: "the flame." },
  { key: "care.hero.description", page: "care", section: "Hero", label: "Intro text", source: "A few considered habits help every candle burn evenly, keep the vessel clean and let the perfume unfold as intended.", multiline: true },
  { key: "care.hero.note", page: "care", section: "Hero", label: "Side note", source: "Even burn / Clean vessel / Balanced scent", multiline: true },
  { key: "care.essentials.kicker", page: "care", section: "The essentials", label: "Section heading", source: "Care extends the ritual" },
  { key: "care.essentials.heading", page: "care", section: "The essentials", label: "Main headline", source: "A clean, even burn starts with the wick.", multiline: true },
  { key: "care.essentials.intro", page: "care", section: "The essentials", label: "First paragraph", source: "We tested numerous wax and wick combinations. This pairing was selected for a steady burn and balanced scent diffusion. Caring for it well helps the candle perform as intended.", multiline: true },
  { key: "care.essentials.instructions", page: "care", section: "The essentials", label: "Second paragraph", source: "Let the wax pool become fully liquid on the first burn, keep the wick centered and remove any debris before lighting. Small adjustments make a noticeable difference.", multiline: true },
  { key: "care.facts.wick", page: "care", section: "The essentials", label: "Wick note", source: "Wick trim only after the wax has fully set.", multiline: true },
  { key: "care.facts.recommended", page: "care", section: "The essentials", label: "Recommended burn time", source: "Recommended burn time for regular-sized candles.", multiline: true },
  { key: "care.facts.maximum", page: "care", section: "The essentials", label: "Maximum burn time", source: "Do not exceed four hours in one burn.", multiline: true },
  { key: "care.facts.finish", page: "care", section: "The essentials", label: "When to stop burning", source: "Stop burning when this amount of wax remains.", multiline: true },
  { key: "care.steps.title.first", page: "care", section: "Step by step", label: "Headline · first line", source: "How to care" },
  { key: "care.steps.title.second", page: "care", section: "Step by step", label: "Headline · second line", source: "for your candle." },
  { key: "care.steps.first.title", page: "care", section: "Step by step", label: "Step 1 · title", source: "The first burn" },
  { key: "care.steps.first", page: "care", section: "Step by step", label: "Step 1 · text", source: "Allow the melt pool to become fully liquid and reach the edges of the refill. This establishes an even burn and helps prevent tunnelling during future use.", multiline: true },
  { key: "care.steps.each.title", page: "care", section: "Step by step", label: "Step 2 · title", source: "Each time you burn" },
  { key: "care.steps.each", page: "care", section: "Step by step", label: "Step 2 · text", source: "Place the candle in a well-ventilated room, away from drafts and fans. Burn regular-sized candles for 1½–2 hours at a time and never longer than four hours.", multiline: true },
  { key: "care.steps.wick.title", page: "care", section: "Step by step", label: "Step 3 · title", source: "Care for the wick" },
  { key: "care.steps.wick", page: "care", section: "Step by step", label: "Step 3 · text", source: "Keep the wax pool free from wick trimmings, matches and debris. After extinguishing, gently re-center the wick while the wax is still soft. Once fully set, trim it to approximately 5 mm.", multiline: true },
  { key: "care.steps.finish.title", page: "care", section: "Step by step", label: "Step 4 · title", source: "Extinguish and finish" },
  { key: "care.steps.finish", page: "care", section: "Step by step", label: "Step 4 · text", source: "Use the lid or a candle snuffer to extinguish the flame. Let the vessel cool before touching or moving it. Discontinue use when approximately 10 mm of wax remains at the bottom.", multiline: true },
  { key: "care.safety.heading", page: "care", section: "Safety first", label: "Main headline", source: "Never leave a burning candle unattended.", multiline: true },
  { key: "care.safety.clear.title", page: "care", section: "Safety first", label: "Safety note 1 · title", source: "Keep a clear space" },
  { key: "care.safety.clear", page: "care", section: "Safety first", label: "Safety note 1 · text", source: "Keep away from children, pets and flammable materials.", multiline: true },
  { key: "care.safety.surface.title", page: "care", section: "Safety first", label: "Safety note 2 · title", source: "Use a stable surface" },
  { key: "care.safety.surface", page: "care", section: "Safety first", label: "Safety note 2 · text", source: "Place on a stable, heat-resistant surface.", multiline: true },
  { key: "care.safety.flame.title", page: "care", section: "Safety first", label: "Safety note 3 · title", source: "Watch the flame" },
  { key: "care.safety.flame", page: "care", section: "Safety first", label: "Safety note 3 · text", source: "Extinguish if the flame becomes unusually high or the wick moves close to the vessel wall.", multiline: true },
  { key: "care.safety.cool.title", page: "care", section: "Safety first", label: "Safety note 4 · title", source: "Let the vessel cool" },
  { key: "care.safety.cool", page: "care", section: "Safety first", label: "Safety note 4 · text", source: "Allow the vessel and wax to cool completely before handling.", multiline: true },
  { key: "care.closing.title.vessel", page: "care", section: "Continue the ritual", label: "Headline · first line", source: "Keep the vessel." },
  { key: "care.closing.title.scent", page: "care", section: "Continue the ritual", label: "Headline · second line", source: "Renew the scent." },
  { key: "care.closing.description", page: "care", section: "Continue the ritual", label: "Closing text", source: "Once the candle is finished and the vessel has cooled completely, continue with a new refill. The object remains; only the atmosphere changes.", multiline: true },
] as const;

export type SitePage = "about" | "care";
export type SitePageCopyKey = (typeof PAGE_COPY_FIELDS)[number]["key"];
export type SitePageCopyValues = Record<
  string,
  { english: string; german: string }
>;

export function pageCopyDefaults(
  saved: readonly PageCopy[] = [],
): SitePageCopyValues {
  const savedByKey = new Map(saved.map((item) => [item.key, item]));
  return Object.fromEntries(
    PAGE_COPY_FIELDS.map((field) => {
      const savedField = savedByKey.get(field.key);
      return [
        field.key,
        {
          english: savedField?.english ?? field.source,
          german: savedField?.german ?? translate(field.source, "DE"),
        },
      ];
    }),
  );
}

export function resolvePageCopy(
  key: SitePageCopyKey,
  saved: readonly PageCopy[],
  language: "EN" | "DE",
  fallback: (source: string) => string,
): string {
  const field = PAGE_COPY_FIELDS.find((candidate) => candidate.key === key);
  if (!field) return "";
  const stored = saved.find((item) => item.key === key);
  if (stored) return language === "DE" ? stored.german : stored.english;
  return fallback(field.source);
}

export function useSitePageCopy() {
  const query = useGetPageCopy();
  const { language, t } = useLanguage();
  const saved = useMemo(() => query.data ?? [], [query.data]);

  return {
    copy: (key: SitePageCopyKey) => resolvePageCopy(key, saved, language, t),
    isLoading: query.isLoading,
  };
}
