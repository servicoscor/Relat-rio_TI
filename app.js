// =============================================
//   Relatório de Atividades — app.js
// =============================================

const API_URL = "http://localhost:3000"; // Ajuste conforme o ambiente

let contadores = { andamento: 0, pendente: 0 };

// Preenche data inicial com hoje
const hoje = new Date();
const pad = (n) => String(n).padStart(2, "0");
const hojeISO = `${hoje.getFullYear()}-${pad(hoje.getMonth() + 1)}-${pad(hoje.getDate())}`;
document.getElementById("dt-inicio").value = hojeISO;
document.getElementById("stamp-data").textContent = hoje
  .toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" })
  .toUpperCase();

// ---- Adicionar tarefa ----
function addTarefa(tipo) {
  contadores[tipo]++;
  const id = tipo + contadores[tipo];
  const badge = tipo === "andamento" ? "badge-andamento" : "badge-pendente";
  const label = tipo === "andamento" ? "Em andamento" : "Pendente";

  const el = document.createElement("div");
  el.className = "task-card";
  el.id = id;
  el.innerHTML = `
    <div class="task-card-header">
      <span class="badge ${badge}">${label}</span>
      <button class="btn-remove" onclick="removeTarefa('${id}')">×</button>
    </div>
    <div class="row two">
      <div class="field"><label>Descrição</label><input type="text" placeholder="Descreva a tarefa..." /></div>
      <div class="field"><label>Responsável direto</label><input type="text" placeholder="Quem executa?" /></div>
    </div>
    <div class="row two">
      <div class="field"><label>Previsão de conclusão</label><input type="date" /></div>
      <div class="field">
        <label>Progresso</label>
        <select>
          <option>Não iniciado</option>
          <option>Em andamento</option>
          <option>Quase concluído</option>
          <option>Bloqueado</option>
        </select>
      </div>
    </div>`;
  document.getElementById("lista-" + tipo).appendChild(el);
}

function removeTarefa(id) {
  const el = document.getElementById(id);
  if (el) {
    el.style.opacity = "0";
    el.style.transition = "opacity 0.15s";
    setTimeout(() => el.remove(), 150);
  }
}

// ---- Formatar período ----
function formatarPeriodo() {
  const meses = ["Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
  const ini = document.getElementById("dt-inicio").value;
  const fim = document.getElementById("dt-fim").value;
  if (!ini && !fim) return "";
  if (!fim) {
    const [y, m, d] = ini.split("-");
    return `Rio, ${parseInt(d)} de ${meses[parseInt(m) - 1]} de ${y}`;
  }
  const [yi, mi, di] = ini.split("-");
  const [yf, mf, df] = fim.split("-");
  if (mi === mf && yi === yf) {
    return `Rio, ${parseInt(di)} – ${parseInt(df)} de ${meses[parseInt(mi) - 1]} de ${yi}`;
  }
  return `Rio, ${parseInt(di)} de ${meses[parseInt(mi) - 1]} – ${parseInt(df)} de ${meses[parseInt(mf) - 1]} de ${yf}`;
}

// ---- Coletar tarefas ----
function getTarefas(tipo) {
  const cards = document.getElementById("lista-" + tipo).querySelectorAll(".task-card");
  const linhas = [];
  cards.forEach((card) => {
    const inputs = card.querySelectorAll("input[type=text]");
    const select = card.querySelector("select");
    const desc = inputs[0]?.value.trim();
    const resp = inputs[1]?.value.trim();
    const data = card.querySelector("input[type=date]")?.value;
    const prog = select?.value;
    if (desc) linhas.push({ descricao: desc, responsavelDireto: resp, previsao: data, progresso: prog });
  });
  return linhas;
}

// ---- Gerar texto formatado ----
function gerarTexto() {
  const sep = "======================================================";
  const nome = document.getElementById("nome").value.trim();
  const cargo = document.getElementById("cargo").value || "Supervisor";
  const atencao = document.getElementById("atencao").value.trim();
  const obs = document.getElementById("obs").value.trim();
  const prox = document.getElementById("prox").value.trim();
  const periodo = formatarPeriodo();
  const tarefasAndamento = getTarefas("andamento");
  const tarefasPendentes = getTarefas("pendente");
  const todasAtividades = [...tarefasAndamento, ...tarefasPendentes];

  let txt = `${sep}\n= ${periodo} =\n\n${cargo}: ${nome}\n`;

  if (atencao) {
    txt += `\nPONTOS DE ATENÇÃO DO PERÍODO:\n`;
    atencao.split("\n").forEach((l) => { if (l.trim()) txt += `- ${l.trim()}\n`; });
  }

  txt += `\n${sep}\n`;

  if (todasAtividades.length > 0) {
    txt += `PRINCIPAIS ATIVIDADES:\n`;
    todasAtividades.forEach((t) => { txt += `- ${t.descricao}\n`; });
  }

  if (obs) {
    txt += `\n${sep}\n`;
    obs.split("\n").forEach((l) => { if (l.trim()) txt += `- ${l.trim()}\n`; });
  }

  if (prox) {
    txt += `\nPRÓXIMOS PASSOS:\n`;
    prox.split("\n").forEach((l) => { if (l.trim()) txt += `- ${l.trim()}\n`; });
  }

  txt += sep;
  return txt;
}

// ---- Enviar relatório ----
async function enviar() {
  const nome = document.getElementById("nome").value.trim();
  if (!nome) {
    const input = document.getElementById("nome");
    input.style.borderColor = "rgba(226,75,74,.6)";
    setTimeout(() => (input.style.borderColor = ""), 2000);
    return;
  }

  const payload = {
    responsavel: nome,
    cargo: document.getElementById("cargo").value,
    periodo: {
      inicio: document.getElementById("dt-inicio").value,
      fim: document.getElementById("dt-fim").value,
    },
    tarefasAndamento: getTarefas("andamento"),
    tarefasPendentes: getTarefas("pendente"),
    observacoes: document.getElementById("obs").value.trim(),
    proximosPassos: document.getElementById("prox").value.trim(),
    pontosAtencao: document.getElementById("atencao").value.trim(),
  };

  // Envia para o backend
  try {
    await fetch(`${API_URL}/relatorio`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("Backend indisponível, exibindo prévia localmente.", err);
  }

  // Exibe prévia formatada
  document.getElementById("preview-text").textContent = gerarTexto();
  document.getElementById("preview").style.display = "flex";
}

function fechar() {
  document.getElementById("preview").style.display = "none";
}

function copiar() {
  const txt = document.getElementById("preview-text").textContent;
  navigator.clipboard.writeText(txt).then(() => {
    const tip = document.getElementById("copied-tip");
    tip.style.opacity = "1";
    setTimeout(() => (tip.style.opacity = "0"), 2000);
  });
}

// ---- Lógica de substituto ----
function verificarSubstituto() {
  const cargo = document.getElementById("cargo").value;
  const wrap = document.getElementById("substituto-wrap");
  if (cargo === "Coordenador 02") {
    wrap.classList.add("visible");
  } else {
    wrap.classList.remove("visible");
  }
}

// Inicia com uma tarefa de cada tipo
addTarefa("andamento");
addTarefa("pendente");
