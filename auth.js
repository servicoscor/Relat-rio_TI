// =============================================
//   Auth Guard - auth.js
//   Incluir em index.html e historico.html
// =============================================

window.API_URL = window.API_URL || "http://localhost:3000";

function getToken() {
  return localStorage.getItem("token");
}

function getNivel() {
  return localStorage.getItem("nivel");
}

function getNome() {
  return localStorage.getItem("nome");
}

function getCargo() {
  return localStorage.getItem("cargo") || "";
}

function logout() {
  localStorage.removeItem("token");
  localStorage.removeItem("nivel");
  localStorage.removeItem("nome");
  localStorage.removeItem("cargo");
  window.location.href = "login.html";
}

function redirecionarPorNivel() {
  const nivel = getNivel();
  window.location.href = nivel === "coordenador" ? "historico.html" : "index.html";
}

function verificarAuth(nivelNecessario) {
  const token = getToken();

  if (!token) {
    window.location.href = "login.html";
    return false;
  }

  if (nivelNecessario === "admin" && getNivel() !== "admin") {
    redirecionarPorNivel();
    return false;
  }

  if (nivelNecessario === "coordenador" && getNivel() !== "coordenador") {
    redirecionarPorNivel();
    return false;
  }

  return true;
}

async function apiFetch(url, options = {}) {
  const headers = new Headers(options.headers || {});
  const token = getToken();

  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const response = await fetch(url, { ...options, headers });

  if (response.status === 401) {
    logout();
    throw new Error("Sessao expirada.");
  }

  if (response.status === 403) {
    redirecionarPorNivel();
    throw new Error("Acesso negado.");
  }

  return response;
}

function injetarHeader() {
  const header = document.querySelector(".header");
  if (!header) return;

  const nome = getNome();
  const nivel = getNivel();
  let headerRight = header.querySelector(".header-right");

  if (!headerRight) {
    headerRight = document.createElement("div");
    headerRight.className = "header-right";
    headerRight.style.cssText = "display:flex;align-items:center;gap:10px;flex-wrap:wrap";

    Array.from(header.children)
      .filter((child) => !child.classList.contains("header-left"))
      .forEach((child) => headerRight.appendChild(child));

    header.appendChild(headerRight);
  }

  if (headerRight.querySelector("[data-auth-badge='true']")) {
    return;
  }

  const badge = document.createElement("div");
  badge.setAttribute("data-auth-badge", "true");
  badge.style.cssText = `
    display:flex;
    align-items:center;
    gap:10px;
    font-family:'DM Sans', sans-serif;
  `;
  badge.innerHTML = `
    <span style="font-size:11px;color:#888;letter-spacing:.05em;text-transform:uppercase">
      ${nome || "Usuario"}
      <span style="color:#8A6E2F;margin-left:4px">${nivel === "admin" ? "- Admin" : "- Coordenador"}</span>
    </span>
    <button onclick="logout()" style="
      background:transparent;border:0.5px solid #2E2E2E;border-radius:3px;
      padding:5px 12px;font-size:11px;color:#555;cursor:pointer;
      font-family:'DM Sans',sans-serif;letter-spacing:.06em;text-transform:uppercase;
      transition:all .2s;
    " onmouseover="this.style.borderColor='rgba(201,168,76,.3)';this.style.color='#888'"
       onmouseout="this.style.borderColor='#2E2E2E';this.style.color='#555'">
      Sair
    </button>
  `;

  headerRight.prepend(badge);
}
