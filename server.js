// =============================================
//   Relatorio de Atividades - server.js
//   Persistencia local em arquivo JSON
// =============================================

require("dotenv").config();

const path = require("path");
const express = require("express");
const cors = require("cors");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");

const {
  getStorePath,
  readStore,
  seedUsuariosPadrao,
  mutateStore,
} = require("./storage");

const app = express();
const JWT_SECRET = process.env.JWT_SECRET || "relatorio_secret_2026";
const PUBLIC_DIR = __dirname;

app.use(cors());
app.use(express.json());
app.get("/healthz", (req, res) => {
  res.json({ ok: true });
});
app.get("/", (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, "login.html"));
});
app.use(express.static(PUBLIC_DIR, { index: false }));

function autenticar(req, res, next) {
  const auth = req.headers.authorization;

  if (!auth || !auth.startsWith("Bearer ")) {
    return res.status(401).json({ erro: "Nao autorizado." });
  }

  try {
    req.usuario = jwt.verify(auth.split(" ")[1], JWT_SECRET);
    next();
  } catch {
    return res.status(401).json({ erro: "Token invalido ou expirado." });
  }
}

function apenasAdmin(req, res, next) {
  if (req.usuario?.nivel !== "admin") {
    return res.status(403).json({ erro: "Acesso restrito ao administrador." });
  }

  next();
}

function apenasCoordenador(req, res, next) {
  if (req.usuario?.nivel !== "coordenador") {
    return res.status(403).json({ erro: "Acesso restrito ao coordenador." });
  }

  next();
}

