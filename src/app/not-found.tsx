import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <main className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 text-center shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">
          404
        </p>
        <h1 className="mt-3 text-3xl font-bold">Página não encontrada</h1>
        <p className="mt-3 text-sm text-slate-400">
          A rota solicitada não existe ou foi movida.
        </p>
        <Link
          href="/"
          className="mt-6 inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
        >
          Voltar para o início
        </Link>
      </main>
    </div>
  );
}
