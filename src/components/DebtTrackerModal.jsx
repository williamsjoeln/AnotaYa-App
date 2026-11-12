import React, { useState } from 'react';
import { X, UserPlus, Check, MessageCircle, ArrowUpRight, ArrowDownRight, Trash2, ShieldAlert } from 'lucide-react';
import { sounds } from '../utils/audio';

export function DebtTrackerModal({ isOpen, onClose, debts, onAddDebt, onMarkPaid, onDeleteDebt }) {
  const [personName, setPersonName] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [type, setType] = useState('they_owe_me'); // 'they_owe_me' (Me deben) | 'i_owe' (Yo debo)
  const [phone, setPhone] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsed = parseFloat(amountStr);
    if (!parsed || parsed <= 0 || !personName.trim()) {
      alert('Ingresa el nombre y un monto válido');
      return;
    }

    const newDebt = {
      id: `debt-${Date.now()}`,
      personName: personName.trim(),
      amount: parsed,
      note: note.trim() || (type === 'they_owe_me' ? 'Préstamo' : 'Deuda'),
      type,
      phone: phone.trim().replace(/\s+/g, ''),
      date: new Date().toISOString(),
      isPaid: false
    };

    sounds.playCash();
    onAddDebt(newDebt);
    setPersonName('');
    setAmountStr('');
    setNote('');
    setPhone('');
  };

  const handleSendWhatsApp = (debt) => {
    sounds.playPop();
    let cleanPhone = debt.phone ? debt.phone.replace(/[^0-9]/g, '') : '';
    // Si es número ecuatoriano que empieza con 09 y tiene 10 dígitos, formatear con prefijo +593
    if (cleanPhone.startsWith('09') && cleanPhone.length === 10) {
      cleanPhone = '593' + cleanPhone.substring(1);
    }

    const text = encodeURIComponent(
      `Hola ${debt.personName}, ¿cómo estás? Te escribo para dejarte el recordatorio de los $${debt.amount.toFixed(2)} (${debt.note || 'pendiente'}). ¡Muchas gracias! 🤝`
    );

    const isMobile = typeof navigator !== 'undefined' && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Protocolo nativo de WhatsApp. Abre la app directamente SIN abrir pestañas o pantallas blancas en la PWA
      const nativeUrl = cleanPhone 
        ? `whatsapp://send?phone=${cleanPhone}&text=${text}`
        : `whatsapp://send?text=${text}`;

      const link = document.createElement('a');
      link.href = nativeUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      // En computadoras / laptops, abrir WhatsApp Web
      const webUrl = cleanPhone 
        ? `https://web.whatsapp.com/send?phone=${cleanPhone}&text=${text}`
        : `https://web.whatsapp.com/send?text=${text}`;
      window.open(webUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const activeDebts = debts.filter(d => !d.isPaid);
  const totalTheyOweMe = activeDebts
    .filter(d => d.type === 'they_owe_me')
    .reduce((sum, d) => sum + d.amount, 0);

  const totalIOwe = activeDebts
    .filter(d => d.type === 'i_owe')
    .reduce((sum, d) => sum + d.amount, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto text-left space-y-4">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🤝</span>
            <div>
              <h3 className="font-extrabold text-base text-gray-900 leading-tight">Control de Deudas & Préstamos</h3>
              <p className="text-[10px] text-gray-400 font-bold">¿Quién te debe? o ¿A quién le debes?</p>
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

        {/* Resumen Superior */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">Me deben a mí</span>
            <p className="text-xl font-black text-emerald-700 leading-tight mt-0.5">${totalTheyOweMe.toFixed(2)}</p>
          </div>
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-100">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-800">Yo debo</span>
            <p className="text-xl font-black text-amber-700 leading-tight mt-0.5">${totalIOwe.toFixed(2)}</p>
          </div>
        </div>

        {/* Formulario Rápido */}
        <form onSubmit={handleSubmit} className="p-4 bg-gray-50 rounded-3xl border border-gray-200/80 space-y-3">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-black text-gray-700">Anotar Préstamo o Deuda:</span>
            
            {/* Toggle tipo */}
            <div className="flex items-center bg-gray-200 rounded-xl p-0.5 text-[11px] font-black">
              <button
                type="button"
                onClick={() => setType('they_owe_me')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  type === 'they_owe_me' ? 'bg-emerald-600 text-white shadow-xs' : 'text-gray-500'
                }`}
              >
                Me deben
              </button>
              <button
                type="button"
                onClick={() => setType('i_owe')}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  type === 'i_owe' ? 'bg-amber-600 text-white shadow-xs' : 'text-gray-500'
                }`}
              >
                Yo debo
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              required
              placeholder="Nombre (ej. Juan)"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white focus:outline-hidden"
            />
            <div className="relative">
              <span className="absolute left-2.5 top-2 text-xs font-black text-gray-400">$</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                required
                placeholder="Monto (ej. 5.00)"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="w-full pl-6 pr-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white focus:outline-hidden"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <input
              type="text"
              placeholder="Motivo (ej. Almuerzo)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white focus:outline-hidden"
            />
            <input
              type="tel"
              placeholder="WhatsApp (ej. +593...)"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl border border-gray-200 bg-white focus:outline-hidden"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 rounded-xl bg-gray-900 hover:bg-black text-white text-xs font-black cursor-pointer shadow-sm transition-all"
          >
            + Guardar Registro
          </button>
        </form>

        {/* Lista de Deudas Activas */}
        <div className="space-y-2">
          <h4 className="text-xs font-black text-gray-500 uppercase tracking-wider px-1">Pendientes ({activeDebts.length})</h4>
          
          {activeDebts.length === 0 ? (
            <div className="p-5 text-center text-gray-400 text-xs font-semibold bg-gray-50 rounded-2xl">
              Nadie te debe ni debes dinero a nadie 🎉
            </div>
          ) : (
            activeDebts.map((debt) => {
              const isTheyOweMe = debt.type === 'they_owe_me';
              return (
                <div
                  key={debt.id}
                  className="p-3.5 rounded-2xl bg-white border border-gray-200/90 shadow-2xs flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-black text-gray-900">{debt.personName}</span>
                      <span className={`text-[10px] font-extrabold px-1.5 py-0.2 rounded-full ${
                        isTheyOweMe ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                      }`}>
                        {isTheyOweMe ? 'Te debe' : 'Le debes'}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 font-medium mt-0.5">{debt.note}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`font-black text-sm ${isTheyOweMe ? 'text-emerald-700' : 'text-amber-700'}`}>
                      ${debt.amount.toFixed(2)}
                    </span>

                    {/* Botón WhatsApp */}
                    {isTheyOweMe && (
                      <button
                        type="button"
                        onClick={() => handleSendWhatsApp(debt)}
                        title="Enviar recordatorio por WhatsApp"
                        className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 flex items-center justify-center cursor-pointer transition-colors"
                      >
                        <MessageCircle size={15} />
                      </button>
                    )}

                    {/* Botón Marcar Pagado */}
                    <button
                      type="button"
                      onClick={() => onMarkPaid(debt.id)}
                      title="Marcar como pagado (se suma a tu bolsillo)"
                      className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-emerald-600 hover:text-white text-gray-600 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Check size={15} />
                    </button>

                    {/* Botón Eliminar */}
                    <button
                      type="button"
                      onClick={() => onDeleteDebt(debt.id)}
                      title="Eliminar"
                      className="w-8 h-8 rounded-xl bg-gray-50 hover:bg-red-50 text-gray-300 hover:text-red-500 flex items-center justify-center cursor-pointer transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
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
