"use client";

import React from "react";
import { AlertTriangle, Chrome, Globe } from "lucide-react";

interface BrowserCompatibilityCheckProps {
  children: React.ReactNode;
}

export function BrowserCompatibilityCheck({
  children,
}: BrowserCompatibilityCheckProps) {
  const [isSupported, setIsSupported] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    checkBrowserSupport();
  }, []);

  const checkBrowserSupport = () => {
    try {
      // Check for required WebRTC APIs
      const hasGetUserMedia = !!(
        navigator.mediaDevices && navigator.mediaDevices.getUserMedia
      );
      const hasRTCPeerConnection = !!window.RTCPeerConnection;
      const hasWebSocket = !!window.WebSocket;

      console.log("Browser support check:", {
        getUserMedia: hasGetUserMedia,
        RTCPeerConnection: hasRTCPeerConnection,
        WebSocket: hasWebSocket,
      });

      setIsSupported(hasGetUserMedia && hasRTCPeerConnection && hasWebSocket);
    } catch (error) {
      console.error("Error checking browser support:", error);
      setIsSupported(false);
    }
  };

  if (isSupported === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            Checking browser compatibility...
          </p>
        </div>
      </div>
    );
  }

  if (!isSupported) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
          <AlertTriangle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Browser Not Supported
          </h2>
          <p className="text-gray-600 mb-6">
            Your browser doesn't support the features required for video
            calling. Please use one of the supported browsers:
          </p>

          <div className="space-y-3 mb-6">
            <div className="flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-lg">
              <Chrome className="w-6 h-6 text-blue-600" />
              <span className="font-medium">Google Chrome</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-lg">
              <Globe className="w-6 h-6 text-orange-600" />
              <span className="font-medium">Mozilla Firefox</span>
            </div>
            <div className="flex items-center justify-center gap-3 p-3 border border-gray-200 rounded-lg">
              <Globe className="w-6 h-6 text-blue-700" />
              <span className="font-medium">Microsoft Edge</span>
            </div>
          </div>

          <div className="text-sm text-gray-500">
            <p>
              Make sure your browser is up to date and has access to camera and
              microphone.
            </p>
          </div>

          <button
            onClick={() => window.location.reload()}
            className="mt-6 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
