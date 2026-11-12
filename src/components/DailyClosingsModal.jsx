import React from 'react';
import { X, Calendar, Moon, Sun, CheckCircle2, AlertTriangle } from 'lucide-react';
import { sounds } from '../utils/audio';

export function DailyClosingsModal({ 
  isOpen, 
  onClose, 
  closings = [], 
  todayLog = {}, 
  todaySpent = 0, 
  todayIncome = 0, 
  currentPocketBalance = 0,
  dailyLimit = 10,
  onManualCloseToday = () => {}
}) {
  if (!isOpen) return null;

  const safeClosings = Array.isArray(closings) ? closings : [];
  const safeTodaySpent = typeof todaySpent === 'number' && !isNaN(todaySpent) ? todaySpent : 0;
  const safePocketBalance = typeof currentPocketBalance === 'number' && !isNaN(currentPocketBalance) ? currentPocketBalance : 0;
  const safeStartBalance = typeof todayLog?.startBalance === 'number' && !isNaN(todayLog.startBalance) ? todayLog.startBalance : 0;

  // Estadísticas del mes
  const totalDaysClosed = safeClosings.length;
  const totalSpentAllDays = safeClosings.reduce((sum, c) => sum + (c?.totalSpent || 0), 0);
  const avgDailySpent = totalDaysClosed > 0 ? (totalSpentAllDays / totalDaysClosed) : 0;
  const daysUnderBudget = safeClosings.filter(c => (c?.totalSpent || 0) <= (c?.dailyLimit || dailyLimit)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-lg bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 border border-amber-200/60 flex items-center justify-center text-amber-700">
              <Moon size={20} />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 leading-tight">
                Cierres Diarios & Estadísticas
              </h3>
              <p className="text-xs text-gray-400 font-bold">Arqueo automático a medianoche</p>
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

        {/* Tarjetas de Resumen General */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200/70 text-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block">Gasto Promedio</span>
            <span className="text-base font-black text-gray-900">${avgDailySpent.toFixed(2)}</span>
            <span className="text-[9px] text-gray-400 block">por día</span>
          </div>
          <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200/70 text-center">
            <span className="text-[10px] font-black text-emerald-600 uppercase tracking-wider block">Días Cumplidos</span>
            <span className="text-base font-black text-emerald-800">{daysUnderBudget} / {totalDaysClosed || 1}</span>
            <span className="text-[9px] text-emerald-600 block">bajo presupuesto</span>
          </div>
          <div className="p-3 bg-blue-50 rounded-2xl border border-blue-200/70 text-center">
            <span className="text-[10px] font-black text-blue-600 uppercase tracking-wider block">Total Mes</span>
            <span className="text-base font-black text-blue-900">${totalSpentAllDays.toFixed(2)}</span>
            <span className="text-[9px] text-blue-600 block">gastado</span>
          </div>
        </div>

        {/* Estado del Día Actual en Curso */}
        <div className="mb-6 p-4 rounded-3xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 shadow-2xs">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-1.5 text-xs font-black text-emerald-800">
              <Sun size={15} className="text-amber-500" />
              <span>Día en Curso (Hoy)</span>
            </div>
            <span className="text-[10px] font-bold bg-white text-emerald-700 px-2 py-0.5 rounded-full border border-emerald-200">
              Cierre automático a las 12:00 AM
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2 my-2 text-center">
            <div className="bg-white/80 p-2 rounded-xl">
              <span className="text-[9px] font-black text-gray-400 uppercase block">Inicio Mañana</span>
              <span className="text-xs font-black text-gray-900">${safeStartBalance.toFixed(2)}</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl">
              <span className="text-[9px] font-black text-rose-500 uppercase block">Gastado Hoy</span>
              <span className="text-xs font-black text-rose-600">-${safeTodaySpent.toFixed(2)}</span>
            </div>
            <div className="bg-white/80 p-2 rounded-xl">
              <span className="text-[9px] font-black text-emerald-600 uppercase block">Saldo Actual</span>
              <span className="text-xs font-black text-emerald-700">${safePocketBalance.toFixed(2)}</span>
            </div>
          </div>

          {/* Botón opcional para cerrar el día manualmente antes de dormir */}
          <button
            type="button"
            onClick={() => {
              if (window.confirm('¿Deseas cerrar el día de hoy ahora? Se guardará el resumen en tu historial y mañana empezarás de cero.')) {
                sounds.playCash();
                onManualCloseToday();
                onClose();
              }
            }}
            className="w-full mt-2 py-2 rounded-xl bg-white hover:bg-emerald-100/60 border border-emerald-300 text-emerald-800 font-black text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <Moon size={13} className="text-emerald-700" />
            <span>Cerrar Día Ahora (Ir a dormir)</span>
          </button>
        </div>

        {/* Lista de Cierres Anteriores */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-wider flex items-center justify-between">
            <span>Historial de Días Cerrados</span>
            <span className="text-[10px] text-gray-400 font-bold">{safeClosings.length} días</span>
          </h4>

          {safeClosings.length === 0 ? (
            <div className="p-8 text-center bg-gray-50 rounded-3xl border border-dashed border-gray-200 text-gray-400 space-y-2">
              <Calendar size={28} className="mx-auto text-gray-300" />
              <p className="text-xs font-bold text-gray-500">Aún no hay días cerrados</p>
              <p className="text-[11px] text-gray-400">
                A las 12:00 de la medianoche, la app guardará automáticamente tu primer cierre diario aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
              {safeClosings.map((c, index) => {
                const spent = typeof c?.totalSpent === 'number' ? c.totalSpent : 0;
                const limit = typeof c?.dailyLimit === 'number' ? c.dailyLimit : dailyLimit;
                const isUnder = spent <= limit;
                const diff = limit - spent;

                return (
                  <div 
                    key={c?.id || c?.dateStr || `close-${index}`}
                    className="p-3.5 bg-gray-50 hover:bg-gray-100/70 rounded-2xl border border-gray-200/80 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-extrabold text-xs text-gray-900">
                          {c?.dateLabel || c?.dateStr || 'Día registrado'}
                        </span>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 ${
                          isUnder ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {isUnder ? <CheckCircle2 size={10} /> : <AlertTriangle size={10} />}
                          <span>{isUnder ? `Ahorraste $${diff.toFixed(2)}` : `Excediste $${Math.abs(diff).toFixed(2)}`}</span>
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-3 text-[11px] text-gray-500 font-medium">
                        <span>Inicio: <strong className="text-gray-700">${(c?.startBalance || 0).toFixed(2)}</strong></span>
                        <span>•</span>
                        <span>Gastado: <strong className="text-rose-600">-${spent.toFixed(2)}</strong></span>
                        <span>•</span>
                        <span>Cierre: <strong className="text-emerald-700">${(c?.endBalance || 0).toFixed(2)}</strong></span>
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
