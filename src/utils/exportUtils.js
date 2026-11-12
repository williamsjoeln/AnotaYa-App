// Utilidades de Exportación a Excel (CSV) y PDF para AnotaYa

export function exportDebtsToCSV(debts, filterType = 'all') {
  if (!debts || debts.length === 0) {
    alert('No hay registros de deudas o préstamos para exportar.');
    return;
  }

  const filtered = debts.filter(d => {
    if (filterType === 'they_owe_me') return !d.isPaid && d.type === 'they_owe_me';
    if (filterType === 'i_owe') return !d.isPaid && d.type === 'i_owe';
    if (filterType === 'paid') return d.isPaid;
    return true;
  });

  if (filtered.length === 0) {
    alert('No hay registros con el filtro seleccionado.');
    return;
  }

  const headers = [
    'Fecha Registro',
    'Tipo',
    'Persona',
    'Motivo',
    'Monto Original (USD)',
    'Total Abonado (USD)',
    'Saldo Pendiente (USD)',
    'Estado',
    'Teléfono WhatsApp',
    'Fecha Límite'
  ];

  const rows = filtered.map(d => {
    const dDate = d.date ? new Date(d.date).toLocaleDateString() : '';
    const totalPaid = (d.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = d.isPaid ? 0 : Math.max(0, (d.amount || 0) - totalPaid);
    const tipo = d.type === 'they_owe_me' ? 'Me deben (Cobro)' : 'Yo debo (Pago)';
    const estado = d.isPaid ? 'Saldado' : 'Pendiente';

    return [
      `"${dDate}"`,
      `"${tipo}"`,
      `"${(d.personName || '').replace(/"/g, '""')}"`,
      `"${(d.note || '').replace(/"/g, '""')}"`,
      (d.amount || 0).toFixed(2),
      totalPaid.toFixed(2),
      remaining.toFixed(2),
      `"${estado}"`,
      `"${d.phone ? '+' + (d.countryCode || '593') + ' ' + d.phone : ''}"`,
      `"${d.dueDate || ''}"`
    ];
  });

  const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement('a');
  link.setAttribute('href', encodedUri);
  link.setAttribute('download', `AnotaYa_Reporte_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printDebtsReportPDF(debts, filterType = 'all', userName = 'Usuario') {
  if (!debts || debts.length === 0) {
    alert('No hay registros para generar el reporte en PDF.');
    return;
  }

  const filtered = debts.filter(d => {
    if (filterType === 'they_owe_me') return !d.isPaid && d.type === 'they_owe_me';
    if (filterType === 'i_owe') return !d.isPaid && d.type === 'i_owe';
    if (filterType === 'paid') return d.isPaid;
    return true;
  });

  if (filtered.length === 0) {
    alert('No hay registros con el filtro seleccionado para el PDF.');
    return;
  }

  // Cálculos de totales
  let totalCobrar = 0;
  let totalPagar = 0;
  let totalAbonado = 0;

  filtered.forEach(d => {
    const paid = (d.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    totalAbonado += paid;
    const remaining = d.isPaid ? 0 : Math.max(0, (d.amount || 0) - paid);
    if (!d.isPaid) {
      if (d.type === 'they_owe_me') totalCobrar += remaining;
      else totalPagar += remaining;
    }
  });

  const balanceNeto = totalCobrar - totalPagar;
  const fechaHoy = new Date().toLocaleDateString('es-ES', { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const filterLabel = filterType === 'they_owe_me' 
    ? 'Solo lo que Me Deben (Cobros Pendientes)'
    : filterType === 'i_owe'
    ? 'Solo lo que Yo Debo (Pagos Pendientes)'
    : filterType === 'paid'
    ? 'Solo Cuentas Saldadas (Historial)'
    : 'Reporte General Consolidado (Todos)';

  const tableRowsHtml = filtered.map((d, index) => {
    const paid = (d.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    const remaining = d.isPaid ? 0 : Math.max(0, (d.amount || 0) - paid);
    const tipo = d.type === 'they_owe_me' ? '🟢 Me deben' : '🔴 Yo debo';
    const estado = d.isPaid ? '<span style="color:#059669; font-weight:bold;">Saldado</span>' : '<span style="color:#d97706; font-weight:bold;">Pendiente</span>';

    return `
      <tr style="background-color: ${index % 2 === 0 ? '#ffffff' : '#f9fafb'}; border-bottom: 1px solid #e5e7eb;">
        <td style="padding: 10px 8px; font-size: 12px; color: #374151;">${d.date ? new Date(d.date).toLocaleDateString() : '-'}</td>
        <td style="padding: 10px 8px; font-size: 12px; font-weight: 700; color: #111827;">${d.personName || ''}</td>
        <td style="padding: 10px 8px; font-size: 12px; color: ${d.type === 'they_owe_me' ? '#047857' : '#b91c1c'}; font-weight: bold;">${tipo}</td>
        <td style="padding: 10px 8px; font-size: 12px; color: #4b5563;">${d.note || '-'}</td>
        <td style="padding: 10px 8px; font-size: 12px; text-align: right; color: #6b7280;">$${(d.amount || 0).toFixed(2)}</td>
        <td style="padding: 10px 8px; font-size: 12px; text-align: right; color: #059669; font-weight: 600;">$${paid.toFixed(2)}</td>
        <td style="padding: 10px 8px; font-size: 13px; text-align: right; font-weight: 800; color: ${d.isPaid ? '#9ca3af' : d.type === 'they_owe_me' ? '#047857' : '#b91c1c'};">
          $${remaining.toFixed(2)}
        </td>
        <td style="padding: 10px 8px; font-size: 11px; text-align: center;">${estado}</td>
      </tr>
    `;
  }).join('');

  const reportHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <title>Reporte Financiero — AnotaYa</title>
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 30px; color: #111827; }
        .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 3px solid #10b981; padding-bottom: 15px; margin-bottom: 20px; }
        .logo { font-size: 26px; font-weight: 900; color: #0f172a; }
        .logo span { color: #10b981; }
        .subtitle { font-size: 12px; color: #6b7280; font-weight: 600; margin-top: 2px; }
        .meta { text-align: right; font-size: 11px; color: #6b7280; }
        .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 25px; }
        .summary-card { padding: 14px; border-radius: 12px; border: 1px solid #e5e7eb; background: #f9fafb; text-align: center; }
        .summary-card h4 { margin: 0 0 5px 0; font-size: 10px; font-weight: 800; text-transform: uppercase; color: #6b7280; }
        .summary-card p { margin: 0; font-size: 20px; font-weight: 900; }
        table { width: 100%; border-collapse: collapse; margin-top: 15px; }
        th { background: #111827; color: white; padding: 10px 8px; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; text-align: left; }
        th:nth-child(5), th:nth-child(6), th:nth-child(7) { text-align: right; }
        th:nth-child(8) { text-align: center; }
        .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 15px; }
        @media print {
          body { margin: 15px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>
      <div class="no-print" style="margin-bottom: 20px; text-align: right;">
        <button onclick="window.print()" style="background:#10b981; color:white; border:none; padding:10px 20px; font-weight:bold; border-radius:8px; cursor:pointer; font-size:13px;">
          🖨️ Imprimir o Guardar como PDF
        </button>
      </div>

      <div class="header">
        <div>
          <div class="logo">Anota<span>Ya</span></div>
          <div class="subtitle">Control Inteligente de Préstamos y Deudas</div>
        </div>
        <div class="meta">
          <div><strong>Usuario:</strong> ${userName}</div>
          <div><strong>Fecha de emisión:</strong> ${fechaHoy}</div>
          <div><strong>Filtro:</strong> ${filterLabel}</div>
        </div>
      </div>

      <div class="summary-grid">
        <div class="summary-card" style="border-color: #a7f3d0; background: #ecfdf5;">
          <h4 style="color: #047857;">Total que Me Deben</h4>
          <p style="color: #047857;">$${totalCobrar.toFixed(2)}</p>
        </div>
        <div class="summary-card" style="border-color: #fecdd3; background: #fff1f2;">
          <h4 style="color: #be123c;">Total que Yo Debo</h4>
          <p style="color: #be123c;">$${totalPagar.toFixed(2)}</p>
        </div>
        <div class="summary-card" style="border-color: #e5e7eb; background: #ffffff;">
          <h4 style="color: #374151;">Balance Neto</h4>
          <p style="color: ${balanceNeto >= 0 ? '#047857' : '#be123c'};">${balanceNeto >= 0 ? '+' : '-'}$${Math.abs(balanceNeto).toFixed(2)}</p>
        </div>
      </div>

      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Persona</th>
            <th>Tipo</th>
            <th>Motivo</th>
            <th style="text-align:right;">Original</th>
            <th style="text-align:right;">Abonado</th>
            <th style="text-align:right;">Pendiente</th>
            <th style="text-align:center;">Estado</th>
          </tr>
        </thead>
        <tbody>
          ${tableRowsHtml}
        </tbody>
      </table>

      <div class="footer">
        Generado automáticamente por <strong>AnotaYa</strong> — Gestión personal de cobros y deudas.
      </div>

      <script>
        window.onload = function() {
          // Auto disparar la ventana de impresión
          setTimeout(function() { window.print(); }, 400);
        };
      </script>
    </body>
    </html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.open();
    printWindow.document.write(reportHtml);
    printWindow.document.close();
  } else {
    // Si el bloqueador de popups bloqueó la ventana, usar un iframe oculto
    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);
    iframe.contentDocument.write(reportHtml);
    iframe.contentDocument.close();
    iframe.contentWindow.focus();
    iframe.contentWindow.print();
    setTimeout(() => document.body.removeChild(iframe), 2000);
  }
}
