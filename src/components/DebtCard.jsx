import React from 'react';
import { MessageCircle, Check, Trash2, Calendar, Clock, DollarSign, AlertCircle, ArrowUpRight, ArrowDownRight, Edit3 } from 'lucide-react';
import { openWhatsApp, COUNTRY_CODES } from '../utils/countryCodes';
import { sounds } from '../utils/audio';

function getDueDateStatus(dueDateStr) {
  if (!dueDateStr) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const [y, m, d] = dueDateStr.split('-').map(Number);
  const due = new Date(y, m - 1, d);
  due.setHours(0, 0, 0, 0);

  const diffTime = due.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      label: `Vencido hace ${Math.abs(diffDays)} ${Math.abs(diffDays) === 1 ? 'día' : 'días'}`,
      color: 'bg-rose-100 text-rose-800 border-rose-200',
      isOverdue: true
    };
  }
  if (diffDays === 0) {
    return {
      label: '¡Vence hoy!',
      color: 'bg-amber-100 text-amber-800 border-amber-200 animate-pulse',
      isOverdue: false
    };
  }
  if (diffDays <= 3) {
    return {
      label: `Vence en ${diffDays} días`,
      color: 'bg-amber-50 text-amber-700 border-amber-200',
      isOverdue: false
    };
  }
  return {
    label: `Vence el ${due.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`,
    color: 'bg-gray-100 text-gray-600 border-gray-200',
    isOverdue: false
  };
}

