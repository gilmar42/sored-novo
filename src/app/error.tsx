/* eslint-disable @next/next/no-html-link-for-pages */
'use client';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <main className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400">
          Erro de Página
        </p>
        <h1 className="mt-3 text-3xl font-bold">Não foi possível carregar esta página</h1>
        <p className="mt-3 text-sm text-slate-400">
          Ocorreu um erro inesperado nesta rota. Você pode tentar novamente ou voltar ao início.
        </p>

        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
          >
            Tentar novamente
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
          >
            Ir para o início
          </a>
        </div>
      </main>
    </div>
  );
}
