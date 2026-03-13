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

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
