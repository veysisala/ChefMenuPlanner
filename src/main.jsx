import React from 'react';
import ReactDOM from 'react-dom/client';
import App from '../MasterChefPlanner.jsx';

// MasterChefPlanner uses window.storage (e.g. browser extension API).
// Polyfill with localStorage for standalone web run.
if (typeof window !== 'undefined' && !window.storage) {
  window.storage = {
    get: (key) =>
      Promise.resolve({
        value: localStorage.getItem(key),
      }),
    set: (key, value) =>
      Promise.resolve(localStorage.setItem(key, value)),
  };
}

class ErrorBoundary extends React.Component {
  state = { error: null };
  static getDerivedStateFromError(error) {
    return { error };
  }
  componentDidCatch(error, info) {
    console.error('App error:', error, info);
  }
  render() {
    if (this.state.error) {
      return (
        <div style={{ padding: 20, fontFamily: 'sans-serif', color: '#c00', maxWidth: 600 }}>
          <h2>Uygulama hatası</h2>
          <pre style={{ whiteSpace: 'pre-wrap', fontSize: 14 }}>
            {this.state.error?.message || String(this.state.error)}
          </pre>
          <p>Tarayıcı konsolunda (F12) daha fazla ayrıntı görebilirsiniz.</p>
        </div>
      );
    }
    return this.props.children;
  }
}

const rootEl = document.getElementById('root');
if (!rootEl) {
  document.body.innerHTML = '<div style="padding:20px;font-family:sans-serif;color:#c00;">Hata: #root bulunamadı.</div>';
} else {
  ReactDOM.createRoot(rootEl).render(
    <React.StrictMode>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </React.StrictMode>
  );
}
