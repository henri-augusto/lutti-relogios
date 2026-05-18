import RegistrationForm from "@/components/registration-form";

export const metadata = {
  title: "Cadastro | Luti Relogios",
  description: "Cadastro opcional para cliente comum ou revendedor com atendimento via WhatsApp.",
};

export default function CadastroPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <RegistrationForm />
    </div>
  );
}
