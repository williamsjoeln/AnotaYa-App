import React, { useState } from 'react';
import { Capacitor } from '@capacitor/core';
import { 
  ShieldCheck, Lock, Mail, User, Eye, EyeOff, 
  ArrowRight, Sparkles, CheckCircle2, AlertCircle, 
  KeyRound, HelpCircle, ArrowLeft
} from 'lucide-react';
import { 
  loginWithGoogle, 
  loginWithApple,
  loginWithEmail, 
  registerWithEmail, 
  resetPassword 
} from '../services/firebase';
import { sounds } from '../utils/audio';
import confetti from 'canvas-confetti';

export function AuthScreen({ onLoginSuccess }) {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'forgot'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  
  // Separar estados de carga para que no se congele el botón principal
  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [formLoading, setFormLoading] = useState(false);
  
  // Detección inteligente: Si está en iPhone pantalla de inicio (PWA), ocultar Google para evitar bloqueos de Apple
  const isIOSPWA = typeof window !== 'undefined' && (
    /iPhone|iPad|iPod/i.test(navigator.userAgent) && 
    (window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches)
  );
  
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Traducir errores de Firebase a español amigable
  const parseFirebaseError = (err) => {
    const code = err?.code || err?.message || '';
    if (code.includes('user-not-found')) return 'No existe ninguna cuenta registrada con este correo.';
    if (code.includes('wrong-password') || code.includes('invalid-credential')) return 'Correo o contraseña incorrectos. Verifica tus datos.';
    if (code.includes('email-already-in-use')) return 'Este correo ya está registrado. Por favor inicia sesión.';
    if (code.includes('weak-password')) return 'La contraseña debe tener un mínimo de 6 caracteres.';
    if (code.includes('invalid-email')) return 'El formato del correo electrónico no es válido.';
    if (code.includes('popup-closed-by-user')) return 'Ventana cerrada. Toca de nuevo para conectar tu cuenta de Google.';
    if (code.includes('unauthorized-domain')) return 'Dominio en sincronización. Si persiste, prueba con tu correo.';
    if (code.includes('network-request-failed')) return 'Error de conexión. Verifica tu conexión a internet.';
    return err?.message || 'Ocurrió un error al procesar tu acceso. Intenta de nuevo.';
  };

  const handleGoogle = async () => {
    setError('');
    setSuccessMsg('');
    setGoogleLoading(true);

    try {
      const { user, error: err, redirecting } = await loginWithGoogle(rememberMe);
      
      if (redirecting) {
        // Redirigiendo a pantalla de Google
        return;
      }

      setGoogleLoading(false);

      if (err) {
        if (!err.includes('popup-closed-by-user')) {
          setError(parseFirebaseError({ message: err }));
          sounds.playDelete();
        }
      } else if (user) {
        sounds.playCash();
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
        onLoginSuccess({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Usuario',
          email: user.email,
          isGuest: false
        });
      }
    } catch (e) {
      setGoogleLoading(false);
      setError('No se pudo conectar con Google. Puedes ingresar con tu correo abajo.');
    }
  };

  const handleApple = async () => {
    setError('');
    setSuccessMsg('');
    setAppleLoading(true);

    try {
      const { user, error: err, redirecting } = await loginWithApple(rememberMe);

      if (redirecting) {
        return;
      }

      setAppleLoading(false);

      if (err) {
        if (!err.includes('popup-closed-by-user')) {
          setError(parseFirebaseError({ message: err }));
          sounds.playDelete();
        }
      } else if (user) {
        sounds.playCash();
        try {
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
        } catch {}
        onLoginSuccess({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Usuario Apple',
          email: user.email,
          isGuest: false
        });
      }
    } catch (e) {
      setAppleLoading(false);
      setError('No se pudo conectar con Apple. Puedes ingresar con tu correo abajo.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (mode === 'forgot') {
      if (!email.trim()) {
        setError('Ingresa tu correo para enviarte el enlace de recuperación.');
        return;
      }
      setFormLoading(true);
      const res = await resetPassword(email.trim());
      setFormLoading(false);
      if (res.success) {
        sounds.playCash();
        setSuccessMsg(`Te enviamos un enlace de recuperación a ${email}. Revisa tu bandeja de entrada o spam.`);
      } else {
        setError(parseFirebaseError(res));
        sounds.playDelete();
      }
      return;
    }

    if (mode === 'register') {
      if (!name.trim()) {
        setError('Por favor escribe tu nombre o apodo.');
        return;
      }
      if (password.length < 6) {
        setError('La contraseña debe tener al menos 6 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }

      setFormLoading(true);
      const { user, error: err } = await registerWithEmail(email.trim(), password, name.trim(), rememberMe);
      setFormLoading(false);

      if (err) {
        setError(parseFirebaseError({ message: err }));
        sounds.playDelete();
      } else if (user) {
        sounds.playCash();
        try {
          confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 } });
        } catch {}
        onLoginSuccess({
          uid: user.uid,
          name: name.trim(),
          email: user.email,
          isGuest: false
        });
      }
    } else {
      // Login
      if (!email.trim() || !password) {
        setError('Por favor ingresa tu correo y contraseña.');
        return;
      }
      setFormLoading(true);
      const { user, error: err } = await loginWithEmail(email.trim(), password, rememberMe);
      setFormLoading(false);

      if (err) {
        setError(parseFirebaseError({ message: err }));
        sounds.playDelete();
      } else if (user) {
        sounds.playCash();
        try {
          confetti({ particleCount: 60, spread: 60, origin: { y: 0.6 } });
        } catch {}
        onLoginSuccess({
          uid: user.uid,
          name: user.displayName || user.email?.split('@')[0] || 'Usuario',
          email: user.email,
          isGuest: false
        });
      }
    }
  };

  return (
    <div className="min-h-screen w-full bg-[#F8FAFC] text-gray-900 flex flex-col justify-between relative selection:bg-emerald-500 selection:text-white px-4 sm:px-6 pt-[calc(env(safe-area-inset-top,0px)+1.5rem)] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
      
      {/* Luces suaves y elegantes de fondo blanco / menta */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-96 bg-emerald-100/50 rounded-full blur-[120px] pointer-events-none" />

      {/* Contenedor central */}
      <div className="max-w-md w-full mx-auto my-auto relative z-10 py-2">
        
        {/* Cabecera / Branding Limpio y Blanco */}
        <div className="text-center space-y-3 mb-6">
          <div className="inline-flex p-3 rounded-3xl bg-white border border-gray-100 shadow-xl">
            <img 
              src="/logo.png" 
              alt="AnotaYa" 
              className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-md" 
            />
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 flex items-center justify-center gap-1.5">
              <span>Anota</span>
              <span className="text-emerald-600">Ya</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-black px-2.5 py-0.5 rounded-full ml-1">
                APP
              </span>
            </h1>
            <p className="text-xs sm:text-sm text-gray-500 mt-1 font-semibold">
              Control inteligente de quién te debe y a quién le debes
            </p>
          </div>

          {/* Insignia de Bóveda Segura */}
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200/80 text-[11px] font-extrabold text-emerald-800 shadow-2xs">
            <ShieldCheck size={14} className="text-emerald-600" />
            <span>Bóveda privada encriptada y protegida</span>
          </div>
        </div>

        {/* Tarjeta de Formulario Principal Blanco y Limpio */}
        <div className="bg-white border border-gray-200/80 rounded-[32px] p-6 sm:p-8 shadow-xl shadow-gray-200/50 space-y-5 text-left">
          
          {/* Tabs: Iniciar Sesión / Crear Cuenta */}
          {mode !== 'forgot' ? (
            <div className="flex bg-gray-100 p-1 rounded-2xl border border-gray-200/60">
              <button
                type="button"
                onClick={() => { sounds.playPop(); setMode('login'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  mode === 'login'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                onClick={() => { sounds.playPop(); setMode('register'); setError(''); setSuccessMsg(''); }}
                className={`flex-1 py-2.5 rounded-xl text-xs sm:text-sm font-black transition-all cursor-pointer ${
                  mode === 'register'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                Crear Cuenta
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => { sounds.playPop(); setMode('login'); setError(''); setSuccessMsg(''); }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors cursor-pointer"
              >
                <ArrowLeft size={14} />
                <span>Volver a Iniciar Sesión</span>
              </button>
              <span className="text-xs font-black text-emerald-600">Recuperar Acceso</span>
            </div>
          )}

          {/* Mensajes de Alerta y Notificación */}
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5 leading-relaxed font-semibold">
              <AlertCircle size={16} className="shrink-0 text-rose-500 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2.5 leading-relaxed font-semibold">
              <CheckCircle2 size={16} className="shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* Botones Sociales: Google y Apple (Social Login en Web) */}
          {mode !== 'forgot' && !Capacitor.isNativePlatform() && (
            <div className="space-y-2.5">
              {/* Botón Google */}
              <button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading || appleLoading || formLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-gray-50 active:bg-gray-100 text-gray-800 font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all border border-gray-200/90 shadow-xs cursor-pointer disabled:opacity-60"
              >
                {googleLoading ? (
                  <div className="w-4 h-4 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                  </svg>
                )}
                <span>{googleLoading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
              </button>

              {/* Botón Apple Oficial */}
              <button
                type="button"
                onClick={handleApple}
                disabled={googleLoading || appleLoading || formLoading}
                className="w-full py-3 px-4 rounded-2xl bg-black hover:bg-neutral-800 active:bg-neutral-900 text-white font-extrabold text-xs sm:text-sm flex items-center justify-center gap-3 transition-all shadow-xs cursor-pointer disabled:opacity-60"
              >
                {appleLoading ? (
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4 shrink-0 fill-current" viewBox="0 0 170 170">
                    <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.71-11.71-14-4.79-7.39-8.74-16.14-11.87-26.24-3.13-10.1-4.7-20.08-4.7-29.93 0-14.12 3.65-25.79 10.95-35 7.3-9.22 16.5-13.88 27.6-14 4.57 0 9.78 1.25 15.63 3.75 5.85 2.5 9.87 3.8 12.06 3.9 2.06 0 6.27-1.39 12.63-4.17 6.36-2.77 11.83-4 16.41-3.7 12.39.65 22.37 5.22 29.93 13.7-10.87 6.63-16.2 15.54-16 26.74.22 8.7 3.48 16.08 9.78 22.17 6.3 6.09 13.7 9.57 22.2 10.43-2.17 6.52-4.67 12.83-7.5 18.91zM119.22 31.84c0-7.72 2.76-14.89 8.28-21.52 5.53-6.63 12.39-10.32 20.59-11.07.22 1.09.33 2.17.33 3.26 0 7.72-2.82 14.99-8.48 21.83-5.65 6.85-12.72 10.66-21.2 11.41-.33-1.3-.52-2.6-.52-3.91z" />
                  </svg>
                )}
                <span>{appleLoading ? 'Conectando con Apple...' : 'Continuar con Apple'}</span>
              </button>

              <div className="flex items-center gap-3 pt-1">
                <div className="flex-1 h-px bg-gray-200" />
                <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">o con tu correo</span>
                <div className="flex-1 h-px bg-gray-200" />
              </div>
            </div>
          )}

          {/* Formulario de Correo & Contraseña */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            
            {/* Campo Nombre (solo registro) */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                  <User size={13} className="text-emerald-600" />
                  <span>Tu Nombre o Apodo</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ej. Carlos Mendoza"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-600 focus:bg-white rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all font-semibold"
                />
              </div>
            )}

            {/* Campo Correo */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                <Mail size={13} className="text-emerald-600" />
                <span>Correo Electrónico</span>
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-600 focus:bg-white rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all font-semibold"
              />
            </div>

            {/* Campo Contraseña (solo login y registro) */}
            {mode !== 'forgot' && (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                    <Lock size={13} className="text-emerald-600" />
                    <span>Contraseña</span>
                  </label>
                  {mode === 'login' && (
                    <button
                      type="button"
                      onClick={() => { sounds.playPop(); setMode('forgot'); setError(''); setSuccessMsg(''); }}
                      className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline cursor-pointer"
                    >
                      ¿Olvidaste tu contraseña?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-600 focus:bg-white rounded-2xl px-4 py-3 pr-11 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all font-semibold"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1 cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            )}

            {/* Confirmar Contraseña (solo registro) */}
            {mode === 'register' && (
              <div className="space-y-1.5">
                <label className="text-[11px] font-black text-gray-700 uppercase tracking-wide flex items-center gap-1.5">
                  <KeyRound size={13} className="text-emerald-600" />
                  <span>Confirmar Contraseña</span>
                </label>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Repite la contraseña"
                  className="w-full bg-gray-50 border border-gray-200 focus:border-emerald-600 focus:bg-white rounded-2xl px-4 py-3 text-sm text-gray-900 placeholder-gray-400 outline-none transition-all font-semibold"
                />
              </div>
            )}

            {/* Checkbox: Recordarme */}
            {mode !== 'forgot' && (
              <div className="flex items-center justify-between pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="w-4 h-4 rounded-md accent-emerald-600 bg-gray-100 border-gray-300 cursor-pointer"
                  />
                  <span className="text-xs font-bold text-gray-700">
                    Recordar mi sesión en este teléfono
                  </span>
                </label>
              </div>
            )}

            {/* Botón de Enviar (Usa formLoading de manera independiente) */}
            <button
              type="submit"
              disabled={formLoading || googleLoading}
              className="w-full py-3.5 px-5 rounded-2xl bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/25 transition-all active:scale-[0.98] cursor-pointer disabled:opacity-50 mt-4"
            >
              {formLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>
                    {mode === 'login' && 'Entrar a AnotaYa'}
                    {mode === 'register' && 'Crear Mi Cuenta en AnotaYa'}
                    {mode === 'forgot' && 'Enviar Correo de Recuperación'}
                  </span>
                  <ArrowRight size={16} className="stroke-[3]" />
                </>
              )}
            </button>
          </form>

        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-[11px] text-gray-400 font-bold">
            AnotaYa • Control Inteligente de Deudas y Préstamos
          </p>
        </div>

      </div>

    </div>
  );
}