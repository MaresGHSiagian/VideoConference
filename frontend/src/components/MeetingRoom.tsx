"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VideoGrid } from "./VideoGrid";
import { ChatPanel } from "./ChatPanel";
import { Toolbar } from "./Toolbar";
import { PermissionCheck } from "./PermissionCheck";
import { JoinMeetingSettings } from "./JoinMeetingSettings";
import { SettingsPanel } from "./SettingsPanel";
import { RoomInvite } from "./RoomInvite";
import { useMeeting } from "@/context/MeetingContext";
import { useAuth } from "@/context/AuthContext";
import { getInitials, getAvatarGradient } from "@/utils/avatarUtils";
import {
  Users,
  Settings,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
} from "lucide-react";
import { showToast } from "@/services/toastService";

interface MeetingRoomProps {
  roomId: string;
}

interface JoinMeetingOptions {
  videoEnabled: boolean;
  audioEnabled: boolean;
  userName?: string;
}

export function MeetingRoom({ roomId }: MeetingRoomProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();
  const {
    state,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    toggleChat,
    sendMessage,
  } = useMeeting();

  const [isInitialized, setIsInitialized] = useState(false);
  const [showJoinSettings, setShowJoinSettings] = useState(true);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [showInvitePopup, setShowInvitePopup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    // Wait for auth to complete before checking user
    if (!isLoading) {
      setAuthChecked(true);
      if (!user) {
        const token = localStorage.getItem("access_token");
        const storedUser = localStorage.getItem("user");

        // If we have stored auth data, don't redirect immediately
        if (!token || !storedUser) {
          console.log("No auth data found, redirecting to login");
          router.push("/login");
        }
      }
    }
  }, [user, isLoading, router]);

  const handleJoinMeetingWithSettings = async (options: JoinMeetingOptions) => {
    setShowJoinSettings(false);
    setPermissionError(null);

    // Update user data with custom name if provided
    const currentUser =
      user || JSON.parse(localStorage.getItem("user") || "{}");

    if (options.userName && options.userName !== currentUser.name) {
      currentUser.name = options.userName;
      // Update localStorage if needed
      localStorage.setItem("user", JSON.stringify(currentUser));
    }

    if (currentUser && currentUser.id && roomId && !isInitialized) {
      await initializeMeeting(currentUser, {
        videoEnabled: options.videoEnabled,
        audioEnabled: options.audioEnabled,
      });
    } else if (!currentUser || !currentUser.id) {
      console.error("No valid user data available");
      router.push("/login");
    }
  };

  const handleCancelJoin = () => {
    router.push("/dashboard");
  };

  const initializeMeeting = async (
    userData?: any,
    joinOptions?: JoinMeetingOptions
  ) => {
    const currentUser = userData || user;

    if (!currentUser) {
      router.push("/login");
      return;
    }

    const loadingToast = showToast.loading("Joining meeting...");

    try {
      console.log(
        "Initializing meeting for room:",
        roomId,
        "user:",
        currentUser.name
      );

      // Pass join options to joinRoom
      const joinRoomOptions = joinOptions
        ? {
            videoEnabled: joinOptions.videoEnabled,
            audioEnabled: joinOptions.audioEnabled,
          }
        : undefined;

      await joinRoom(roomId, currentUser, joinRoomOptions);
      setIsInitialized(true);
      console.log("Meeting initialized successfully");

      // Update loading toast to success
      showToast.update(loadingToast, {
        render: `Successfully joined meeting! 📹`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      });
    } catch (error) {
      console.error("Failed to join room:", error);

      // Dismiss loading toast
      showToast.dismiss(loadingToast);

      // Show appropriate error toast
      if (error instanceof Error) {
        if (error.message.includes("getUserMedia")) {
          showToast.permissionError(
            "Unable to access camera/microphone. Please check your permissions and try again."
          );
        } else if (error.message.includes("not supported")) {
          showToast.error(
            "Your browser does not support video calling features. Please try a different browser."
          );
        } else {
          showToast.meetingError(`Failed to join meeting: ${error.message}`);
        }
      } else {
        showToast.meetingError(
          "Failed to join meeting. Please check your connection and try again."
        );
      }

      // Redirect back to dashboard on error
      router.push("/dashboard");
    }
  };

  const handleEndCall = () => {
    showToast.info("Leaving meeting...", { autoClose: 2000 });
    leaveRoom();
    router.push("/dashboard");
  };

  // Show join settings first if not completed yet
  if (showJoinSettings && !isInitialized) {
    const currentUser =
      user || JSON.parse(localStorage.getItem("user") || "{}");

    return (
      <JoinMeetingSettings
        roomId={roomId}
        currentUser={currentUser}
        onJoinMeeting={handleJoinMeetingWithSettings}
        onCancel={handleCancelJoin}
      />
    );
  }

  // Show loading while auth is checking or meeting is initializing
  if (isLoading || !authChecked || !isInitialized) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p className="text-white text-lg">
            {isLoading
              ? "Loading..."
              : !authChecked
              ? "Checking authentication..."
              : "Joining meeting..."}
          </p>
        </div>
      </div>
    );
  }

  // Get current user data (from props or localStorage)
  const currentUser = user || JSON.parse(localStorage.getItem("user") || "{}");

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-black flex flex-col relative">
      {/* Clean animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-emerald-400 to-blue-500 rounded-full animate-pulse transform -translate-x-1/2 -translate-y-1/2"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full animate-pulse delay-1000 transform translate-x-1/2 translate-y-1/2"></div>
      </div>

      {/* Modern Header */}
      <header className="relative z-10 bg-gray-900/80 border-b border-gray-700/50 px-6 py-4">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xl">U</span>
            </div>
            <div>
              <h1 className="text-white text-xl font-bold">Umalo Meeting</h1>
              <p className="text-gray-400 text-sm">Room: {roomId}</p>
            </div>
          </div>

          {/* Meeting Info */}
          <div className="hidden md:flex items-center gap-4">
            <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-2 border border-gray-600/50">
              <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
              <span className="text-white font-medium">
                {state.participants.length} participants
              </span>
            </div>
          </div>

          {/* User info */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-3 bg-gray-800/60 rounded-xl px-4 py-2 border border-gray-600/50">
              <div className="w-10 h-10 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-sm font-bold">
                  {(currentUser?.name || "U").charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="hidden sm:block">
                <span className="text-white font-medium">
                  {currentUser?.name || "User"}
                </span>
                <span className="text-gray-400 text-sm">Host</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <div className="flex-1 flex relative z-10 p-6 gap-6">
        {/* Video Area */}
        <main className="flex-1">
          <div className="h-full bg-gray-800/40 rounded-2xl border border-gray-600/50 overflow-hidden relative">
            <VideoGrid
              participants={state.participants}
              localStream={state.localStream}
              currentUserId={currentUser?.id || ""}
              className="h-full"
            />
          </div>
        </main>

        {/* Participants Sidebar */}
        <aside className="w-80 bg-gray-800/60 rounded-2xl border border-gray-600/50 p-6">
          {/* Participants header */}
          <div className="mb-6">
            <h3 className="font-semibold text-white flex items-center gap-3">
              <div className="w-8 h-8 bg-blue-500/30 rounded-lg flex items-center justify-center">
                <Users className="w-4 h-4 text-blue-400" />
              </div>
              <span>Participants</span>
              <span className="ml-auto bg-blue-500/20 px-3 py-1 rounded-full text-sm text-blue-300">
                {state.participants.length}
              </span>
            </h3>
          </div>

          {/* Participants list */}
          <div className="space-y-3 mb-6">
            {state.participants.map((participant, index) => (
              <div
                key={participant.socketId}
                className="flex items-center gap-4 p-3 bg-gray-700/50 rounded-xl border border-gray-600/30 hover:bg-gray-700/80 transition-all"
              >
                <div className="relative">
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center relative overflow-hidden shadow-lg"
                    style={{
                      background: `linear-gradient(to right, ${getAvatarGradient(
                        participant.name
                      )})`,
                    }}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent"></div>
                    <span className="relative z-10 text-white text-sm font-bold">
                      {getInitials(participant.name)}
                    </span>
                  </div>
                  {participant.userId === (currentUser?.id || "") && (
                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 flex items-center justify-center">
                      <span className="text-xs font-bold text-gray-900">✓</span>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="font-medium text-white truncate">
                    {participant.name}
                    {participant.userId === (currentUser?.id || "") && " (You)"}
                  </div>
                  <div className="text-sm text-gray-400">
                    {participant.userId === (currentUser?.id || "")
                      ? "Host"
                      : "Participant"}
                  </div>
                </div>

                <div className="flex gap-2">
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      participant.isAudioOn
                        ? "bg-green-500/20 border border-green-500/30"
                        : "bg-red-500/20 border border-red-500/30"
                    }`}
                  >
                    {participant.isAudioOn ? (
                      <Mic className="w-3 h-3 text-green-400" />
                    ) : (
                      <MicOff className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                  <div
                    className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                      participant.isVideoOn
                        ? "bg-green-500/20 border border-green-500/30"
                        : "bg-red-500/20 border border-red-500/30"
                    }`}
                  >
                    {participant.isVideoOn ? (
                      <Video className="w-3 h-3 text-green-400" />
                    ) : (
                      <VideoOff className="w-3 h-3 text-red-400" />
                    )}
                  </div>
                </div>
              </div>
            ))}

            {state.participants.length === 0 && (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-700/50 rounded-xl flex items-center justify-center mx-auto mb-4">
                  <Users className="w-8 h-8 text-gray-400" />
                </div>
                <p className="text-gray-400 font-medium">
                  Waiting for participants...
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Share the room ID to invite others
                </p>
              </div>
            )}
          </div>

          {/* Room Invite */}
          <div className="mt-auto">
            {/* <button
              onClick={() => setShowInvitePopup(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white rounded-xl font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Users className="w-4 h-4" />
              Invite Others
            </button> */}
          </div>
        </aside>
      </div>

      {/* Chat Panel - Slide up from bottom-right */}
      <div
        className={`
        fixed right-6 bottom-6 w-80 h-96
        transform transition-all duration-500 ease-in-out z-40
        ${
          state.isChatOpen
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95"
        }
      `}
      >
        <div className="h-full bg-gray-800/95 backdrop-blur-lg rounded-2xl border border-gray-600/50 shadow-2xl overflow-hidden">
          <ChatPanel
            messages={state.messages}
            isOpen={state.isChatOpen}
            onClose={toggleChat}
            onSendMessage={sendMessage}
            currentUserName={currentUser?.name || "User"}
            className="h-full"
          />
        </div>
      </div>

      {/* Invite Panel - Slide up from bottom-right (next to chat) */}
      <div
        className={`
        fixed right-6 bottom-6 w-80 h-96
        transform transition-all duration-500 ease-in-out z-40
        ${
          showInvitePopup
            ? "translate-y-0 opacity-100 scale-100"
            : "translate-y-8 opacity-0 scale-95"
        }
        ${state.isChatOpen ? "translate-x-[-21rem]" : ""}
      `}
      >
        <div className="h-full bg-gray-800/95 backdrop-blur-lg rounded-2xl border border-gray-600/50 shadow-2xl overflow-hidden">
          <div className="h-full">
            <RoomInvite
              roomId={roomId}
              className="h-full"
              onClose={() => setShowInvitePopup(false)}
            />
          </div>
        </div>
      </div>

      {/* Modern Floating Toolbar */}
      <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-gray-900/80 rounded-2xl px-6 py-3 shadow-2xl border border-gray-700/50">
          <Toolbar
            isVideoOn={state.isVideoOn}
            isAudioOn={state.isAudioOn}
            isScreenSharing={state.isScreenSharing}
            isChatOpen={state.isChatOpen}
            isInviteOpen={showInvitePopup}
            participantCount={state.participants.length}
            onToggleVideo={toggleVideo}
            onToggleAudio={toggleAudio}
            onToggleScreenShare={toggleScreenShare}
            onToggleChat={toggleChat}
            onToggleInvite={() => setShowInvitePopup(!showInvitePopup)}
            onToggleSettings={() => setShowSettings(!showSettings)}
            onEndCall={handleEndCall}
          />
        </div>
      </div>

      {/* Status indicators */}
      <div className="fixed top-24 left-6 z-30 flex flex-col gap-2">
        {state.isScreenSharing && (
          <div className="flex items-center gap-2 bg-blue-500/80 rounded-xl px-4 py-2 border border-blue-400/50">
            <Monitor className="w-4 h-4 text-white" />
            <span className="text-white font-medium text-sm">
              Screen Sharing
            </span>
          </div>
        )}
      </div>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        isVideoOn={state.isVideoOn}
        isAudioOn={state.isAudioOn}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        localStream={state.localStream}
      />
    </div>
  );
}
