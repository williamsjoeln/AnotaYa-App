import { initializeApp } from 'firebase/app';
import { Capacitor } from '@capacitor/core';
import { SocialLogin } from '@capgo/capacitor-social-login';
import { 
  getAuth, 
  initializeAuth,
  indexedDBLocalPersistence,
  GoogleAuthProvider, 
  OAuthProvider,
  signInWithPopup, 
  signInWithRedirect,
  getRedirectResult,
  signInWithCredential,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  sendPasswordResetEmail,
  sendEmailVerification,
  setPersistence,
  browserLocalPersistence,
  browserSessionPersistence,
  signOut, 
  onAuthStateChanged 
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  getDoc, 
  onSnapshot 
} from 'firebase/firestore';

const firebaseConfig = {
  projectId: "mibolsillo-app-ec",
  appId: "1:797797104296:web:14592eb9d0e29b82eda09d",
  storageBucket: "mibolsillo-app-ec.firebasestorage.app",
  apiKey: "AIzaSyDXu_l-IWLMAKPKEY-AKolUSlybOtoAiuA",
  authDomain: typeof window !== "undefined" && window.location.hostname.includes("web.app") ? window.location.hostname : "mibolsillo-app-ec.firebaseapp.com",
  messagingSenderId: "797797104296",
  projectNumber: "797797104296"
};

export const app = initializeApp(firebaseConfig);
export const auth = typeof window !== 'undefined'
  ? initializeAuth(app, {
      persistence: [indexedDBLocalPersistence, browserLocalPersistence, browserSessionPersistence]
    })
  : getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });

const appleProvider = new OAuthProvider('apple.com');
appleProvider.addScope('email');
appleProvider.addScope('name');

// Apple Sign In (Social Login Oficial para iOS, Web y Android)
export async function loginWithApple(rememberMe = true) {
  try {
    try {
      await setPersistence(auth, rememberMe ? (indexedDBLocalPersistence || browserLocalPersistence) : browserSessionPersistence);
    } catch (persistErr) {
      console.warn('Persistence setup warning:', persistErr);
    }

    // En iOS nativo con Capacitor, usamos SocialLogin oficial con Face ID / Touch ID
    if (Capacitor.isNativePlatform()) {
      await ensureSocialLogin();
      const loginRes = await SocialLogin.login({
        provider: 'apple',
        options: {
          scopes: ['email', 'name']
        }
      });

      const resData = loginRes?.result || loginRes;
      const idToken = resData?.idToken || resData?.identityToken;
      const rawNonce = resData?.nonce;
      if (!idToken) {
        return { user: null, error: 'No se recibió la confirmación de Apple.' };
      }

      const credential = appleProvider.credential({
        idToken: idToken,
        ...(rawNonce ? { rawNonce } : {})
      });
      const userCredential = await signInWithCredential(auth, credential);
      return { user: userCredential.user, error: null };
    }

    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isIOS) {
      const popupPromise = signInWithPopup(auth, appleProvider);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('timeout')), 20000);
      });
      const result = await Promise.race([popupPromise, timeoutPromise]);
      return { user: result.user, error: null };
    }

    const popupPromise = signInWithPopup(auth, appleProvider);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 20000);
    });

    const result = await Promise.race([popupPromise, timeoutPromise]);
    return { user: result.user, error: null };
  } catch (error) {
    if (error.message === 'timeout' || error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, appleProvider);
        return { user: null, redirecting: true, error: null };
      } catch (redirectError) {
        return { user: null, error: 'La ventana de Apple fue bloqueada. Intenta de nuevo o ingresa con tu correo.' };
      }
    }
    if (error.code === 'auth/popup-closed-by-user') {
      return { user: null, error: 'Ventana de inicio de Apple cerrada.' };
    }
    if (error.code === 'auth/operation-not-allowed') {
      return { user: null, error: 'El proveedor de Apple debe activarse en la consola de Firebase (Authentication > Sign-in method > Apple).' };
    }
    return { user: null, error: error.message, code: error.code };
  }
}

let socialLoginInitialized = false;
async function ensureSocialLogin() {
  if (socialLoginInitialized) return;
  try {
    await SocialLogin.initialize({
      google: {
        webClientId: '797797104296-tlt21sh24beptk6f5vkh0232hscf26rm.apps.googleusercontent.com',
        mode: 'online'
      },
      apple: {}
    });
    socialLoginInitialized = true;
  } catch (e) {
    console.warn('SocialLogin init:', e);
  }
}

