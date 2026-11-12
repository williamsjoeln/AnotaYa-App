import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { sounds } from '../utils/audio';

export function EditAccountModal({ isOpen, onClose, account, onUpdateBalance }) {
  const [balance, setBalance] = useState(account ? account.balance.toString() : '');

  if (!isOpen || !account) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(balance);
    if (isNaN(parsed) || parsed < 0) {
      alert('Ingresa un monto válido');
      return;
    }
    sounds.playCash();
    onUpdateBalance(account.id, parsed);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-sm bg-white rounded-[32px] p-6 shadow-2xl border border-gray-100 text-left">
        
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{account.icon}</span>
            <div>
              <h3 className="font-extrabold text-base text-gray-900">{account.name}</h3>
              <p className="text-[11px] text-gray-400 font-semibold">Ajustar saldo real</p>
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

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              ¿Cuánto dinero tienes exactamente ahora?
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-3 text-lg font-black text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0"
                autoFocus
                required
                value={balance}
                onChange={(e) => setBalance(e.target.value)}
                className="w-full pl-8 pr-4 py-3 text-lg font-black text-gray-900 rounded-2xl border border-gray-200 focus:outline-hidden focus:border-emerald-600 bg-gray-50"
              />
            </div>
            <p className="text-[11px] text-gray-400 mt-1">
              Ejemplo: Si contaste tus monedas y tienes $7.00, escríbelo aquí para sincronizar tu bolsillo.
            </p>
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            <Check size={16} />
            <span>Actualizar Saldo</span>
          </button>
        </form>

      </div>
    </div>
  );
}
