'use client';

import Link from 'next/link';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="pt-BR">
      <body className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6">
        <main className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
          <div className="mb-6">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-red-400">
              Erro do Sistema
            </p>
            <h1 className="mt-3 text-3xl font-bold">Falha ao carregar a aplicação</h1>
            <p className="mt-3 text-sm text-slate-400">
              Ocorreu um erro inesperado durante a renderização. Tente recarregar a página ou voltar para o início.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-3 text-sm font-semibold text-white hover:bg-indigo-500"
            >
              Tentar novamente
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-lg border border-slate-700 px-4 py-3 text-sm font-semibold text-slate-200 hover:bg-slate-800"
            >
              Ir para o início
            </Link>
          </div>

          {error.digest && (
            <p className="mt-6 text-xs text-slate-500">
              Código de referência: {error.digest}
            </p>
          )}
        </main>
      </body>
    </html>
  );
}
