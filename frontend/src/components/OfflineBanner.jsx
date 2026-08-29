import React, { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

const OfflineBanner = () => {
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
    <div className="w-full bg-amber-100 border-b border-amber-200 text-amber-800 px-4 py-3 flex flex-wrap items-center justify-center gap-2 shadow-sm sticky top-0 z-[100] transition-all duration-300">
      <WifiOff className="h-4 w-4 shrink-0" />
      <p className="text-sm font-medium text-center">
        You are currently offline. Viewing cached data.
      </p>
    </div>
  );
};

export default OfflineBanner;
