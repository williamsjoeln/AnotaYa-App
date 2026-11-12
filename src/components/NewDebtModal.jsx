import React, { useState } from 'react';
import { X, UserPlus, DollarSign, Calendar, MessageCircle, ArrowRight, Sparkles, Check, ChevronDown } from 'lucide-react';
import { COUNTRY_CODES, cleanWhatsAppPhone } from '../utils/countryCodes';
import { sounds } from '../utils/audio';

const QUICK_REASONS = [
  '🍽️ Almuerzo',
  '💵 Préstamo',
  '⛽ Gasolina',
  '🧾 Factura / Servicio',
  '🛒 Compras',
  '🍺 Salida / Fiesta',
  '📱 Saldo / Recarga',
  '💼 Trabajo / Venta'
];

export function NewDebtModal({ 
  isOpen, 
  onClose, 
  onSave, 
  initialPersonName = '', 
  initialPhone = '', 
  initialCountryCode = '593' 
}) {
  const [type, setType] = useState('they_owe_me'); // 'they_owe_me' (Me deben) | 'i_owe' (Yo debo)
  const [personName, setPersonName] = useState(initialPersonName);
  const [amountStr, setAmountStr] = useState('');
  const [note, setNote] = useState('');
  const [countryCode, setCountryCode] = useState(initialCountryCode); // Ecuador por defecto
  const [phone, setPhone] = useState(initialPhone);
  const [dueDate, setDueDate] = useState('');
  const [showCountryPicker, setShowCountryPicker] = useState(false);

  React.useEffect(() => {
    if (isOpen) {
      if (initialPersonName) setPersonName(initialPersonName);
      if (initialPhone) setPhone(initialPhone);
      if (initialCountryCode) setCountryCode(initialCountryCode);

      // Bloquear scroll de la página de fondo para evitar desplazamientos raros
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'pan-y';

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen, initialPersonName, initialPhone, initialCountryCode]);

  if (!isOpen) return null;

  const selectedCountry = COUNTRY_CODES.find(c => c.code === countryCode) || COUNTRY_CODES[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amountStr);
    if (!personName.trim()) {
      alert('Por favor, ingresa el nombre de la persona');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }

    const newRecord = {
      id: `debt-${Date.now()}`,
      personName: personName.trim(),
      amount: parseFloat(parsedAmount.toFixed(2)),
      type,
      note: note.trim() || (type === 'they_owe_me' ? 'Préstamo' : 'Deuda'),
      countryCode,
      phone: phone.trim(),
      dueDate: dueDate || null,
      date: new Date().toISOString(),
      isPaid: false,
      payments: []
    };

    sounds.playCash();
    onSave(newRecord);
    handleReset();
    onClose();
  };

  const handleReset = () => {
    setPersonName('');
    setAmountStr('');
    setNote('');
    setPhone('');
    setDueDate('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden w-full max-w-full touch-pan-y overscroll-none">
      <div className="modal-sheet-container w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto overflow-x-hidden text-left overscroll-contain box-border">
        
        {/* Encabezado */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-xl shadow-xs ${
              type === 'they_owe_me' ? 'bg-emerald-50 text-emerald-600 border border-emerald-200/60' : 'bg-rose-50 text-rose-600 border border-rose-200/60'
            }`}>
              {type === 'they_owe_me' ? '📥' : '📤'}
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 leading-tight">
                Anotar {type === 'they_owe_me' ? 'Dinero que te Deben' : 'Dinero que Debes'}
              </h3>
              <p className="text-xs text-gray-400 font-bold">
                {type === 'they_owe_me' ? 'Alguien te debe pagar a ti' : 'Tú le debes pagar a alguien'}
              </p>
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

        {/* Selector de Tipo (Switch Me Deben vs Yo Debo) */}
        <div className="grid grid-cols-2 p-1.5 bg-gray-100 rounded-2xl mb-5">
          <button
            type="button"
            onClick={() => { sounds.playPop(); setType('they_owe_me'); }}
            className={`py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              type === 'they_owe_me'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🟢 Me Deben (Cobrar)</span>
          </button>
          <button
            type="button"
            onClick={() => { sounds.playPop(); setType('i_owe'); }}
            className={`py-2.5 rounded-xl font-black text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              type === 'i_owe'
                ? 'bg-rose-600 text-white shadow-md'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            <span>🔴 Yo Debo (Pagar)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Monto Grande Destacado */}
          <div className="p-4 bg-gray-50 rounded-3xl border border-gray-200/80 text-center">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider block mb-1">
              Monto en Dólares (USD)
            </span>
            <div className="flex items-center justify-center gap-1 w-full max-w-full">
              <span className="text-3xl font-black text-gray-400 shrink-0">$</span>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                min="0.01"
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="text-4xl font-black text-gray-900 flex-1 min-w-0 text-center bg-transparent focus:outline-none"
              />
            </div>
          </div>

          {/* Nombre de la persona */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              ¿A quién? (Nombre de la Persona o Negocio) *
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Juan Pérez, Carlos, Vecina"
              value={personName}
              onChange={(e) => setPersonName(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-bold text-base text-gray-900 outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Motivo o Concepto */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5">
              Motivo o Concepto
            </label>
            <input
              type="text"
              placeholder="Ej. Almuerzo del viernes, Préstamo efectivo"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-bold text-base text-gray-900 outline-none transition-all shadow-2xs mb-2"
            />
            
            {/* Chips de sugerencias rápidas */}
            <div className="flex flex-wrap gap-1.5 w-full max-w-full">
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  type="button"
                  onClick={() => { sounds.playPop(); setNote(r); }}
                  className="px-2.5 py-1 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 text-[11px] font-bold cursor-pointer transition-colors"
                >
                  {r}
                </button>
              ))}
            </div>
          </div>

          {/* WhatsApp con selector internacional de país */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>WhatsApp (Para recordatorios en 1 clic)</span>
              <span className="text-[10px] text-gray-400 font-normal">Opcional</span>
            </label>
            
            <div className="flex items-center gap-2 relative w-full max-w-full">
              
              {/* Botón selector de país */}
              <button
                type="button"
                onClick={() => setShowCountryPicker(!showCountryPicker)}
                className="px-3 py-3 rounded-2xl bg-gray-50 hover:bg-gray-100 border border-gray-200 flex items-center gap-1.5 text-xs font-black text-gray-800 shrink-0 cursor-pointer shadow-2xs"
              >
                <span className="text-base">{selectedCountry.flag}</span>
                <span>+{selectedCountry.code}</span>
                <ChevronDown size={14} className="text-gray-400" />
              </button>

              {/* Input de teléfono */}
              <input
                type="tel"
                placeholder={selectedCountry.placeholder || '099 123 4567'}
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="flex-1 min-w-0 px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-bold text-base text-gray-900 outline-none transition-all shadow-2xs"
              />
            </div>

            {/* Dropdown de países desplegable */}
            {showCountryPicker && (
              <div className="mt-2 p-2 bg-white rounded-2xl border border-gray-200 shadow-xl max-h-52 overflow-y-auto space-y-1 animate-fade-in z-20">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider px-2 py-1 block">
                  Selecciona tu país
                </span>
                {COUNTRY_CODES.map((c) => (
                  <button
                    key={`${c.code}-${c.name}`}
                    type="button"
                    onClick={() => {
                      sounds.playPop();
                      setCountryCode(c.code);
                      setShowCountryPicker(false);
                    }}
                    className={`w-full px-3 py-2 rounded-xl text-left text-xs font-bold flex items-center justify-between cursor-pointer transition-colors ${
                      countryCode === c.code ? 'bg-emerald-50 text-emerald-800' : 'hover:bg-gray-50 text-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{c.flag}</span>
                      <span>{c.name}</span>
                    </div>
                    <span className="text-gray-400 font-black">+{c.code}</span>
                  </button>
                ))}
              </div>
            )}

            <p className="text-[10px] text-gray-400 font-semibold mt-1">
              💡 Puedes escribir con o sin el 0 inicial (ej: 099... o 99...); AnotaYa lo formateará automáticamente.
            </p>
          </div>

          {/* Fecha Límite de Pago (Opcional) */}
          <div>
            <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
              <span>Fecha Límite de Pago</span>
              <span className="text-[10px] text-gray-400 font-normal">Opcional</span>
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-bold text-sm text-gray-800 outline-none transition-all shadow-2xs"
            />
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98 mt-2 ${
              type === 'they_owe_me'
                ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
                : 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/30'
            }`}
          >
            <span>+ Guardar en AnotaYa</span>
            <ArrowRight size={16} />
          </button>
        </form>

      </div>
    </div>
  );
}
