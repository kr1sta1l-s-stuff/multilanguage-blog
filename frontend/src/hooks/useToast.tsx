import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

export function useToast(duration: number = 1000) {
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!message) return;
    const handle = window.setTimeout(() => setMessage(''), duration);
    return () => window.clearTimeout(handle);
  }, [message, duration]);

  const toast = message
    ? createPortal(
        <div className="app-toast" role="status">{message}</div>,
        document.body,
      )
    : null;

  return { toast, showToast: setMessage };
}
