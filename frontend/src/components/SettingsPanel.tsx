"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  X,
  Camera,
  Mic,
  Monitor,
  Volume2,
  Settings,
  Palette,
  Upload,
  Trash2,
} from "lucide-react";
import { backgroundEffectService } from "@/services/backgroundEffectService";

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  isVideoOn: boolean;
  isAudioOn: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  localStream?: MediaStream | null;
  className?: string;
}

export function SettingsPanel({
  isOpen,
  onClose,
  isVideoOn,
  isAudioOn,
  onToggleVideo,
  onToggleAudio,
  localStream,
  className = "",
}: SettingsPanelProps) {
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([]);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedAudioDevice, setSelectedAudioDevice] = useState<string>("");
  const [selectedVideoDevice, setSelectedVideoDevice] = useState<string>("");
  const [volume, setVolume] = useState<number>(50);
  const [microphoneGain, setMicrophoneGain] = useState<number>(50);
  const [activeTab, setActiveTab] = useState<"media" | "background">("media");
  const [selectedBackground, setSelectedBackground] = useState<string>("none");
  const [customBackgrounds, setCustomBackgrounds] = useState<any[]>([]);
  const [isApplyingBackground, setIsApplyingBackground] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load available devices
  useEffect(() => {
    if (isOpen) {
      loadDevices();
      setupVideoPreview();
    }
    return () => {
      backgroundEffectService.stopEffect();
    };
  }, [isOpen]);

  useEffect(() => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  const loadDevices = async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();

      const audioInputs = devices.filter(
        (device) => device.kind === "audioinput"
      );
      const videoInputs = devices.filter(
        (device) => device.kind === "videoinput"
      );

      setAudioDevices(audioInputs);
      setVideoDevices(videoInputs);

      // Set default selections
      if (audioInputs.length > 0 && !selectedAudioDevice) {
        setSelectedAudioDevice(audioInputs[0].deviceId);
      }
      if (videoInputs.length > 0 && !selectedVideoDevice) {
        setSelectedVideoDevice(videoInputs[0].deviceId);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
    }
  };

  const setupVideoPreview = () => {
    if (localStream && videoRef.current) {
      videoRef.current.srcObject = localStream;
    }
  };

  const handleBackgroundSelect = async (backgroundId: string) => {
    try {
      setIsApplyingBackground(true);
      setSelectedBackground(backgroundId);

      if (backgroundId === "none") {
        backgroundEffectService.stopEffect();
      } else if (canvasRef.current && videoRef.current) {
        await backgroundEffectService.applyEffect(
          backgroundId,
          canvasRef.current,
          videoRef.current
        );
      }
    } catch (error) {
      console.error("Error applying background:", error);
    } finally {
      setIsApplyingBackground(false);
    }
  };

  const handleCustomBackgroundUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        const customBackground = {
          id: `custom-${Date.now()}`,
          name: file.name,
          type: "image",
          value: imageUrl,
          isCustom: true,
        };

        setCustomBackgrounds((prev) => [...prev, customBackground]);
        handleBackgroundSelect(customBackground.id);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeCustomBackground = (backgroundId: string) => {
    setCustomBackgrounds((prev) => prev.filter((bg) => bg.id !== backgroundId));
    if (selectedBackground === backgroundId) {
      handleBackgroundSelect("none");
    }
  };

  const handleDeviceChange = async (
    deviceId: string,
    type: "audio" | "video"
  ) => {
    try {
      if (type === "audio") {
        setSelectedAudioDevice(deviceId);
        // Here you would implement device switching logic
        // This would require updating the WebRTC service
      } else {
        setSelectedVideoDevice(deviceId);
        // Here you would implement device switching logic
        // This would require updating the WebRTC service
      }
    } catch (error) {
      console.error(`Error changing ${type} device:`, error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`
        fixed right-6 top-20 w-96 h-auto max-h-[80vh]
        transform transition-all duration-300 ease-in-out z-50
        ${
          isOpen
            ? "translate-x-0 opacity-100 scale-100"
            : "translate-x-8 opacity-0 scale-95"
        }
        ${className}
      `}
    >
      <div className="bg-gray-800/95 backdrop-blur-lg rounded-2xl border border-gray-600/50 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-600/50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Settings className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">Settings</h3>
              <p className="text-gray-400 text-sm">Meeting Preferences</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg bg-gray-700/50 hover:bg-gray-600/50 flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4 text-gray-400" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-600/50">
          <button
            onClick={() => setActiveTab("media")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "media"
                ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/10"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Media & Devices
          </button>
          <button
            onClick={() => setActiveTab("background")}
            className={`flex-1 py-3 px-4 text-sm font-medium transition-colors ${
              activeTab === "background"
                ? "text-blue-400 border-b-2 border-blue-500 bg-blue-500/10"
                : "text-gray-400 hover:text-gray-300"
            }`}
          >
            Background
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
          {activeTab === "media" && (
            <>
              {/* Audio Settings */}
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Mic className="w-4 h-4 text-green-400" />
                  Audio Settings
                </h4>

                {/* Microphone Control */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Microphone</span>
                    <button
                      onClick={onToggleAudio}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isAudioOn
                          ? "bg-green-500/20 text-green-400 border border-green-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isAudioOn ? "ON" : "OFF"}
                    </button>
                  </div>

                  {/* Microphone Device Selection */}
                  <div className="space-y-2">
                    <label className="text-gray-400 text-xs">
                      Microphone Device
                    </label>
                    <select
                      value={selectedAudioDevice}
                      onChange={(e) =>
                        handleDeviceChange(e.target.value, "audio")
                      }
                      className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    >
                      {audioDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label ||
                            `Microphone ${device.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Microphone Gain */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-gray-400 text-xs">
                        Microphone Gain
                      </label>
                      <span className="text-gray-300 text-xs">
                        {microphoneGain}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={microphoneGain}
                      onChange={(e) =>
                        setMicrophoneGain(parseInt(e.target.value))
                      }
                      className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                    />
                  </div>
                </div>
              </div>

              {/* Video Settings */}
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-400" />
                  Video Settings
                </h4>

                {/* Camera Control */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-300 text-sm">Camera</span>
                    <button
                      onClick={onToggleVideo}
                      className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                        isVideoOn
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-red-500/20 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {isVideoOn ? "ON" : "OFF"}
                    </button>
                  </div>

                  {/* Camera Device Selection */}
                  <div className="space-y-2">
                    <label className="text-gray-400 text-xs">
                      Camera Device
                    </label>
                    <select
                      value={selectedVideoDevice}
                      onChange={(e) =>
                        handleDeviceChange(e.target.value, "video")
                      }
                      className="w-full bg-gray-700/50 border border-gray-600/50 rounded-lg px-3 py-2 text-white text-sm focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
                    >
                      {videoDevices.map((device) => (
                        <option key={device.deviceId} value={device.deviceId}>
                          {device.label ||
                            `Camera ${device.deviceId.slice(0, 8)}`}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Speaker Settings */}
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Volume2 className="w-4 h-4 text-purple-400" />
                  Speaker Settings
                </h4>

                {/* Volume Control */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-gray-400 text-xs">Volume</label>
                    <span className="text-gray-300 text-xs">{volume}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={volume}
                    onChange={(e) => setVolume(parseInt(e.target.value))}
                    className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer slider"
                  />
                </div>
              </div>

              {/* Meeting Preferences */}
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-yellow-400" />
                  Meeting Preferences
                </h4>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-300 text-sm">
                        Auto-mute on join
                      </span>
                      <p className="text-gray-500 text-xs">
                        Start with microphone muted
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 text-blue-500 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-300 text-sm">
                        Camera off on join
                      </span>
                      <p className="text-gray-500 text-xs">
                        Start with camera disabled
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      className="rounded border-gray-600 text-blue-500 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-300 text-sm">
                        Echo cancellation
                      </span>
                      <p className="text-gray-500 text-xs">
                        Reduce echo and feedback
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-600 text-blue-500 focus:ring-blue-500/50"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-gray-300 text-sm">
                        Noise suppression
                      </span>
                      <p className="text-gray-500 text-xs">
                        Filter background noise
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      defaultChecked
                      className="rounded border-gray-600 text-blue-500 focus:ring-blue-500/50"
                    />
                  </div>
                </div>
              </div>
            </>
          )}

          {activeTab === "background" && (
            <div className="space-y-6">
              {/* Video Preview */}
              <div className="space-y-4">
                <h4 className="text-white font-medium flex items-center gap-2">
                  <Camera className="w-4 h-4 text-blue-400" />
                  Video Preview
                </h4>

                <div className="relative aspect-video bg-gray-900 rounded-xl overflow-hidden border border-gray-600/50">
                  {isVideoOn && localStream ? (
                    <>
                      <video
                        ref={videoRef}
                        autoPlay
                        muted
                        playsInline
                        className="w-full h-full object-cover"
                      />
                      <canvas
                        ref={canvasRef}
                        className="absolute inset-0 w-full h-full pointer-events-none"
                        style={{
                          display:
                            selectedBackground === "none" ? "none" : "block",
                        }}
                      />
                    </>
                  ) : (
                    <div className="flex items-center justify-center h-full">
                      <div className="text-center">
                        <Camera className="w-12 h-12 text-gray-500 mx-auto mb-2" />
                        <p className="text-gray-400">Camera is off</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Background Options */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h4 className="text-white font-medium flex items-center gap-2">
                    <Palette className="w-4 h-4 text-purple-400" />
                    Background Effects
                  </h4>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex items-center gap-2 px-3 py-1 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg text-xs font-medium hover:bg-blue-500/30 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    Upload
                  </button>
                </div>

                {/* Background Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    ...backgroundEffectService.getAvailableEffects(),
                    ...customBackgrounds,
                  ].map((background) => (
                    <div key={background.id} className="relative">
                      <button
                        onClick={() => handleBackgroundSelect(background.id)}
                        disabled={isApplyingBackground}
                        className={`w-full aspect-video rounded-lg border-2 transition-all flex items-center justify-center text-xs font-medium relative overflow-hidden ${
                          selectedBackground === background.id
                            ? "border-blue-500 bg-blue-500/20 text-blue-400"
                            : "border-gray-600/50 hover:border-gray-500 bg-gray-800/50 text-gray-300"
                        } ${
                          isApplyingBackground
                            ? "opacity-50 cursor-not-allowed"
                            : ""
                        }`}
                        style={{
                          background:
                            background.type === "gradient" && background.value
                              ? background.value
                              : background.type === "image" && background.value
                              ? `url(${background.value})`
                              : undefined,
                          backgroundSize: "cover",
                          backgroundPosition: "center",
                        }}
                      >
                        {background.type === "none" && (
                          <span className="text-gray-400">No Background</span>
                        )}
                        {background.type === "blur" && (
                          <span className="text-gray-400">Blur</span>
                        )}
                        {background.type === "gradient" && (
                          <span className="text-white font-medium drop-shadow-lg">
                            {background.name}
                          </span>
                        )}
                        {background.type === "image" &&
                          background.value?.startsWith("data:") && (
                            <span className="text-white font-medium drop-shadow-lg text-center px-2">
                              {background.name}
                            </span>
                          )}
                      </button>

                      {background.isCustom && (
                        <button
                          onClick={() => removeCustomBackground(background.id)}
                          className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center text-xs transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {/* Upload Input */}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleCustomBackgroundUpload}
                  className="hidden"
                />

                {/* Status */}
                {isApplyingBackground && (
                  <div className="flex items-center justify-center gap-2 py-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                    <span className="text-blue-400 text-sm">
                      Applying background...
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-600/50">
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 border border-blue-500/30 rounded-lg py-2 px-4 text-sm font-medium transition-colors"
            >
              Apply Settings
            </button>
            <button
              onClick={onClose}
              className="bg-gray-700/50 hover:bg-gray-600/50 text-gray-300 rounded-lg py-2 px-4 text-sm font-medium transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Custom slider styles */}
      <style jsx>{`
        .slider::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }

        .slider::-moz-range-thumb {
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #3b82f6;
          cursor: pointer;
          border: 2px solid #1e293b;
        }
      `}</style>
    </div>
  );
}
