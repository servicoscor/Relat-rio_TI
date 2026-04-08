# Relatório de Atividades

Projeto completo com frontend e backend para preenchimento e envio de relatórios de atividades.

## Estrutura

```
projeto-relatorio/
├── index.html   → Página principal (formulário)
├── style.css    → Estilo visual
├── app.js       → Lógica do frontend
├── server.js    → Servidor Node.js (backend)
└── README.md
```

## Como rodar

### Backend

```bash
npm init -y
npm install express cors
node server.js
```

O servidor sobe em: http://localhost:3000

### Frontend

Abra o `index.html` diretamente no navegador, ou use a extensão **Live Server** no VS Code.

---

## Rotas da API

| Método | Rota            | Descrição                    |
|--------|-----------------|------------------------------|
| POST   | /relatorio      | Envia um novo relatório      |
| GET    | /relatorios     | Lista todos os relatórios    |
| GET    | /relatorio/:id  | Busca relatório por ID       |

---

## Exemplo de payload (POST /relatorio)

```json
{
  "responsavel": "João Silva",
  "cargo": "Coordenador 01",
  "periodo": { "inicio": "2026-04-01", "fim": "2026-04-06" },
  "tarefasAndamento": [
    { "descricao": "Verificações de rotina", "responsavelDireto": "João", "previsao": "2026-04-10", "progresso": "Em andamento" }
  ],
  "tarefasPendentes": [
    { "descricao": "Enviar relatório mensal", "responsavelDireto": "Maria", "previsao": "2026-04-15", "progresso": "Não iniciado" }
  ],
  "pontosAtencao": "1054 câmeras indisponíveis.",
  "observacoes": "Sem intercorrências.",
  "proximosPassos": "Acompanhar entrega das tarefas pendentes."
}
```
