import ProductCard from "@/components/product-card";

export default function ProductGrid({
  products,
  className = "grid gap-5 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3",
}) {
  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-600">
        Nenhum produto disponivel no momento.
      </div>
    );
  }

  return (
<<<<<<< HEAD
    <section className="grid gap-5 sm:auto-rows-fr sm:grid-cols-2 lg:grid-cols-3">
=======
    <section className={className}>
>>>>>>> main
      {products.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </section>
  );
}
