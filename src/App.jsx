import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, ArrowUpRight, ArrowDownRight, RefreshCw, 
  Eye, EyeOff, Download, User, CheckCircle2, ShieldCheck, 
  SlidersHorizontal, Monitor, Smartphone, Tablet, X, 
  HelpCircle, Sparkles, Scale, HandCoins, ArrowRight, Bell, BellRing, Crown
} from 'lucide-react';
import { NewDebtModal } from './components/NewDebtModal';
import { PaymentModal } from './components/PaymentModal';
import { DebtCard } from './components/DebtCard';
import { WhatsAppTemplateModal } from './components/WhatsAppTemplateModal';
import { ContactHistoryModal } from './components/ContactHistoryModal';
import { ExportModal } from './components/ExportModal';
import { AuthModal } from './components/AuthModal';
import { AuthScreen } from './components/AuthScreen';
import { ProUpgradeModal } from './components/ProUpgradeModal';
import { NotificationSettingsModal } from './components/NotificationSettingsModal';
import { exportDebtsToCSV } from './utils/exportUtils';
import { sounds } from './utils/audio';
import { auth, db, syncDebtsToFirestore, syncUserDataToFirestore, subscribeToUserData, checkRedirectResult, getUserDataOnce } from './services/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { setupNotificationChannels, scheduleSmartReminders } from './services/notifications';
import confetti from 'canvas-confetti';

