import io from "socket.io-client";
import { User, Participant, Message } from "@/types";

type SocketType = ReturnType<typeof io>;

class SocketService {
  private socket: SocketType | null = null;
  private readonly serverUrl: string;

  constructor() {
    this.serverUrl =
      process.env.NEXT_PUBLIC_SIGNALING_SERVER_URL || "http://localhost:5001";
  }

  connect(): SocketType {
    if (!this.socket) {
      this.socket = io(this.serverUrl, {
        transports: ["websocket"],
        upgrade: true,
      });
    }
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }

  joinRoom(roomId: string, user: User): void {
    if (this.socket) {
      this.socket.emit("join-room", { roomId, user });
    }
  }

  leaveRoom(): void {
    if (this.socket) {
      this.socket.emit("leave-room");
    }
  }

  sendOffer(target: string, offer: RTCSessionDescriptionInit): void {
    if (this.socket) {
      this.socket.emit("offer", { target, offer });
    }
  }

  sendAnswer(target: string, answer: RTCSessionDescriptionInit): void {
    if (this.socket) {
      this.socket.emit("answer", { target, answer });
    }
  }

  sendIceCandidate(target: string, candidate: RTCIceCandidate): void {
    if (this.socket) {
      this.socket.emit("ice-candidate", { target, candidate });
    }
  }

  toggleVideo(isVideoOn: boolean): void {
    if (this.socket) {
      this.socket.emit("toggle-video", { isVideoOn });
    }
  }

  toggleAudio(isAudioOn: boolean): void {
    if (this.socket) {
      this.socket.emit("toggle-audio", { isAudioOn });
    }
  }

  startScreenShare(): void {
    if (this.socket) {
      this.socket.emit("start-screen-share");
    }
  }

  stopScreenShare(): void {
    if (this.socket) {
      this.socket.emit("stop-screen-share");
    }
  }

  sendMessage(text: string): void {
    if (this.socket) {
      this.socket.emit("send-message", { text });
    }
  }

  startRecording(): void {
    if (this.socket) {
      this.socket.emit("start-recording");
    }
  }

  stopRecording(): void {
    if (this.socket) {
      this.socket.emit("stop-recording");
    }
  }

  // Event listeners
  onRoomState(
    callback: (data: {
      participants: Participant[];
      messages: Message[];
    }) => void
  ): void {
    if (this.socket) {
      this.socket.on("room-state", callback);
    }
  }

  onParticipantJoined(callback: (participant: Participant) => void): void {
    if (this.socket) {
      this.socket.on("participant-joined", callback);
    }
  }

  onParticipantLeft(callback: (data: { socketId: string }) => void): void {
    if (this.socket) {
      this.socket.on("participant-left", callback);
    }
  }

  onOffer(
    callback: (data: {
      offer: RTCSessionDescriptionInit;
      sender: string;
    }) => void
  ): void {
    if (this.socket) {
      this.socket.on("offer", callback);
    }
  }

  onAnswer(
    callback: (data: {
      answer: RTCSessionDescriptionInit;
      sender: string;
    }) => void
  ): void {
    if (this.socket) {
      this.socket.on("answer", callback);
    }
  }

  onIceCandidate(
    callback: (data: { candidate: RTCIceCandidate; sender: string }) => void
  ): void {
    if (this.socket) {
      this.socket.on("ice-candidate", callback);
    }
  }

  onParticipantVideoToggle(
    callback: (data: { socketId: string; isVideoOn: boolean }) => void
  ): void {
    if (this.socket) {
      this.socket.on("participant-video-toggle", callback);
    }
  }

  onParticipantAudioToggle(
    callback: (data: { socketId: string; isAudioOn: boolean }) => void
  ): void {
    if (this.socket) {
      this.socket.on("participant-audio-toggle", callback);
    }
  }

  onParticipantScreenShareStart(
    callback: (data: { socketId: string }) => void
  ): void {
    if (this.socket) {
      this.socket.on("participant-screen-share-start", callback);
    }
  }

  onParticipantScreenShareStop(
    callback: (data: { socketId: string }) => void
  ): void {
    if (this.socket) {
      this.socket.on("participant-screen-share-stop", callback);
    }
  }

  onNewMessage(callback: (message: Message) => void): void {
    if (this.socket) {
      this.socket.on("new-message", callback);
    }
  }

  onRecordingStarted(callback: (data: { socketId: string }) => void): void {
    if (this.socket) {
      this.socket.on("recording-started", callback);
    }
  }

  onRecordingStopped(callback: (data: { socketId: string }) => void): void {
    if (this.socket) {
      this.socket.on("recording-stopped", callback);
    }
  }

  // Remove event listeners
  removeAllListeners(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
    }
  }

  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}

export const socketService = new SocketService();
