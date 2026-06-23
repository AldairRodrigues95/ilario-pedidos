function getTipoPedido() {
  const selecionado = document.querySelector('input[name="tipoPedido"]:checked');
  return selecionado ? selecionado.value : 'entrega';
}

function toggleTipoPedido() {
  const isEntrega = getTipoPedido() === 'entrega';

  document.getElementById('blocoEndereco').classList.toggle('hidden', !isEntrega);
  document.getElementById('blocoTaxaEntrega').classList.toggle('hidden', !isEntrega);
}

function toggleTroco() {
  const pagamento = document.getElementById('pagamento').value;
  const blocoTroco = document.getElementById('blocoTroco');

  blocoTroco.classList.toggle('hidden', pagamento !== 'DINHEIRO');

  if (pagamento !== 'DINHEIRO') {
    document.getElementById('precisaTroco').value = 'Não';
    document.getElementById('blocoTrocoValor').classList.add('hidden');
  }
}

function toggleTrocoValor() {
  const precisaTroco = document.getElementById('precisaTroco').value;
  document.getElementById('blocoTrocoValor').classList.toggle('hidden', precisaTroco !== 'Sim');
}

/* =========================
   COLETAR DADOS (CORRIGIDO)
========================= */
function coletarDadosFormulario() {
  const tipoPedido = getTipoPedido();
  const isEntrega = tipoPedido === 'entrega';
  const pagamento = document.getElementById('pagamento').value;

  return {
    nome: document.getElementById('nome').value.trim(),
    endereco: isEntrega ? document.getElementById('endereco').value.trim() : null,
    telefone: document.getElementById('telefone').value.trim() || null,
    pedido: document.getElementById('pedido').value.trim() || null,
    valor: parseFloat(document.getElementById('valor').value) || 0,
    taxa_entrega: isEntrega ? (parseFloat(document.getElementById('taxaEntrega').value) || 0) : 0,
    pagamento: pagamento,

    // 🔥 ESSENCIAL PARA O PAINEL FUNCIONAR
    tipo_pedido: tipoPedido,

    status: 'novo'
  };
}

/* =========================
   LIMPAR FORMULÁRIO
========================= */
function limparFormulario() {
  document.getElementById('nome').value = '';
  document.getElementById('endereco').value = '';
  document.getElementById('telefone').value = '';
  document.getElementById('pedido').value = '';
  document.getElementById('taxaEntrega').value = '';
  document.getElementById('valor').value = '';
  document.getElementById('pagamento').value = 'DINHEIRO';
  document.getElementById('precisaTroco').value = 'Não';
  document.getElementById('trocoPara').value = '';

  document.querySelector('input[name="tipoPedido"][value="entrega"]').checked = true;

  toggleTipoPedido();
  toggleTroco();
}

/* =========================
   SALVAR PEDIDO
========================= */
async function salvarPedido() {
  const msg = document.getElementById('msg');
  const btn = document.getElementById('btnSalvar');
  const dados = coletarDadosFormulario();

  msg.className = 'msg';

  // validações
  if (!dados.nome) {
    msg.textContent = 'Preencha o nome do cliente!';
    msg.classList.add('erro');
    return;
  }

  if (dados.tipo_pedido === 'entrega' && !dados.endereco) {
    msg.textContent = 'Para entrega, o endereço é obrigatório!';
    msg.classList.add('erro');
    return;
  }

  btn.disabled = true;
  msg.textContent = 'Salvando pedido...';

  const { data, error } = await window.supabaseClient
    .from('pedidos')
    .insert([dados])
    .select()
    .single();

  if (error) {
    msg.textContent = 'Erro ao salvar: ' + error.message;
    msg.classList.add('erro');
    btn.disabled = false;
    return;
  }

  /* =========================
     IMPRESSÃO (SÓ ENTREGA)
  ========================= */
  if (dados.tipo_pedido === 'entrega') {
    if (typeof gerarPDFPedido === 'function' && typeof imprimirPDF === 'function') {
      const doc = gerarPDFPedido(data);
      imprimirPDF(doc);
    }

    msg.textContent = 'Pedido salvo e enviado para impressão!';
  } else {
    msg.textContent = 'Pedido de retirada salvo com sucesso!';
  }

  msg.classList.add('sucesso');

  limparFormulario();
  btn.disabled = false;
}

/* =========================
   INIT
========================= */
document.addEventListener('DOMContentLoaded', function () {
  document.querySelectorAll('input[name="tipoPedido"]').forEach(function (radio) {
    radio.addEventListener('change', toggleTipoPedido);
  });

  document.getElementById('pagamento').addEventListener('change', toggleTroco);
  document.getElementById('precisaTroco').addEventListener('change', toggleTrocoValor);
  document.getElementById('btnSalvar').addEventListener('click', salvarPedido);

  toggleTipoPedido();
  toggleTroco();
});