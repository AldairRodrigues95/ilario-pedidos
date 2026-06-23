const pedidosMap = new Map();
let audioCtx = null;

/* =========================
   UTIL
========================= */

function normalizarTipo(tipo) {
  const t = (tipo || '').toString().trim().toLowerCase();
  if (t === 'retirada') return 'retirada';
  return 'entrega';
}

function formatarHora(iso) {
  return new Date(iso).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatarMoeda(valor) {
  return 'R$ ' + (parseFloat(valor) || 0).toFixed(2).replace('.', ',');
}

function montarPagamentoTexto(pedido) {
  return pedido.pagamento || '-';
}

/* =========================
   SOM
========================= */

function tocarSomNovoPedido() {
  try {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.frequency.setValueAtTime(880, audioCtx.currentTime);
    osc.frequency.setValueAtTime(1100, audioCtx.currentTime + 0.1);
    osc.frequency.setValueAtTime(880, audioCtx.currentTime + 0.2);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.4);

    osc.start(audioCtx.currentTime);
    osc.stop(audioCtx.currentTime + 0.4);
  } catch (e) {}
}

/* =========================
   CONTADORES
========================= */

function atualizarContadores() {
  const entregas = [...pedidosMap.values()]
    .filter(p => normalizarTipo(p.tipo_pedido) === 'entrega').length;

  const retiradas = [...pedidosMap.values()]
    .filter(p => normalizarTipo(p.tipo_pedido) === 'retirada').length;

  document.getElementById('contadorEntregas').textContent =
    entregas + ' pedido(s)';

  document.getElementById('contadorRetiradas').textContent =
    retiradas + ' pedido(s)';
}

/* =========================
   IMPRESSÃO RAWBT
========================= */

function imprimirTermica(pedido) {
  const total =
    (parseFloat(pedido.valor) || 0) +
    (parseFloat(pedido.taxa_entrega) || 0);

  const texto = `
========================
        PEDIDO
========================

Nome: ${pedido.nome}
Telefone: ${pedido.telefone || '-'}
Endereço: ${pedido.endereco || '-'}

------------------------
Pedido:
${pedido.pedido || '-'}

------------------------
Valor: ${formatarMoeda(pedido.valor)}
Taxa: ${formatarMoeda(pedido.taxa_entrega)}
TOTAL: ${formatarMoeda(total)}

------------------------
Pagamento: ${montarPagamentoTexto(pedido)}

========================
   Obrigado!
========================
`;

  const url = "rawbt:" + encodeURIComponent(texto);
  window.location.href = url;
}

/* =========================
   CARD
========================= */

function criarCardPedido(pedido, isNovo) {
  const card = document.createElement('div');

  const tipo = normalizarTipo(pedido.tipo_pedido);
  card.className = `pedido-card ${tipo}` + (isNovo ? ' novo' : '');
  card.dataset.id = pedido.id;

  const total =
    (parseFloat(pedido.valor) || 0) +
    (parseFloat(pedido.taxa_entrega) || 0);

  let infoHtml = '';

  // INFO BASE (sempre)
  if (pedido.telefone) {
    infoHtml += `<div><span class="label">Tel:</span> ${pedido.telefone}</div>`;
  }

  if (pedido.endereco) {
    infoHtml += `<div><span class="label">Endereço:</span> ${pedido.endereco}</div>`;
  }

  // RETIRADA: só nome + pedido (visualmente forte)
  if (tipo === 'retirada') {
    infoHtml += `<div class="pedido-grande">${pedido.pedido || '-'}</div>`;
  } else {
    if (pedido.pedido) {
      infoHtml += `<div><span class="label">Pedido:</span> ${pedido.pedido}</div>`;
    }
  }

  const valoresHtml =
    tipo === 'retirada'
      ? ''
      : `
    <div class="pedido-valores">
      <div>Valor: ${formatarMoeda(pedido.valor)}</div>
      <div>Taxa entrega: ${formatarMoeda(pedido.taxa_entrega)}</div>
      <div class="total">Total: ${formatarMoeda(total)}</div>
      <div><span class="label">Pagamento:</span> ${montarPagamentoTexto(pedido)}</div>
    </div>
  `;

  const acoesHtml = `
    <div class="pedido-acoes">
      <button class="btn-imprimir" data-acao="imprimir">🖨 Imprimir</button>
      <button class="btn-concluir" data-acao="concluir">✓ Concluído</button>
    </div>
  `;

  card.innerHTML = `
    <div class="pedido-header">
      <strong class="${tipo === 'retirada' ? 'nome-grande' : ''}">${pedido.nome}</strong>
      <span class="pedido-hora">${formatarHora(pedido.created_at)}</span>
    </div>

    <div class="pedido-info">${infoHtml}</div>

    ${valoresHtml}

    ${acoesHtml}
  `;

  card.querySelector('[data-acao="imprimir"]')
    ?.addEventListener('click', () => imprimirTermica(pedido));

  card.querySelector('[data-acao="concluir"]')
    ?.addEventListener('click', () => concluirPedido(pedido.id, card));

  return card;
}

