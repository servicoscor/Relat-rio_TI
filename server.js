// =============================================
//   Relatório de Atividades — server.js
//   Banco de dados: PostgreSQL
// =============================================

require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");

const app = express();
app.use(cors());
app.use(express.json());

// -----------------------------------------------
// Conexão com o PostgreSQL
// -----------------------------------------------
const pool = new Pool({
  host:     process.env.DB_HOST     || "localhost",
  port:     process.env.DB_PORT     || 5432,
  database: process.env.DB_NAME     || "relatorios_db",
  user:     process.env.DB_USER     || "postgres",
  password: process.env.DB_PASSWORD || "",
});

pool.connect()
  .then(() => console.log("Conectado ao PostgreSQL"))
  .catch((err) => {
    console.error("Erro ao conectar ao banco:", err.message);
    process.exit(1);
  });

// -----------------------------------------------
// POST /relatorio — Salva novo relatório + tarefas
// -----------------------------------------------
app.post("/relatorio", async (req, res) => {
  const {
    responsavel,
    cargo,
    substituto,
    periodo,
    tarefasAndamento,
    tarefasPendentes,
    observacoes,
    proximosPassos,
    pontosAtencao,
  } = req.body;

  if (!responsavel) {
    return res.status(400).json({ erro: "Campo obrigatório: responsavel." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    // Insere o relatório
    const { rows } = await client.query(
      `INSERT INTO relatorios
        (responsavel, cargo, substituto, data_inicio, data_fim, pontos_atencao, observacoes, proximos_passos)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING id, criado_em`,
      [
        responsavel,
        cargo || null,
        substituto || false,
        periodo?.inicio || null,
        periodo?.fim || null,
        pontosAtencao || null,
        observacoes || null,
        proximosPassos || null,
      ]
    );

    const relatorioId = rows[0].id;

    // Insere tarefas em andamento
    for (const t of tarefasAndamento || []) {
      await client.query(
        `INSERT INTO tarefas (relatorio_id, tipo, descricao, responsavel_direto, previsao, progresso)
         VALUES ($1, 'andamento', $2, $3, $4, $5)`,
        [relatorioId, t.descricao, t.responsavelDireto || null, t.previsao || null, t.progresso || null]
      );
    }

    // Insere tarefas pendentes
    for (const t of tarefasPendentes || []) {
      await client.query(
        `INSERT INTO tarefas (relatorio_id, tipo, descricao, responsavel_direto, previsao, progresso)
         VALUES ($1, 'pendente', $2, $3, $4, $5)`,
        [relatorioId, t.descricao, t.responsavelDireto || null, t.previsao || null, t.progresso || null]
      );
    }

    await client.query("COMMIT");

    console.log(`[+] Relatório salvo — ID: ${relatorioId} — ${responsavel} (${cargo})`);
    return res.status(201).json({ mensagem: "Relatório salvo com sucesso.", id: relatorioId, criado_em: rows[0].criado_em });

  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Erro ao salvar relatório:", err.message);
    return res.status(500).json({ erro: "Erro interno ao salvar o relatório." });
  } finally {
    client.release();
  }
});

// -----------------------------------------------
// GET /relatorios — Lista todos os relatórios
// -----------------------------------------------
app.get("/relatorios", async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, criado_em, responsavel, cargo, substituto, data_inicio, data_fim
       FROM relatorios
       ORDER BY criado_em DESC`
    );
    return res.json(rows);
  } catch (err) {
    console.error("Erro ao listar relatórios:", err.message);
    return res.status(500).json({ erro: "Erro ao buscar relatórios." });
  }
});

// -----------------------------------------------
// GET /relatorio/:id — Busca relatório completo com tarefas
// -----------------------------------------------
app.get("/relatorio/:id", async (req, res) => {
  try {
    const { rows: rel } = await pool.query(
      `SELECT * FROM relatorios WHERE id = $1`,
      [req.params.id]
    );

    if (rel.length === 0) {
      return res.status(404).json({ erro: "Relatório não encontrado." });
    }

    const { rows: tarefas } = await pool.query(
      `SELECT * FROM tarefas WHERE relatorio_id = $1 ORDER BY criado_em ASC`,
      [req.params.id]
    );

    return res.json({
      ...rel[0],
      tarefasAndamento: tarefas.filter((t) => t.tipo === "andamento"),
      tarefasPendentes: tarefas.filter((t) => t.tipo === "pendente"),
    });
  } catch (err) {
    console.error("Erro ao buscar relatório:", err.message);
    return res.status(500).json({ erro: "Erro ao buscar relatório." });
  }
});

// -----------------------------------------------
// DELETE /relatorio/:id — Remove um relatório
// -----------------------------------------------
app.delete("/relatorio/:id", async (req, res) => {
  try {
    const { rowCount } = await pool.query(
      `DELETE FROM relatorios WHERE id = $1`,
      [req.params.id]
    );
    if (rowCount === 0) {
      return res.status(404).json({ erro: "Relatório não encontrado." });
    }
    return res.json({ mensagem: "Relatório removido com sucesso." });
  } catch (err) {
    console.error("Erro ao remover relatório:", err.message);
    return res.status(500).json({ erro: "Erro ao remover relatório." });
  }
});

// -----------------------------------------------
// Inicialização
// -----------------------------------------------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando em http://localhost:${PORT}`);
});
