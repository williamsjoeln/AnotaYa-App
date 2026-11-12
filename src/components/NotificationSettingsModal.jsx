import React, { useState } from 'react';
import { X, Bell, BellRing, Clock, Crown, Sparkles, Check, AlertCircle, Play } from 'lucide-react';
import { sounds } from '../utils/audio';
import { 
  requestNotificationPermission, 
  getNotificationPermissionStatus, 
  sendTestNotification, 
  scheduleSmartReminders 
} from '../services/notifications';

export function NotificationSettingsModal({ 
  isOpen, 
  onClose, 
  isPro, 
  onOpenProModal, 
  debts = [],
  settings = {},
  onSaveSettings 
}) {
  const [enabled, setEnabled] = useState(settings.enabled || false);
  const [frequency, setFrequency] = useState(settings.frequency || 'daily_morning');
  const [customHours, setCustomHours] = useState(settings.customHourInterval || 4);
  const [testSent, setTestSent] = useState(false);
  const [permStatus, setPermStatus] = useState('prompt');

  React.useEffect(() => {
    if (isOpen) {
      const originalOverflow = document.body.style.overflow;
      const originalTouchAction = document.body.style.touchAction;
      document.body.style.overflow = 'hidden';
      document.body.style.touchAction = 'pan-y';

      getNotificationPermissionStatus().then(status => setPermStatus(status));

      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.touchAction = originalTouchAction;
      };
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleToggleEnable = async () => {
    sounds.playPop();
    if (!isPro) {
      onOpenProModal();
      return;
    }

    if (!enabled) {
      // Activar: solicitar permisos si no están listos
      const granted = await requestNotificationPermission();
      if (!granted) {
        alert('Por favor, activa los permisos de notificación en los ajustes de tu teléfono para que AnotaYa pueda enviarte recordatorios.');
        return;
      }
      setEnabled(true);
      const newSettings = { enabled: true, frequency, customHourInterval: customHours };
      onSaveSettings(newSettings);
      scheduleSmartReminders(debts, newSettings);
    } else {
      setEnabled(false);
      const newSettings = { enabled: false, frequency, customHourInterval: customHours };
      onSaveSettings(newSettings);
      scheduleSmartReminders(debts, newSettings);
    }
  };

  const handleChangeFrequency = (freq) => {
    sounds.playPop();
    if (!isPro) {
      onOpenProModal();
      return;
    }
    setFrequency(freq);
    const newSettings = { enabled, frequency: freq, customHourInterval: customHours };
    onSaveSettings(newSettings);
    if (enabled) scheduleSmartReminders(debts, newSettings);
  };

  const handleChangeCustomHours = (h) => {
    sounds.playPop();
    if (!isPro) {
      onOpenProModal();
      return;
    }
    setCustomHours(h);
    const newSettings = { enabled, frequency: 'custom_hours', customHourInterval: h };
    onSaveSettings(newSettings);
    if (enabled) scheduleSmartReminders(debts, newSettings);
  };

  const handleTestNow = async () => {
    sounds.playCash();
    setTestSent(true);
    const activeDebt = debts.find(d => !d.isPaid);
    const name = activeDebt ? activeDebt.personName : 'Ricardo';
    const amount = activeDebt ? activeDebt.amount : 100;
    
    await sendTestNotification(name, amount);
    setTimeout(() => setTestSent(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/65 backdrop-blur-sm animate-fade-in overflow-hidden w-full max-w-full touch-pan-y overscroll-none">
      <div className="modal-sheet-container w-full max-w-md bg-white rounded-t-[36px] sm:rounded-[36px] p-6 shadow-2xl border border-gray-100 max-h-[92vh] overflow-y-auto overflow-x-hidden text-left overscroll-contain box-border space-y-5">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/80 flex items-center justify-center text-xl shadow-xs">
              <BellRing size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="font-extrabold text-lg text-gray-900 leading-tight">
                  Recordatorios
                </h3>
                <span className="text-[10px] font-black bg-gradient-to-r from-amber-400 to-yellow-500 text-slate-900 px-2 py-0.5 rounded-full flex items-center gap-1 shadow-2xs">
                  <Crown size={11} className="fill-slate-900" />
                  <span>PRO</span>
                </span>
              </div>
              <p className="text-xs text-gray-400 font-bold">Alertas automáticas en tu teléfono</p>
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

        {/* Switch Principal: Activar Notificaciones */}
        <div className={`p-4 rounded-3xl border transition-all ${
          enabled 
            ? 'bg-emerald-50/70 border-emerald-200 shadow-xs' 
            : 'bg-gray-50 border-gray-200'
        }`}>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5 pr-2">
              <span className="text-xs font-black text-gray-900 block">
                Notificaciones Automáticas
              </span>
              <p className="text-[11px] text-gray-500 font-medium">
                Te avisa quién te debe y tus compromisos sin abrir la app
              </p>
            </div>
            <button
              type="button"
              onClick={handleToggleEnable}
              className={`w-14 h-8 rounded-full p-1 transition-colors cursor-pointer relative shrink-0 ${
                enabled ? 'bg-emerald-600' : 'bg-gray-300'
              }`}
            >
              <div className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`} />
            </button>
          </div>
        </div>

        {/* Selector de Frecuencia */}
        <div className="space-y-2.5">
          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider">
            Frecuencia de las Notificaciones
          </label>

          <div className="space-y-2">
            
            {/* Opción 1: Resumen Matutino (Recomendado) */}
            <button
              type="button"
              onClick={() => handleChangeFrequency('daily_morning')}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                frequency === 'daily_morning'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0 mt-0.5 text-base font-black">
                ☀️
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-gray-900">1 vez al día (9:00 AM)</h4>
                  <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">
                    Recomendado
                  </span>
                </div>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Un solo resumen matutino con todo lo pendiente por cobrar y pagar.
                </p>
              </div>
            </button>

            {/* Opción 2: Dos veces al día */}
            <button
              type="button"
              onClick={() => handleChangeFrequency('twice_daily')}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                frequency === 'twice_daily'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0 mt-0.5 text-base font-black">
                🌅
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-gray-900">2 veces al día (9:00 AM y 6:00 PM)</h4>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Apertura y cierre de jornada laboral para cuadrar cobros.
                </p>
              </div>
            </button>

            {/* Opción 3: Solo fechas límite */}
            <button
              type="button"
              onClick={() => handleChangeFrequency('due_date_only')}
              className={`w-full p-3.5 rounded-2xl border text-left flex items-start gap-3 cursor-pointer transition-all ${
                frequency === 'due_date_only'
                  ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                  : 'bg-white hover:bg-gray-50 border-gray-200'
              }`}
            >
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center shrink-0 mt-0.5 text-base font-black">
                ⏰
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-black text-gray-900">Solo en Fechas de Vencimiento</h4>
                <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                  Te avisa a las 9:00 AM únicamente el día en que vence un compromiso.
                </p>
              </div>
            </button>

            {/* Opción 4: Cada X horas */}
            <div className={`p-3.5 rounded-2xl border text-left transition-all ${
              frequency === 'custom_hours'
                ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                : 'bg-white hover:bg-gray-50 border-gray-200'
            }`}>
              <button
                type="button"
                onClick={() => handleChangeFrequency('custom_hours')}
                className="w-full text-left flex items-start gap-3 cursor-pointer mb-2"
              >
                <div className="w-8 h-8 rounded-xl bg-rose-100 text-rose-800 flex items-center justify-center shrink-0 text-base font-black">
                  ⚡
                </div>
                <div>
                  <h4 className="text-xs font-black text-gray-900">Intervalo por Horas (Personalizado)</h4>
                  <p className="text-[11px] text-gray-500 font-medium mt-0.5">
                    Recibir alertas repetidas a lo largo del día.
                  </p>
                </div>
              </button>

              {frequency === 'custom_hours' && (
                <div className="pt-2 border-t border-emerald-200/60 flex items-center gap-2">
                  <span className="text-[11px] font-bold text-gray-600">Cada:</span>
                  {[2, 4, 8, 12].map((hours) => (
                    <button
                      key={hours}
                      type="button"
                      onClick={() => handleChangeCustomHours(hours)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black cursor-pointer transition-colors ${
                        customHours === hours
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      {hours} horas
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>

        {/* Botón de Prueba Inmediata en el Teléfono */}
        <div className="pt-2">
          <button
            type="button"
            onClick={handleTestNow}
            className="w-full py-3.5 rounded-2xl bg-gray-900 hover:bg-black text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-md cursor-pointer transition-all active:scale-98"
          >
            <Play size={14} className="fill-white" />
            <span>{testSent ? '¡Notificación de Ejemplo Enviada!' : '🔔 Enviar Notificación de Ejemplo'}</span>
          </button>
          <p className="text-[10px] text-center text-gray-400 font-medium mt-2">
            Sonará y vibrará en tu pantalla de bloqueo y barra de avisos.
          </p>
        </div>

      </div>
    </div>
  );
}
