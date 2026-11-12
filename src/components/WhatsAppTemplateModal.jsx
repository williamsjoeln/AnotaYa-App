import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Send, Copy, Check, Sparkles, User, FileText } from 'lucide-react';
import { WHATSAPP_TEMPLATES, sendWhatsAppMessage } from '../utils/whatsappTemplates';
import { sounds } from '../utils/audio';

export function WhatsAppTemplateModal({ isOpen, onClose, debt }) {
  const [selectedTemplateId, setSelectedTemplateId] = useState('friendly');
  const [customText, setCustomText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
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

  useEffect(() => {
    if (debt) {
      const template = WHATSAPP_TEMPLATES.find(t => t.id === selectedTemplateId) || WHATSAPP_TEMPLATES[0];
      setCustomText(template.generateText(debt));
    }
  }, [debt, selectedTemplateId]);

  if (!isOpen || !debt) return null;

  const handleSelectTemplate = (tplId) => {
    sounds.playPop();
    setSelectedTemplateId(tplId);
    const tpl = WHATSAPP_TEMPLATES.find(t => t.id === tplId);
    if (tpl) {
      setCustomText(tpl.generateText(debt));
    }
  };

  const handleSend = () => {
    sounds.playCash();
    sendWhatsAppMessage(debt.phone, debt.countryCode, customText);
    onClose();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(customText);
    setCopied(true);
    sounds.playPop();
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden w-full max-w-full touch-pan-y overscroll-none">
      <div className="modal-sheet-container w-full max-w-lg bg-white rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto overflow-x-hidden text-left space-y-4 overscroll-contain box-border">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center text-xl shadow-xs">
              <MessageCircle size={22} className="fill-emerald-100" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 leading-tight">
                Recordatorio de WhatsApp
              </h3>
              <p className="text-xs text-gray-400 font-bold">
                Para: <strong className="text-gray-700">{debt.personName}</strong> {debt.phone ? `(${debt.phone})` : ''}
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

        {/* Selector de Plantillas */}
        <div>
          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
            Elige el tono del mensaje
          </label>
          <div className="grid grid-cols-2 gap-2">
            {WHATSAPP_TEMPLATES.map((tpl) => {
              const isSelected = selectedTemplateId === tpl.id;
              return (
                <button
                  key={tpl.id}
                  type="button"
                  onClick={() => handleSelectTemplate(tpl.id)}
                  className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200'
                      : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
                  }`}
                >
                  <span className="font-extrabold text-xs block leading-snug">
                    {tpl.title}
                  </span>
                  <span className="text-[10px] text-gray-400 font-medium block mt-0.5 line-clamp-1">
                    {tpl.desc}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Vista Previa y Edición del Mensaje */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-black text-gray-700 uppercase tracking-wider">
              Vista previa del mensaje (editable)
            </label>
            <button
              type="button"
              onClick={handleCopy}
              className="text-[11px] font-bold text-gray-500 hover:text-emerald-700 flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
              <span>{copied ? '¡Copiado!' : 'Copiar texto'}</span>
            </button>
          </div>

          <textarea
            rows={5}
            value={customText}
            onChange={(e) => setCustomText(e.target.value)}
            className="w-full p-3.5 rounded-2xl bg-gray-50 border border-gray-200 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 text-xs sm:text-sm font-medium text-gray-800 outline-none transition-all resize-none shadow-2xs leading-relaxed"
          />
        </div>

        {/* Botón Acción Principal */}
        <button
          type="button"
          onClick={handleSend}
          className="w-full py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-lg shadow-emerald-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all active:scale-98"
        >
          <Send size={16} />
          <span>Abrir WhatsApp y Enviar Mensaje</span>
        </button>

        {!debt.phone && (
          <p className="text-[11px] text-amber-700 bg-amber-50 p-2.5 rounded-xl border border-amber-200 text-center font-bold">
            ℹ️ No registraste número telefónico. Al presionar el botón, se abrirá WhatsApp para que elijas el contacto de tu lista.
          </p>
        )}

      </div>
    </div>
  );
}
