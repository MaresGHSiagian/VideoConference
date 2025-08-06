"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useEffect,
  ReactNode,
} from "react";
import { User, Participant, Message, MeetingState } from "@/types";
import { socketService } from "@/services/socketService";
import { webRTCService } from "@/services/webRTCService";
import { showToast } from "@/services/toastService";

interface MeetingContextType {
  state: MeetingState;
  user: User | null;
  joinRoom: (
    roomId: string,
    user: User,
    options?: { videoEnabled?: boolean; audioEnabled?: boolean }
  ) => Promise<void>;
  leaveRoom: () => void;
  toggleVideo: () => void;
  toggleAudio: () => void;
  toggleScreenShare: () => Promise<void>;
  toggleChat: () => void;
  sendMessage: (text: string) => void;
  startRecording: () => void;
  stopRecording: () => void;
}

type MeetingAction =
  | { type: "SET_USER"; payload: User }
  | { type: "SET_LOCAL_STREAM"; payload: MediaStream | null }
  | { type: "SET_SCREEN_STREAM"; payload: MediaStream | null }
  | { type: "TOGGLE_VIDEO"; payload: boolean }
  | { type: "TOGGLE_AUDIO"; payload: boolean }
  | { type: "TOGGLE_SCREEN_SHARE"; payload: boolean }
  | { type: "TOGGLE_CHAT"; payload: boolean }
  | { type: "TOGGLE_RECORDING"; payload: boolean }
  | { type: "SET_PARTICIPANTS"; payload: Participant[] }
  | { type: "ADD_PARTICIPANT"; payload: Participant }
  | { type: "REMOVE_PARTICIPANT"; payload: string }
  | {
      type: "UPDATE_PARTICIPANT";
      payload: { socketId: string; updates: Partial<Participant> };
    }
  | { type: "SET_MESSAGES"; payload: Message[] }
  | { type: "ADD_MESSAGE"; payload: Message }
  | { type: "RESET_STATE" };

const initialState: MeetingState = {
  isVideoOn: true,
  isAudioOn: true,
  isScreenSharing: false,
  isChatOpen: false,
  isRecording: false,
  participants: [],
  messages: [],
  localStream: null,
  screenStream: null,
};

function meetingReducer(
  state: MeetingState,
  action: MeetingAction
): MeetingState {
  switch (action.type) {
    case "SET_LOCAL_STREAM":
      return { ...state, localStream: action.payload };

    case "SET_SCREEN_STREAM":
      return { ...state, screenStream: action.payload };

    case "TOGGLE_VIDEO":
      return { ...state, isVideoOn: action.payload };

    case "TOGGLE_AUDIO":
      return { ...state, isAudioOn: action.payload };

    case "TOGGLE_SCREEN_SHARE":
      return { ...state, isScreenSharing: action.payload };

    case "TOGGLE_CHAT":
      return { ...state, isChatOpen: action.payload };

    case "TOGGLE_RECORDING":
      return { ...state, isRecording: action.payload };

    case "SET_PARTICIPANTS":
      return { ...state, participants: action.payload };

    case "ADD_PARTICIPANT":
      return {
        ...state,
        participants: [...state.participants, action.payload],
      };

    case "REMOVE_PARTICIPANT":
      return {
        ...state,
        participants: state.participants.filter(
          (p) => p.socketId !== action.payload
        ),
      };

    case "UPDATE_PARTICIPANT":
      return {
        ...state,
        participants: state.participants.map((p) =>
          p.socketId === action.payload.socketId
            ? { ...p, ...action.payload.updates }
            : p
        ),
      };

    case "SET_MESSAGES":
      return { ...state, messages: action.payload };

    case "ADD_MESSAGE":
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };

    case "RESET_STATE":
      return initialState;

    default:
      return state;
  }
}

const MeetingContext = createContext<MeetingContextType | undefined>(undefined);

interface MeetingProviderProps {
  children: ReactNode;
}

