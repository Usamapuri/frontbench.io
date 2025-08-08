import { useState, useEffect } from 'react';

export default function OfflineBanner() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!isOffline) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 to-red-400 text-white px-4 py-2 text-center text-sm z-50">
      <i className="fas fa-wifi-slash mr-2"></i>
      You're offline. Changes will sync when connection is restored.
    </div>
  );
}
