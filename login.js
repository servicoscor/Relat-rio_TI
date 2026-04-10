// =============================================
//   Login - login.js
// =============================================

const API_URL = window.API_URL || "";

const token = localStorage.getItem("token");
if (token) {
  const nivel = localStorage.getItem("nivel");
  window.location.href = nivel === "coordenador" ? "historico.html" : "index.html";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") entrar();
});

function setErro(message) {
  const erro = document.getElementById("erro");
  erro.textContent = message;
  erro.style.display = "block";
}

function mensagemConexao() {
  if (window.API_CONFIG_ERROR) {
    return window.API_CONFIG_ERROR;
  }

  if (window.location.hostname.endsWith("github.io")) {
    return "Este frontend esta no GitHub Pages. Publique o backend e configure a URL da API em config.js.";
  }

  return "Nao foi possivel conectar ao servidor.";
}

async function entrar() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;
  const erro = document.getElementById("erro");
  erro.style.display = "none";

  if (!API_URL) {
    setErro(mensagemConexao());
    return;
  }

  if (!usuario || !senha) {
    setErro("Preencha usuario e senha.");
    return;
  }

  try {
    const res = await fetch(`${API_URL}/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ usuario, senha }),
    });

    const data = await res.json();

    if (!res.ok) {
      setErro(data.erro || "Usuario ou senha incorretos.");
      document.querySelector(".card").style.animation = "shake 0.3s ease";
      setTimeout(() => {
        document.querySelector(".card").style.animation = "";
      }, 300);
      return;
    }

    localStorage.setItem("token", data.token);
    localStorage.setItem("nivel", data.nivel);
    localStorage.setItem("nome", data.nome);
    localStorage.setItem("cargo", data.cargo || "");

    window.location.href = data.nivel === "coordenador" ? "historico.html" : "index.html";
  } catch {
    setErro(mensagemConexao());
  }
}
