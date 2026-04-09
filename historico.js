// =============================================
//   Historico de Relatorios - historico.js
// =============================================

const API_URL = window.API_URL || "http://localhost:3000";

let todosRelatorios = [];
let filtroAtivo = "todos";
let relatorioAberto = null;

document.addEventListener("DOMContentLoaded", initPagina);

function initPagina() {
  if (!verificarAuth("coordenador")) {
    return;
  }

  injetarHeader();
  configurarPermissoesHistorico();
  carregarRelatorios();
}

function configurarPermissoesHistorico() {
  const botaoExcluir = document.querySelector(".btn-del");
  if (botaoExcluir) {
    botaoExcluir.style.display = "none";
  }
}

async function carregarRelatorios() {
  const lista = document.getElementById("lista");
  lista.innerHTML = '<div class="loading">Carregando relatorios...</div>';

  try {
    const res = await apiFetch(`${API_URL}/relatorios`);

    if (!res.ok) {
      throw new Error("Falha ao listar relatorios.");
    }

    todosRelatorios = await res.json();
    aplicarFiltros();
  } catch (err) {
    if (err.message === "Sessao expirada." || err.message === "Acesso negado.") {
      return;
    }

    console.error("Erro ao carregar relatorios:", err);
    lista.innerHTML = '<div class="empty"><div class="empty-icon">-</div><p>Nao foi possivel conectar ao servidor.</p></div>';
  }
}

function filtrar(tipo, btn) {
  filtroAtivo = tipo;
  document.querySelectorAll(".filtro-btn").forEach((b) => b.classList.remove("ativo"));
  btn.classList.add("ativo");
  aplicarFiltros();
}

function buscar() {
  aplicarFiltros();
}

function aplicarFiltros() {
  const termo = document.getElementById("busca").value.toLowerCase();
  const filtrados = todosRelatorios.filter((relatorio) => {
    const matchFiltro =
      filtroAtivo === "todos" ||
      (filtroAtivo === "coord01" && relatorio.cargo === "Coordenador 01" && !relatorio.substituto) ||
      (filtroAtivo === "coord02" && relatorio.cargo === "Coordenador 02" && !relatorio.substituto) ||
      (filtroAtivo === "substituto" && relatorio.substituto);

    const matchBusca = !termo || relatorio.responsavel.toLowerCase().includes(termo);
    return matchFiltro && matchBusca;
  });

  renderLista(filtrados);
}

function renderLista(lista) {
  const el = document.getElementById("lista");

  if (lista.length === 0) {
    el.innerHTML = '<div class="empty"><div class="empty-icon">-</div><p>Nenhum relatorio encontrado.</p></div>';
    return;
  }

  el.innerHTML = lista
    .map(
      (relatorio, index) => `
    <div class="card" onclick="abrirModal('${relatorio.id}')" style="animation-delay:${index * 0.04}s;animation:fadeUp .4s ease both">
      <div class="card-avatar">${iniciais(relatorio.responsavel)}</div>
      <div class="card-info">
        <div class="card-info-top">
          <span class="card-nome">${relatorio.responsavel}</span>
          <span class="card-cargo">${relatorio.cargo || "-"}</span>
          ${relatorio.substituto ? '<span class="badge-sub">Substituto</span>' : ""}
        </div>
        <div class="card-periodo">${formatarPeriodo(relatorio)}</div>
      </div>
      <div class="card-meta">
        <span class="card-tarefas">${relatorio.total_tarefas || 0} tarefa(s)</span>
      </div>
      <span class="card-arrow">></span>
    </div>`
    )
    .join("");
}

async function abrirModal(id) {
  try {
    const res = await apiFetch(`${API_URL}/relatorio/${id}`);

    if (!res.ok) {
      throw new Error("Falha ao carregar relatorio.");
    }

    relatorioAberto = await res.json();
    renderModal(relatorioAberto);
    document.getElementById("modal").style.display = "flex";
  } catch (err) {
    if (err.message === "Sessao expirada." || err.message === "Acesso negado.") {
      return;
    }

    console.error("Erro ao carregar relatorio:", err);
    alert("Nao foi possivel carregar os detalhes do relatorio.");
  }
}

