import React, { useState } from 'react';
import { X, Plus, PiggyBank, Sparkles, Check, Trash2, ArrowRight } from 'lucide-react';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';

export function SavingsGoalsModal({ isOpen, onClose, goals, onAddGoal, onDepositToGoal, onDeleteGoal, pocketBalance }) {
  const [title, setTitle] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [emoji, setEmoji] = useState('🎯');
  const [depositGoalId, setDepositGoalId] = useState(null);
  const [depositAmountStr, setDepositAmountStr] = useState('');

  if (!isOpen) return null;

  const handleCreate = (e) => {
    e.preventDefault();
    const target = parseFloat(targetAmountStr);
    if (!title.trim() || !target || target <= 0) {
      alert('Ingresa un título y meta válidos');
      return;
    }

    const newGoal = {
      id: `goal-${Date.now()}`,
      title: title.trim(),
      targetAmount: target,
      currentAmount: 0,
      emoji: emoji || '🎯',
      createdAt: new Date().toISOString()
    };

    sounds.playCash();
    onAddGoal(newGoal);
    setTitle('');
    setTargetAmountStr('');
  };

  const handleDepositSubmit = (e) => {
    e.preventDefault();
    const amount = parseFloat(depositAmountStr);
    if (!amount || amount <= 0) return;
    if (amount > pocketBalance) {
      alert(`No tienes suficiente efectivo en el bolsillo ($${pocketBalance.toFixed(2)})`);
      return;
    }

    sounds.playCash();
    const completed = onDepositToGoal(depositGoalId, amount);
    if (completed) {
      try {
        confetti({ particleCount: 90, spread: 80, origin: { y: 0.6 } });
      } catch {}
    }
    setDepositGoalId(null);
    setDepositAmountStr('');
  };

  const totalSavedInGoals = goals.reduce((sum, g) => sum + g.currentAmount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto text-left space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🐷</span>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 leading-tight">Metas de Ahorro & Alcancía</h3>
              <p className="text-[10px] text-gray-400 font-bold">Total acumulado: ${totalSavedInGoals.toFixed(2)} USD</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal interno para abonar a una meta */}
        {depositGoalId && (
          <div className="p-4 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3 animate-fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-emerald-950">Abonar desde tu Bolsillo (Tienes ${pocketBalance.toFixed(2)})</span>
              <button onClick={() => setDepositGoalId(null)} className="text-xs text-gray-400 hover:text-gray-700">✕</button>
            </div>
            <form onSubmit={handleDepositSubmit} className="flex gap-2">
              <input
                type="number"
                step="0.01"
                min="0.10"
                max={pocketBalance}
                autoFocus
                required
                placeholder="Monto a guardar (ej. 2.00)"
                value={depositAmountStr}
                onChange={(e) => setDepositAmountStr(e.target.value)}
                className="flex-1 px-3 py-2 text-xs font-bold rounded-xl border border-emerald-300 bg-white focus:outline-hidden"
              />
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-xs cursor-pointer"
              >
                Abonar
              </button>
            </form>
          </div>
        )}

        {/* Formulario Nueva Meta */}
        <form onSubmit={handleCreate} className="p-4 bg-gray-50 rounded-3xl border border-gray-200/80 space-y-3">
          <span className="text-xs font-black text-gray-700 block">Crear Nueva Meta de Ahorro:</span>

          <div className="flex gap-2">
            <select
              value={emoji}
              onChange={(e) => setEmoji(e.target.value)}
              className="px-2 py-2 rounded-xl border border-gray-200 bg-white text-base cursor-pointer"
            >
              <option value="🎯">🎯</option>
              <option value="👟">👟</option>
              <option value="✈️">✈️</option>
              <option value="📱">📱</option>
              <option value="🛵">🛵</option>
              <option value="🎄">🎄</option>
            </select>
            <input
              type="text"
              required
              placeholder="¿Para qué estás ahorrando? (ej. Zapatos)"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="flex-1 px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white focus:outline-hidden"
            />
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <span className="absolute left-3 top-2 text-xs font-black text-gray-400">$</span>
              <input
                type="number"
                step="0.50"
                min="1.00"
                required
                placeholder="Meta total (ej. 60.00)"
                value={targetAmountStr}
                onChange={(e) => setTargetAmountStr(e.target.value)}
                className="w-full pl-6 pr-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white focus:outline-hidden"
              />
            </div>
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-black cursor-pointer shadow-sm"
            >
              + Crear Meta
            </button>
          </div>
        </form>

        {/* Lista de Metas */}
        <div className="space-y-3">
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider px-1">Tus Metas Activas ({goals.length})</h4>

          {goals.length === 0 ? (
            <div className="p-5 text-center text-gray-400 text-xs font-semibold bg-gray-50 rounded-2xl">
              Crea tu primera meta (ej. Comprarte algo lindo) para empezar a guardar monedas 🎉
            </div>
          ) : (
            goals.map((g) => {
              const pct = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100));
              const isCompleted = g.currentAmount >= g.targetAmount;

              return (
                <div
                  key={g.id}
                  className="p-4 rounded-2xl bg-white border border-gray-200/90 shadow-2xs space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{g.emoji}</span>
                      <div>
                        <p className="font-extrabold text-xs text-gray-900 leading-tight">{g.title}</p>
                        <p className="text-[10px] text-gray-400 font-semibold">
                          ${g.currentAmount.toFixed(2)} de ${g.targetAmount.toFixed(2)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {!isCompleted && (
                        <button
                          type="button"
                          onClick={() => { sounds.playPop(); setDepositGoalId(g.id); }}
                          className="px-2.5 py-1 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-black cursor-pointer transition-colors"
                        >
                          + Abonar
                        </button>
                      )}
                      {isCompleted && (
                        <span className="px-2.5 py-1 rounded-xl bg-amber-100 text-amber-900 text-[11px] font-black">
                          ¡Meta Lograda! 🎉
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => onDeleteGoal(g.id)}
                        className="w-7 h-7 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center cursor-pointer"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Barra de progreso */}
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%` }}
                      className={`h-full rounded-full transition-all duration-500 ${
                        isCompleted ? 'bg-amber-400' : 'bg-emerald-500'
                      }`}
                    />
                  </div>

                  <div className="flex justify-between text-[10px] font-bold text-gray-400">
                    <span>{pct}% completado</span>
                    <span>Falta: ${Math.max(0, g.targetAmount - g.currentAmount).toFixed(2)}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
