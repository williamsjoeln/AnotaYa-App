import React, { useState } from 'react';
import { X, DollarSign, Check, History, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';

export function PaymentModal({ isOpen, onClose, debt, onAddPayment }) {
  const [paymentAmountStr, setPaymentAmountStr] = useState('');
  const [paymentNote, setPaymentNote] = useState('');

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

  if (!isOpen || !debt) return null;

  const totalPaidSoFar = (debt.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = Math.max(0, (debt.amount || 0) - totalPaidSoFar);
  const pctPaid = Math.min(100, Math.round((totalPaidSoFar / debt.amount) * 100));

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(paymentAmountStr);
    if (!parsed || parsed <= 0) {
      alert('Ingresa un monto de abono válido mayor a 0');
      return;
    }

    if (parsed > remaining) {
      if (!window.confirm(`El abono ($${parsed.toFixed(2)}) es mayor al saldo pendiente ($${remaining.toFixed(2)}). ¿Deseas marcar la deuda como completamente saldada?`)) {
        return;
      }
    }

    const newPayment = {
      id: `pay-${Date.now()}`,
      amount: parsed,
      note: paymentNote.trim() || 'Abono parcial',
      date: new Date().toISOString()
    };

    sounds.playCash();
    const isNowFullyPaid = (totalPaidSoFar + parsed) >= debt.amount;
    if (isNowFullyPaid) {
      try {
        confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
      } catch {}
    }

    onAddPayment(debt.id, newPayment, isNowFullyPaid);
    setPaymentAmountStr('');
    setPaymentNote('');
    onClose();
  };

  const handleQuickPayFull = () => {
    setPaymentAmountStr(remaining.toFixed(2));
    setPaymentNote('Cancelación total');
  };

  const handleQuickPayHalf = () => {
    setPaymentAmountStr((remaining / 2).toFixed(2));
    setPaymentNote('Abono del 50%');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden w-full max-w-full touch-pan-y overscroll-none">
      <div className="modal-sheet-container w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto overflow-x-hidden text-left space-y-4 overscroll-contain box-border">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
              {debt.type === 'they_owe_me' ? 'Abono de Cobro' : 'Abono de Pago'}
            </span>
            <h3 className="font-extrabold text-lg text-gray-900 mt-1">
              Registrar Abono: {debt.personName}
            </h3>
            <p className="text-xs text-gray-400 font-semibold">{debt.note}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Resumen de Montos y Barra de Progreso */}
        <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200/80 space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center">
            <div>
              <span className="text-[10px] font-black text-gray-400 uppercase block">Total Original</span>
              <span className="text-sm font-black text-gray-700">${debt.amount.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-emerald-600 uppercase block">Abonado</span>
              <span className="text-sm font-black text-emerald-700">${totalPaidSoFar.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-[10px] font-black text-rose-500 uppercase block">Resta Pagar</span>
              <span className="text-base font-black text-rose-600">${remaining.toFixed(2)}</span>
            </div>
          </div>

          {/* Barra de progreso */}
          <div>
            <div className="flex items-center justify-between text-[10px] font-black text-gray-400 mb-1">
              <span>Progreso de Pago</span>
              <span>{pctPaid}% saldado</span>
            </div>
            <div className="w-full h-2.5 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all duration-500"
                style={{ width: `${pctPaid}%` }}
              />
            </div>
          </div>
        </div>

        {/* Formulario de Abono */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
              Monto a Abonar (USD) *
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base">
                $
              </span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                autoFocus
                required
                placeholder="0.00"
                value={paymentAmountStr}
                onChange={(e) => setPaymentAmountStr(e.target.value)}
                className="w-full pl-8 pr-4 py-3 bg-white rounded-2xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-black text-xl text-gray-900 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Accesos rápidos */}
            <div className="flex items-center gap-2 mt-2">
              <button
                type="button"
                onClick={handleQuickPayFull}
                className="flex-1 py-1.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 rounded-xl text-xs font-black cursor-pointer transition-colors"
              >
                Pagar todo (${remaining.toFixed(2)})
              </button>
              {remaining > 1 && (
                <button
                  type="button"
                  onClick={handleQuickPayHalf}
                  className="flex-1 py-1.5 px-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                >
                  Pagar 50% (${(remaining / 2).toFixed(2)})
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1">
              Nota o Medio de Pago (Opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Transferencia Banco Pichincha, Efectivo"
              value={paymentNote}
              onChange={(e) => setPaymentNote(e.target.value)}
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 rounded-xl text-xs font-bold text-gray-900 outline-none transition-all"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <span>+ Registrar Abono</span>
            <ArrowRight size={15} />
          </button>
        </form>

        {/* Historial de Abonos Anteriores */}
        {debt.payments && debt.payments.length > 0 && (
          <div className="pt-2 border-t border-gray-100">
            <h4 className="text-[11px] font-black text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1">
              <History size={12} />
              <span>Historial de Abonos ({debt.payments.length})</span>
            </h4>
            <div className="space-y-1.5 max-h-36 overflow-y-auto">
              {debt.payments.map((p) => (
                <div key={p.id} className="p-2 bg-gray-50 rounded-xl border border-gray-200/60 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-black text-emerald-700">+${p.amount.toFixed(2)}</span>
                    <span className="text-[10px] text-gray-500 ml-2 font-medium">{p.note || 'Abono'}</span>
                  </div>
                  <span className="text-[10px] text-gray-400 font-semibold">
                    {new Date(p.date).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
