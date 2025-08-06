"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Camera,
  Mic,
  CameraOff,
  MicOff,
  Settings,
  Monitor,
  User,
  Video,
  AudioLines,
  X,
} from "lucide-react";

interface JoinMeetingSettingsProps {
  roomId: string;
  currentUser: any;
  onJoinMeeting: (settings: JoinMeetingOptions) => void;
  onCancel: () => void;
}

interface JoinMeetingOptions {
  videoEnabled: boolean;
  audioEnabled: boolean;
  userName?: string;
}

interface MediaDevice {
  deviceId: string;
  label: string;
}

export function JoinMeetingSettings({
  roomId,
  currentUser,
  onJoinMeeting,
  onCancel,
}: JoinMeetingSettingsProps) {
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [userName, setUserName] = useState(currentUser?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDevice[]>([]);
  const [audioDevices, setAudioDevices] = useState<MediaDevice[]>([]);
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    initializePreview();
    loadDevices();

    return () => {
      // Cleanup preview stream when component unmounts
      if (previewStream) {
        previewStream.getTracks().forEach((track) => {
          track.stop();
          track.enabled = false;
        });
      }
    };
  }, []);

  useEffect(() => {
    if (previewStream && videoRef.current) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  const initializePreview = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled,
      });

      setPreviewStream(stream);
      setError(null);
    } catch (error) {
      console.error("Error initializing preview:", error);
      setError("Unable to access camera/microphone. Please check permissions.");
    }
  };

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const videoDevs = devices
        .filter((device) => device.kind === "videoinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Camera ${device.deviceId.slice(0, 8)}`,
        }));

      const audioDevs = devices
        .filter((device) => device.kind === "audioinput")
        .map((device) => ({
          deviceId: device.deviceId,
          label: device.label || `Microphone ${device.deviceId.slice(0, 8)}`,
        }));

      setVideoDevices(videoDevs);
      setAudioDevices(audioDevs);

      // Set default devices
      if (videoDevs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoDevs[0].deviceId);
      }
      if (audioDevs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioDevs[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  const updatePreviewStream = async () => {
    if (previewStream) {
      previewStream.getTracks().forEach((track) => track.stop());
    }

    try {
      const constraints: MediaStreamConstraints = {};

      if (videoEnabled) {
        constraints.video = selectedVideoDevice
          ? { deviceId: { exact: selectedVideoDevice } }
          : true;
      }

      if (audioEnabled) {
        constraints.audio = selectedAudioDevice
          ? { deviceId: { exact: selectedAudioDevice } }
          : true;
      }

      if (constraints.video || constraints.audio) {
        const newStream = await navigator.mediaDevices.getUserMedia(
          constraints
        );
        setPreviewStream(newStream);
      } else {
        setPreviewStream(null);
      }

      setError(null);
    } catch (error) {
      console.error("Error updating preview:", error);
      setError("Unable to access selected devices.");
    }
  };

  useEffect(() => {
    updatePreviewStream();
  }, [videoEnabled, audioEnabled, selectedVideoDevice, selectedAudioDevice]);

  const handleJoinMeeting = async () => {
    if (!userName.trim()) {
      setError("Please enter your name");
      return;
    }

    setIsLoading(true);

    try {
      // Stop preview stream as it will be recreated in meeting
      if (previewStream) {
        previewStream.getTracks().forEach((track) => track.stop());
        setPreviewStream(null);
      }

      onJoinMeeting({
        videoEnabled,
        audioEnabled,
        userName: userName.trim(),
      });
    } catch (error) {
      console.error("Error joining meeting:", error);
      setError("Failed to join meeting. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex items-center justify-center p-6">
      <div className="bg-gray-800/95 backdrop-blur-lg rounded-3xl border border-gray-600/50 shadow-2xl max-w-4xl w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-600/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center">
                <Video className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Join Meeting</h1>
                <p className="text-gray-400">Room: {roomId}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Video Preview */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Camera Preview
              </h3>

              <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-600/50">
                {videoEnabled && previewStream ? (
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <CameraOff className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                      <p className="text-gray-400">Camera is off</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Media Controls */}
              <div className="flex items-center justify-center gap-4">
                <button
                  onClick={() => setVideoEnabled(!videoEnabled)}
                  className={`p-4 rounded-xl border transition-all ${
                    videoEnabled
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : "bg-red-500/20 border-red-500/50 text-red-400"
                  }`}
                >
                  {videoEnabled ? (
                    <Camera className="w-6 h-6" />
                  ) : (
                    <CameraOff className="w-6 h-6" />
                  )}
                </button>

                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-4 rounded-xl border transition-all ${
                    audioEnabled
                      ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                      : "bg-red-500/20 border-red-500/50 text-red-400"
                  }`}
                >
                  {audioEnabled ? (
                    <Mic className="w-6 h-6" />
                  ) : (
                    <MicOff className="w-6 h-6" />
                  )}
                </button>
              </div>
            </div>

            {/* Settings Panel */}
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Meeting Settings
              </h3>

              {/* Name Input */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  <User className="w-4 h-4 inline mr-2" />
                  Your Name
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your name"
                />
              </div>

              {/* Device Selection */}
              {videoDevices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Camera className="w-4 h-4 inline mr-2" />
                    Camera
                  </label>
                  <select
                    value={selectedVideoDevice}
                    onChange={(e) => setSelectedVideoDevice(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {videoDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {audioDevices.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <AudioLines className="w-4 h-4 inline mr-2" />
                    Microphone
                  </label>
                  <select
                    value={selectedAudioDevice}
                    onChange={(e) => setSelectedAudioDevice(e.target.value)}
                    className="w-full px-4 py-3 bg-gray-700/50 border border-gray-600/50 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {audioDevices.map((device) => (
                      <option key={device.deviceId} value={device.deviceId}>
                        {device.label}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="p-4 bg-red-500/20 border border-red-500/50 rounded-lg">
                  <p className="text-red-400 text-sm">{error}</p>
                </div>
              )}

              {/* Join Button */}
              <button
                onClick={handleJoinMeeting}
                disabled={isLoading || !userName.trim()}
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 disabled:transform-none"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Joining...
                  </div>
                ) : (
                  "Join Meeting"
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
