import React, { Component, StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.jsx';

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('AnotaYa Error Boundary caught:', error, errorInfo);
  }

  handleReload = async () => {
    try {
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
      }
      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (const reg of registrations) {
          await reg.unregister();
        }
      }
    } catch {}
    window.location.reload(true);
  };

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '24px',
          fontFamily: 'system-ui, -apple-system, sans-serif',
          background: '#F8FAFC',
          color: '#0F172A',
          textAlign: 'center'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '20px',
            background: '#ffffff',
            padding: '10px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.06)',
            marginBottom: '16px'
          }}>
            <img src="/logo.png" alt="AnotaYa" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
          <h2 style={{ fontSize: '20px', fontWeight: '900', marginBottom: '8px' }}>
            AnotaYa — Cargar Versión Actualizada
          </h2>
          <p style={{ fontSize: '13px', color: '#64748B', maxWidth: '320px', marginBottom: '24px', lineHeight: '1.4' }}>
            Se ha publicado una actualización de AnotaYa. Toca el botón para actualizar de inmediato.
          </p>
          <button
            onClick={this.handleReload}
            style={{
              padding: '14px 28px',
              borderRadius: '16px',
              background: '#10B981',
              color: '#ffffff',
              fontWeight: '800',
              fontSize: '14px',
              border: 'none',
              cursor: 'pointer',
              boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
            }}
          >
            Actualizar y Abrir AnotaYa
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <GlobalErrorBoundary>
      <App />
    </GlobalErrorBoundary>
  </StrictMode>
);
