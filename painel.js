function criarCardPedido(pedido, isNovo) {
  const card = document.createElement('div');

  const tipo = normalizarTipo(pedido.tipo_pedido);
  card.className = `pedido-card ${tipo}` + (isNovo ? ' novo' : '');
  card.dataset.id = pedido.id;

  const total =
    (parseFloat(pedido.valor) || 0) +
    (parseFloat(pedido.taxa_entrega) || 0);

  let infoHtml = '';

  /* =========================
     RETIRADA
  ========================= */
  if (tipo === 'retirada') {

    infoHtml = `
      <div class="tag-retirada">
        🔴 RETIRADA
      </div>

      <div class="pedido-retirada">
        ${pedido.pedido || '-'}
      </div>
    `;

    card.innerHTML = `
      <div class="pedido-header">
        <strong class="nome-retirada">${pedido.nome}</strong>
        <span class="pedido-hora">${formatarHora(pedido.created_at)}</span>
      </div>

      <div class="pedido-info">
        ${infoHtml}
      </div>

      <div class="pedido-acoes">
        <button class="btn-concluir" data-acao="concluir">
          ✓ Concluído
        </button>
      </div>
    `;

  } else {

    /* =========================
       ENTREGA (NORMAL)
    ========================= */

    if (pedido.telefone) {
      infoHtml += `<div><span class="label">Tel:</span> ${pedido.telefone}</div>`;
    }

    if (pedido.endereco) {
      infoHtml += `<div><span class="label">Endereço:</span> ${pedido.endereco}</div>`;
    }

    if (pedido.pedido) {
      infoHtml += `<div><span class="label">Pedido:</span> ${pedido.pedido}</div>`;
    }

    card.innerHTML = `
      <div class="pedido-header">
        <strong>${pedido.nome}</strong>
        <span class="pedido-hora">${formatarHora(pedido.created_at)}</span>
      </div>

      <div class="pedido-info">${infoHtml}</div>

      <div class="pedido-valores">
        <div>Valor: ${formatarMoeda(pedido.valor)}</div>
        <div>Taxa entrega: ${formatarMoeda(pedido.taxa_entrega)}</div>
        <div class="total">Total: ${formatarMoeda(total)}</div>
        <div>
          <span class="label">Pagamento:</span>
          ${montarPagamentoTexto(pedido)}
        </div>
      </div>

      <div class="pedido-acoes">
        <button class="btn-imprimir" data-acao="imprimir">
          🖨 Imprimir
        </button>

        <button class="btn-concluir" data-acao="concluir">
          ✓ Concluído
        </button>
      </div>
    `;

    card.querySelector('[data-acao="imprimir"]')
      ?.addEventListener('click', () => imprimirTermica(pedido));
  }

  card.querySelector('[data-acao="concluir"]')
    ?.addEventListener('click', () => concluirPedido(pedido.id, card));

  return card;
}
