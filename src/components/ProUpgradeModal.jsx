import React, { useState } from 'react';
import { X, Crown, Bell, Clock, ShieldCheck, Sparkles, Check, ArrowRight, RotateCcw } from 'lucide-react';
import confetti from 'canvas-confetti';
import { sounds } from '../utils/audio';

export function ProUpgradeModal({ isOpen, onClose, isPro, onUpgradeSuccess }) {
  const [loading, setLoading] = useState(false);

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

  if (!isOpen) return null;

  const handlePurchase = async () => {
    sounds.playPop();
    setLoading(true);

    // Simulación de pasarela nativa (In-App Purchase / Stripe)
    setTimeout(() => {
      setLoading(false);
      sounds.playCash();
      try {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { y: 0.5 }
        });
      } catch {}
      onUpgradeSuccess();
      onClose();
    }, 1000);
  };

  const handleRestorePurchases = () => {
    sounds.playPop();
    alert('Buscando compras anteriores en tu cuenta de App Store / Play Store... Si ya adquiriste el pase con tu Apple ID o Google, se restaurará automáticamente.');
    onUpgradeSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in overflow-hidden w-full max-w-full touch-pan-y overscroll-none">
      <div className="modal-sheet-container w-full max-w-md bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl border border-amber-200/60 max-h-[92vh] overflow-y-auto overflow-x-hidden text-left overscroll-contain box-border relative">
        
        {/* Glow de fondo decorativo */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-amber-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-10 left-0 w-48 h-48 bg-emerald-400/10 rounded-full blur-3xl pointer-events-none" />

        {/* Botón cerrar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-500 cursor-pointer transition-colors z-10"
        >
          <X size={16} />
        </button>

        {/* Encabezado PRO */}
        <div className="text-center pt-2 pb-4">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-300 text-slate-900 mx-auto flex items-center justify-center shadow-lg shadow-amber-500/30 mb-3 border border-white/60">
            <Crown size={32} className="stroke-[2.5] text-white" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-widest text-amber-600 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
            PASE VITALICIO • 1 SOLO PAGO
          </span>
          <h3 className="font-black text-2xl text-gray-900 mt-2">
            AnotaYa <span className="text-amber-500">PRO</span>
          </h3>
          <p className="text-xs text-gray-500 font-semibold mt-1">
            Activa las Notificaciones Automáticas y recordatorios inteligentes en tu teléfono
          </p>
        </div>

        {/* Tarjeta de Precio Único */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-50 via-yellow-50 to-emerald-50 border border-amber-200 text-center mb-5 shadow-xs">
          <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
            Acceso Completo de por Vida
          </span>
          <div className="flex items-baseline justify-center gap-1 my-1">
            <span className="text-3xl font-black text-gray-900">$1.00</span>
            <span className="text-xs font-bold text-gray-500 uppercase">USD / único</span>
          </div>
          <p className="text-[11px] text-emerald-700 font-bold">
            ✨ Sin suscripciones mensuales. Pagas una sola vez y es tuyo para siempre.
          </p>
        </div>

        {/* Lista de Beneficios Exclusivos */}
        <div className="space-y-3 mb-6">
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Bell size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">Notificaciones Push Automáticas</h4>
              <p className="text-[11px] text-gray-500 font-medium">
                Tu teléfono te recordará automáticamente a quién debes cobrar y qué pagos se acercan.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
              <Clock size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">Frecuencia 100% Personalizable</h4>
              <p className="text-[11px] text-gray-500 font-medium">
                Elige si recibir alertas 1 vez al día (9:00 AM), 2 veces al día, solo al vencimiento o cada pocas horas.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <Crown size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">Insignia Dorada de Miembro PRO</h4>
              <p className="text-[11px] text-gray-500 font-medium">
                Distintivo oficial en tu perfil y reportes exportados en Excel y PDF.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-3 p-3 rounded-2xl bg-gray-50 border border-gray-100">
            <div className="w-9 h-9 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
              <ShieldCheck size={18} className="stroke-[2.5]" />
            </div>
            <div>
              <h4 className="text-xs font-black text-gray-900">Bóveda y Respaldo Ilimitado en la Nube</h4>
              <p className="text-[11px] text-gray-500 font-medium">
                Tus registros protegidos y sincronizados en tiempo real entre tus dispositivos.
              </p>
            </div>
          </div>
        </div>

        {/* Botón de Acción Principal */}
        <div className="space-y-2.5">
          <button
            type="button"
            disabled={loading}
            onClick={handlePurchase}
            className="w-full py-4 rounded-2xl font-black text-sm text-white bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 hover:from-amber-600 hover:to-yellow-700 shadow-lg shadow-amber-500/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
          >
            {loading ? (
              <span>Activando Pase PRO...</span>
            ) : (
              <>
                <Crown size={18} />
                <span>Desbloquear AnotaYa PRO por $1.00 USD</span>
                <ArrowRight size={16} />
              </>
            )}
          </button>

          {/* Restaurar Compras (Requisito obligatorio de Apple App Store) */}
          <button
            type="button"
            onClick={handleRestorePurchases}
            className="w-full py-2.5 text-center text-xs font-bold text-gray-400 hover:text-gray-600 cursor-pointer flex items-center justify-center gap-1.5 transition-colors"
          >
            <RotateCcw size={12} />
            <span>Restaurar Compra Anterior</span>
          </button>
        </div>

        <p className="text-[10px] text-center text-gray-400 font-medium mt-3">
          Pago 100% seguro y encriptado. Cumple con los estándares oficiales de Apple App Store y Google Play.
        </p>

      </div>
    </div>
  );
}
