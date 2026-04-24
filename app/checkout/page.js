import CheckoutForm from "@/components/checkout-form";

export const metadata = {
  title: "Checkout | Luti Relogios",
  description: "Fluxo de checkout em etapas para finalizar sua compra.",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="mt-4 font-serif text-3xl font-bold text-slate-900">Checkout</h1>
        <p className="mt-2 text-sm text-slate-600">
          Confira seus dados, revise o carrinho e continue para o Stripe.
        </p>
      </div>
      <CheckoutForm />
    </div>
  );
}
