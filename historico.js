// =============================================
//   Histórico de Relatórios — historico.js
// =============================================

const API_URL = "http://localhost:3000";

let todosRelatorios = [];
let filtroAtivo = "todos";
let relatorioAberto = null;

// ---- Inicialização ----
document.addEventListener("DOMContentLoaded", carregarRelatorios);

async function carregarRelatorios() {
  const lista = document.getElementById("lista");
  lista.innerHTML = `<div class="loading">Carregando relatórios...</div>`;

  try {
    const res = await fetch(`${API_URL}/relatorios`);
    todosRelatorios = await res.json();
    aplicarFiltros();
  } catch (err) {
    console.error("Erro ao carregar relatórios:", err);
    lista.innerHTML = `<div class="empty"><div class="empty-icon">—</div><p>Não foi possível conectar ao servidor.</p></div>`;
  }
}

// ---- Filtros e busca ----
function filtrar(tipo, btn) {
  filtroAtivo = tipo;
  document.querySelectorAll(".filtro-btn").forEach((b) => b.classList.remove("ativo"));
  btn.classList.add("ativo");
  aplicarFiltros();
}

function buscar() { aplicarFiltros(); }

function aplicarFiltros() {
  const termo = document.getElementById("busca").value.toLowerCase();
  const filtrados = todosRelatorios.filter((r) => {
    const matchFiltro =
      filtroAtivo === "todos" ||
      (filtroAtivo === "coord01" && r.cargo === "Coordenador 01" && !r.substituto) ||
      (filtroAtivo === "coord02" && r.cargo === "Coordenador 02" && !r.substituto) ||
      (filtroAtivo === "substituto" && r.substituto);
    const matchBusca = !termo || r.responsavel.toLowerCase().includes(termo);
    return matchFiltro && matchBusca;
  });
  renderLista(filtrados);
}

// ---- Renderizar lista ----
function renderLista(lista) {
  const el = document.getElementById("lista");
  if (lista.length === 0) {
    el.innerHTML = `<div class="empty"><div class="empty-icon">—</div><p>Nenhum relatório encontrado.</p></div>`;
    return;
  }
  el.innerHTML = lista
    .map(
      (r, i) => `
    <div class="card" onclick="abrirModal('${r.id}')" style="animation-delay:${i * 0.04}s;animation:fadeUp .4s ease both">
      <div class="card-avatar">${iniciais(r.responsavel)}</div>
      <div class="card-info">
        <div class="card-info-top">
          <span class="card-nome">${r.responsavel}</span>
          <span class="card-cargo">${r.cargo || "—"}</span>
          ${r.substituto ? '<span class="badge-sub">Substituto</span>' : ""}
        </div>
        <div class="card-periodo">${formatarPeriodo(r)}</div>
      </div>
      <div class="card-meta">
        <span class="card-tarefas">${(r.total_tarefas || 0)} tarefa(s)</span>
      </div>
      <span class="card-arrow">›</span>
    </div>`
    )
    .join("");
}

// ---- Abrir modal com detalhes ----
async function abrirModal(id) {
  try {
    const res = await fetch(`${API_URL}/relatorio/${id}`);
    relatorioAberto = await res.json();
    renderModal(relatorioAberto);
    document.getElementById("modal").style.display = "flex";
  } catch (err) {
    console.error("Erro ao carregar relatório:", err);
  }
}

