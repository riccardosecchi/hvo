import { LoginForm } from "@/components/admin/login-form";

interface LoginPageProps {
  params: Promise<{ locale: string }>;
}

export default async function LoginPage({ params }: LoginPageProps) {
  const { locale } = await params;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-20">
      {/* Background gradient orbs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute w-[500px] h-[500px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(0, 229, 255, 0.1) 0%, transparent 70%)",
            top: "20%",
            left: "10%",
            filter: "blur(60px)",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(233, 30, 140, 0.08) 0%, transparent 70%)",
            bottom: "20%",
            right: "10%",
            filter: "blur(60px)",
          }}
        />
      </div>

      <LoginForm locale={locale} />
    </div>
  );
}
