// =============================================
//   Persistencia local - storage.js
// =============================================

const fs = require("fs/promises");
const path = require("path");
const bcrypt = require("bcrypt");
const { randomUUID } = require("crypto");

const DATA_DIR = path.join(__dirname, "data");
const STORE_FILE = path.join(DATA_DIR, "store.json");

const BASE_STORE = {
  usuarios: [],
  relatorios: [],
};

const USUARIOS_PADRAO = [
  { usuario: "admin", senha: "admin123", nome: "Administrador", nivel: "admin", cargo: null },
  { usuario: "coord01", senha: "coord123", nome: "Coordenador 01", nivel: "coordenador", cargo: "Coordenador 01" },
  { usuario: "coord02", senha: "coord123", nome: "Coordenador 02", nivel: "coordenador", cargo: "Coordenador 02" },
];

let writeQueue = Promise.resolve();

function normalizarStore(raw) {
  return {
    usuarios: Array.isArray(raw?.usuarios) ? raw.usuarios : [],
    relatorios: Array.isArray(raw?.relatorios) ? raw.relatorios : [],
  };
}

async function ensureStore() {
  await fs.mkdir(DATA_DIR, { recursive: true });

  try {
    await fs.access(STORE_FILE);
  } catch (err) {
    if (err.code !== "ENOENT") {
      throw err;
    }

    await writeStore(BASE_STORE);
  }
}

async function readStore() {
  await ensureStore();

  const content = await fs.readFile(STORE_FILE, "utf8");

  if (!content.trim()) {
    return { ...BASE_STORE };
  }

  try {
    return normalizarStore(JSON.parse(content));
  } catch {
    throw new Error("Arquivo de dados invalido.");
  }
}

async function writeStore(store) {
  const finalStore = normalizarStore(store);
  const tempFile = `${STORE_FILE}.tmp`;

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(tempFile, JSON.stringify(finalStore, null, 2), "utf8");
  await fs.rename(tempFile, STORE_FILE);
}

function withStoreLock(task) {
  const run = writeQueue.then(task, task);
  writeQueue = run.catch(() => {});
  return run;
}

async function mutateStore(mutator) {
  return withStoreLock(async () => {
    const store = await readStore();
    const result = await mutator(store);
    await writeStore(store);
    return result;
  });
}

async function seedUsuariosPadrao() {
  return mutateStore(async (store) => {
    const criados = [];

    for (const base of USUARIOS_PADRAO) {
      const existente = store.usuarios.find((usuario) => usuario.usuario === base.usuario);
      if (existente) {
        continue;
      }

      const senha_hash = await bcrypt.hash(base.senha, 10);

      store.usuarios.push({
        id: randomUUID(),
        usuario: base.usuario,
        senha_hash,
        nome: base.nome,
        nivel: base.nivel,
        cargo: base.cargo,
        ativo: true,
        criado_em: new Date().toISOString(),
      });

      criados.push(base.usuario);
    }

    return {
      criados,
      totalUsuarios: store.usuarios.length,
    };
  });
}

function getStorePath() {
  return STORE_FILE;
}

module.exports = {
  getStorePath,
  readStore,
  seedUsuariosPadrao,
  mutateStore,
};
