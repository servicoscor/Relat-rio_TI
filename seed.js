// =============================================
//   Seed de usuarios - seed.js
//   Rode uma vez: node seed.js
// =============================================

require("dotenv").config();

const { getStorePath, seedUsuariosPadrao } = require("./storage");

async function seed() {
  try {
    const resultado = await seedUsuariosPadrao();

    if (resultado.criados.length > 0) {
      resultado.criados.forEach((usuario) => {
        console.log(`[+] Usuario criado: ${usuario}`);
      });
    } else {
      console.log("Nenhum usuario novo precisou ser criado.");
    }

    console.log(`Arquivo de dados: ${getStorePath()}`);
    console.log("Seed concluido.");
  } catch (err) {
    console.error("Erro no seed:", err.message);
    process.exit(1);
  }
}

seed();
