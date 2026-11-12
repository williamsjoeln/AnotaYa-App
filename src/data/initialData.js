export const INITIAL_ACCOUNTS = [
  { id: 'pocket', name: 'Bolsillo (Efectivo)', balance: 0.00, icon: '💵', color: 'from-emerald-500 to-teal-700', isPrimary: true },
  { id: 'bank', name: 'Banco / Débito', balance: 0.00, icon: '🏦', color: 'from-blue-600 to-indigo-800' },
  { id: 'savings', name: 'Caja de Ahorro', balance: 0.00, icon: '🐷', color: 'from-purple-600 to-pink-700' },
];

export const CATEGORIES = [
  { id: 'drinks', name: 'Bebidas & Agua', icon: '🥤', color: '#0284C7', type: 'expense' },
  { id: 'food', name: 'Comida & Snacks', icon: '🍽️', color: '#EA580C', type: 'expense' },
  { id: 'transport', name: 'Transporte & Gasolina', icon: '🚌', color: '#D97706', type: 'expense' },
  { id: 'coffee', name: 'Café & Pan', icon: '☕', color: '#78350F', type: 'expense' },
  { id: 'groceries', name: 'Supermercado', icon: '🛒', color: '#16A34A', type: 'expense' },
  { id: 'shopping', name: 'Compras & Ropa', icon: '🛍️', color: '#EC4899', type: 'expense' },
  { id: 'health', name: 'Salud & Farmacia', icon: '💊', color: '#EF4444', type: 'expense' },
  { id: 'services', name: 'Servicios & Saldo', icon: '📱', color: '#7C3AED', type: 'expense' },
  { id: 'income_work', name: 'Sueldo / Salario', icon: '💼', color: '#059669', type: 'income' },
  { id: 'income_extra', name: 'Venta / Extra', icon: '✨', color: '#10B981', type: 'income' },
];

export const INITIAL_TRANSACTIONS = [];