// Google Sign In (Selector nativo en Android/iOS o Popup en Web)
export async function loginWithGoogle(rememberMe = true) {
  try {
    try {
      await setPersistence(auth, rememberMe ? (indexedDBLocalPersistence || browserLocalPersistence) : browserSessionPersistence);
    } catch (persistErr) {
      console.warn('Persistence setup warning:', persistErr);
    }

    // En Android / iOS nativo con Capacitor, usamos el selector oficial de Google (sin abrir navegador)
    if (Capacitor.isNativePlatform()) {
      await ensureSocialLogin();
      const loginRes = await SocialLogin.login({
        provider: 'google',
        options: {}
      });

      const idToken = loginRes?.result?.idToken;
      if (!idToken) {
        return { user: null, error: 'No se recibió la confirmación de Google.' };
      }

      const credential = GoogleAuthProvider.credential(idToken);
      const userCredential = await signInWithCredential(auth, credential);
      return { user: userCredential.user, error: null };
    }

    const isStandalone = typeof window !== 'undefined' && (
      window.navigator.standalone === true || 
      window.matchMedia('(display-mode: standalone)').matches
    );
    const isIOS = typeof navigator !== 'undefined' && /iPhone|iPad|iPod/i.test(navigator.userAgent);

    // En iOS PWA en modo pantalla de inicio, los popups son bloqueados silenciosamente por WebKit.
    // Usamos signInWithRedirect para que no quede congelado.
    if (isIOS && isStandalone) {
      await signInWithRedirect(auth, googleProvider);
      return { user: null, redirecting: true, error: null };
    }

    // Carrera de 10 segundos: si el popup queda suspendido por el navegador, se cancela
    const popupPromise = signInWithPopup(auth, googleProvider);
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('timeout')), 10000);
    });

    const result = await Promise.race([popupPromise, timeoutPromise]);
    return { user: result.user, error: null };
  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user' || error.message?.includes('canceled') || error.message?.includes('cancelled')) {
      return { user: null, error: 'Ventana cerrada. Toca de nuevo o ingresa con tu correo abajo.' };
    }
    if (error.message === 'timeout' || error.code === 'auth/popup-blocked') {
      try {
        await signInWithRedirect(auth, googleProvider);
        return { user: null, redirecting: true, error: null };
      } catch (redirectError) {
        return { user: null, error: 'La ventana de Google fue bloqueada. Puedes iniciar de forma directa con tu correo abajo.' };
      }
    }
    return { user: null, error: error.message, code: error.code };
  }
}

// Check redirect result on load
export async function checkRedirectResult() {
  try {
    // Si es nativo (iOS / Android), getRedirectResult no debe bloquear el inicio
    if (Capacitor.isNativePlatform()) {
      return { user: null, error: null };
    }
    const checkPromise = getRedirectResult(auth);
    const timeoutPromise = new Promise((resolve) => setTimeout(() => resolve(null), 2500));
    const result = await Promise.race([checkPromise, timeoutPromise]);
    return { user: result?.user || null, error: null };
  } catch (error) {
    console.warn('Redirect result check error:', error);
    return { user: null, error: null };
  }
}

// Email & Password Register with Official Verification Email
export async function registerWithEmail(email, password, displayName, rememberMe = true) {
  try {
    try {
      await setPersistence(auth, rememberMe ? (indexedDBLocalPersistence || browserLocalPersistence) : browserSessionPersistence);
    } catch (persistErr) {
      console.warn('Persistence setup warning:', persistErr);
    }
    const result = await createUserWithEmailAndPassword(auth, email, password);
    
    // Enviar correo de confirmación oficial a su bandeja de entrada
    try {
      await sendEmailVerification(result.user);
    } catch (emailErr) {
      console.warn('No se pudo enviar correo de confirmación de inmediato:', emailErr);
    }

    if (displayName) {
      await setDoc(doc(db, 'users', result.user.uid), {
        name: displayName,
        email: email,
        createdAt: new Date().toISOString()
      }, { merge: true });
    }
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message, code: error.code };
  }
}

// Email & Password Login
export async function loginWithEmail(email, password, rememberMe = true) {
  try {
    try {
      await setPersistence(auth, rememberMe ? (indexedDBLocalPersistence || browserLocalPersistence) : browserSessionPersistence);
    } catch (persistErr) {
      console.warn('Persistence setup warning:', persistErr);
    }
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (error) {
    return { user: null, error: error.message, code: error.code };
  }
}

// Forgot Password / Reset
export async function resetPassword(email) {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error: error.message, code: error.code };
  }
}

// Logout
export async function logoutUser() {
  await signOut(auth);
}

// Guardar Deudas en Firestore de forma directa y segura (AnotaYa)
export async function syncDebtsToFirestore(userId, debts) {
  if (!userId || userId === 'guest') return;
  try {
    await setDoc(doc(db, 'user_finances', userId), {
      debts: debts || [],
      updatedAt: new Date().toISOString()
    }, { merge: true });
  } catch (e) {
    console.error('Error syncing debts to Firestore:', e);
    throw e;
  }
}

// Save User Budget Data in Firestore
export async function syncUserDataToFirestore(userId, accounts, transactions, debts, goals, dailyLimit, dailyClosings, todayLog) {
  if (!userId || userId === 'guest') return;
  try {
    const payload = {
      updatedAt: new Date().toISOString()
    };
    if (accounts !== undefined) payload.accounts = accounts;
    if (transactions !== undefined) payload.transactions = transactions;
    if (debts !== undefined) payload.debts = debts;
    if (goals !== undefined) payload.goals = goals;
    if (dailyLimit !== undefined) payload.dailyLimit = dailyLimit;
    if (dailyClosings !== undefined) payload.dailyClosings = dailyClosings;
    if (todayLog !== undefined) payload.todayLog = todayLog;

    await setDoc(doc(db, 'user_finances', userId), payload, { merge: true });
  } catch (e) {
    console.error('Error syncing to Firestore:', e);
    throw e;
  }
}

// Get User Budget Data Once from Firestore
export async function getUserDataOnce(userId) {
  if (!userId || userId === 'guest') return null;
  try {
    const snap = await getDoc(doc(db, 'user_finances', userId));
    return snap.exists() ? snap.data() : null;
  } catch (e) {
    console.error('Error fetching user data:', e);
    return null;
  }
}

// Subscribe to User Data in Firestore
export function subscribeToUserData(userId, onData, onError) {
  if (!userId || userId === 'guest') return () => {};
  return onSnapshot(doc(db, 'user_finances', userId), (snap) => {
    if (snap.exists()) {
      const data = snap.data();
      onData(data);
    } else {
      onData(null);
    }
  }, (err) => {
    console.error('Firestore subscription error:', err);
    if (onError) onError(err);
  });
}