app.post("/login", async (req, res) => {
  const { usuario, senha } = req.body;

  if (!usuario || !senha) {
    return res.status(400).json({ erro: "Usuario e senha sao obrigatorios." });
  }

  try {
    const store = await readStore();
    const usuarioDb = store.usuarios.find(
      (item) => item.usuario === usuario && item.ativo !== false
    );

    if (!usuarioDb) {
      return res.status(401).json({ erro: "Usuario ou senha incorretos." });
    }

    const senhaCorreta = await bcrypt.compare(senha, usuarioDb.senha_hash);

    if (!senhaCorreta) {
      return res.status(401).json({ erro: "Usuario ou senha incorretos." });
    }

    const token = jwt.sign(
      {
        id: usuarioDb.id,
        usuario: usuarioDb.usuario,
        nivel: usuarioDb.nivel,
        nome: usuarioDb.nome,
        cargo: usuarioDb.cargo,
      },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    return res.json({
      token,
      nivel: usuarioDb.nivel,
      nome: usuarioDb.nome,
      cargo: usuarioDb.cargo,
    });
  } catch (err) {
    console.error("Erro no login:", err.message);
    return res.status(500).json({ erro: "Erro interno." });
  }
});

app.post("/relatorio", autenticar, async (req, res) => {
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

  const ehAdmin = req.usuario?.nivel === "admin";
  const responsavelFinal = ehAdmin ? responsavel || req.usuario?.nome : req.usuario?.nome;
  const cargoFinal = ehAdmin ? cargo || req.usuario?.cargo || null : req.usuario?.cargo || null;
  const substitutoFinal = ehAdmin ? Boolean(substituto) : cargoFinal === "Coordenador 02";

  if (!responsavelFinal) {
    return res.status(400).json({ erro: "Campo obrigatorio: responsavel." });
  }

  try {
    const relatorioId = randomUUID();
    const criadoEm = new Date().toISOString();
    const tarefas = [
      ...(tarefasAndamento || []).map((tarefa) => ({
        id: randomUUID(),
        relatorio_id: relatorioId,
        tipo: "andamento",
        descricao: tarefa.descricao,
        responsavel_direto: tarefa.responsavelDireto || null,
        previsao: tarefa.previsao || null,
        progresso: tarefa.progresso || null,
        criado_em: new Date().toISOString(),
      })),
      ...(tarefasPendentes || []).map((tarefa) => ({
        id: randomUUID(),
        relatorio_id: relatorioId,
        tipo: "pendente",
        descricao: tarefa.descricao,
        responsavel_direto: tarefa.responsavelDireto || null,
        previsao: tarefa.previsao || null,
        progresso: tarefa.progresso || null,
        criado_em: new Date().toISOString(),
      })),
    ];

    await mutateStore(async (store) => {
      store.relatorios.push({
        id: relatorioId,
        criado_em: criadoEm,
        responsavel: responsavelFinal,
        cargo: cargoFinal,
        substituto: substitutoFinal,
        data_inicio: periodo?.inicio || null,
        data_fim: periodo?.fim || null,
        pontos_atencao: pontosAtencao || null,
        observacoes: observacoes || null,
        proximos_passos: proximosPassos || null,
        tarefas,
      });
    });

    console.log(`[+] Relatorio salvo - ID: ${relatorioId} - ${responsavelFinal} (${cargoFinal || "-"})`);
    return res.status(201).json({
      mensagem: "Relatorio salvo com sucesso.",
      id: relatorioId,
      criado_em: criadoEm,
    });
  } catch (err) {
    console.error("Erro ao salvar relatorio:", err.message);
    return res.status(500).json({ erro: "Erro interno ao salvar o relatorio." });
  }
});

app.get("/relatorios", autenticar, apenasCoordenador, async (req, res) => {
  try {
    const store = await readStore();
    const relatorios = [...store.relatorios]
      .sort((a, b) => new Date(b.criado_em) - new Date(a.criado_em))
      .map((relatorio) => ({
        id: relatorio.id,
        criado_em: relatorio.criado_em,
        responsavel: relatorio.responsavel,
        cargo: relatorio.cargo,
        substituto: Boolean(relatorio.substituto),
        data_inicio: relatorio.data_inicio,
        data_fim: relatorio.data_fim,
        total_tarefas: Array.isArray(relatorio.tarefas) ? relatorio.tarefas.length : 0,
      }));

    return res.json(relatorios);
  } catch (err) {
    console.error("Erro ao listar relatorios:", err.message);
    return res.status(500).json({ erro: "Erro ao buscar relatorios." });
  }
});

app.get("/relatorio/:id", autenticar, apenasCoordenador, async (req, res) => {
  try {
    const store = await readStore();
    const relatorio = store.relatorios.find((item) => item.id === req.params.id);

    if (!relatorio) {
      return res.status(404).json({ erro: "Relatorio nao encontrado." });
    }

    const tarefas = Array.isArray(relatorio.tarefas) ? relatorio.tarefas : [];

    return res.json({
      id: relatorio.id,
      criado_em: relatorio.criado_em,
      responsavel: relatorio.responsavel,
      cargo: relatorio.cargo,
      substituto: Boolean(relatorio.substituto),
      data_inicio: relatorio.data_inicio,
      data_fim: relatorio.data_fim,
      pontos_atencao: relatorio.pontos_atencao,
      observacoes: relatorio.observacoes,
      proximos_passos: relatorio.proximos_passos,
      tarefasAndamento: tarefas.filter((tarefa) => tarefa.tipo === "andamento"),
      tarefasPendentes: tarefas.filter((tarefa) => tarefa.tipo === "pendente"),
    });
  } catch (err) {
    console.error("Erro ao buscar relatorio:", err.message);
    return res.status(500).json({ erro: "Erro ao buscar relatorio." });
  }
});

app.delete("/relatorio/:id", autenticar, apenasAdmin, async (req, res) => {
  try {
    let removido = false;

    await mutateStore(async (store) => {
      const quantidadeAntes = store.relatorios.length;
      store.relatorios = store.relatorios.filter((item) => item.id !== req.params.id);
      removido = store.relatorios.length !== quantidadeAntes;
    });

    if (!removido) {
      return res.status(404).json({ erro: "Relatorio nao encontrado." });
    }

    return res.json({ mensagem: "Relatorio removido com sucesso." });
  } catch (err) {
    console.error("Erro ao remover relatorio:", err.message);
    return res.status(500).json({ erro: "Erro ao remover relatorio." });
  }
});

async function iniciarServidor() {
  try {
    const resultadoSeed = await seedUsuariosPadrao();
    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
      console.log(`Armazenamento local inicializado em ${getStorePath()}`);
      if (resultadoSeed.criados.length > 0) {
        console.log(`Usuarios padrao criados: ${resultadoSeed.criados.join(", ")}`);
      }
      console.log(`Servidor rodando em http://localhost:${PORT}`);
    });
  } catch (err) {
    const motivo = err.code || err.message || String(err);
    console.error(`Erro ao iniciar armazenamento local: ${motivo}`);
    process.exit(1);
  }
}

iniciarServidor();
