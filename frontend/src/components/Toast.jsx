import React, { useEffect } from 'react';
import { X, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import '../styles/Components.css';

const Toast = ({ message, type = 'info', onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle size={18} />;
      case 'error':
        return <AlertTriangle size={18} />;
      default:
        return <Info size={18} />;
    }
  };

  return (
    <div className={`toast ${type}`}>
      {getIcon()}
      <span>{message}</span>
      <button onClick={onClose} style={{ background: 'none', color: 'inherit', display: 'flex', alignItems: 'center', marginLeft: '10px' }}>
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
