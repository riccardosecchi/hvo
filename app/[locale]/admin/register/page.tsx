import { RegisterForm } from "@/components/admin/register-form";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center px-4">
      <RegisterForm locale={locale} />
    </div>
  );
}
