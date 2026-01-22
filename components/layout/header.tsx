import Image from "next/image";
import Link from "next/link";
import { LanguageToggle } from "./language-toggle";

interface HeaderProps {
  locale: string;
}

export function Header({ locale }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md bg-background/80 border-b border-border/50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href={`/${locale}`} className="flex items-center">
          <Image
            src="/logos/04_HVO.jpg"
            alt="HVO"
            width={100}
            height={40}
            className="h-10 w-auto"
            priority
          />
        </Link>
        <LanguageToggle />
      </div>
    </header>
  );
}
