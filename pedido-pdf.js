function montarTextoPagamento(pagamento, precisaTroco, trocoPara) {
  let texto = pagamento || '-';
  if (pagamento === 'DINHEIRO') {
    if (precisaTroco && trocoPara) {
      texto += ' - TROCO PARA R$ ' + parseFloat(trocoPara).toFixed(2);
    } else {
      texto += ' - SEM TROCO';
    }
  }
  return texto;
}

function gerarPDFPedido(pedido) {
  const nome = pedido.nome_cliente || '-';
  const endereco = pedido.endereco || '-';
  const telefone = pedido.telefone || '-';
  const descricao = pedido.descricao_pedido || '-';
  const valor = parseFloat(pedido.valor) || 0;
  const taxaEntrega = parseFloat(pedido.taxa_entrega) || 0;
  const tipoPedido = pedido.tipo_pedido || 'entrega';
  const textoPagamento = montarTextoPagamento(
    pedido.forma_pagamento,
    pedido.precisa_troco,
    pedido.troco_para
  );

  const dataHora = pedido.created_at
    ? new Date(pedido.created_at).toLocaleString('pt-BR')
    : new Date().toLocaleString('pt-BR');

  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: 'mm', format: [80, 180] });

  let y = 10;
  const margin = 5;
  const width = 70;
  const centerX = 40;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.text('ILARIO LANCHES', centerX, y, { align: 'center' });
  y += 6;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(dataHora, centerX, y, { align: 'center' });
  y += 5;
  doc.text(
    tipoPedido === 'retirada' ? 'RETIRADA NO LOCAL' : 'ENTREGA',
    centerX,
    y,
    { align: 'center' }
  );
  y += 6;

  doc.setLineWidth(0.3);
  doc.line(margin, y, 80 - margin, y);
  y += 6;

  function campo(titulo, valorTexto) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(titulo, margin, y);
    y += 4.5;
    doc.setFont('helvetica', 'normal');
    const linhas = doc.splitTextToSize(String(valorTexto), width);
    doc.text(linhas, margin, y);
    y += linhas.length * 4.2 + 3;
  }

  campo('CLIENTE:', nome);
  if (tipoPedido === 'entrega') {
    campo('ENDEREÇO:', endereco);
  }
  campo('TELEFONE:', telefone);
  campo('PEDIDO:', descricao);

  doc.line(margin, y, 80 - margin, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('VALOR PEDIDO: R$ ' + valor.toFixed(2), margin, y);
  y += 6;

  if (tipoPedido === 'entrega') {
    doc.text('TAXA ENTREGA (motoboy): R$ ' + taxaEntrega.toFixed(2), margin, y);
    y += 6;
  }

  doc.text('PAGAMENTO: ' + textoPagamento, margin, y);
  y += 8;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Obrigado pela preferência!', centerX, y, { align: 'center' });

  return doc;
}

function imprimirPDF(doc) {
  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const iframe = document.createElement('iframe');
  iframe.style.display = 'none';
  iframe.src = url;
  document.body.appendChild(iframe);
  iframe.onload = function () {
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(function () {
      URL.revokeObjectURL(url);
      document.body.removeChild(iframe);
    }, 1000);
  };
}