function renderModal(r) {
  const body = document.getElementById("modal-body");
  const tarefasAndamento = r.tarefasandamento || r.tarefasAndamento || [];
  const tarefasPendentes = r.tarefaspendentes || r.tarefasPendentes || [];

  body.innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Responsável</div>
      <div class="modal-field"><span>Nome</span>${r.responsavel}</div>
      <div class="modal-field" style="margin-top:8px">
        <span>Cargo</span>${r.cargo || "—"}${r.substituto ? " — Substituindo Coordenador 01" : ""}
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Período</div>
      <div class="modal-field">${formatarPeriodo(r)}</div>
    </div>

    ${r.pontos_atencao ? `
    <div class="modal-section">
      <div class="modal-section-title">Pontos de Atenção</div>
      <div class="modal-field">${r.pontos_atencao}</div>
    </div>` : ""}

    ${tarefasAndamento.length > 0 ? `
    <div class="modal-section">
      <div class="modal-section-title">Tarefas em Andamento</div>
      ${tarefasAndamento.map((t) => `
        <div class="tarefa-item">
          ${t.descricao}
          <div class="tarefa-prog">${t.progresso || ""}${t.responsavel_direto ? " · " + t.responsavel_direto : ""}</div>
        </div>`).join("")}
    </div>` : ""}

    ${tarefasPendentes.length > 0 ? `
    <div class="modal-section">
      <div class="modal-section-title">Tarefas Pendentes</div>
      ${tarefasPendentes.map((t) => `
        <div class="tarefa-item pendente">
          ${t.descricao}
          <div class="tarefa-prog">${t.progresso || ""}${t.responsavel_direto ? " · " + t.responsavel_direto : ""}</div>
        </div>`).join("")}
    </div>` : ""}

    ${r.observacoes ? `
    <div class="modal-section">
      <div class="modal-section-title">Observações</div>
      <div class="modal-field">${r.observacoes}</div>
    </div>` : ""}

    ${r.proximos_passos ? `
    <div class="modal-section">
      <div class="modal-section-title">Próximos Passos</div>
      <div class="modal-field">${r.proximos_passos}</div>
    </div>` : ""}`;
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

// ---- Excluir relatório ----
async function excluir() {
  if (!relatorioAberto) return;
  if (!confirm("Tem certeza que deseja excluir este relatório?")) return;

  try {
    await fetch(`${API_URL}/relatorio/${relatorioAberto.id}`, { method: "DELETE" });
    todosRelatorios = todosRelatorios.filter((r) => r.id !== relatorioAberto.id);
    fecharModal();
    aplicarFiltros();
  } catch (err) {
    console.error("Erro ao excluir:", err);
  }
}

// ---- Copiar relatório formatado ----
function copiarModal() {
  if (!relatorioAberto) return;
  const r = relatorioAberto;
  const sep = "======================================================";
  const tarefasAndamento = r.tarefasandamento || r.tarefasAndamento || [];
  const tarefasPendentes = r.tarefaspendentes || r.tarefasPendentes || [];

  let txt = `${sep}\n= Rio, ${formatarPeriodo(r)} =\n\n${r.cargo}: ${r.responsavel}`;
  if (r.substituto) txt += ` (Substituindo Coordenador 01)`;
  txt += "\n";
  if (r.pontos_atencao) txt += `\nPONTOS DE ATENÇÃO DO PERÍODO:\n- ${r.pontos_atencao}\n`;
  txt += `\n${sep}\nPRINCIPAIS ATIVIDADES:\n`;
  [...tarefasAndamento, ...tarefasPendentes].forEach((t) => (txt += `- ${t.descricao}\n`));
  if (r.observacoes) txt += `\n${sep}\n- ${r.observacoes}\n`;
  if (r.proximos_passos) txt += `\nPRÓXIMOS PASSOS:\n- ${r.proximos_passos}\n`;
  txt += sep;

  navigator.clipboard.writeText(txt).then(() => {
    const tip = document.getElementById("copied-tip");
    tip.style.opacity = "1";
    setTimeout(() => (tip.style.opacity = "0"), 2000);
  });
}

// ---- Helpers ----
function iniciais(nome) {
  return nome.split(" ").slice(0, 2).map((n) => n[0]).join("").toUpperCase();
}

function formatarData(str) {
  if (!str) return "-";
  const meses = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  const [y, m, d] = str.split("T")[0].split("-");
  return `${parseInt(d)} ${meses[parseInt(m) - 1]} ${y}`;
}

function formatarPeriodo(r) {
  if (!r.data_inicio) return "-";
  if (!r.data_fim) return formatarData(r.data_inicio);
  return `${formatarData(r.data_inicio)} – ${formatarData(r.data_fim)}`;
}
