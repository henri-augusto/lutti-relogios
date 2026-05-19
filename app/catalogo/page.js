import CatalogProductGrid from "@/components/catalog-product-grid";
import ProductGridSkeleton from "@/components/product-grid-skeleton";
import ProductsErrorBanner from "@/components/products-error-banner";
import { ProductsFetchError, getProdutos } from "@/lib/domain/produtos";
import Link from "next/link";
import { Suspense } from "react";

export const metadata = {
  title: "Catálogo | Luti Relógios",
  description: "Explore nosso catálogo completo de relógios premium.",
};

export const revalidate = 60;
const ALL_FILTER = "todos";
const UNKNOWN_BRAND = "Sem marca";
const UNKNOWN_GENDER = "Não informado";
const BRAND_PRESET = [
  { label: "Technos", aliases: ["technos"] },
  { label: "Condor", aliases: ["condor"] },
  { label: "Euro", aliases: ["euro"] },
  { label: "Mormaii", aliases: ["mormaii"] },
  { label: "Champion", aliases: ["champion"] },
  { label: "Citizen", aliases: ["citizen"] },
  { label: "Orient", aliases: ["orient"] },
  { label: "Tuguir", aliases: ["tuguir"] },
  { label: "Backer", aliases: ["backer"] },
  { label: "Philyph London", aliases: ["philyph london", "philyph-london"] },
  { label: "X Games", aliases: ["x games", "x-games", "xgames"] },
  { label: "Magnum", aliases: ["magnum"] },
  { label: "Weide", aliases: ["weide"] },
  { label: "X-Watch", aliases: ["x-watch", "xwatch", "x watch"] },
  { label: "Seiko", aliases: ["seiko"] },
];

function normalizeText(value) {
  return String(value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}

function detectGenero(product) {
  const texto = normalizeText(
    `${product?.genero ?? ""} ${product?.nome ?? ""} ${product?.descricao ?? ""} ${
      product?.descricaoComplementar ?? ""
    }`,
  );

  if (!texto) {
    return UNKNOWN_GENDER;
  }
  if (texto.includes("unissex")) {
    return "Unissex";
  }
  if (texto.includes("feminino") || texto.includes("feminina")) {
    return "Feminino";
  }
  if (texto.includes("masculino") || texto.includes("masculina")) {
    return "Masculino";
  }
  if (texto.includes("infantil")) {
    return "Infantil";
  }
  return UNKNOWN_GENDER;
}

function detectMarca(product) {
  const marcaDireta = String(product?.marca ?? product?.brand ?? "").trim();
  const nome = String(product?.nome ?? "").trim();
  const baseText = normalizeText(`${marcaDireta} ${nome}`);

  for (const brand of BRAND_PRESET) {
    const found = brand.aliases.some((alias) => baseText.includes(normalizeText(alias)));
    if (found) {
      return brand.label;
    }
  }

  return UNKNOWN_BRAND;
}

async function CatalogContent({ searchParams }) {
  const resolvedParams = await Promise.resolve(searchParams);
  const queryMarca = normalizeText(resolvedParams?.marca ?? ALL_FILTER);
  const queryGenero = normalizeText(resolvedParams?.genero ?? ALL_FILTER);

  try {
    const produtos = await getProdutos();
    const productsWithFilters = produtos.map((product) => ({
      ...product,
      __marca: detectMarca(product),
      __genero: detectGenero(product),
      __marcaKey: normalizeText(detectMarca(product)),
      __generoKey: normalizeText(detectGenero(product)),
    }));

    const marcas = Array.from(new Set(productsWithFilters.map((p) => p.__marca))).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
    const generos = Array.from(new Set(productsWithFilters.map((p) => p.__genero))).sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
    const marcasSet = new Set(marcas.map((marca) => normalizeText(marca)));
    const generosSet = new Set(generos.map((genero) => normalizeText(genero)));
    const selectedMarca = marcasSet.has(queryMarca) ? queryMarca : ALL_FILTER;
    const selectedGenero = generosSet.has(queryGenero) ? queryGenero : ALL_FILTER;
    const marcaCounts = new Map();
    const generoCounts = new Map();

    for (const product of productsWithFilters) {
      marcaCounts.set(product.__marca, (marcaCounts.get(product.__marca) ?? 0) + 1);
      generoCounts.set(product.__genero, (generoCounts.get(product.__genero) ?? 0) + 1);
    }

    const filteredProducts = productsWithFilters.filter((product) => {
      const marcaOk = selectedMarca === ALL_FILTER || product.__marcaKey === selectedMarca;
      const generoOk = selectedGenero === ALL_FILTER || product.__generoKey === selectedGenero;
      return marcaOk && generoOk;
    });

    return (
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <aside className="h-fit rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <form action="/catalogo" className="space-y-5">
            <div>
              <label
                htmlFor="catalog-marca"
                className="text-sm font-semibold uppercase tracking-wide text-slate-500"
              >
                Filtrar por marca
              </label>
              <select
                id="catalog-marca"
                name="marca"
                defaultValue={selectedMarca}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value={ALL_FILTER}>Todas as marcas</option>
                {marcas.map((marca) => (
                  <option key={marca} value={normalizeText(marca)}>
                    {marca} ({marcaCounts.get(marca) ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="border-t border-slate-100 pt-5">
              <label
                htmlFor="catalog-genero"
                className="text-sm font-semibold uppercase tracking-wide text-slate-500"
              >
                Filtrar por gênero
              </label>
              <select
                id="catalog-genero"
                name="genero"
                defaultValue={selectedGenero}
                className="mt-3 w-full rounded-lg border border-slate-200 bg-white px-3 py-2.5 text-sm font-medium text-slate-700 shadow-sm outline-none transition hover:border-slate-300 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10"
              >
                <option value={ALL_FILTER}>Todos os gêneros</option>
                {generos.map((genero) => (
                  <option key={genero} value={normalizeText(genero)}>
                    {genero} ({generoCounts.get(genero) ?? 0})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-3 border-t border-slate-100 pt-4">
              <button
                type="submit"
                className="rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-900/25"
              >
                Aplicar filtros
              </button>
              <Link
                href="/catalogo"
                className="text-center text-sm font-semibold text-slate-700 underline underline-offset-2 hover:text-slate-900"
              >
                Limpar filtros
              </Link>
            </div>
          </form>
        </aside>

        <div>
          <p className="mb-4 text-sm text-slate-600">
            Exibindo <strong>{filteredProducts.length}</strong> de{" "}
            <strong>{productsWithFilters.length}</strong> produtos.
          </p>
          <CatalogProductGrid products={filteredProducts} />
        </div>
      </div>
    );
  } catch (err) {
    const fetchError =
      err instanceof ProductsFetchError ? err.message : "Erro inesperado ao buscar produtos no Supabase.";
    return <ProductsErrorBanner message={fetchError} />;
  }
}

export default function CatalogoPage({ searchParams }) {
  return (
    <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="mb-8">
        <h1 className="font-serif text-3xl font-bold text-slate-900">Catálogo de Relógios</h1>
        <p className="mt-2 text-sm text-slate-600">
          Encontre o modelo ideal para seu estilo com compra segura e atendimento exclusivo.
        </p>
      </div>
      <Suspense
        fallback={
          <ProductGridSkeleton
            count={8}
            gridClassName="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4"
          />
        }
      >
        <CatalogContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
