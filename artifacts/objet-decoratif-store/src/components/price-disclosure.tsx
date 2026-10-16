import { Link } from "wouter";
import { useLanguage } from "@/lib/language";

export function PriceDisclosure({ className = "" }: { className?: string }) {
  const { t } = useLanguage();

  return (
    <p className={`price-disclosure ${className}`.trim()}>
      <span>{t("Prices include VAT; shipping extra")}</span>
      <span aria-hidden="true">·</span>
      <Link href="/shipping-policy">{t("Shipping costs & delivery")}</Link>
      <span className="price-disclosure__delivery">
        {t("Delivery time: 3–5 working days")}
      </span>
    </p>
  );
}
