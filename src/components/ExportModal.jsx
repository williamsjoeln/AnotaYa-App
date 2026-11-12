import React, { useState } from 'react';
import { X, FileSpreadsheet, FileText, Download, CheckCircle, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { exportDebtsToCSV, printDebtsReportPDF } from '../utils/exportUtils';
import { sounds } from '../utils/audio';

export function ExportModal({ isOpen, onClose, debts = [], userName = 'Usuario' }) {
  const [filterType, setFilterType] = useState('all'); // 'all' | 'they_owe_me' | 'i_owe' | 'paid'

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

  const countAll = debts.length;
  const countTheyOweMe = debts.filter(d => !d.isPaid && d.type === 'they_owe_me').length;
  const countIOwe = debts.filter(d => !d.isPaid && d.type === 'i_owe').length;
  const countPaid = debts.filter(d => d.isPaid).length;

  const handleExportCSV = () => {
    sounds.playCash();
    exportDebtsToCSV(debts, filterType);
    onClose();
  };

  const handleExportPDF = () => {
    sounds.playCash();
    printDebtsReportPDF(debts, filterType, userName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-hidden w-full max-w-full touch-pan-y overscroll-none">
      <div className="modal-sheet-container w-full max-w-md bg-white rounded-t-[32px] sm:rounded-[32px] p-5 sm:p-6 shadow-2xl border border-gray-100 max-h-[90vh] overflow-y-auto overflow-x-hidden text-left space-y-4 overscroll-contain box-border">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-600 flex items-center justify-center text-xl shadow-xs">
              <Download size={20} className="stroke-[2.5]" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg text-gray-900 leading-tight">
                Exportar Reporte
              </h3>
              <p className="text-xs text-gray-400 font-bold">
                Descarga tus registros en Excel o PDF
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

        {/* Selector de Filtro */}
        <div>
          <label className="block text-xs font-black text-gray-700 uppercase tracking-wider mb-2">
            ¿Qué registros deseas incluir?
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => { sounds.playPop(); setFilterType('all'); }}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                filterType === 'all'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              <span className="font-extrabold text-xs block">Todos los registros</span>
              <span className="text-[10px] text-gray-400 font-bold">{countAll} registros</span>
            </button>

            <button
              type="button"
              onClick={() => { sounds.playPop(); setFilterType('they_owe_me'); }}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                filterType === 'they_owe_me'
                  ? 'bg-emerald-50 border-emerald-500 text-emerald-900 ring-2 ring-emerald-200'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              <span className="font-extrabold text-xs block text-emerald-700">🟢 Me Deben</span>
              <span className="text-[10px] text-gray-400 font-bold">{countTheyOweMe} pendientes</span>
            </button>

            <button
              type="button"
              onClick={() => { sounds.playPop(); setFilterType('i_owe'); }}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                filterType === 'i_owe'
                  ? 'bg-rose-50 border-rose-500 text-rose-900 ring-2 ring-rose-200'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              <span className="font-extrabold text-xs block text-rose-700">🔴 Yo Debo</span>
              <span className="text-[10px] text-gray-400 font-bold">{countIOwe} pendientes</span>
            </button>

            <button
              type="button"
              onClick={() => { sounds.playPop(); setFilterType('paid'); }}
              className={`p-3 rounded-2xl text-left border transition-all cursor-pointer ${
                filterType === 'paid'
                  ? 'bg-gray-100 border-gray-500 text-gray-900 ring-2 ring-gray-300'
                  : 'bg-gray-50 hover:bg-gray-100 border-gray-200 text-gray-700'
              }`}
            >
              <span className="font-extrabold text-xs block text-gray-800">✅ Saldados</span>
              <span className="text-[10px] text-gray-400 font-bold">{countPaid} registros</span>
            </button>
          </div>
        </div>

        {/* Opciones de Formato de Descarga */}
        <div className="space-y-2.5 pt-2">
          
          {/* Opción 1: Excel / CSV */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="w-full p-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-between cursor-pointer transition-all shadow-md active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
                <FileSpreadsheet size={22} className="text-white" />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm">Exportar a Excel (.CSV)</h4>
                <p className="text-[11px] text-emerald-100 font-medium">Compatible con Excel, Sheets y Numbers</p>
              </div>
            </div>
            <Download size={18} />
          </button>

          {/* Opción 2: Reporte PDF Imprimible */}
          <button
            type="button"
            onClick={handleExportPDF}
            className="w-full p-4 rounded-2xl bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 text-gray-800 flex items-center justify-between cursor-pointer transition-all shadow-xs active:scale-98"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
                <FileText size={22} />
              </div>
              <div className="text-left">
                <h4 className="font-black text-sm text-gray-900">Generar Reporte en PDF</h4>
                <p className="text-[11px] text-gray-400 font-medium">Formato formal de estado de cuenta listo para guardar</p>
              </div>
            </div>
            <Download size={18} className="text-gray-400" />
          </button>

        </div>

      </div>
    </div>
  );
}