/* =========================
   LISTA
========================= */

function renderizarLista(tipo, containerId) {
  const container = document.getElementById(containerId);
  container.innerHTML = '';

  const pedidos = [...pedidosMap.values()]
    .filter(p => normalizarTipo(p.tipo_pedido) === tipo)
    .sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

  pedidos.forEach(p => {
    container.appendChild(criarCardPedido(p, false));
  });
}

function renderizarTudo() {
  renderizarLista('entrega', 'listaEntregas');
  renderizarLista('retirada', 'listaRetiradas');
  atualizarContadores();
}

/* =========================
   PEDIDOS
========================= */

function adicionarPedido(pedido, isNovo) {
  if (pedido.status !== 'novo') return;
  if (pedidosMap.has(pedido.id)) return;

  pedidosMap.set(pedido.id, pedido);

  const containerId =
    normalizarTipo(pedido.tipo_pedido) === 'retirada'
      ? 'listaRetiradas'
      : 'listaEntregas';

  const container = document.getElementById(containerId);

  const card = criarCardPedido(pedido, isNovo);
  container.insertBefore(card, container.firstChild);

  atualizarContadores();

  if (isNovo) {
    tocarSomNovoPedido();
    setTimeout(() => card.classList.remove('novo'), 600);
  }
}

function removerPedido(id) {
  pedidosMap.delete(id);

  const card = document.querySelector(`.pedido-card[data-id="${id}"]`);
  if (card) card.remove();

  renderizarTudo();
}

/* =========================
   CONCLUIR
========================= */

async function concluirPedido(id, cardEl) {
  const btn = cardEl.querySelector('[data-acao="concluir"]');

  btn.disabled = true;
  btn.textContent = '...';

  const { error } = await window.supabaseClient
    .from('pedidos')
    .update({ status: 'concluido' })
    .eq('id', id);

  if (error) {
    btn.disabled = false;
    btn.textContent = '✓ Concluído';
    alert(error.message);
    return;
  }

  removerPedido(id);
}

/* =========================
   CARREGAR
========================= */

async function carregarPedidos() {
  const { data, error } = await window.supabaseClient
    .from('pedidos')
    .select('*')
    .eq('status', 'novo')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  pedidosMap.clear();
  data.forEach(p => pedidosMap.set(p.id, p));

  renderizarTudo();
}

/* =========================
   REALTIME
========================= */

function iniciarRealtime() {
  const statusEl = document.getElementById('statusConexao');

  window.supabaseClient
    .channel('pedidos-painel')
    .on('postgres_changes', {
      event: 'INSERT',
      schema: 'public',
      table: 'pedidos'
    }, payload => adicionarPedido(payload.new, true))

    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public',
      table: 'pedidos'
    }, payload => {
      if (payload.new.status === 'concluido') {
        removerPedido(payload.new.id);
      }
    })

    .subscribe(status => {
      statusEl.textContent =
        status === 'SUBSCRIBED' ? '● Ao vivo' : '● Offline';

      statusEl.className =
        status === 'SUBSCRIBED' ? 'online' : 'offline';
    });
}

/* =========================
   INIT
========================= */

document.addEventListener('DOMContentLoaded', async () => {
  document.body.addEventListener('click', () => {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }, { once: true });

  await carregarPedidos();
  iniciarRealtime();
});
