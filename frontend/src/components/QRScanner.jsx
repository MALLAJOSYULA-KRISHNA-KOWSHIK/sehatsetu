import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Loader2, CameraOff } from 'lucide-react';

const QRScanner = ({ onScanSuccess, onScanError }) => {
  const [isScanning, setIsScanning] = useState(true);
  const [cameraError, setCameraError] = useState('');

  useEffect(() => {
    let html5QrCode = null;

    // Use a slight timeout to bypass React 18 Strict Mode's synchronous double-mount.
    // The first mount's cleanup will cancel this timeout before it ever fires.
    const initTimer = setTimeout(async () => {
      html5QrCode = new Html5Qrcode("qr-reader");

      try {
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 }
          },
          (decodedText) => {
            if (html5QrCode) {
              html5QrCode.stop().then(() => {
                html5QrCode.clear();
                setIsScanning(false);
                if (onScanSuccess) onScanSuccess(decodedText);
              }).catch(() => {
                html5QrCode.clear();
                setIsScanning(false);
                if (onScanSuccess) onScanSuccess(decodedText);
              });
            }
          },
          (errorMessage) => {
            // Ignore normal scan failures
          }
        );
      } catch (err) {
        const errStr = err?.toString() || "";
        console.error("Camera start error:", errStr);
        if (errStr.includes("NotAllowedError") || errStr.includes("Permission denied")) {
          setCameraError("Camera permission denied. Please allow camera access in your browser settings.");
        } else if (errStr.includes("NotFoundError") || errStr.includes("Requested device not found")) {
          setCameraError("No camera found on this device.");
        } else {
          setCameraError("Unable to access camera. Please ensure you are using HTTPS or localhost.");
        }
      }
    }, 150);

    // Cleanup on unmount
    return () => {
      clearTimeout(initTimer);
      if (html5QrCode) {
        try {
          html5QrCode.stop().then(() => {
            html5QrCode.clear();
          }).catch(() => {
            try { html5QrCode.clear(); } catch (e) {}
          });
        } catch (e) {
          try { html5QrCode.clear(); } catch (err) {}
        }
      }
    };
  }, [onScanSuccess]);

  if (cameraError) {
    return (
      <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center p-8 bg-red-50 text-red-700 rounded-2xl border border-red-200 text-center">
        <CameraOff className="h-10 w-10 mb-4 text-red-500" />
        <p className="font-semibold text-lg mb-2">Camera Access Denied</p>
        <p className="text-sm opacity-90">{cameraError}</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto flex flex-col items-center justify-center space-y-4">
      {isScanning ? (
        <div className="w-full relative overflow-hidden rounded-2xl shadow-lg border border-gray-200 bg-black min-h-[300px] flex items-center justify-center">
          <div id="qr-reader" className="w-full" />
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center p-8 bg-green-50 text-green-700 rounded-2xl w-full border border-green-200">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-green-600" />
          <p className="font-semibold text-lg">Authenticating...</p>
          <p className="text-sm opacity-80">Please wait while we log you in.</p>
        </div>
      )}
    </div>
  );
};

export default QRScanner;
