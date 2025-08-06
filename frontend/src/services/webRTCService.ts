import { socketService } from "./socketService";
import { WebRTCConnection } from "@/types";
import { showToast } from "./toastService";

class WebRTCService {
  private localStream: MediaStream | null = null;
  private screenStream: MediaStream | null = null;
  private connections: Map<string, WebRTCConnection> = new Map();
  private configuration: RTCConfiguration = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      { urls: "stun:stun1.l.google.com:19302" },
      { urls: "stun:stun2.l.google.com:19302" },
      { urls: "stun:stun3.l.google.com:19302" },
      { urls: "stun:stun4.l.google.com:19302" },
    ],
    iceCandidatePoolSize: 10,
  };
  private connectionStates: Map<string, RTCPeerConnectionState> = new Map();
  private reconnectAttempts: Map<string, number> = new Map();
  private maxReconnectAttempts = 3;

  constructor() {
    this.setupSocketListeners();
    this.setupNetworkMonitoring();
  }

  private setupNetworkMonitoring(): void {
    // Monitor network connectivity - only in browser
    if (typeof window !== "undefined") {
      window.addEventListener("online", () => {
        console.log("Network connection restored");
        showToast.networkReconnected();
        this.handleNetworkReconnect();
      });

      window.addEventListener("offline", () => {
        console.log("Network connection lost");
        showToast.connectionError();
      });
    }
  }

  private handleNetworkReconnect(): void {
    // Attempt to reconnect all failed connections
    this.connections.forEach(async (connection, socketId) => {
      if (
        connection.peerConnection.connectionState === "failed" ||
        connection.peerConnection.connectionState === "disconnected"
      ) {
        await this.recreateConnection(socketId);
      }
    });
  }

  private setupSocketListeners(): void {
    socketService.onOffer(this.handleOffer.bind(this));
    socketService.onAnswer(this.handleAnswer.bind(this));
    socketService.onIceCandidate(this.handleIceCandidate.bind(this));
    socketService.onParticipantLeft(this.handleParticipantLeft.bind(this));
  }

  async initializeLocalStream(): Promise<MediaStream> {
    try {
      // Check if we already have a stream from permission check
      const existingStream = (window as any).__permissionStream;
      if (existingStream && existingStream.active) {
        console.log("Using existing stream from permission check");
        this.localStream = existingStream;

        // Clear the reference to prevent reuse
        delete (window as any).__permissionStream;

        // Ensure all tracks are enabled (important for video)
        if (this.localStream) {
          this.localStream.getVideoTracks().forEach((track) => {
            track.enabled = true;
            console.log("Video track enabled:", track.enabled);
          });

          this.localStream.getAudioTracks().forEach((track) => {
            track.enabled = true;
            console.log("Audio track enabled:", track.enabled);
          });

          // Add event listeners for track ended
          this.localStream.getTracks().forEach((track) => {
            track.addEventListener("ended", () => {
              console.log(`${track.kind} track ended`);
              this.handleTrackEnded(track);
            });
          });
        }

        return this.localStream!;
      }

      // Check if navigator.mediaDevices is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("getUserMedia is not supported in this browser");
      }

      // High quality settings for better conference experience
      this.localStream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280, min: 640 },
          height: { ideal: 720, min: 480 },
          frameRate: { ideal: 30, min: 15 },
          aspectRatio: 16 / 9,
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          sampleSize: 16,
        },
      });

      // Ensure all tracks are enabled by default
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = true;
        console.log("Video track enabled:", track.enabled);
      });

      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = true;
        console.log("Audio track enabled:", track.enabled);
      });

      // Add event listeners for track ended
      this.localStream.getTracks().forEach((track) => {
        track.addEventListener("ended", () => {
          console.log(`${track.kind} track ended`);
          this.handleTrackEnded(track);
        });
      });

      return this.localStream;
    } catch (error) {
      console.error("Error accessing media devices:", error);

      // Progressive fallback for better compatibility
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480 },
          audio: { echoCancellation: true, noiseSuppression: true },
        });

        // Ensure fallback tracks are also enabled
        this.localStream.getVideoTracks().forEach((track) => {
          track.enabled = true;
        });
        this.localStream.getAudioTracks().forEach((track) => {
          track.enabled = true;
        });

        return this.localStream;
      } catch (fallbackError) {
        try {
          this.localStream = await navigator.mediaDevices.getUserMedia({
            video: true,
            audio: true,
          });

          // Ensure basic tracks are also enabled
          this.localStream.getVideoTracks().forEach((track) => {
            track.enabled = true;
          });
          this.localStream.getAudioTracks().forEach((track) => {
            track.enabled = true;
          });

          return this.localStream;
        } catch (finalError) {
          console.error("All getUserMedia attempts failed:", finalError);
          throw finalError;
        }
      }
    }
  }

  private handleTrackEnded(track: MediaStreamTrack): void {
    console.log(`Track ${track.kind} ended, attempting to restart...`);
    // Attempt to restart the stream
    this.initializeLocalStream().catch(console.error);
  }

  async initializeScreenShare(): Promise<MediaStream> {
    try {
      // Check if getDisplayMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error("Screen sharing is not supported in this browser");
      }

      this.screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      // Handle screen share stop event
      this.screenStream.getVideoTracks()[0].addEventListener("ended", () => {
        this.stopScreenShare();
      });

      return this.screenStream;
    } catch (error) {
      console.error("Error accessing screen share:", error);
      throw error;
    }
  }

  createPeerConnection(socketId: string): RTCPeerConnection {
    const peerConnection = new RTCPeerConnection(this.configuration);

    // Enhanced connection monitoring
    peerConnection.addEventListener("connectionstatechange", () => {
      const state = peerConnection.connectionState;
      console.log(`Connection ${socketId} state changed to: ${state}`);
      this.connectionStates.set(socketId, state);

      if (state === "failed" || state === "disconnected") {
        this.handleConnectionFailure(socketId);
      } else if (state === "connected") {
        // Reset reconnect attempts on successful connection
        this.reconnectAttempts.delete(socketId);
      }
    });

    peerConnection.addEventListener("iceconnectionstatechange", () => {
      console.log(
        `ICE connection ${socketId} state: ${peerConnection.iceConnectionState}`
      );
    });

    peerConnection.addEventListener("icegatheringstatechange", () => {
      console.log(
        `ICE gathering ${socketId} state: ${peerConnection.iceGatheringState}`
      );
    });

    // Add local stream to peer connection with optimized settings
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => {
        const sender = peerConnection.addTrack(track, this.localStream!);

        // Set encoding parameters for better quality
        if (track.kind === "video") {
          const params = sender.getParameters();
          if (params.encodings && params.encodings.length > 0) {
            params.encodings[0].maxBitrate = 2500000; // 2.5 Mbps max
            params.encodings[0].scaleResolutionDownBy = 1;
            sender.setParameters(params).catch(console.error);
          }
        }
      });
    }

    // Handle incoming streams
    peerConnection.addEventListener("track", (event) => {
      console.log(`Received ${event.track.kind} track from ${socketId}`);
      const connection = this.connections.get(socketId);
      if (connection && event.streams[0]) {
        connection.stream = event.streams[0];

        // Monitor track health
        event.track.addEventListener("ended", () => {
          console.log(`Remote ${event.track.kind} track ended for ${socketId}`);
        });

        event.track.addEventListener("mute", () => {
          console.log(`Remote ${event.track.kind} track muted for ${socketId}`);
        });

        event.track.addEventListener("unmute", () => {
          console.log(
            `Remote ${event.track.kind} track unmuted for ${socketId}`
          );
        });
      }
    });

    // Handle ICE candidates
    peerConnection.addEventListener("icecandidate", (event) => {
      if (event.candidate) {
        socketService.sendIceCandidate(socketId, event.candidate);
      }
    });

    const connection: WebRTCConnection = {
      socketId,
      peerConnection,
      stream: undefined,
    };

    this.connections.set(socketId, connection);
    return peerConnection;
  }

  private async handleConnectionFailure(socketId: string): Promise<void> {
    const attempts = this.reconnectAttempts.get(socketId) || 0;

    if (attempts < this.maxReconnectAttempts) {
      console.log(
        `Attempting to reconnect ${socketId} (${attempts + 1}/${
          this.maxReconnectAttempts
        })`
      );
      this.reconnectAttempts.set(socketId, attempts + 1);

      // Wait before reconnecting
      setTimeout(() => {
        this.recreateConnection(socketId);
      }, 2000 * (attempts + 1)); // Exponential backoff
    } else {
      console.log(`Max reconnect attempts reached for ${socketId}`);
      this.closeConnection(socketId);
    }
  }

  async createOffer(socketId: string): Promise<void> {
    const peerConnection = this.createPeerConnection(socketId);

    try {
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);

      socketService.sendOffer(socketId, offer);
    } catch (error) {
      console.error("Error creating offer:", error);
    }
  }

  private async handleOffer(data: {
    offer: RTCSessionDescriptionInit;
    sender: string;
  }): Promise<void> {
    const { offer, sender } = data;
    const peerConnection = this.createPeerConnection(sender);

    try {
      await peerConnection.setRemoteDescription(
        new RTCSessionDescription(offer)
      );

      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);

      socketService.sendAnswer(sender, answer);
    } catch (error) {
      console.error("Error handling offer:", error);
    }
  }

  private async handleAnswer(data: {
    answer: RTCSessionDescriptionInit;
    sender: string;
  }): Promise<void> {
    const { answer, sender } = data;
    const connection = this.connections.get(sender);

    if (connection) {
      try {
        await connection.peerConnection.setRemoteDescription(
          new RTCSessionDescription(answer)
        );
      } catch (error) {
        console.error("Error handling answer:", error);
      }
    }
  }

  private async handleIceCandidate(data: {
    candidate: RTCIceCandidate;
    sender: string;
  }): Promise<void> {
    const { candidate, sender } = data;
    const connection = this.connections.get(sender);

    if (connection) {
      try {
        await connection.peerConnection.addIceCandidate(
          new RTCIceCandidate(candidate)
        );
      } catch (error) {
        console.error("Error handling ICE candidate:", error);
      }
    }
  }

  private handleParticipantLeft(data: { socketId: string }): void {
    this.closeConnection(data.socketId);
  }

  private async recreateConnection(socketId: string): Promise<void> {
    this.closeConnection(socketId);
    await this.createOffer(socketId);
  }

  closeConnection(socketId: string): void {
    const connection = this.connections.get(socketId);
    if (connection) {
      connection.peerConnection.close();
      this.connections.delete(socketId);
    }
  }

  toggleVideo(enabled: boolean): void {
    console.log(`Toggling video: ${enabled}`);
    if (this.localStream) {
      this.localStream.getVideoTracks().forEach((track) => {
        track.enabled = enabled;
        console.log(`Video track ${track.id} enabled: ${track.enabled}`);
      });
      socketService.toggleVideo(enabled);
    } else {
      console.warn("No local stream available for video toggle");
    }
  }

  toggleAudio(enabled: boolean): void {
    console.log(`Toggling audio: ${enabled}`);
    if (this.localStream) {
      this.localStream.getAudioTracks().forEach((track) => {
        track.enabled = enabled;
        console.log(`Audio track ${track.id} enabled: ${track.enabled}`);
      });
      socketService.toggleAudio(enabled);
    } else {
      console.warn("No local stream available for audio toggle");
    }
  }

  async startScreenShare(): Promise<MediaStream> {
    try {
      const screenStream = await this.initializeScreenShare();

      // Replace video track in all peer connections
      const videoTrack = screenStream.getVideoTracks()[0];

      this.connections.forEach((connection) => {
        const sender = connection.peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });

      socketService.startScreenShare();
      return screenStream;
    } catch (error) {
      console.error("Error starting screen share:", error);
      throw error;
    }
  }

  async stopScreenShare(): Promise<void> {
    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Switch back to camera
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];

      this.connections.forEach((connection) => {
        const sender = connection.peerConnection
          .getSenders()
          .find((s) => s.track && s.track.kind === "video");
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      });
    }

    socketService.stopScreenShare();
  }

  getLocalStream(): MediaStream | null {
    return this.localStream;
  }

  getScreenStream(): MediaStream | null {
    return this.screenStream;
  }

  getConnection(socketId: string): WebRTCConnection | undefined {
    return this.connections.get(socketId);
  }

  getAllConnections(): WebRTCConnection[] {
    return Array.from(this.connections.values());
  }

  // Helper methods to get current track states
  isVideoEnabled(): boolean {
    if (this.localStream) {
      const videoTracks = this.localStream.getVideoTracks();
      return videoTracks.length > 0 && videoTracks[0].enabled;
    }
    return false;
  }

  isAudioEnabled(): boolean {
    if (this.localStream) {
      const audioTracks = this.localStream.getAudioTracks();
      return audioTracks.length > 0 && audioTracks[0].enabled;
    }
    return false;
  }

  // Method to sync UI with actual track states
  getCurrentMediaState(): { isVideoOn: boolean; isAudioOn: boolean } {
    return {
      isVideoOn: this.isVideoEnabled(),
      isAudioOn: this.isAudioEnabled(),
    };
  }

  disconnect(): void {
    // Stop all streams
    if (this.localStream) {
      this.localStream.getTracks().forEach((track) => track.stop());
      this.localStream = null;
    }

    if (this.screenStream) {
      this.screenStream.getTracks().forEach((track) => track.stop());
      this.screenStream = null;
    }

    // Close all connections
    this.connections.forEach((connection) => {
      connection.peerConnection.close();
    });
    this.connections.clear();
  }
}

export const webRTCService = new WebRTCService();
