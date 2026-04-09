// =============================================
//   Login - login.js
// =============================================

const API_URL = "http://localhost:3000";

const token = localStorage.getItem("token");
if (token) {
  const nivel = localStorage.getItem("nivel");
  window.location.href = nivel === "coordenador" ? "historico.html" : "index.html";
}

document.addEventListener("keydown", (e) => {
  if (e.key === "Enter") entrar();
});

async function entrar() {
  const usuario = document.getElementById("usuario").value.trim();
  const senha = document.getElementById("senha").value;
  const erro = document.getElementById("erro");
  erro.style.display = "none";

  if (!usuario || !senha) {
    erro.textContent = "Preencha usuario e senha.";
    erro.style.display = "block";
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
      erro.textContent = data.erro || "Usuario ou senha incorretos.";
      erro.style.display = "block";
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
  } catch (err) {
    erro.textContent = "Nao foi possivel conectar ao servidor.";
    erro.style.display = "block";
  }
}
