import RegisterPanel from "@/components/register-panel";

export const metadata = {
  title: "Criar conta | Luti Relogios",
  description: "Cadastre-se na Luti Relogios.",
};

export default function RegisterPage() {
  return (
    <main className="relative min-h-screen overflow-hidden">
      <div
        className="fixed inset-0 -z-20 bg-cover bg-center bg-no-repeat bg-fixed"
        style={{ backgroundImage: "url('/mao_segunrando_relogio.jpg')" }}
      />
      <div className="fixed inset-0 -z-10 bg-stone-900/45" />
      <div className="mx-auto flex min-h-screen w-full max-w-6xl items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
        <RegisterPanel />
      </div>
    </main>
  );
}
