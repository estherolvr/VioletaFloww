// src/componentes/Toast.jsx
import React, { useEffect } from 'react';

const Toast = ({ message, type = 'success', onClose, duration = 4000 }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [duration, onClose]);
  
  const config = {
    success: { bg: 'bg-gradient-to-r from-green-500 to-green-600', icon: 'fa-check-circle' },
    error: { bg: 'bg-gradient-to-r from-red-500 to-red-600', icon: 'fa-exclamation-circle' },
    warning: { bg: 'bg-gradient-to-r from-yellow-500 to-orange-500', icon: 'fa-exclamation-triangle' },
    info: { bg: 'bg-gradient-to-r from-blue-500 to-blue-600', icon: 'fa-info-circle' }
  };
  
  const { bg, icon } = config[type];
  
  return (
    <div className="fixed bottom-5 right-5 z-50 animate-slideUp">
      <div className={`${bg} text-white px-5 py-4 rounded-xl shadow-2xl flex items-start gap-3 min-w-[280px] max-w-md`}>
        <i className={`fas ${icon} text-xl`} />
        <div className="flex-1">
          <p className="text-sm font-semibold">
            {type === 'success' && 'Sucesso!'}
            {type === 'error' && 'Erro!'}
            {type === 'warning' && 'Atenção!'}
          </p>
          <p className="text-xs opacity-90">{message}</p>
        </div>
        <button onClick={onClose} className="hover:opacity-70">
          <i className="fas fa-times" />
        </button>
      </div>
    </div>
  );
};

export default Toast;