import { useTranslations } from "next-intl";

export default function HomePage() {
  const t = useTranslations("hero");

  return (
    <main className="min-h-screen flex items-center justify-center">
      <h1 className="text-4xl font-bold text-primary">{t("tagline")}</h1>
    </main>
  );
}
