"use client";

import React, { useState, useEffect } from "react";
import { Camera, Mic, AlertCircle, CheckCircle, Settings } from "lucide-react";

interface PermissionCheckProps {
  onPermissionsGranted: () => void;
  onPermissionsDenied: (error: string) => void;
}

interface PermissionStatus {
  camera: "granted" | "denied" | "prompt" | "checking";
  microphone: "granted" | "denied" | "prompt" | "checking";
}

export function PermissionCheck({
  onPermissionsGranted,
  onPermissionsDenied,
}: PermissionCheckProps) {
  const [permissions, setPermissions] = useState<PermissionStatus>({
    camera: "checking",
    microphone: "checking",
  });
  const [isRequesting, setIsRequesting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkInitialPermissions();
    return () => {
      // Cleanup stream when component unmounts
      console.log("PermissionCheck cleanup: Stopping test streams");
      if (stream) {
        stream.getTracks().forEach((track) => {
          console.log(`Stopping test ${track.kind} track:`, track.id);
          track.stop();
          track.enabled = false;
        });
      }
    };
  }, [stream]); // Add stream to dependencies to ensure cleanup when stream changes

  const checkInitialPermissions = async () => {
    try {
      // Check if permissions API is available
      if (navigator.permissions) {
        const cameraPermission = await navigator.permissions.query({
          name: "camera" as PermissionName,
        });
        const micPermission = await navigator.permissions.query({
          name: "microphone" as PermissionName,
        });

        setPermissions({
          camera: cameraPermission.state as PermissionState,
          microphone: micPermission.state as PermissionState,
        });

        // If both permissions are already granted, proceed
        if (
          cameraPermission.state === "granted" &&
          micPermission.state === "granted"
        ) {
          await testMediaDevices();
        }
      } else {
        // Fallback for browsers without permissions API
        setPermissions({
          camera: "prompt",
          microphone: "prompt",
        });
      }
    } catch (error) {
      console.error("Error checking permissions:", error);
      setPermissions({
        camera: "prompt",
        microphone: "prompt",
      });
    }
  };

  const testMediaDevices = async () => {
    try {
      // Clean up any previous stream first
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      }

      const testStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setStream(testStream);
      setPermissions({
        camera: "granted",
        microphone: "granted",
      });

      // Auto proceed if permissions are granted
      setTimeout(() => {
        // Clean up test stream before proceeding
        testStream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        onPermissionsGranted();
      }, 1000);
    } catch (error: unknown) {
      console.error("Error accessing media devices:", error);
      handleMediaError(error as Error);
    }
  };

  const requestPermissions = async () => {
    setIsRequesting(true);
    setError(null);

    try {
      // Clean up any previous stream first
      if (stream) {
        stream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      }

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: "user",
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      setStream(newStream);
      setPermissions({
        camera: "granted",
        microphone: "granted",
      });

      // Wait a moment to show success state
      setTimeout(() => {
        // Clean up test stream before proceeding
        newStream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
        onPermissionsGranted();
      }, 1000);
    } catch (error: unknown) {
      console.error("Permission request failed:", error);
      handleMediaError(error as Error);
    } finally {
      setIsRequesting(false);
    }
  };

  const handleMediaError = (error: Error) => {
    let errorMessage = "Failed to access camera and microphone.";

    if (error.name === "NotAllowedError") {
      errorMessage =
        "Camera and microphone access denied. Please allow access and try again.";
      setPermissions({
        camera: "denied",
        microphone: "denied",
      });
    } else if (error.name === "NotFoundError") {
      errorMessage =
        "No camera or microphone found. Please connect devices and try again.";
    } else if (error.name === "NotReadableError") {
      errorMessage =
        "Camera or microphone is already in use by another application.";
    } else if (error.name === "OverconstrainedError") {
      errorMessage = "Camera or microphone constraints cannot be satisfied.";
    }

    setError(errorMessage);
    onPermissionsDenied(errorMessage);
  };

  const getPermissionIcon = (status: string) => {
    switch (status) {
      case "granted":
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case "denied":
        return <AlertCircle className="w-6 h-6 text-red-500" />;
      default:
        return <AlertCircle className="w-6 h-6 text-yellow-500" />;
    }
  };

  const getPermissionText = (status: string) => {
    switch (status) {
      case "granted":
        return "Granted";
      case "denied":
        return "Denied";
      case "checking":
        return "Checking...";
      default:
        return "Required";
    }
  };

  const allPermissionsGranted =
    permissions.camera === "granted" && permissions.microphone === "granted";
  const hasPermissionDenied =
    permissions.camera === "denied" || permissions.microphone === "denied";

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <Settings className="w-8 h-8 text-white" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Camera & Microphone Access
          </h2>
          <p className="text-gray-600">
            Please allow access to your camera and microphone to join the
            meeting.
          </p>
        </div>

        <div className="space-y-4 mb-8">
          {/* Camera Permission */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Camera className="w-6 h-6 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Camera</div>
                <div className="text-sm text-gray-500">
                  Required for video calls
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionIcon(permissions.camera)}
              <span className="text-sm font-medium">
                {getPermissionText(permissions.camera)}
              </span>
            </div>
          </div>

          {/* Microphone Permission */}
          <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
            <div className="flex items-center gap-3">
              <Mic className="w-6 h-6 text-gray-600" />
              <div>
                <div className="font-medium text-gray-900">Microphone</div>
                <div className="text-sm text-gray-500">
                  Required for audio calls
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {getPermissionIcon(permissions.microphone)}
              <span className="text-sm font-medium">
                {getPermissionText(permissions.microphone)}
              </span>
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
              <div>
                <div className="font-medium text-red-800">Permission Error</div>
                <div className="text-sm text-red-600 mt-1">{error}</div>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-3">
          {!allPermissionsGranted && !hasPermissionDenied && (
            <button
              onClick={requestPermissions}
              disabled={isRequesting}
              className="w-full px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {isRequesting ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  Requesting Access...
                </>
              ) : (
                "Allow Camera & Microphone"
              )}
            </button>
          )}

          {allPermissionsGranted && (
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 text-green-600 mb-4">
                <CheckCircle className="w-6 h-6" />
                <span className="font-medium">Permissions Granted!</span>
              </div>
              <div className="text-sm text-gray-600">Joining meeting...</div>
            </div>
          )}

          {hasPermissionDenied && (
            <div className="text-center">
              <div className="text-sm text-gray-600 mb-4">
                Please enable camera and microphone in your browser settings and
                refresh the page.
              </div>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          )}
        </div>

        <div className="mt-6 text-center">
          <div className="text-xs text-gray-500">
            Your privacy is important. We only access your camera and microphone
            during meetings.
          </div>
        </div>
      </div>
    </div>
  );
}
