import React, { useState } from 'react';
import { Sun, ArrowRight, RefreshCw, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

export function MorningPocketBanner({
  todayLog = { isOpened: false, startBalance: 0 },
  currentPocketBalance = 0,
  onSetMorningBalance = () => {},
  onKeepPreviousBalance = () => {}
}) {
  const safeBalance = typeof currentPocketBalance === 'number' && !isNaN(currentPocketBalance)
    ? currentPocketBalance
    : 0;

  const [amountStr, setAmountStr] = useState(() => safeBalance > 0 ? safeBalance.toFixed(2) : '');
  const [isEditing, setIsEditing] = useState(() => !todayLog?.isOpened);

  // Si ya inició el día y no está en modo edición, mostrar chip compacto
  if (todayLog?.isOpened && !isEditing) {
    const startBal = typeof todayLog?.startBalance === 'number' && !isNaN(todayLog.startBalance)
      ? todayLog.startBalance
      : 0;

    return (
      <div className="mb-4 px-3.5 py-2.5 rounded-2xl bg-white border border-gray-200/80 shadow-2xs flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm shrink-0">☀️</span>
          <span className="text-xs font-bold text-gray-700 truncate">
            Día iniciado con: <strong className="font-black text-emerald-700">${startBal.toFixed(2)}</strong>
          </span>
        </div>
        <button
          type="button"
          onClick={() => { sounds.playPop(); setIsEditing(true); }}
          className="text-xs font-black text-emerald-600 hover:text-emerald-700 cursor-pointer underline decoration-dotted shrink-0 px-1"
        >
          Ajustar
        </button>
      </div>
    );
  }

  const handleConfirm = (e) => {
    e?.preventDefault();
    const parsed = parseFloat(amountStr) || 0;
    if (isNaN(parsed) || parsed < 0) {
      alert('Ingresa un monto válido para tu bolsillo');
      return;
    }
    sounds.playCash();
    onSetMorningBalance(parsed);
    setIsEditing(false);
  };

  const handleKeep = () => {
    sounds.playPop();
    onKeepPreviousBalance();
    setIsEditing(false);
  };

  return (
    <div className="mb-4 p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-50 via-orange-50/60 to-emerald-50 border border-amber-200/90 shadow-xs relative overflow-hidden animate-fade-in">
      
      {/* Encabezado */}
      <div className="flex items-center gap-2.5 mb-3">
        <div className="w-8 h-8 rounded-xl bg-amber-400 text-white flex items-center justify-center shadow-xs shrink-0">
          <Sun size={17} />
        </div>
        <div className="min-w-0">
          <h3 className="font-extrabold text-sm sm:text-base text-gray-900 leading-tight">
            ¿Con cuánto efectivo sales hoy?
          </h3>
          <p className="text-[11px] text-gray-500 font-bold truncate">
            Registra el dinero que llevas en tu bolsillo
          </p>
        </div>
      </div>

      <form onSubmit={handleConfirm} className="space-y-2.5">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 font-black text-base sm:text-lg select-none">
              $
            </span>
            <input
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              value={amountStr}
              onChange={(e) => setAmountStr(e.target.value)}
              placeholder="0.00"
              className="w-full pl-8 pr-3 py-2.5 bg-white rounded-2xl border border-gray-300 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-black text-lg text-gray-900 outline-none transition-all shadow-2xs"
            />
          </div>

          <button
            type="submit"
            className="px-4 sm:px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 shadow-md active:scale-95 cursor-pointer transition-all shrink-0"
          >
            <span>Iniciar</span>
            <ArrowRight size={14} />
          </button>
        </div>

        {/* Acciones secundarias en móvil */}
        <div className="flex items-center justify-between pt-0.5 text-[11px]">
          <button
            type="button"
            onClick={handleKeep}
            className="font-bold text-gray-500 hover:text-gray-800 cursor-pointer flex items-center gap-1 transition-colors"
          >
            <RefreshCw size={11} />
            <span>Mantener saldo (${safeBalance.toFixed(2)})</span>
          </button>

          {isEditing && todayLog?.isOpened && (
            <button
              type="button"
              onClick={() => setIsEditing(false)}
              className="font-bold text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
