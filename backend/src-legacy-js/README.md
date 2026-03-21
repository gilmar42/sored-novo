# Arquivo de compatibilidade (legado)

Este diretorio contem os arquivos JavaScript legados que existiam em `backend/src/**/*.js`.

Motivo: o projeto ja possui as versoes TypeScript (`.ts`) e, quando os dois coexistem,
o Jest/Node pode resolver o `.js` primeiro dependendo da configuracao, causando
conflitos e comportamentos diferentes entre dev/teste.

O backend deve usar os arquivos `.ts` em `backend/src/` (dev) e o build em `backend/dist/` (producao).

