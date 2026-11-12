import React, { useState, useRef } from 'react';
import { X, ArrowDownRight, ArrowUpRight, Check, Sparkles, Camera, Calculator, Equal } from 'lucide-react';
import { CATEGORIES } from '../data/initialData';
import { sounds } from '../utils/audio';
import { scanReceiptWithOCR } from '../utils/receiptParser';

export function NewTransactionModal({ isOpen, onClose, onSave, accounts }) {
  const [type, setType] = useState('expense'); // 'expense' | 'income'
  const [amountStr, setAmountStr] = useState('');
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || 'pocket');
  const [selectedCategoryId, setSelectedCategoryId] = useState(CATEGORIES[0]?.id);
  const [note, setNote] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState('');
  const [scanFeedback, setScanFeedback] = useState(null);
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const filteredCategories = CATEGORIES.filter(c => c.type === type);

  // Safe Math calculation for mini-calculator (Feature 5)
  const evaluateMath = (expr) => {
    try {
      const cleaned = String(expr).replace(/[^0-9+\-*/.]/g, '');
      if (!cleaned) return '';
      const res = Function(`'use strict'; return (${cleaned})`)();
      if (typeof res === 'number' && !isNaN(res) && isFinite(res)) {
        return parseFloat(res.toFixed(2)).toString();
      }
    } catch {}
    return expr;
  };

  const handleEqual = () => {
    sounds.playPop();
    const evaluated = evaluateMath(amountStr);
    setAmountStr(evaluated);
  };

  const handleAddQuickAmount = (val) => {
    sounds.playPop();
    const curr = parseFloat(evaluateMath(amountStr)) || 0;
    setAmountStr((curr + val).toFixed(2));
  };

  // Feature 7: Camera Receipt OCR Scanner Real
  const handleReceiptCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    sounds.playPop();
    setIsScanning(true);
    setScanProgress('Iniciando lector OCR...');
    setScanFeedback(null);

    const result = await scanReceiptWithOCR(file, (msg) => {
      setScanProgress(msg);
    });

    setIsScanning(false);
    setScanProgress('');

    if (result.success && result.data.amount) {
      sounds.playCash();
      setAmountStr(result.data.amount);
      if (result.data.note) setNote(result.data.note);
      if (result.data.suggestedCategory) setSelectedCategoryId(result.data.suggestedCategory);
      
      const sourceLabel = result.data.source === 'same_line' || result.data.source === 'plain_same_line'
        ? 'Línea TOTAL'
        : result.data.source === 'spatial_column'
        ? 'Columna TOTAL'
        : result.data.source === 'next_line' || result.data.source === 'plain_next_line'
        ? 'TOTAL detectado'
        : 'Monto detectado';

      setScanFeedback({
        type: 'success',
        text: `✅ ¡TOTAL leído: $${result.data.amount}! (${sourceLabel})`
      });
    } else {
      sounds.playDelete();
      setScanFeedback({
        type: 'warning',
        text: result.error || 'No se encontró la palabra TOTAL con claridad. Puedes escribir el monto a mano.'
      });
    }

    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const finalAmountStr = evaluateMath(amountStr);
    const parsedAmount = parseFloat(finalAmountStr);
    if (!parsedAmount || parsedAmount <= 0) {
      alert('Ingresa un monto válido mayor a 0');
      return;
    }

    const cat = CATEGORIES.find(c => c.id === selectedCategoryId) || filteredCategories[0];
    const acc = accounts.find(a => a.id === selectedAccountId) || accounts[0];

    const newTx = {
      id: `tx-${Date.now()}`,
      amount: parsedAmount,
      type,
      categoryId: cat.id,
      categoryName: cat.name,
      categoryIcon: cat.icon,
      accountId: acc.id,
      accountName: acc.name,
      note: note.trim() || (type === 'expense' ? 'Gasto rápido' : 'Ingreso'),
      date: new Date().toISOString()
    };

    sounds.playCash();
    onSave(newTx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-md bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-xl">{type === 'expense' ? '💸' : '💰'}</span>
            <h3 className="font-extrabold text-lg text-gray-900">
              {type === 'expense' ? 'Registrar Gasto' : 'Registrar Ingreso'}
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tipo: Gasto vs Ingreso */}
        <div className="grid grid-cols-2 p-1 bg-gray-100 rounded-2xl mb-4">
          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setType('expense');
              setSelectedCategoryId('drinks');
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              type === 'expense'
                ? 'bg-red-500 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ArrowDownRight size={14} />
            <span>Gasto (- Dinero)</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playPop();
              setType('income');
              setSelectedCategoryId('income_work');
            }}
            className={`py-2 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              type === 'income'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            <ArrowUpRight size={14} />
            <span>Ingreso (+ Dinero)</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Monto Grande + Mini-Calculadora + Escáner */}
          <div className="p-4 bg-gray-50 rounded-3xl border border-gray-200/80 text-center relative overflow-hidden">
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-wider">
                Monto USD (Soporta sumas: 0.30+1.20)
              </span>

              {/* Botón Escanear Ticket (Feature 7) */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-xs font-black text-emerald-700 hover:bg-emerald-50 cursor-pointer shadow-2xs transition-all"
              >
                <Camera size={13} />
                <span>Foto Ticket</span>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleReceiptCapture}
              />
            </div>

            {/* Banner escaneando con progreso real */}
            {isScanning && (
              <div className="mb-2 p-2.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-black animate-pulse flex items-center justify-center gap-2">
                <Sparkles size={14} className="animate-spin text-emerald-600" />
                <span>{scanProgress || 'Escaneando ticket con cámara...'}</span>
              </div>
            )}

            {/* Resultado del escaneo */}
            {scanFeedback && (
              <div className={`mb-2 p-2.5 rounded-2xl text-xs font-bold flex items-center justify-between gap-2 ${
                scanFeedback.type === 'success' 
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' 
                  : 'bg-amber-50 text-amber-800 border border-amber-200'
              }`}>
                <span>{scanFeedback.text}</span>
                <button 
                  type="button" 
                  onClick={() => setScanFeedback(null)} 
                  className="text-gray-400 hover:text-gray-600 text-xs px-1 cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            <div className="flex items-center justify-center gap-1 my-1">
              <span className="text-3xl font-black text-gray-400">$</span>
              <input
                type="text"
                autoFocus
                placeholder="0.00"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                className="text-4xl font-black text-gray-900 w-full text-center bg-transparent focus:outline-hidden"
              />
              {amountStr.includes('+') && (
                <button
                  type="button"
                  onClick={handleEqual}
                  className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 cursor-pointer shadow-xs active:scale-95"
                >
                  <Equal size={16} />
                </button>
              )}
            </div>

            {/* Botones de micro-montos rápidos */}
            <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-200/60 flex-wrap">
              {[0.30, 0.50, 1.00, 2.00, 5.00].map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => handleAddQuickAmount(val)}
                  className="px-2.5 py-1 rounded-xl bg-white border border-gray-200 text-[11px] font-extrabold text-gray-700 hover:bg-gray-100 cursor-pointer shadow-2xs active:scale-95 transition-all"
                >
                  +${val.toFixed(2)}
                </button>
              ))}

              {/* Botón signo más para sumar */}
              <button
                type="button"
                onClick={() => { sounds.playPop(); setAmountStr(prev => prev ? `${prev}+` : ''); }}
                className="px-2.5 py-1 rounded-xl bg-gray-200 hover:bg-gray-300 text-[11px] font-black text-gray-800 cursor-pointer"
              >
                +
              </button>
            </div>
          </div>

          {/* Cuenta / Bolsillo de origen */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">
              {type === 'expense' ? '¿De dónde salió el dinero?' : '¿Dónde entró el dinero?'}
            </label>
            <div className="grid grid-cols-3 gap-2">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedAccountId(acc.id);
                  }}
                  className={`p-2.5 rounded-2xl border text-left transition-all cursor-pointer ${
                    selectedAccountId === acc.id
                      ? 'border-[#10B981] bg-emerald-50 text-emerald-950 ring-1 ring-[#10B981]'
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-700'
                  }`}
                >
                  <span className="text-base">{acc.icon}</span>
                  <p className="text-[11px] font-extrabold leading-tight mt-1 truncate">{acc.name}</p>
                  <p className="text-[10px] font-bold text-gray-400">${acc.balance.toFixed(2)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Categoría */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">Categoría</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {filteredCategories.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    sounds.playPop();
                    setSelectedCategoryId(cat.id);
                  }}
                  className={`p-2 rounded-2xl border flex items-center gap-2 transition-all cursor-pointer ${
                    selectedCategoryId === cat.id
                      ? 'border-gray-900 bg-gray-900 text-white shadow-sm'
                      : 'border-gray-200 bg-white hover:border-gray-300 text-gray-800'
                  }`}
                >
                  <span className="text-base">{cat.icon}</span>
                  <span className="text-[11px] font-extrabold truncate">{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Nota rápida */}
          <div>
            <label className="block text-xs font-black text-gray-700 mb-1.5">Detalle / Nota rápida</label>
            <input
              type="text"
              placeholder="Ej. Agua con gas, pasaje bus, almuerzo..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-xs font-semibold text-gray-900 focus:outline-hidden focus:border-gray-900 bg-gray-50/50"
            />
          </div>

          {/* Botón Guardar */}
          <button
            type="submit"
            className={`w-full py-4 rounded-2xl font-black text-sm text-white shadow-lg cursor-pointer flex items-center justify-center gap-2 transition-all active:scale-98 ${
              type === 'expense'
                ? 'bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700'
                : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800'
            }`}
          >
            <Check size={18} />
            <span>Guardar {type === 'expense' ? 'Gasto' : 'Ingreso'}</span>
          </button>

        </form>

      </div>
    </div>
  );
}
