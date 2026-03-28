import { useState, useCallback } from 'react';

export function useToast() {
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  }, []);

  const ToastComponent = toast ? (
    <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>
      {toast.message}
    </div>
  ) : null;

  return { showToast, ToastComponent };
}
