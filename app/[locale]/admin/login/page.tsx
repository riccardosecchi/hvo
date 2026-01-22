import { LoginForm } from "@/components/admin/login-form";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <LoginForm locale={locale} />
    </div>
  );
}
