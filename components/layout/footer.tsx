import { useTranslations } from "next-intl";
import Image from "next/image";

export function Footer() {
  const t = useTranslations("footer");

  return (
    <footer className="border-t border-border/50 bg-background/50 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col items-center gap-4">
          <Image
            src="/logos/04_HVO.jpg"
            alt="HVO"
            width={80}
            height={32}
            className="h-8 w-auto opacity-70"
          />
          <p className="text-sm text-muted-foreground">{t("copyright")}</p>
        </div>
      </div>
    </footer>
  );
}
