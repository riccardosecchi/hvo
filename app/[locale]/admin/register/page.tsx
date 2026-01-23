import { RegisterForm } from "@/components/admin/register-form";

interface RegisterPageProps {
  params: Promise<{ locale: string }>;
}

export default async function RegisterPage({ params }: RegisterPageProps) {
  const { locale } = await params;

  return <RegisterForm locale={locale} />;
}
