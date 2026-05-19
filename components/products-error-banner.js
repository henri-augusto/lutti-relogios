export default function ProductsErrorBanner({ title = "Nao foi possivel carregar os produtos", message }) {
  return (
    <div
      role="alert"
      className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-900"
    >
      <p className="font-semibold">{title}</p>
      {message ? <p className="mt-2 text-red-800">{message}</p> : null}
      <p className="mt-3 text-xs text-red-700">
        Verifique as variaveis NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY
        (ou NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY), a tabela{" "}
        <code className="rounded bg-red-100 px-1">produto</code> e as politicas RLS no Supabase.
      </p>
    </div>
  );
}