export function DebtCard({ 
  debt, 
  onOpenPayment, 
  onMarkPaid, 
  onDeleteDebt, 
  onTogglePaid,
  onOpenContactHistory,
  onOpenWhatsAppTemplate
}) {
  const isTheyOweMe = debt.type === 'they_owe_me';
  const totalPaid = (debt.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = Math.max(0, (debt.amount || 0) - totalPaid);
  const pctPaid = Math.min(100, Math.round((totalPaid / debt.amount) * 100));

  const country = COUNTRY_CODES.find(c => c.code === debt.countryCode) || COUNTRY_CODES[0];
  const dueStatus = getDueDateStatus(debt.dueDate);

  return (
    <div className={`p-4 sm:p-5 rounded-3xl bg-white border shadow-xs transition-all hover:shadow-md ${
      debt.isPaid 
        ? 'border-gray-200/80 bg-gray-50/50 opacity-80' 
        : isTheyOweMe 
        ? 'border-emerald-200/90 hover:border-emerald-300' 
        : 'border-rose-200/90 hover:border-rose-300'
    }`}>
      
      {/* Fila Superior: Badge Tipo + Nombre + Estado Vencimiento + Opciones */}
      <div className="flex items-start justify-between gap-2 mb-2.5">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 flex-wrap mb-1">
            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border flex items-center gap-1 ${
              debt.isPaid
                ? 'bg-gray-100 text-gray-600 border-gray-200'
                : isTheyOweMe
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-rose-50 text-rose-700 border-rose-200'
            }`}>
              {debt.isPaid ? '✅ Saldado' : isTheyOweMe ? '🟢 Me Debe' : '🔴 Yo Debo'}
            </span>

            {/* Alerta de Fecha Límite */}
            {!debt.isPaid && dueStatus && (
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${dueStatus.color}`}>
                {dueStatus.label}
              </span>
            )}
          </div>

          <h3 
            onClick={() => {
              if (onOpenContactHistory) {
                sounds.playPop();
                onOpenContactHistory(debt.personName);
              }
            }}
            title="Toca para ver la ficha de historial de esta persona"
            className={`font-black text-base sm:text-lg text-gray-900 leading-tight truncate cursor-pointer hover:text-emerald-600 transition-colors underline decoration-dotted decoration-gray-300 underline-offset-2 ${
              debt.isPaid ? 'line-through text-gray-400' : ''
            }`}
          >
            {debt.personName}
          </h3>
          <p className="text-xs text-gray-500 font-bold mt-0.5 truncate">
            {debt.note || 'Sin motivo'}
          </p>
        </div>

        {/* Monto Destacado */}
        <div className="text-right shrink-0">
          <div className="flex items-baseline justify-end gap-0.5">
            <span className={`text-xs font-black ${
              debt.isPaid ? 'text-gray-400' : isTheyOweMe ? 'text-emerald-600' : 'text-rose-600'
            }`}>$</span>
            <span className={`text-xl sm:text-2xl font-black tracking-tight ${
              debt.isPaid ? 'text-gray-400 line-through' : isTheyOweMe ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {debt.isPaid ? debt.amount.toFixed(2) : remaining.toFixed(2)}
            </span>
          </div>

          {/* Si hubo abonos parciales, mostrar monto original */}
          {!debt.isPaid && totalPaid > 0 && (
            <span className="text-[10px] text-gray-400 font-bold block">
              de ${debt.amount.toFixed(2)} (Abonado: ${totalPaid.toFixed(2)})
            </span>
          )}
        </div>
      </div>

      {/* Barra de progreso de abonos (si existen pagos) */}
      {!debt.isPaid && totalPaid > 0 && (
        <div className="mb-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
          <div className="flex items-center justify-between text-[10px] font-black text-gray-400 mb-1">
            <span>Abonos registrados: {debt.payments.length}</span>
            <span className="text-emerald-700">{pctPaid}% cancelado</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-emerald-500 rounded-full transition-all"
              style={{ width: `${pctPaid}%` }}
            />
          </div>
        </div>
      )}

      {/* Barra de Acciones Clave: WhatsApp + Abonar + Saldar + Eliminar */}
      <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between gap-1.5 flex-wrap">
        
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          {/* Botón WhatsApp */}
          <button
            type="button"
            onClick={() => { 
              sounds.playPop(); 
              if (onOpenWhatsAppTemplate) {
                onOpenWhatsAppTemplate(debt);
              } else {
                openWhatsApp(debt);
              }
            }}
            title={debt.phone ? `Enviar plantilla de WhatsApp a ${debt.personName}` : 'Enviar mensaje por WhatsApp'}
            className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shadow-2xs border border-emerald-200/70 shrink-0"
          >
            <MessageCircle size={14} className="text-emerald-600 fill-emerald-100" />
            <span>WhatsApp</span>
          </button>

          {/* Botón Abonar (Destacado y Claro) */}
          {!debt.isPaid && (
            <button
              type="button"
              onClick={() => { sounds.playPop(); onOpenPayment(debt); }}
              title="Registrar un abono o pago parcial"
              className="px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-black flex items-center gap-1.5 cursor-pointer transition-all shadow-2xs border border-blue-200/90 shrink-0 active:scale-95"
            >
              <DollarSign size={14} className="text-blue-600 stroke-[3]" />
              <span>Abonar</span>
            </button>
          )}

          {/* Botón Marcar Saldado / Reactivar */}
          <button
            type="button"
            onClick={() => {
              if (debt.isPaid) {
                onTogglePaid(debt.id, false);
              } else {
                onMarkPaid(debt.id);
              }
            }}
            className={`px-3 py-2 rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer transition-colors shrink-0 ${
              debt.isPaid
                ? 'bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200'
                : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
            }`}
          >
            <Check size={13} className="stroke-[3]" />
            <span>{debt.isPaid ? 'Reabrir' : 'Saldado'}</span>
          </button>
        </div>

        {/* Botón Eliminar */}
        <button
          type="button"
          onClick={() => {
            if (window.confirm(`¿Seguro que deseas eliminar el registro de ${debt.personName}?`)) {
              sounds.playDelete();
              onDeleteDebt(debt.id);
            }
          }}
          title="Eliminar registro"
          className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-rose-50 hover:text-rose-600 flex items-center justify-center text-gray-400 cursor-pointer transition-colors shrink-0"
        >
          <Trash2 size={14} />
        </button>

      </div>
    </div>
  );
}