export function MeetingProvider({ children }: MeetingProviderProps) {
  const [state, dispatch] = useReducer(meetingReducer, initialState);
  const [user, setUser] = React.useState<User | null>(null);

  useEffect(() => {
    // Initialize socket connection only once
    const socket = socketService.connect();
    let isComponentMounted = true;

    // Setup socket event listeners with mounted check
    socketService.onRoomState(({ participants, messages }) => {
      if (isComponentMounted) {
        dispatch({ type: "SET_PARTICIPANTS", payload: participants });
        dispatch({ type: "SET_MESSAGES", payload: messages });
      }
    });

    socketService.onParticipantJoined((participant) => {
      if (isComponentMounted) {
        // Check if participant already exists to prevent duplicate
        const existingParticipant = state.participants.find(
          (p) => p.socketId === participant.socketId
        );

        if (!existingParticipant) {
          dispatch({ type: "ADD_PARTICIPANT", payload: participant });
          // Only show toast if it's not the current user joining
          if (socketService.getSocketId() !== participant.socketId) {
            showToast.participantJoined(participant.name);
          }

          // Create WebRTC connection for new participant
          if (socketService.getSocketId() !== participant.socketId) {
            webRTCService.createOffer(participant.socketId);
          }
        }
      }
    });

    socketService.onParticipantLeft(({ socketId }) => {
      if (isComponentMounted) {
        // Find participant name before removing
        const participant = state.participants.find(
          (p) => p.socketId === socketId
        );
        if (participant && socketService.getSocketId() !== socketId) {
          showToast.participantLeft(participant.name);
        }

        dispatch({ type: "REMOVE_PARTICIPANT", payload: socketId });
        webRTCService.closeConnection(socketId);
      }
    });

    socketService.onParticipantVideoToggle(({ socketId, isVideoOn }) => {
      if (isComponentMounted) {
        dispatch({
          type: "UPDATE_PARTICIPANT",
          payload: { socketId, updates: { isVideoOn } },
        });
      }
    });

    socketService.onParticipantAudioToggle(({ socketId, isAudioOn }) => {
      if (isComponentMounted) {
        dispatch({
          type: "UPDATE_PARTICIPANT",
          payload: { socketId, updates: { isAudioOn } },
        });
      }
    });

    socketService.onParticipantScreenShareStart(({ socketId }) => {
      if (isComponentMounted) {
        dispatch({
          type: "UPDATE_PARTICIPANT",
          payload: { socketId, updates: { isScreenSharing: true } },
        });
      }
    });

    socketService.onParticipantScreenShareStop(({ socketId }) => {
      if (isComponentMounted) {
        dispatch({
          type: "UPDATE_PARTICIPANT",
          payload: { socketId, updates: { isScreenSharing: false } },
        });
      }
    });

    socketService.onNewMessage((message) => {
      if (isComponentMounted) {
        dispatch({ type: "ADD_MESSAGE", payload: message });
      }
    });

    socketService.onRecordingStarted(() => {
      if (isComponentMounted) {
        dispatch({ type: "TOGGLE_RECORDING", payload: true });
      }
    });

    socketService.onRecordingStopped(() => {
      if (isComponentMounted) {
        dispatch({ type: "TOGGLE_RECORDING", payload: false });
      }
    });

    return () => {
      isComponentMounted = false;
      socketService.removeAllListeners();
      socketService.disconnect();
      webRTCService.disconnect();
    };
  }, []); // Empty dependency array to run only once

  const joinRoom = async (
    roomId: string,
    userData: User,
    options?: { videoEnabled?: boolean; audioEnabled?: boolean }
  ) => {
    try {
      setUser(userData);

      // Initialize local media stream with fresh stream
      console.log("Initializing fresh media stream for meeting...");
      const localStream = await webRTCService.initializeLocalStream();
      dispatch({ type: "SET_LOCAL_STREAM", payload: localStream });

      // Apply join options to media tracks
      const videoTracks = localStream.getVideoTracks();
      const audioTracks = localStream.getAudioTracks();

      console.log("Media stream analysis:", {
        videoTracks: videoTracks.length,
        audioTracks: audioTracks.length,
        videoEnabled: videoTracks[0]?.enabled,
        audioEnabled: audioTracks[0]?.enabled,
      });

      // Apply video setting from options
      if (videoTracks.length > 0) {
        const videoTrack = videoTracks[0];
        const videoEnabled =
          options?.videoEnabled !== undefined ? options.videoEnabled : true;
        videoTrack.enabled = videoEnabled;
        console.log("Video track state after setting:", videoTrack.enabled);
        dispatch({ type: "TOGGLE_VIDEO", payload: videoTrack.enabled });
      } else {
        console.warn("No video tracks available");
        dispatch({ type: "TOGGLE_VIDEO", payload: false });
      }

      // Apply audio setting from options
      if (audioTracks.length > 0) {
        const audioTrack = audioTracks[0];
        const audioEnabled =
          options?.audioEnabled !== undefined ? options.audioEnabled : true;
        audioTrack.enabled = audioEnabled;
        console.log("Audio track state after setting:", audioTrack.enabled);
        dispatch({ type: "TOGGLE_AUDIO", payload: audioTrack.enabled });
      } else {
        console.warn("No audio tracks available");
        dispatch({ type: "TOGGLE_AUDIO", payload: false });
      }

      // Join room via socket
      socketService.joinRoom(roomId, userData);

      console.log("Meeting joined successfully with media state:", {
        videoOn: videoTracks[0]?.enabled,
        audioOn: audioTracks[0]?.enabled,
      });
    } catch (error) {
      console.error("Error joining room:", error);
      throw error;
    }
  };

  const leaveRoom = () => {
    console.log("MeetingContext leaveRoom: Starting cleanup...");

    try {
      // Leave room via socket first
      socketService.leaveRoom();
      console.log("Socket room left");

      // Disconnect WebRTC connections and stop all streams
      webRTCService.disconnect();
      console.log("WebRTC disconnected");

      // Reset all meeting state
      dispatch({ type: "RESET_STATE" });
      console.log("Meeting state reset");

      // Clear user data
      setUser(null);
      console.log("User data cleared");

      console.log("MeetingContext leaveRoom: Cleanup completed");
    } catch (error) {
      console.error("Error during leaveRoom cleanup:", error);
      // Force cleanup even if there's an error
      try {
        webRTCService.disconnect();
      } catch (cleanupError) {
        console.error("Error during force cleanup:", cleanupError);
      }
    }
  };
  const toggleVideo = () => {
    const newState = !state.isVideoOn;
    console.log(
      `MeetingContext toggleVideo: ${state.isVideoOn} -> ${newState}`
    );

    try {
      // Update WebRTC service first
      webRTCService.toggleVideo(newState);

      // Update UI state immediately for better UX
      dispatch({ type: "TOGGLE_VIDEO", payload: newState });

      // Verify the change took effect after a brief delay
      setTimeout(() => {
        const currentState = webRTCService.getCurrentMediaState();
        console.log("Video state verification:", {
          ui: newState,
          actual: currentState.isVideoOn,
          match: newState === currentState.isVideoOn,
        });

        // Auto-correct if there's a mismatch
        if (newState !== currentState.isVideoOn) {
          console.warn("Video state mismatch detected, correcting UI");
          dispatch({ type: "TOGGLE_VIDEO", payload: currentState.isVideoOn });
        }
      }, 100);
    } catch (error) {
      console.error("Error toggling video:", error);
      // Revert UI state on error
      dispatch({ type: "TOGGLE_VIDEO", payload: state.isVideoOn });
    }
  };

  const toggleAudio = () => {
    const newState = !state.isAudioOn;
    console.log(
      `MeetingContext toggleAudio: ${state.isAudioOn} -> ${newState}`
    );

    // Update WebRTC service first
    webRTCService.toggleAudio(newState);

    // Update UI state immediately
    dispatch({ type: "TOGGLE_AUDIO", payload: newState });

    // Verify after brief delay
    setTimeout(() => {
      const currentState = webRTCService.getCurrentMediaState();
      if (newState !== currentState.isAudioOn) {
        console.warn("Audio state mismatch, correcting UI");
        dispatch({ type: "TOGGLE_AUDIO", payload: currentState.isAudioOn });
      }
    }, 100);
  };

  const toggleScreenShare = async () => {
    try {
      if (state.isScreenSharing) {
        await webRTCService.stopScreenShare();
        dispatch({ type: "SET_SCREEN_STREAM", payload: null });
        dispatch({ type: "TOGGLE_SCREEN_SHARE", payload: false });
        showToast.screenShareStopped();
      } else {
        const screenStream = await webRTCService.startScreenShare();
        dispatch({ type: "SET_SCREEN_STREAM", payload: screenStream });
        dispatch({ type: "TOGGLE_SCREEN_SHARE", payload: true });
        showToast.screenShareStarted();
      }
    } catch (error) {
      console.error("Error toggling screen share:", error);
      showToast.error("Failed to toggle screen sharing. Please try again.", {
        autoClose: 4000,
      });
    }
  };

  const toggleChat = () => {
    dispatch({ type: "TOGGLE_CHAT", payload: !state.isChatOpen });
  };

  const sendMessage = (text: string) => {
    socketService.sendMessage(text);
  };

  const startRecording = () => {
    socketService.startRecording();
  };

  const stopRecording = () => {
    socketService.stopRecording();
  };

  const contextValue: MeetingContextType = {
    state,
    user,
    joinRoom,
    leaveRoom,
    toggleVideo,
    toggleAudio,
    toggleScreenShare,
    toggleChat,
    sendMessage,
    startRecording,
    stopRecording,
  };

  return (
    <MeetingContext.Provider value={contextValue}>
      {children}
    </MeetingContext.Provider>
  );
}

export function useMeeting() {
  const context = useContext(MeetingContext);
  if (context === undefined) {
    throw new Error("useMeeting must be used within a MeetingProvider");
  }
  return context;
}
