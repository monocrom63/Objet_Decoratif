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
        {t("Ready for dispatch: 3-5 working days.")}
      </span>
      <span className="price-disclosure__delivery">
        {t("Free shipping on orders over €100.")}
      </span>
    </p>
  );
}