function renderModal(relatorio) {
  const body = document.getElementById("modal-body");
  const tarefasAndamento = relatorio.tarefasAndamento || [];
  const tarefasPendentes = relatorio.tarefasPendentes || [];

  body.innerHTML = `
    <div class="modal-section">
      <div class="modal-section-title">Responsavel</div>
      <div class="modal-field"><span>Nome</span>${relatorio.responsavel}</div>
      <div class="modal-field" style="margin-top:8px">
        <span>Cargo</span>${relatorio.cargo || "-"}${relatorio.substituto ? " - Substituindo Coordenador 01" : ""}
      </div>
    </div>

    <div class="modal-section">
      <div class="modal-section-title">Periodo</div>
      <div class="modal-field">${formatarPeriodo(relatorio)}</div>
    </div>

    ${relatorio.pontos_atencao ? `
    <div class="modal-section">
      <div class="modal-section-title">Pontos de atencao</div>
      <div class="modal-field">${relatorio.pontos_atencao}</div>
    </div>` : ""}

    ${tarefasAndamento.length > 0 ? `
    <div class="modal-section">
      <div class="modal-section-title">Tarefas em andamento</div>
      ${tarefasAndamento.map((tarefa) => `
        <div class="tarefa-item">
          ${tarefa.descricao}
          <div class="tarefa-prog">${tarefa.progresso || ""}${tarefa.responsavel_direto ? " - " + tarefa.responsavel_direto : ""}</div>
        </div>`).join("")}
    </div>` : ""}

    ${tarefasPendentes.length > 0 ? `
    <div class="modal-section">
      <div class="modal-section-title">Tarefas pendentes</div>
      ${tarefasPendentes.map((tarefa) => `
        <div class="tarefa-item pendente">
          ${tarefa.descricao}
          <div class="tarefa-prog">${tarefa.progresso || ""}${tarefa.responsavel_direto ? " - " + tarefa.responsavel_direto : ""}</div>
        </div>`).join("")}
    </div>` : ""}

    ${relatorio.observacoes ? `
    <div class="modal-section">
      <div class="modal-section-title">Observacoes</div>
      <div class="modal-field">${relatorio.observacoes}</div>
    </div>` : ""}

    ${relatorio.proximos_passos ? `
    <div class="modal-section">
      <div class="modal-section-title">Proximos passos</div>
      <div class="modal-field">${relatorio.proximos_passos}</div>
    </div>` : ""}`;
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

async function excluir() {
  if (!relatorioAberto) return;
  if (!confirm("Tem certeza que deseja excluir este relatorio?")) return;

  try {
    const res = await apiFetch(`${API_URL}/relatorio/${relatorioAberto.id}`, {
      method: "DELETE",
    });

    if (!res.ok) {
      const erro = await extrairErro(res);
      alert(erro || "Nao foi possivel excluir o relatorio.");
      return;
    }

    todosRelatorios = todosRelatorios.filter((relatorio) => relatorio.id !== relatorioAberto.id);
    fecharModal();
    aplicarFiltros();
  } catch (err) {
    if (err.message === "Sessao expirada." || err.message === "Acesso negado.") {
      return;
    }

    console.error("Erro ao excluir relatorio:", err);
    alert("Nao foi possivel excluir o relatorio.");
  }
}

function copiarModal() {
  if (!relatorioAberto) return;

  const relatorio = relatorioAberto;
  const sep = "======================================================";
  const tarefasAndamento = relatorio.tarefasAndamento || [];
  const tarefasPendentes = relatorio.tarefasPendentes || [];

  let txt = `${sep}\n= Rio, ${formatarPeriodo(relatorio)} =\n\n${relatorio.cargo}: ${relatorio.responsavel}`;
  if (relatorio.substituto) txt += " (Substituindo Coordenador 01)";
  txt += "\n";

  if (relatorio.pontos_atencao) {
    txt += `\nPONTOS DE ATENCAO DO PERIODO:\n- ${relatorio.pontos_atencao}\n`;
  }

  txt += `\n${sep}\nPRINCIPAIS ATIVIDADES:\n`;
  [...tarefasAndamento, ...tarefasPendentes].forEach((tarefa) => {
    txt += `- ${tarefa.descricao}\n`;
  });

  if (relatorio.observacoes) {
    txt += `\n${sep}\n- ${relatorio.observacoes}\n`;
  }

  if (relatorio.proximos_passos) {
    txt += `\nPROXIMOS PASSOS:\n- ${relatorio.proximos_passos}\n`;
  }

  txt += sep;

  navigator.clipboard.writeText(txt).then(() => {
    const tip = document.getElementById("copied-tip");
    tip.style.opacity = "1";
    setTimeout(() => {
      tip.style.opacity = "0";
    }, 2000);
  });
}

async function extrairErro(response) {
  try {
    const data = await response.json();
    return data.erro || data.mensagem || "";
  } catch {
    return "";
  }
}

function iniciais(nome) {
  return nome
    .split(" ")
    .slice(0, 2)
    .map((parte) => parte[0])
    .join("")
    .toUpperCase();
}

function formatarData(data) {
  if (!data) return "-";

  const meses = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
  const [ano, mes, dia] = data.split("T")[0].split("-");
  return `${parseInt(dia, 10)} ${meses[parseInt(mes, 10) - 1]} ${ano}`;
}

function formatarPeriodo(relatorio) {
  if (!relatorio.data_inicio) return "-";
  if (!relatorio.data_fim) return formatarData(relatorio.data_inicio);
  return `${formatarData(relatorio.data_inicio)} - ${formatarData(relatorio.data_fim)}`;
}
