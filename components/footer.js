export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-2 px-4 py-8 text-sm text-slate-500 sm:px-6 lg:px-8">
        <p>&copy; {new Date().getFullYear()} Luti Relogios. Todos os direitos reservados.</p>
        <p>Relogios originais, garantia e atendimento especializado.</p>
      </div>
    </footer>
  );
}
