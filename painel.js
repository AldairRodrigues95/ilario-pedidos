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
   IMPRESSÃO TÉRMICA
========================= */
function imprimirPedidoTermico(pedido) {
  const janela = window.open('', '_blank');

  const total = (
    parseFloat(pedido.valor || 0) +
    parseFloat(pedido.taxa_entrega || 0)
  ).toFixed(2);

  janela.document.write(`
    <html>
      <head>
        <title>Pedido</title>
        <style>
          @page { size: 80mm auto; margin: 0; }
          body {
            width: 80mm;
            font-family: monospace;
            font-size: 12px;
            padding: 5px;
          }
          .center { text-align: center; }
          .linha { margin: 2px 0; }
          .hr { border-top: 1px dashed #000; margin: 5px 0; }
          .total { font-weight: bold; font-size: 14px; }
        </style>
      </head>
      <body onload="window.print(); setTimeout(() => window.close(), 300);">

        <div class="center"><strong>🍽 PEDIDO</strong></div>
        <div class="hr"></div>

        <div class="linha"><strong>Nome:</strong> ${pedido.nome}</div>
        <div class="linha"><strong>Telefone:</strong> ${pedido.telefone || '-'}</div>
        <div class="linha"><strong>Endereço:</strong> ${pedido.endereco || '-'}</div>

        <div class="hr"></div>

        <div class="linha"><strong>Pedido:</strong></div>
        <div class="linha">${pedido.pedido || '-'}</div>

        <div class="hr"></div>

        <div class="linha">Valor: ${formatarMoeda(pedido.valor)}</div>
        <div class="linha">Taxa: ${formatarMoeda(pedido.taxa_entrega)}</div>

        <div class="hr"></div>

        <div class="center total">TOTAL: ${formatarMoeda(total)}</div>

        <div class="hr"></div>
        <div class="center">Obrigado!</div>

      </body>
    </html>
  `);

  janela.document.close();
}

/* =========================
   CARD
========================= */
function criarCardPedido(pedido, isNovo) {
  const tipo = normalizarTipo(pedido.tipo_pedido);

  const card = document.createElement('div');
  card.className = `pedido-card ${tipo}` + (isNovo ? ' novo' : '');
  card.dataset.id = pedido.id;

  const total =
    (parseFloat(pedido.valor) || 0) +
    (parseFloat(pedido.taxa_entrega) || 0);

  let infoHtml = '';

  if (pedido.telefone) {
    infoHtml += `<div><span class="label">Tel:</span> ${pedido.telefone}</div>`;
  }

  if (pedido.endereco) {
    infoHtml += `<div><span class="label">Endereço:</span> ${pedido.endereco}</div>`;
  }

  if (pedido.pedido) {
    infoHtml += `<div><span class="label">Pedido:</span> ${pedido.pedido}</div>`;
  }

  const botaoImprimir =
    tipo === 'entrega'
      ? `<button class="btn-imprimir" data-acao="imprimir">🖨 Imprimir</button>`
      : '';

  const botaoConcluir =
    tipo === 'entrega'
      ? `<button class="btn-concluir entrega-btn" data-acao="concluir">✓ Concluir</button>`
      : `<button class="btn-concluir retirada-btn" data-acao="concluir">✓ Concluir</button>`;

  card.innerHTML = `
    <div class="pedido-header">
      <strong>${pedido.nome}</strong>
      ${tipo === 'retirada' ? '<span style="color:#ff4d4d;font-weight:bold;">RETIRADA</span>' : ''}
      <span class="pedido-hora">${formatarHora(pedido.created_at)}</span>
    </div>

    <div class="pedido-info">${infoHtml}</div>

    <div class="pedido-valores">
      <div>Valor: ${formatarMoeda(pedido.valor)}</div>
      <div>Taxa: ${formatarMoeda(pedido.taxa_entrega)}</div>
      <div class="total">Total: ${formatarMoeda(total)}</div>
      <div><span class="label">Pagamento:</span> ${montarPagamentoTexto(pedido)}</div>
    </div>

    <div class="pedido-acoes">
      ${botaoImprimir}
      ${botaoConcluir}
    </div>
  `;

  if (tipo === 'entrega') {
    card.querySelector('[data-acao="imprimir"]')
      ?.addEventListener('click', () => imprimirPedidoTermico(pedido));
  }

  card.querySelector('[data-acao="concluir"]')
    .addEventListener('click', () => concluirPedido(pedido.id, card));

  return card;
}

/* =========================
   RESTO
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

function adicionarPedido(pedido, isNovo) {
  if (pedido.status !== 'novo') return;
  if (pedidosMap.has(pedido.id)) return;

  pedidosMap.set(pedido.id, pedido);

  const tipo = normalizarTipo(pedido.tipo_pedido);

  const containerId =
    tipo === 'retirada' ? 'listaRetiradas' : 'listaEntregas';

  const container = document.getElementById(containerId);

  const card = criarCardPedido(pedido, isNovo);
  container.insertBefore(card, container.firstChild);

  atualizarContadores();

  if (isNovo) tocarSomNovoPedido();
}

function removerPedido(id) {
  pedidosMap.delete(id);

  const card = document.querySelector(`.pedido-card[data-id="${id}"]`);
  if (card) card.remove();

  renderizarTudo();
}

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
    btn.textContent = '✓ Concluir';
    alert(error.message);
    return;
  }

  removerPedido(id);
}

async function carregarPedidos() {
  const { data, error } = await window.supabaseClient
    .from('pedidos')
    .select('*')
    .eq('status', 'novo')
    .order('created_at', { ascending: false });

  if (error) return console.error(error);

  pedidosMap.clear();
  data.forEach(p => pedidosMap.set(p.id, p));

  renderizarTudo();
}

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
      if (payload.new.status === 'concluido') removerPedido(payload.new.id);
    })
    .subscribe(status => {
      statusEl.textContent =
        status === 'SUBSCRIBED' ? '● Ao vivo' : '● Offline';

      statusEl.className =
        status === 'SUBSCRIBED' ? 'online' : 'offline';
    });
}

document.addEventListener('DOMContentLoaded', async () => {
  document.body.addEventListener('click', () => {
    if (!audioCtx)
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }, { once: true });

  await carregarPedidos();
  iniciarRealtime();
});