export default function App() {
  // Device Detection: Phone, Tablet, Laptop / Desktop
  const [deviceType, setDeviceType] = useState(() => {
    if (typeof window === 'undefined') return 'mobile';
    const w = window.innerWidth;
    if (w < 768) return 'mobile';
    if (w < 1024) return 'tablet';
    return 'desktop';
  });

  useEffect(() => {
    const handleResize = () => {
      const w = window.innerWidth;
      if (w < 768) setDeviceType('mobile');
      else if (w < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Persistencia de Deudas (AnotaYa) con fallback a almacenamiento local previo
  const [debts, setDebts] = useState(() => {
    try {
      const saved = localStorage.getItem('anotaya_debts') || localStorage.getItem('bolsillo_debts');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Modo Privacidad / Calle (ocultar montos con asteriscos)
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // Filtros: 'all' | 'they_owe_me' | 'i_owe' | 'paid'
  const [activeTab, setActiveTab] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modales y Vistas Detalladas
  const [isNewDebtOpen, setIsNewDebtOpen] = useState(false);
  const [newDebtPrefill, setNewDebtPrefill] = useState({ personName: '', phone: '', countryCode: '593' });
  const [selectedDebtForPayment, setSelectedDebtForPayment] = useState(null);
  const [selectedDebtForWhatsApp, setSelectedDebtForWhatsApp] = useState(null);
  const [selectedContactForHistory, setSelectedContactForHistory] = useState(null);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isProModalOpen, setIsProModalOpen] = useState(false);
  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false);

  // Estado AnotaYa PRO ($1.00 Vitalicio)
  const [isPro, setIsPro] = useState(() => {
    try {
      return localStorage.getItem('anotaya_is_pro') === 'true';
    } catch {
      return false;
    }
  });

  // Ajustes de Notificaciones Push Automáticas
  const [notificationSettings, setNotificationSettings] = useState(() => {
    try {
      const saved = localStorage.getItem('anotaya_notif_settings');
      return saved ? JSON.parse(saved) : { enabled: false, frequency: 'daily_morning', customHourInterval: 4 };
    } catch {
      return { enabled: false, frequency: 'daily_morning', customHourInterval: 4 };
    }
  });

  // Autenticación & Sincronización en la Nube
  const [authChecking, setAuthChecking] = useState(true);
  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('syncing'); // 'synced' | 'syncing' | 'offline'

  // Inicializar canales de notificación en dispositivos nativos
  useEffect(() => {
    setupNotificationChannels();
  }, []);

  // Programar recordatorios automáticos cuando cambian las deudas o ajustes
  useEffect(() => {
    if (isPro && notificationSettings.enabled) {
      scheduleSmartReminders(debts, notificationSettings);
    }
  }, [debts, isPro, notificationSettings]);

  // Conectar Firebase Auth & Firestore en tiempo real
  useEffect(() => {
    let isMounted = true;
    let unsubFirestore = null;

    async function initAuth() {
      // Timeout de seguridad de 2.5s: nunca dejar la pantalla congelada en 'Cargando AnotaYa...'
      const safetyTimeout = setTimeout(() => {
        if (isMounted) setAuthChecking(false);
      }, 2500);

      try {
        const res = await checkRedirectResult();
        if (res?.error) {
          alert('Detalle de Apple Sign-In:\n' + res.error);
        } else if (res?.user && isMounted) {
          const userData = {
            uid: res.user.uid,
            name: res.user.displayName || res.user.email?.split('@')[0] || 'Usuario Apple',
            email: res.user.email,
            isGuest: false
          };
          setUser(userData);
          try {
            localStorage.setItem('anotaya_user', JSON.stringify(userData));
          } catch {}
        }
      } catch (err) {
        console.warn('Redirect check error:', err);
      }

      onAuthStateChanged(auth, (firebaseUser) => {
        clearTimeout(safetyTimeout);
        if (!isMounted) return;

        if (firebaseUser) {
          const userData = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || 'Usuario',
            email: firebaseUser.email,
            isGuest: false
          };
          setUser(userData);
          try {
            localStorage.setItem('anotaya_user', JSON.stringify(userData));
          } catch {}

          setSyncStatus('syncing');
          if (unsubFirestore) unsubFirestore();

          // Suscribirse en tiempo real a las deudas del usuario en la nube
          unsubFirestore = subscribeToUserData(
            firebaseUser.uid,
            (cloudData) => {
              if (!isMounted) return;
              if (cloudData && Array.isArray(cloudData.debts)) {
                setDebts(cloudData.debts);
                try {
                  localStorage.setItem('anotaya_debts', JSON.stringify(cloudData.debts));
                  localStorage.setItem('bolsillo_debts', JSON.stringify(cloudData.debts));
                } catch {}
              } else if (cloudData === null) {
                // Si la nube aún no tiene documento creado, pero el usuario tiene deudas creadas localmente, respaldar a la nube
                try {
                  const saved = localStorage.getItem('anotaya_debts') || localStorage.getItem('bolsillo_debts');
                  const localArr = saved ? JSON.parse(saved) : [];
                  if (Array.isArray(localArr) && localArr.length > 0) {
                    syncDebtsToFirestore(firebaseUser.uid, localArr).catch(() => {});
                  }
                } catch {}
              }

              // Cargar estado PRO y Notificaciones desde la cuenta en la nube
              if (cloudData && cloudData.isPro !== undefined) {
                setIsPro(Boolean(cloudData.isPro));
                try { localStorage.setItem('anotaya_is_pro', String(Boolean(cloudData.isPro))); } catch {}
              }
              if (cloudData && cloudData.notificationSettings) {
                setNotificationSettings(cloudData.notificationSettings);
                try { localStorage.setItem('anotaya_notif_settings', JSON.stringify(cloudData.notificationSettings)); } catch {}
              }
              setSyncStatus('synced');
            },
            (err) => {
              console.error('Firestore listener error:', err);
              setSyncStatus('offline');
            }
          );
        } else {
          setUser(null);
          setDebts([]);
          try {
            localStorage.removeItem('anotaya_user');
            localStorage.removeItem('anotaya_debts');
            localStorage.removeItem('bolsillo_debts');
          } catch {}
          if (unsubFirestore) {
            unsubFirestore();
            unsubFirestore = null;
          }
          setSyncStatus('offline');
        }
        setAuthChecking(false);
      });
    }

    initAuth();

    return () => {
      isMounted = false;
      if (unsubFirestore) unsubFirestore();
    };
  }, []);

  // Actualizar estado AnotaYa PRO ($1.00)
  const handleUpgradeToPro = async (status = true) => {
    setIsPro(status);
    try {
      localStorage.setItem('anotaya_is_pro', String(status));
    } catch {}

    const currentUid = auth.currentUser?.uid || user?.uid;
    if (currentUid && !user?.isGuest) {
      try {
        await setDoc(doc(db, 'user_finances', currentUid), {
          isPro: status,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error('Error saving pro status:', e);
      }
    }
  };

  // Guardar configuración de notificaciones
  const handleSaveNotificationSettings = async (nextSettings) => {
    setNotificationSettings(nextSettings);
    try {
      localStorage.setItem('anotaya_notif_settings', JSON.stringify(nextSettings));
    } catch {}

    const currentUid = auth.currentUser?.uid || user?.uid;
    if (currentUid && !user?.isGuest) {
      try {
        await setDoc(doc(db, 'user_finances', currentUid), {
          notificationSettings: nextSettings,
          updatedAt: new Date().toISOString()
        }, { merge: true });
      } catch (e) {
        console.error('Error saving notification settings:', e);
      }
    }
  };

  // Función maestra de persistencia
  const saveDebts = (nextDebts) => {
    setDebts(nextDebts);
    try {
      localStorage.setItem('anotaya_debts', JSON.stringify(nextDebts));
      localStorage.setItem('bolsillo_debts', JSON.stringify(nextDebts));
    } catch {}

    const currentUid = auth.currentUser?.uid || user?.uid;
    if (currentUid && !user?.isGuest) {
      setSyncStatus('syncing');
      syncDebtsToFirestore(currentUid, nextDebts)
        .then(() => setSyncStatus('synced'))
        .catch((e) => {
          console.error('Firestore save error:', e);
          setSyncStatus('offline');
        });
    }
  };

  // Forzar actualización inmediata desde la nube
  const handleForceSync = async () => {
    const currentUid = auth.currentUser?.uid || user?.uid;
    if (!currentUid || user?.isGuest) return;
    sounds.playPop();
    setSyncStatus('syncing');
    try {
      const cloudData = await getUserDataOnce(currentUid);
      if (cloudData && cloudData.debts && Array.isArray(cloudData.debts)) {
        setDebts(cloudData.debts);
        try {
          localStorage.setItem('anotaya_debts', JSON.stringify(cloudData.debts));
        } catch {}
        setSyncStatus('synced');
        try {
          confetti({ particleCount: 35, spread: 50, origin: { y: 0.2 } });
        } catch {}
      }
    } catch (e) {
      console.error('Force sync error:', e);
      setSyncStatus('offline');
    }
  };

  // Acciones de Deudas
  const handleAddDebt = (newRecord) => {
    const next = [newRecord, ...debts];
    saveDebts(next);
  };

  const handleAddPayment = (debtId, payment, isFullyPaid) => {
    const next = debts.map(d => {
      if (d.id === debtId) {
        const existingPayments = d.payments || [];
        const nextPayments = [payment, ...existingPayments];
        return {
          ...d,
          payments: nextPayments,
          isPaid: isFullyPaid ? true : d.isPaid,
          paidDate: isFullyPaid ? new Date().toISOString() : d.paidDate
        };
      }
      return d;
    });
    saveDebts(next);
  };

  const handleMarkPaid = (debtId) => {
    sounds.playCash();
    try {
      confetti({ particleCount: 70, spread: 70, origin: { y: 0.6 } });
    } catch {}
    const next = debts.map(d => {
      if (d.id === debtId) {
        return { ...d, isPaid: true, paidDate: new Date().toISOString() };
      }
      return d;
    });
    saveDebts(next);
  };

  const handleTogglePaid = (debtId, isPaid) => {
    sounds.playPop();
    const next = debts.map(d => {
      if (d.id === debtId) {
        return { ...d, isPaid, paidDate: isPaid ? new Date().toISOString() : null };
      }
      return d;
    });
    saveDebts(next);
  };

  const handleDeleteDebt = (debtId) => {
    sounds.playDelete();
    const next = debts.filter(d => d.id !== debtId);
    saveDebts(next);
  };

  const handleResetAllData = () => {
    sounds.playCash();
    saveDebts([]);
    alert('✅ Tu cuenta de AnotaYa ha sido reiniciada a cero con éxito.');
  };

  // Cálculos de Balance General en tiempo real
  const activeDebts = debts.filter(d => !d.isPaid);
  const paidDebts = debts.filter(d => d.isPaid);

  const getRemainingAmount = (d) => {
    if (d.isPaid) return 0;
    const paid = (d.payments || []).reduce((sum, p) => sum + (p.amount || 0), 0);
    return Math.max(0, (d.amount || 0) - paid);
  };

  const totalTheyOweMe = activeDebts
    .filter(d => d.type === 'they_owe_me')
    .reduce((sum, d) => sum + getRemainingAmount(d), 0);

  const totalIOwe = activeDebts
    .filter(d => d.type === 'i_owe')
    .reduce((sum, d) => sum + getRemainingAmount(d), 0);

  const netBalance = totalTheyOweMe - totalIOwe;

  const countTheyOweMe = activeDebts.filter(d => d.type === 'they_owe_me').length;
  const countIOwe = activeDebts.filter(d => d.type === 'i_owe').length;

  // Filtrado de la lista según pestaña y búsqueda
  const filteredDebts = debts.filter(d => {
    // Filtro por pestaña
    if (activeTab === 'all' && d.isPaid) return false;
    if (activeTab === 'they_owe_me' && (d.isPaid || d.type !== 'they_owe_me')) return false;
    if (activeTab === 'i_owe' && (d.isPaid || d.type !== 'i_owe')) return false;
    if (activeTab === 'paid' && !d.isPaid) return false;

    // Filtro por búsqueda
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = (d.personName || '').toLowerCase().includes(q);
      const noteMatch = (d.note || '').toLowerCase().includes(q);
      return nameMatch || noteMatch;
    }

    return true;
  });

  const formatMoney = (amount) => {
    if (isPrivacyMode) return '•••••';
    return `$${Math.abs(amount).toFixed(2)}`;
  };

  // Pantalla de carga
  if (authChecking) {
    return (
      <div className="min-h-screen bg-[#F8FAFC] flex flex-col items-center justify-center p-6 text-gray-900 text-center select-none">
        <div className="w-20 h-20 rounded-3xl bg-white p-3 border border-gray-100 shadow-xl mb-4 animate-pulse">
          <img src="/logo.png" alt="AnotaYa" className="w-full h-full object-contain drop-shadow-md" />
        </div>
        <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mb-3" />
        <p className="text-xs font-black text-gray-400 tracking-widest uppercase">Cargando AnotaYa...</p>
      </div>
    );
  }

  // Si no está autenticado, mostrar pantalla limpia de acceso
  const isAuthenticated = Boolean(user && user.uid && !user.isGuest);
  if (!isAuthenticated) {
    return (
      <AuthScreen
        onLoginSuccess={(userData) => {
          setUser(userData);
        }}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] pb-32 sm:pb-16 selection:bg-emerald-600 selection:text-white max-w-full overflow-x-hidden">
      
      {/* ================= HEADER ADAPTATIVO ================= */}
      <header 
        className="sticky top-0 z-30 bg-white/95 backdrop-blur-[20px] border-b border-gray-200/80 px-3 sm:px-8 py-2.5 sm:py-3 shadow-2xs max-w-full"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 0.65rem)' }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-2">
          
          {/* Logo y Marca */}
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-white shadow-xs p-1 border border-gray-100 flex items-center justify-center shrink-0">
              <img src="/logo.png" alt="AnotaYa" className="w-full h-full object-contain rounded-xl" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-black text-base sm:text-xl tracking-tight leading-none whitespace-nowrap">
                  <span className="text-[#0F172A]">Anota</span><span className="text-[#10B981]">Ya</span>
                </h1>
                <span className="text-[10px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200/80 px-1.5 py-0.5 rounded-lg whitespace-nowrap shrink-0">
                  USD $
                </span>
                {deviceType === 'desktop' && (
                  <span className="hidden md:inline-flex items-center gap-1 text-[10px] font-extrabold text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    <Monitor size={11} />
                    <span>Laptop / PC</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 font-bold mt-0.5 truncate leading-none">
                Control de Deudas
              </p>
            </div>
          </div>

          {/* Acciones del Header */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            
            {/* Botón Acción Rápida (Desktop y Tablet) */}
            {deviceType !== 'mobile' && (
              <button
                type="button"
                onClick={() => { sounds.playPop(); setIsNewDebtOpen(true); }}
                className="px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <Plus size={15} className="stroke-[3]" />
                <span>Anotar Deuda / Préstamo</span>
              </button>
            )}

            {/* Botón Recordatorios Automáticos / Notificaciones */}
            <button
              type="button"
              onClick={() => {
                sounds.playPop();
                if (isPro) {
                  setIsNotifModalOpen(true);
                } else {
                  setIsProModalOpen(true);
                }
              }}
              title={isPro ? (notificationSettings.enabled ? 'Recordatorios automáticos activos. Toca para ajustar.' : 'Recordatorios desactivados') : 'AnotaYa PRO: Activar recordatorios'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 relative ${
                isPro && notificationSettings.enabled
                  ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300 shadow-xs'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Bell size={15} />
              {!isPro && (
                <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-[8px] font-black text-slate-900 flex items-center justify-center shadow-xs">
                  ★
                </span>
              )}
            </button>

            {/* Botón Modo Privacidad / Calle */}
            <button
              type="button"
              onClick={() => { sounds.playPop(); setIsPrivacyMode(!isPrivacyMode); }}
              title={isPrivacyMode ? 'Mostrar montos' : 'Ocultar montos (Modo Calle)'}
              className={`w-9 h-9 rounded-xl flex items-center justify-center cursor-pointer transition-all active:scale-95 shrink-0 ${
                isPrivacyMode ? 'bg-amber-100 text-amber-800 ring-2 ring-amber-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {isPrivacyMode ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>

            {/* Exportar a Excel o PDF */}
            <button
              type="button"
              onClick={() => { sounds.playPop(); setIsExportModalOpen(true); }}
              title="Descargar reporte en Excel o PDF"
              className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-600 flex items-center justify-center cursor-pointer transition-all active:scale-95 shadow-2xs shrink-0"
            >
              <Download size={15} />
            </button>

            {/* Indicador de Sincronización en la Nube */}
            <button
              type="button"
              onClick={handleForceSync}
              title="Sincronizado en tiempo real con la nube. Toca para actualizar."
              className="w-9 h-9 sm:w-auto sm:px-2.5 sm:py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-700 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs shrink-0"
            >
              <RefreshCw 
                size={14} 
                className={`${syncStatus === 'syncing' ? 'animate-spin text-amber-500' : 'text-emerald-500'}`} 
              />
              <span className="hidden md:inline text-[11px]">
                {syncStatus === 'syncing' ? 'Sincronizando...' : 'En Vivo'}
              </span>
            </button>

            {/* Perfil de Usuario con Distintivo PRO */}
            <button
              onClick={() => setShowAuthModal(true)}
              title="Mi Perfil / Configuración de Cuenta"
              className="w-9 h-9 sm:w-auto sm:px-3 sm:py-1.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-bold text-gray-800 flex items-center justify-center gap-1.5 cursor-pointer transition-all active:scale-95 shadow-2xs shrink-0 relative"
            >
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <User size={15} className="text-gray-600 sm:hidden" />
              {isPro && (
                <Crown size={12} className="text-amber-500 fill-amber-400 sm:hidden -ml-0.5" />
              )}
              <span className="hidden sm:inline truncate max-w-[100px]">{user?.name || 'Mi Perfil'}</span>
              {isPro && (
                <span className="hidden sm:inline text-[9px] font-black bg-amber-400 text-slate-900 px-1.5 py-0.5 rounded-md shadow-2xs">
                  PRO
                </span>
              )}
            </button>
          </div>

        </div>
      </header>

      {/* ================= CONTENEDOR PRINCIPAL ================= */}
      <main className="max-w-6xl mx-auto px-4 sm:px-8 pt-5 space-y-6">

        {/* Banner AnotaYa PRO si no es pro */}
        {!isPro && (
          <div 
            onClick={() => { sounds.playPop(); setIsProModalOpen(true); }}
            className="p-3.5 sm:p-4 rounded-2xl bg-gradient-to-r from-amber-500 via-amber-600 to-yellow-600 text-white shadow-md flex items-center justify-between gap-3 cursor-pointer transition-all hover:shadow-lg active:scale-99"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-xs flex items-center justify-center shrink-0">
                <BellRing size={20} className="text-white" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h4 className="font-black text-xs sm:text-sm tracking-tight leading-tight truncate">
                    ¿Quieres recordatorios automáticos en tu teléfono?
                  </h4>
                  <span className="text-[9px] font-black bg-white text-slate-900 px-1.5 py-0.5 rounded-md shrink-0 uppercase">
                    $1.00 USD
                  </span>
                </div>
                <p className="text-[11px] text-amber-100 font-medium truncate mt-0.5">
                  AnotaYa PRO te avisa quién te debe y tus fechas de pago. Toca para ver.
                </p>
              </div>
            </div>
            <ArrowRight size={16} className="shrink-0 text-white stroke-[2.5]" />
          </div>
        )}
        
        {/* ================= 1. TARJETAS DE BALANCE GENERAL ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 sm:gap-4">
          
          {/* Tarjeta 1: Total que Me Deben */}
          <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 text-white shadow-xl shadow-emerald-500/15 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <ArrowDownRight size={16} />
                <span>Total que Me Deben</span>
              </span>
              <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                {countTheyOweMe} {countTheyOweMe === 1 ? 'persona' : 'personas'}
              </span>
            </div>

            <div className="mt-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight block">
                {formatMoney(totalTheyOweMe)}
              </span>
              <span className="text-[11px] font-bold text-emerald-100 block mt-0.5">
                Dinero por cobrar a tu favor
              </span>
            </div>
          </div>

          {/* Tarjeta 2: Total que Yo Debo */}
          <div className="p-5 sm:p-6 rounded-[28px] bg-gradient-to-br from-rose-500 via-rose-600 to-orange-700 text-white shadow-xl shadow-rose-500/15 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-2xl pointer-events-none" />
            
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-rose-100 flex items-center gap-1.5">
                <ArrowUpRight size={16} />
                <span>Total que Yo Debo</span>
              </span>
              <span className="text-[10px] font-black bg-white/20 text-white px-2 py-0.5 rounded-full backdrop-blur-xs">
                {countIOwe} {countIOwe === 1 ? 'deuda' : 'deudas'}
              </span>
            </div>

            <div className="mt-1">
              <span className="text-3xl sm:text-4xl font-black tracking-tight block">
                {formatMoney(totalIOwe)}
              </span>
              <span className="text-[11px] font-bold text-rose-100 block mt-0.5">
                Compromisos pendientes por pagar
              </span>
            </div>
          </div>

          {/* Tarjeta 3: Balance Neto */}
          <div className="p-5 sm:p-6 rounded-[28px] bg-white border border-gray-200/90 shadow-xl shadow-gray-200/40 relative overflow-hidden flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                <Scale size={16} className="text-gray-400" />
                <span>Balance Neto</span>
              </span>
              <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
                netBalance > 0 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-200' 
                  : netBalance < 0 
                  ? 'bg-rose-50 text-rose-800 border-rose-200' 
                  : 'bg-gray-100 text-gray-700 border-gray-200'
              }`}>
                {netBalance > 0 ? 'A tu favor 🟢' : netBalance < 0 ? 'Por pagar 🔴' : 'Al día 🤝'}
              </span>
            </div>

            <div className="mt-1">
              <span className={`text-3xl sm:text-4xl font-black tracking-tight block ${
                netBalance > 0 ? 'text-emerald-700' : netBalance < 0 ? 'text-rose-700' : 'text-gray-800'
              }`}>
                {isPrivacyMode ? '•••••' : `${netBalance >= 0 ? '+' : '-'}$${Math.abs(netBalance).toFixed(2)}`}
              </span>
              <span className="text-[11px] font-bold text-gray-400 block mt-0.5">
                Diferencia real entre cobrar y pagar
              </span>
            </div>
          </div>

        </div>

        {/* ================= 2. BUSCADOR & FILTROS RÁPIDOS ================= */}
        <div className="space-y-3">
          
          {/* Buscador en tiempo real */}
          <div className="relative">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar por nombre de persona o motivo (ej. Juan, almuerzo, gasolina)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-10 py-3 rounded-2xl bg-white border border-gray-200/90 focus:border-emerald-500 focus:ring-2 focus:ring-emerald-200 font-bold text-xs sm:text-sm text-gray-900 outline-none transition-all shadow-2xs"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Pestañas de Filtro */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            <button
              type="button"
              onClick={() => { sounds.playPop(); setActiveTab('all'); }}
              className={`px-4 py-2 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'all'
                  ? 'bg-gray-900 text-white shadow-md'
                  : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              <span>Todos</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'all' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
              }`}>
                {activeDebts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { sounds.playPop(); setActiveTab('they_owe_me'); }}
              className={`px-4 py-2 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'they_owe_me'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-white text-emerald-700 hover:bg-emerald-50 border border-emerald-200/80'
              }`}
            >
              <span>🟢 Me deben</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'they_owe_me' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-800'
              }`}>
                {countTheyOweMe}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { sounds.playPop(); setActiveTab('i_owe'); }}
              className={`px-4 py-2 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'i_owe'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-white text-rose-700 hover:bg-rose-50 border border-rose-200/80'
              }`}
            >
              <span>🔴 Yo debo</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'i_owe' ? 'bg-white/20 text-white' : 'bg-rose-100 text-rose-800'
              }`}>
                {countIOwe}
              </span>
            </button>

            <button
              type="button"
              onClick={() => { sounds.playPop(); setActiveTab('paid'); }}
              className={`px-4 py-2 rounded-2xl text-xs font-black cursor-pointer transition-all flex items-center gap-1.5 shrink-0 ${
                activeTab === 'paid'
                  ? 'bg-gray-700 text-white shadow-md'
                  : 'bg-white text-gray-500 hover:bg-gray-100 border border-gray-200/80'
              }`}
            >
              <span>✅ Saldados</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                activeTab === 'paid' ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'
              }`}>
                {paidDebts.length}
              </span>
            </button>
          </div>

        </div>

        {/* ================= 3. LISTA DE REGISTROS (GRID RESPONSIVE) ================= */}
        {filteredDebts.length === 0 ? (
          <div className="p-10 sm:p-14 text-center bg-white rounded-[32px] border border-dashed border-gray-300 shadow-xs space-y-3">
            <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-3xl">
              {activeTab === 'paid' ? '🎉' : '🤝'}
            </div>
            <div>
              <h3 className="font-extrabold text-base sm:text-lg text-gray-900">
                {searchQuery 
                  ? 'No se encontraron registros con esa búsqueda'
                  : activeTab === 'paid'
                  ? 'Aún no tienes deudas saldadas'
                  : activeTab === 'they_owe_me'
                  ? '¡Excelente! Nadie te debe dinero actualmente'
                  : activeTab === 'i_owe'
                  ? '¡Genial! No tienes deudas pendientes por pagar'
                  : '¡Todo limpio! No tienes registros pendientes'}
              </h3>
              <p className="text-xs sm:text-sm text-gray-400 font-semibold max-w-sm mx-auto mt-1">
                {activeTab === 'paid' 
                  ? 'Cuando marques una deuda como "Saldado", aparecerá guardada aquí en tu historial.'
                  : 'Toca el botón "+ Anotar" para registrar un préstamo o deuda y enviar recordatorios por WhatsApp.'}
              </p>
            </div>

            {activeTab !== 'paid' && (
              <button
                type="button"
                onClick={() => { sounds.playPop(); setIsNewDebtOpen(true); }}
                className="mt-3 px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md inline-flex items-center gap-1.5 cursor-pointer transition-all active:scale-98"
              >
                <Plus size={15} className="stroke-[3]" />
                <span>Anotar mi Primer Registro</span>
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 sm:gap-4">
            {filteredDebts.map((debt) => (
              <DebtCard
                key={debt.id}
                debt={debt}
                onOpenPayment={(d) => setSelectedDebtForPayment(d)}
                onMarkPaid={handleMarkPaid}
                onDeleteDebt={handleDeleteDebt}
                onTogglePaid={handleTogglePaid}
                onOpenContactHistory={(name) => setSelectedContactForHistory(name)}
                onOpenWhatsAppTemplate={(d) => setSelectedDebtForWhatsApp(d)}
              />
            ))}
          </div>
        )}

      </main>

      {/* ================= BOTÓN FLOTANTE MÓVIL (FAB) ================= */}
      <div className="fixed bottom-6 right-5 z-40 sm:hidden">
        <button
          type="button"
          onClick={() => { sounds.playPop(); setIsNewDebtOpen(true); }}
          className="px-5 py-3.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm shadow-xl shadow-emerald-600/40 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
        >
          <Plus size={18} className="stroke-[3]" />
          <span>Anotar</span>
        </button>
      </div>

      {/* ================= MODALES ================= */}
      
      {/* Modal Formulario de Registro ("Anotar Préstamo o Deuda") */}
      <NewDebtModal
        isOpen={isNewDebtOpen}
        onClose={() => {
          setIsNewDebtOpen(false);
          setNewDebtPrefill({ personName: '', phone: '', countryCode: '593' });
        }}
        onSave={handleAddDebt}
        initialPersonName={newDebtPrefill.personName}
        initialPhone={newDebtPrefill.phone}
        initialCountryCode={newDebtPrefill.countryCode}
      />

      {/* Modal de Abonos Parciales */}
      <PaymentModal
        isOpen={Boolean(selectedDebtForPayment)}
        onClose={() => setSelectedDebtForPayment(null)}
        debt={selectedDebtForPayment}
        onAddPayment={handleAddPayment}
      />

      {/* Modal de Plantillas de WhatsApp Automáticas */}
      <WhatsAppTemplateModal
        isOpen={Boolean(selectedDebtForWhatsApp)}
        onClose={() => setSelectedDebtForWhatsApp(null)}
        debt={selectedDebtForWhatsApp}
      />

      {/* Modal de Ficha de Contacto e Historial */}
      <ContactHistoryModal
        isOpen={Boolean(selectedContactForHistory)}
        onClose={() => setSelectedContactForHistory(null)}
        personName={selectedContactForHistory}
        debts={debts}
        onOpenNewDebtWithPerson={(name, phone, code) => {
          setNewDebtPrefill({ personName: name, phone: phone || '', countryCode: code || '593' });
          setIsNewDebtOpen(true);
        }}
        onOpenPayment={(d) => setSelectedDebtForPayment(d)}
        onMarkPaid={handleMarkPaid}
      />

      {/* Modal de Exportación a Excel y PDF */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        debts={debts}
        userName={user?.name || 'Usuario'}
      />

      {/* Modal de Cuenta / Perfil / Reinicio */}
      <AuthModal
        isOpen={showAuthModal}
        currentUser={user}
        onClose={() => setShowAuthModal(false)}
        onUserChange={(newUser) => setUser(newUser)}
        onResetAllData={handleResetAllData}
        isPro={isPro}
        onOpenProModal={() => setIsProModalOpen(true)}
        onTogglePro={(status) => handleUpgradeToPro(status)}
      />

      {/* Modal AnotaYa PRO ($1.00 Vitalicio) */}
      <ProUpgradeModal
        isOpen={isProModalOpen}
        onClose={() => setIsProModalOpen(false)}
        isPro={isPro}
        onUpgradeSuccess={() => {
          handleUpgradeToPro(true);
          setIsNotifModalOpen(true);
        }}
      />

      {/* Modal de Ajustes de Notificaciones Automáticas */}
      <NotificationSettingsModal
        isOpen={isNotifModalOpen}
        onClose={() => setIsNotifModalOpen(false)}
        isPro={isPro}
        onOpenProModal={() => {
          setIsNotifModalOpen(false);
          setIsProModalOpen(true);
        }}
        debts={debts}
        settings={notificationSettings}
        onSaveSettings={handleSaveNotificationSettings}
      />

    </div>
  );
}
