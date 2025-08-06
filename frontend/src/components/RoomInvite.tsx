"use client";

import React, { useState } from "react";
import {
  Copy,
  Share,
  Link,
  Check,
  ExternalLink,
  X,
  UserPlus,
} from "lucide-react";
import { showToast } from "@/services/toastService";

interface RoomInviteProps {
  roomId: string;
  roomUrl?: string;
  className?: string;
  onClose?: () => void;
}

export function RoomInvite({
  roomId,
  roomUrl,
  className = "",
  onClose,
}: RoomInviteProps) {
  const [copied, setCopied] = useState(false);
  const [showInvite, setShowInvite] = useState(false);

  const meetingUrl = roomUrl || `${window.location.origin}/meeting/${roomId}`;

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(meetingUrl);
      setCopied(true);
      showToast.linkCopied();
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy:", error);
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = meetingUrl;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopied(true);
      showToast.linkCopied();
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Join Video Meeting",
          text: `Join our video meeting room: ${roomId}`,
          url: meetingUrl,
        });
        showToast.success("Meeting invitation shared! 📤", {
          autoClose: 3000,
        });
      } catch (error) {
        console.error("Error sharing:", error);
        // Fallback to copy if sharing fails
        handleCopyLink();
      }
    } else {
      // Fallback for browsers without share API
      handleCopyLink();
    }
  };

  return (
    <div className={`relative ${className}`}>
      {onClose ? (
        // Popup mode
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="bg-gray-700/80 px-4 py-3 border-b border-gray-600/50 rounded-t-2xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-cyan-500/30 rounded-lg flex items-center justify-center">
                  <UserPlus className="w-3 h-3 text-cyan-400" />
                </div>
                <h3 className="font-semibold text-white text-sm">
                  Invite Others
                </h3>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 hover:bg-gray-600/50 rounded-lg transition-all duration-200 group"
              >
                <X className="w-4 h-4 text-gray-400 group-hover:text-white" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 p-4 space-y-4 bg-gray-800/60">
            {/* Room ID Section */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">
                Meeting ID
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700/80 border border-gray-600/50 rounded-lg px-3 py-2">
                  <code className="text-white font-mono text-lg tracking-wider">
                    {roomId}
                  </code>
                </div>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(roomId);
                    showToast.success("Meeting ID copied!");
                  }}
                  className="p-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/50 rounded-lg transition-colors"
                >
                  <Copy className="w-4 h-4 text-cyan-400" />
                </button>
              </div>
            </div>

            {/* Meeting Link Section */}
            <div>
              <p className="text-sm font-medium text-gray-300 mb-3">
                Meeting Link
              </p>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700/80 border border-gray-600/50 rounded-lg px-3 py-2">
                  <div className="text-white text-xs truncate">
                    {meetingUrl}
                  </div>
                </div>
                <button
                  onClick={handleCopyLink}
                  className={`p-2 border rounded-lg transition-all ${
                    copied
                      ? "bg-green-500/20 border-green-500/50"
                      : "bg-cyan-500/20 hover:bg-cyan-500/30 border-cyan-500/50"
                  }`}
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4 text-cyan-400" />
                  )}
                </button>
              </div>
            </div>

            {/* Share Button */}
            <div className="pt-2">
              <button
                onClick={handleShare}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Share className="w-4 h-4" />
                Share Invitation
              </button>
            </div>

            {/* Instructions */}
            <div className="bg-gray-700/50 rounded-lg p-3 border border-gray-600/30">
              <p className="text-xs text-gray-400 leading-relaxed">
                Share the Meeting ID or Link with participants to invite them to
                join this meeting.
              </p>
            </div>
          </div>
        </div>
      ) : (
        // Normal mode
        <>
          {/* Modern invite button */}
          <button
            onClick={() => setShowInvite(!showInvite)}
            className="flex items-center gap-3 px-6 py-3 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl text-white hover:bg-white/20 hover:border-white/30 transition-all duration-300 group shadow-lg"
          >
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
              <Share className="w-4 h-4 text-white" />
            </div>
            <span className="font-medium">Invite Others</span>
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
          </button>

          {/* Modern invite panel */}
          {showInvite && (
            <div className="absolute top-full mt-4 left-1/2 transform -translate-x-1/2 bg-black/80 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-6 w-96 z-50">
              {/* Header */}
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-2xl mx-auto mb-4 flex items-center justify-center">
                  <Share className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">
                  Invite to Meeting
                </h3>
                <p className="text-gray-400 text-sm">
                  Share this room with others to join the call
                </p>
              </div>

              <div className="space-y-6">
                {/* Room ID Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <div className="flex items-center gap-2">
                      <Link className="w-4 h-4" />
                      Meeting ID
                    </div>
                  </label>
                  <div className="relative">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 font-mono text-lg text-center text-white tracking-wider">
                      {roomId}
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                      title="Copy meeting ID"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-300 group-hover:text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Meeting URL Section */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-3">
                    <div className="flex items-center gap-2">
                      <ExternalLink className="w-4 h-4" />
                      Direct Link
                    </div>
                  </label>
                  <div className="relative">
                    <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 text-sm text-white overflow-hidden">
                      <div className="truncate">{meetingUrl}</div>
                    </div>
                    <button
                      onClick={handleCopyLink}
                      className="absolute top-1/2 right-4 transform -translate-y-1/2 p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-all duration-200 group"
                      title="Copy meeting link"
                    >
                      {copied ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <Copy className="w-5 h-5 text-gray-300 group-hover:text-white" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Action buttons */}
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={handleShare}
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95 shadow-lg"
                  >
                    <Share className="w-4 h-4" />
                    <span className="font-medium">Share</span>
                  </button>

                  <button
                    onClick={() =>
                      window.open(
                        `mailto:?subject=Join our video meeting&body=Join our video meeting: ${meetingUrl}`,
                        "_blank"
                      )
                    }
                    className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 border border-white/20 hover:border-white/30 text-white rounded-2xl transition-all duration-300 hover:scale-105 active:scale-95"
                  >
                    <ExternalLink className="w-4 h-4" />
                    <span className="font-medium">Email</span>
                  </button>
                </div>

                {/* Instructions */}
                <div className="bg-white/5 backdrop-blur-md rounded-2xl p-4 border border-white/10">
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 bg-amber-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                      <span className="text-amber-400 text-sm">💡</span>
                    </div>
                    <p className="text-xs text-gray-400 leading-relaxed">
                      Participants can join by entering the Meeting ID on the
                      dashboard or clicking the direct link. No account
                      required!
                    </p>
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setShowInvite(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-xl transition-all duration-200"
              >
                <span className="text-xl">×</span>
              </button>
            </div>
          )}

          {/* Backdrop */}
          {showInvite && (
            <div
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
              onClick={() => setShowInvite(false)}
            />
          )}
        </>
      )}
    </div>
  );
}
