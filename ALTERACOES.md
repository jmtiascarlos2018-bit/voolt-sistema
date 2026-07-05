# Alteracoes do Projeto

## Modulo Financeiro e Contas a Pagar

### Frontend

- Adicionado item `Financeiro` no menu lateral.
- Adicionado item `Contas a Pagar` no menu lateral.
- Criada rota `/financeiro`.
- Criada rota `/contas-a-pagar`.
- Criada tela `Financeiro` com:
  - total a pagar;
  - total pago;
  - total vencido;
  - saldo geral;
  - atalho para Contas a Pagar;
  - lista de proximas contas abertas.
- Criada tela `Contas a Pagar` com:
  - listagem de despesas;
  - filtro por status;
  - cadastro de nova despesa;
  - edicao de despesa;
  - exclusao de despesa;
  - acao para marcar despesa como paga.
- Adicionadas funcoes de API no frontend para consumir as rotas de contas a pagar.

### Backend

- Criada tabela SQLite `contas_pagar` dentro de `initDatabaseSchema()`.
- Criadas rotas REST:
  - `GET /api/contas-pagar`
  - `GET /api/contas-pagar/resumo`
  - `POST /api/contas-pagar`
  - `PUT /api/contas-pagar/:id`
  - `DELETE /api/contas-pagar/:id`
  - `PATCH /api/contas-pagar/:id/pagar`

### Arquivos principais alterados

- `server.js`
- `client/src/api/index.js`
- `client/src/App.jsx`
- `client/src/components/Sidebar.jsx`
- `client/src/components/Header.jsx`
- `client/src/components/Financeiro.jsx`
- `client/src/components/ContasPagar.jsx`

### Como rodar em desenvolvimento

Terminal 1:

```powershell
npm run dev
```

Terminal 2:

```powershell
npm run dev --prefix client
```

Acessar:

```text
http://localhost:5173
```

### Como ver pelo backend em `localhost:3000`

Gerar build atualizado:

```powershell
npm run lint --prefix client
npm run build
npm run dev
```

Acessar:

```text
http://localhost:3000
```

Se o navegador mostrar versao antiga, usar `Ctrl + F5`. Se ainda persistir, desregistrar o service worker nas ferramentas do navegador.

### Verificacoes executadas

```powershell
npm run lint --prefix client
node --check server.js
```

Ambas passaram.
