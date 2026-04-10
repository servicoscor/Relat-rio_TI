# Relatorio de Atividades

Sistema web para preenchimento, envio e consulta de relatorios de atividades.

## Como funciona agora

O projeto nao depende mais de PostgreSQL.
Os dados ficam salvos localmente em `data/store.json`.

## Como rodar

```bash
npm install
npm start
```

Servidor: `http://localhost:3000`

Frontend: abra `login.html` no navegador ou use Live Server no VS Code.

## Deploy simples no Render

O projeto inclui `render.yaml` para publicar o backend como Web Service.

Depois do deploy, edite `config.js` e defina:

```js
window.APP_CONFIG = {
  apiUrl: "https://SEU-BACKEND.onrender.com"
};
```

Observacao: no plano free do Render, o arquivo `data/store.json` fica em armazenamento efemero. Se o servico reiniciar ou for redeployado, os dados podem ser perdidos.

## Usuarios padrao

- `admin` / `admin123`
- `coord01` / `coord123`
- `coord02` / `coord123`

Os usuarios sao criados automaticamente no primeiro `npm start`.

## Seed manual

Se quiser recriar apenas os usuarios padrao:

```bash
npm run seed
```

## Rotas principais

- `POST /login`
- `POST /relatorio`
- `GET /relatorios`
- `GET /relatorio/:id`
- `DELETE /relatorio/:id`

## Observacao

O arquivo `banco.sql` ficou no projeto apenas como legado e nao e mais usado pela aplicacao atual.
