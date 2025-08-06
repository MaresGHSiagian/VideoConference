"use client";

import React, { useRef, useEffect, useState } from "react";
import { Participant } from "@/types";
import { Mic, MicOff, Video, VideoOff, Monitor } from "lucide-react";
import { getInitials, getAvatarGradient } from "@/utils/avatarUtils";

interface VideoTileProps {
  participant: Participant;
  stream?: MediaStream;
  isLocal?: boolean;
  className?: string;
}

export function VideoTile({
  participant,
  stream,
  isLocal = false,
  className = "",
}: VideoTileProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

  // Debug logging
  console.log(`VideoTile ${participant.name}:`, {
    isVideoOn: participant.isVideoOn,
    hasStream: !!stream,
    isVideoLoaded,
    shouldShowVideo: participant.isVideoOn && isVideoLoaded && stream,
    shouldShowAvatar:
      !participant.isVideoOn ||
      (participant.isVideoOn && (!isVideoLoaded || !stream)),
  });

  useEffect(() => {
    if (videoRef.current && stream) {
      console.log(`Setting stream for ${participant.name}:`, {
        streamId: stream.id,
        videoTracks: stream.getVideoTracks().length,
        videoEnabled: stream.getVideoTracks()[0]?.enabled,
        participantVideoOn: participant.isVideoOn,
      });

      videoRef.current.srcObject = stream;
      videoRef.current.onloadedmetadata = () => {
        console.log(`Video metadata loaded for ${participant.name}`);
        setIsVideoLoaded(true);
      };

      videoRef.current.onerror = (error) => {
        console.error(`Video error for ${participant.name}:`, error);
      };
    } else {
      console.log(`No stream available for ${participant.name}:`, {
        hasVideoRef: !!videoRef.current,
        hasStream: !!stream,
        participantVideoOn: participant.isVideoOn,
      });
    }
  }, [stream, participant.name, participant.isVideoOn]);

  return (
    <div
      className={`relative bg-gray-900 rounded-lg overflow-hidden ${className}`}
    >
      {/* Video Element - always present for stream setup but conditionally visible */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isLocal}
        className={`w-full h-full object-cover ${
          participant.isVideoOn && isVideoLoaded && stream ? "block" : "hidden"
        }`}
        onPlay={() => console.log(`Video playing for ${participant.name}`)}
        onPause={() => console.log(`Video paused for ${participant.name}`)}
      />

      {/* Avatar fallback - show when video is OFF or video failed to load */}
      {(!participant.isVideoOn ||
        (participant.isVideoOn && (!isVideoLoaded || !stream))) && (
        <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-black z-20">
          {/* Animated background */}
          <div className="absolute inset-0 opacity-30">
            <div className="absolute top-0 left-0 w-32 h-32 bg-gradient-to-r from-blue-400/20 to-purple-400/20 rounded-full animate-pulse"></div>
            <div className="absolute bottom-0 right-0 w-24 h-24 bg-gradient-to-r from-pink-400/20 to-orange-400/20 rounded-full animate-pulse delay-1000"></div>
          </div>

          {/* Main avatar circle */}
          <div className="relative z-30">
            {/* Outer glow ring */}
            <div
              className="absolute inset-0 rounded-full blur-xl opacity-80 scale-125 animate-pulse"
              style={{
                background: `linear-gradient(45deg, ${getAvatarGradient(
                  participant.name
                )})`,
              }}
            ></div>

            {/* Main avatar */}
            <div
              className="relative w-24 h-24 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-2xl border-4 border-white/30 backdrop-blur-sm"
              style={{
                background: `linear-gradient(135deg, ${getAvatarGradient(
                  participant.name
                )})`,
              }}
            >
              {/* Inner shine effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-white/40 to-transparent rounded-full"></div>

              {/* Initials */}
              <span className="relative z-10 drop-shadow-2xl text-white font-extrabold">
                {getInitials(participant.name)}
              </span>
            </div>

            {/* Rotating border */}
            <div
              className="absolute inset-0 w-24 h-24 rounded-full animate-spin-slow opacity-70"
              style={{
                background: `conic-gradient(from 0deg, transparent, rgba(255, 255, 255, 0.6), transparent)`,
                maskImage:
                  "radial-gradient(circle, transparent 88%, white 88%)",
                WebkitMaskImage:
                  "radial-gradient(circle, transparent 88%, white 88%)",
              }}
            ></div>
          </div>

          {/* Participant name below avatar */}
          <div className="absolute bottom-16 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-medium border border-white/30 z-40">
            {participant.name}
            {isLocal && " (You)"}
          </div>

          {/* Camera off indicator */}
          <div className="absolute top-6 left-1/2 transform -translate-x-1/2 bg-red-500/30 backdrop-blur-sm border border-red-500/50 text-red-200 px-4 py-2 rounded-full text-sm font-medium flex items-center gap-2 z-40">
            <VideoOff size={16} />
            Camera Off
          </div>

          {/* Debug info */}
          <div className="absolute top-2 right-2 bg-blue-500/80 text-white px-2 py-1 rounded text-xs z-40">
            V:{participant.isVideoOn ? "ON" : "OFF"} | L:
            {isVideoLoaded ? "YES" : "NO"} | S:{stream ? "YES" : "NO"}
          </div>
        </div>
      )}

      {/* Screen sharing indicator */}
      {participant.isScreenSharing && (
        <div className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded text-xs flex items-center gap-1">
          <Monitor size={12} />
          Screen
        </div>
      )}

      {/* Media status indicators */}
      <div className="absolute top-2 left-2 flex gap-1 z-40">
        {/* Audio status */}
        <div
          className={`p-1 rounded ${
            participant.isAudioOn ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {participant.isAudioOn ? (
            <Mic size={12} className="text-white" />
          ) : (
            <MicOff size={12} className="text-white" />
          )}
        </div>

        {/* Video status */}
        <div
          className={`p-1 rounded ${
            participant.isVideoOn ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {participant.isVideoOn ? (
            <Video size={12} className="text-white" />
          ) : (
            <VideoOff size={12} className="text-white" />
          )}
        </div>
      </div>

      {/* Participant name overlay - only show when video is ON */}
      {participant.isVideoOn && isVideoLoaded && stream && (
        <div className="absolute bottom-2 left-2 bg-black bg-opacity-60 text-white px-2 py-1 rounded text-sm z-40">
          {participant.name}
          {isLocal && " (You)"}
        </div>
      )}

      {/* Border color - subtle border for video tiles */}
      <div className="absolute inset-0 border-2 border-gray-600/30 rounded-lg pointer-events-none z-50" />

      {/* Custom styles for animations */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
}
