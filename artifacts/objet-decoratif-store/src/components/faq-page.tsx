import { useEffect } from "react";
import { Link } from "wouter";
import { ArrowRight } from "lucide-react";
import { useLanguage } from "@/lib/language";

const faqEntries = [
  {
    question: "How does the refill system work?",
    answer:
      "When the candle is finished and the vessel has cooled, place a new wax refill inside the same vessel. Choose the same scent or change the atmosphere.",
  },
  {
    question: "Which refill sizes are available?",
    answer:
      "The shop lists a small 190 g refill and a big 245 g refill. If you are unsure which size is right for your vessel, contact us before ordering.",
  },
  {
    question: "How long does the 245 g refill burn?",
    answer: "The 245 g refill burns for up to 65 hours.",
  },
  {
    question: "How long does standard delivery take?",
    answer:
      "The current standard delivery estimate shown at checkout is 3–5 working days.",
  },
];

export function FaqPage() {
  const { t, locale } = useLanguage();
  const title = t("Frequently asked questions about refillable candles | Objet Décoratif");
  const description = t(
    "Answers about candle refills, available sizes, burn time and delivery for Objet Décoratif.",
  );

  useEffect(() => {
    const previousTitle = document.title;
    const canonical = "https://objet-decoratif-storefront.replit.app/faq";
    document.title = title;

    const setMeta = (key: string, value: string) => {
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[name="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.name = key;
        document.head.appendChild(tag);
      }
      tag.content = value;
    };
    setMeta("description", description);
    const setProperty = (key: string, value: string) => {
      let tag = document.head.querySelector<HTMLMetaElement>(`meta[property="${key}"]`);
      if (!tag) {
        tag = document.createElement("meta");
        tag.setAttribute("property", key);
        document.head.appendChild(tag);
      }
      tag.content = value;
    };
    setProperty("og:type", "website");
    setProperty("og:title", title);
    setProperty("og:description", description);
    setProperty("og:url", canonical);
    setMeta("twitter:card", "summary_large_image");
    setMeta("twitter:title", title);
    setMeta("twitter:description", description);

    let canonicalTag = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonicalTag) {
      canonicalTag = document.createElement("link");
      canonicalTag.rel = "canonical";
      document.head.appendChild(canonicalTag);
    }
    canonicalTag.href = canonical;

    let schema = document.head.querySelector<HTMLScriptElement>("#faq-structured-data");
    if (!schema) {
      schema = document.createElement("script");
      schema.id = "faq-structured-data";
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }
    schema.textContent = JSON.stringify({
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqEntries.map(({ question, answer }) => ({
        "@type": "Question",
        name: t(question),
        acceptedAnswer: { "@type": "Answer", text: t(answer) },
      })),
    });

    return () => {
      document.title = previousTitle;
      schema?.remove();
    };
  }, [description, locale, t, title]);

  return (
    <main className="faq-page">
      <section className="editorial-hero faq-hero">
        <div className="editorial-hero-copy">
          <div className="section-kicker">{t("FAQ / Objet Décoratif")}</div>
          <h1>{t("Questions")}<br /><em>{t("answered.")}</em></h1>
          <p>{t("Answers about our refillable concrete candles, scents and delivery.")}</p>
        </div>
      </section>
      <section className="faq-content">
        <div className="section-kicker">{t("Product information")}</div>
        <h2>{t("Frequently asked questions")}</h2>
        <div className="faq-list">
          {faqEntries.map(({ question, answer }, index) => (
            <details className="faq-item" key={question} data-testid={`faq-item-${index + 1}`}>
              <summary>
                <span>{t(question)}</span>
                <span aria-hidden="true">+</span>
              </summary>
              <p>{t(answer)}</p>
            </details>
          ))}
        </div>
        <p className="faq-contact">
          {t("Still unsure?")}{" "}
          <Link href="/contact">{t("Contact us")} <ArrowRight size={13} /></Link>
        </p>
      </section>
    </main>
  );
}
