import React from 'react'
import ReactDOM from 'react-dom/client'
import './index.css'

const renderApp = () => {
  import('./App.tsx').then(({ default: App }) => {
    ReactDOM.createRoot(document.getElementById('root')!).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>,
    )
  });
};

// 注册 Firebase 代理 Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/proxy-sw.js').then(registration => {
    console.log('Proxy SW registered: ', registration);
    if (navigator.serviceWorker.controller) {
      renderApp();
    } else {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        renderApp();
      }, { once: true });
    }
  }).catch(registrationError => {
    console.log('Proxy SW registration failed: ', registrationError);
    renderApp();
  });
} else {
  renderApp();
}
