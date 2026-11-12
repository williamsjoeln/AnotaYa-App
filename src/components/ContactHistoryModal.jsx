import React from 'react';
import { X, User, Phone, MessageCircle, Plus, CheckCircle2, AlertCircle, ArrowUpRight, ArrowDownRight, Clock, DollarSign } from 'lucide-react';
import { openWhatsApp } from '../utils/countryCodes';
import { sounds } from '../utils/audio';

export function ContactHistoryModal({ 
  isOpen, 
  onClose, 
  personName, 
  debts = [], 
  onOpenNewDebtWithPerson,
  onOpenPayment,
  onMarkPaid
}) {
  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'pan-y';
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  if (!isOpen || !personName) return null;

  // Filtrar todas las deudas pasadas y presentes de esta persona (case-insensitive)
  const normName = personName.trim().toLowerCase();
  const personDebts = debts.filter(d => (d.personName || '').trim().toLowerCase() === normName);

  // Obtener teléfono si está disponible en alguno de sus registros
  const phoneDebt = personDebts.find(d => Boolean(d.phone));
  const phone = phoneDebt?.phone || '';
  const countryCode = phoneDebt?.countryCode || '593';

  // Cálculos consolidados
  let totalTheyOweMeHistorical = 0;
  let totalIOweHistorical = 0;
  let currentTheyOweMePending = 0;
  let currentIOwePending = 0;
  let totalPaymentsReceived = 0;

  personDebts.forEach(d => {
    const totalAbonado = (d.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    totalPaymentsReceived += totalAbonado;

    if (d.type === 'they_owe_me') {
      totalTheyOweMeHistorical += d.amount || 0;
      if (!d.isPaid) {
        currentTheyOweMePending += Math.max(0, (d.amount || 0) - totalAbonado);
      }
    } else {
      totalIOweHistorical += d.amount || 0;
      if (!d.isPaid) {
        currentIOwePending += Math.max(0, (d.amount || 0) - totalAbonado);
      }
    }
  });

  const netPending = currentTheyOweMePending - currentIOwePending;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden w-full max-w-full touch-pan-y overscroll-none">
      <div className="modal-sheet-container w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto overflow-x-hidden text-left space-y-4 overscroll-contain box-border">
        
        {/* Header con Perfil de Contacto */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center text-xl font-black shadow-md">
              {personName.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-lg text-gray-900 leading-tight">
                  {personName}
                </h3>
                <span className="text-[10px] font-black bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                  Ficha de Contacto
                </span>
              </div>
              {phone ? (
                <p className="text-xs text-gray-500 font-semibold flex items-center gap-1 mt-0.5">
                  <Phone size={11} className="text-gray-400" />
                  <span>+{countryCode} {phone}</span>
                </p>
              ) : (
                <p className="text-xs text-gray-400 font-medium mt-0.5">Sin teléfono registrado</p>
              )}
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Resumen del Saldo Actual con esta Persona */}
        <div className={`p-4 rounded-3xl border ${
          netPending > 0
            ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
            : netPending < 0
            ? 'bg-rose-50/80 border-rose-200 text-rose-900'
            : 'bg-gray-50 border-gray-200 text-gray-800'
        }`}>
          <span className="text-[10px] font-black uppercase tracking-wider block mb-1">
            Estado Actual de Cuentas
          </span>
          <div className="flex items-baseline gap-1">
            <span className="text-3xl font-black tracking-tight">
              ${Math.abs(netPending).toFixed(2)}
            </span>
            <span className="text-xs font-bold ml-1">
              {netPending > 0 ? 'Te debe en total' : netPending < 0 ? 'Le debes en total' : 'Cuentas claras (Al día 🤝)'}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-black/5 text-xs font-semibold">
            <div>
              <span className="text-gray-500 block text-[10px] font-bold">Total Prestado Histórico</span>
              <span className="font-black text-emerald-700">${totalTheyOweMeHistorical.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-500 block text-[10px] font-bold">Total Pagado / Abonado</span>
              <span className="font-black text-gray-800">${totalPaymentsReceived.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Botones de Acción Rápida con este Contacto */}
        <div className="flex items-center gap-2">
          {phoneDebt && (
            <button
              type="button"
              onClick={() => { sounds.playPop(); openWhatsApp(phoneDebt); }}
              className="flex-1 py-2.5 px-3 rounded-2xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer border border-emerald-200/80 transition-colors shadow-2xs"
            >
              <MessageCircle size={14} className="text-emerald-600 fill-emerald-100" />
              <span>Enviar WhatsApp</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              onClose();
              onOpenNewDebtWithPerson(personName, phone, countryCode);
            }}
            className="flex-1 py-2.5 px-3 rounded-2xl bg-gray-900 hover:bg-black text-white text-xs font-black flex items-center justify-center gap-1.5 cursor-pointer transition-colors shadow-md"
          >
            <Plus size={14} />
            <span>+ Anotar Deuda</span>
          </button>
        </div>

        {/* Línea de Tiempo de todas las operaciones */}
        <div>
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider mb-2.5">
            Historial de Operaciones ({personDebts.length})
          </h4>

          {personDebts.length === 0 ? (
            <p className="text-xs text-gray-400 p-4 bg-gray-50 rounded-2xl text-center">
              No hay operaciones registradas con este nombre.
            </p>
          ) : (
            <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
              {personDebts.map((d) => {
                const totalAbonos = (d.payments || []).reduce((s, p) => s + (p.amount || 0), 0);
                const rest = Math.max(0, (d.amount || 0) - totalAbonos);
                const isTheyOwe = d.type === 'they_owe_me';

                return (
                  <div
                    key={d.id}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      d.isPaid
                        ? 'bg-gray-50/70 border-gray-200 opacity-75'
                        : isTheyOwe
                        ? 'bg-emerald-50/30 border-emerald-200'
                        : 'bg-rose-50/30 border-rose-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                          d.isPaid
                            ? 'bg-gray-100 text-gray-600 border-gray-200'
                            : isTheyOwe
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border-rose-200'
                        }`}>
                          {d.isPaid ? '✅ Saldado' : isTheyOwe ? 'Me Debe' : 'Yo Debo'}
                        </span>
                        <span className="text-xs font-extrabold text-gray-900 truncate">
                          {d.note || 'Sin motivo'}
                        </span>
                      </div>

                      <span className={`text-sm font-black ${
                        d.isPaid ? 'line-through text-gray-400' : isTheyOwe ? 'text-emerald-700' : 'text-rose-700'
                      }`}>
                        ${d.isPaid ? d.amount.toFixed(2) : rest.toFixed(2)}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-[10px] text-gray-400 font-semibold pt-1">
                      <span>Registrado: {new Date(d.date).toLocaleDateString()}</span>
                      <div className="flex items-center gap-2">
                        {d.payments && d.payments.length > 0 && (
                          <span className="text-emerald-700 font-bold">
                            {d.payments.length} {d.payments.length === 1 ? 'abono' : 'abonos'} (${totalAbonos.toFixed(2)})
                          </span>
                        )}
                        {!d.isPaid && onOpenPayment && (
                          <button
                            type="button"
                            onClick={() => {
                              sounds.playPop();
                              onClose();
                              onOpenPayment(d);
                            }}
                            className="px-2 py-0.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-black text-[10px] border border-blue-200 cursor-pointer"
                          >
                            + Abonar
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}
