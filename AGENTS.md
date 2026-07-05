# Regras do Projeto

- Responder sempre em portugues.
- Nao alterar arquivos `.env`, `.env.*` ou equivalentes com segredos sem instrucao explicita do usuario.
- Nao commitar `database.sqlite`, `*.sqlite`, `*.sqlite3` ou `*.db`.
- Nao commitar XML fiscal (`*.xml`, `*.XML`), NF-e, CC-e ou outros documentos fiscais locais.
- Nao commitar uploads locais ou arquivos enviados por usuarios.
- Pedir aprovacao antes de apagar arquivos ou executar comandos destrutivos.
- Corrigir uma coisa por vez, mantendo as alteracoes pequenas e revisaveis.
- Rodar lint antes de qualquer build.
- Ao finalizar uma alteracao, explicar quais arquivos foram alterados e por que.
- Preservar alteracoes existentes do usuario; nao reverter trabalho que nao foi feito pelo agente.
- Antes de mexer em seguranca, autenticacao, banco de dados ou deploy, explicar o risco e o plano.
