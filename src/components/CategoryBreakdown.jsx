import React, { useState } from 'react';
import { PieChart, TrendingDown, ChevronRight, Sparkles } from 'lucide-react';
import { CATEGORIES } from '../data/initialData';

export function CategoryBreakdown({ transactions }) {
  const [selectedCat, setSelectedCat] = useState(null);

  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);

  if (totalExpense === 0) {
    return (
      <div className="clay-card bg-white p-5 rounded-3xl text-center border border-gray-100">
        <p className="text-xs font-bold text-gray-400">Sin gastos para graficar en este período</p>
      </div>
    );
  }

  // Aggregate by category
  const categoryMap = {};
  expenses.forEach(tx => {
    if (!categoryMap[tx.categoryId]) {
      const cat = CATEGORIES.find(c => c.id === tx.categoryId) || {
        id: tx.categoryId,
        name: tx.categoryName || 'Otros',
        icon: tx.categoryIcon || '💸',
        color: '#64748B'
      };
      categoryMap[tx.categoryId] = {
        ...cat,
        total: 0,
        count: 0
      };
    }
    categoryMap[tx.categoryId].total += tx.amount;
    categoryMap[tx.categoryId].count += 1;
  });

  const categoryList = Object.values(categoryMap).sort((a, b) => b.total - a.total);
  const topCategory = categoryList[0];

  return (
    <div className="clay-card bg-white p-5 rounded-[32px] text-left border border-gray-100 shadow-sm space-y-4">
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#059669] flex items-center justify-center">
            <PieChart size={16} />
          </div>
          <div>
            <h3 className="font-extrabold text-sm text-gray-900 leading-tight">Distribución del Dinero</h3>
            <p className="text-[10px] text-gray-400 font-bold">¿En qué se te fue la plata?</p>
          </div>
        </div>

        <span className="text-xs font-black text-gray-900 bg-gray-100 px-2.5 py-1 rounded-full">
          Total: ${totalExpense.toFixed(2)}
        </span>
      </div>

      {/* Top Gasto Callout */}
      {topCategory && (
        <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200/80 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span className="text-xl">{topCategory.icon}</span>
            <div>
              <p className="text-[10px] font-bold text-amber-800 uppercase">Mayor gasto acumulado</p>
              <p className="font-extrabold text-gray-900">{topCategory.name}</p>
            </div>
          </div>
          <span className="font-black text-sm text-amber-900">
            ${topCategory.total.toFixed(2)} ({Math.round((topCategory.total / totalExpense) * 100)}%)
          </span>
        </div>
      )}

      {/* Barra de progreso visual segmentada estilo Apple */}
      <div className="w-full h-3.5 bg-gray-100 rounded-full overflow-hidden flex shadow-inner p-0.5 gap-0.5">
        {categoryList.map((cat) => {
          const pct = (cat.total / totalExpense) * 100;
          return (
            <div
              key={cat.id}
              style={{
                width: `${pct}%`,
                backgroundColor: cat.color || '#10B981'
              }}
              className="h-full rounded-full transition-all duration-500 first:rounded-l-full last:rounded-r-full"
              title={`${cat.name}: $${cat.total.toFixed(2)} (${Math.round(pct)}%)`}
            />
          );
        })}
      </div>

      {/* Lista detallada con porcentajes */}
      <div className="space-y-2 pt-1">
        {categoryList.map((cat) => {
          const pct = Math.round((cat.total / totalExpense) * 100);
          return (
            <div
              key={cat.id}
              onClick={() => setSelectedCat(selectedCat === cat.id ? null : cat.id)}
              className="flex items-center justify-between p-2 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-2.5">
                <span className="text-base">{cat.icon}</span>
                <div>
                  <p className="font-extrabold text-xs text-gray-800 leading-tight">{cat.name}</p>
                  <p className="text-[10px] text-gray-400 font-semibold">{cat.count} {cat.count === 1 ? 'gasto' : 'gastos'}</p>
                </div>
              </div>

              <div className="text-right">
                <p className="font-black text-xs text-gray-900">${cat.total.toFixed(2)}</p>
                <div className="flex items-center justify-end gap-1.5 mt-0.5">
                  <div className="w-12 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      style={{ width: `${pct}%`, backgroundColor: cat.color }}
                      className="h-full rounded-full"
                    />
                  </div>
                  <span className="text-[10px] font-extrabold text-gray-500">{pct}%</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

    </div>
  );
}
