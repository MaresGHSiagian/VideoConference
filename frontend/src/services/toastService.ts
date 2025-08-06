import { toast, ToastOptions } from "react-toastify";

const defaultOptions: ToastOptions = {
  position: "top-center",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

export class ToastService {
  static success(message: string, options?: ToastOptions) {
    toast.success(message, { ...defaultOptions, ...options });
  }

  static error(message: string, options?: ToastOptions) {
    toast.error(message, { ...defaultOptions, ...options });
  }

  static info(message: string, options?: ToastOptions) {
    toast.info(message, { ...defaultOptions, ...options });
  }

  static warning(message: string, options?: ToastOptions) {
    toast.warning(message, { ...defaultOptions, ...options });
  }

  static loading(message: string) {
    return toast.loading(message, defaultOptions);
  }

  static update(toastId: any, options: any) {
    toast.update(toastId, options);
  }

  static dismiss(toastId?: any) {
    toast.dismiss(toastId);
  }

  static dismissAll() {
    toast.dismiss();
  }

  // Custom toast untuk berbagai situasi
  static loginSuccess(userName: string) {
    this.success(`Welcome back, ${userName}! 👋`, {
      autoClose: 3000,
    });
  }

  static loginError(message?: string) {
    this.error(message || "Login failed. Please check your credentials.", {
      autoClose: 6000,
    });
  }

  static registerSuccess(userName: string) {
    this.success(`Account created successfully! Welcome ${userName}! 🎉`, {
      autoClose: 4000,
    });
  }

  static registerError(message?: string) {
    this.error(message || "Registration failed. Please try again.", {
      autoClose: 6000,
    });
  }

  static meetingJoined(roomId: string) {
    this.success(`Successfully joined meeting: ${roomId} 📹`, {
      autoClose: 3000,
    });
  }

  static meetingError(message?: string) {
    this.error(message || "Failed to join meeting. Please try again.", {
      autoClose: 6000,
    });
  }

  static permissionError(message?: string) {
    this.error(message || "Camera/microphone permission denied.", {
      autoClose: 8000,
    });
  }

  static connectionError() {
    this.error("Connection lost. Attempting to reconnect...", {
      autoClose: 5000,
    });
  }

  static recordingStarted() {
    this.info("Recording started 🎬", {
      autoClose: 2000,
    });
  }

  static recordingStopped() {
    this.info("Recording stopped ⏹️", {
      autoClose: 2000,
    });
  }

  static screenShareStarted() {
    this.info("Screen sharing started 🖥️", {
      autoClose: 2000,
    });
  }

  static screenShareStopped() {
    this.info("Screen sharing stopped", {
      autoClose: 2000,
    });
  }

  static participantJoined(name: string) {
    this.info(`${name} joined the meeting`, {
      autoClose: 3000,
    });
  }

  static participantLeft(name: string) {
    this.info(`${name} left the meeting`, {
      autoClose: 3000,
    });
  }

  static linkCopied() {
    this.success("Meeting link copied to clipboard! 📋", {
      autoClose: 2000,
    });
  }

  static networkReconnected() {
    this.success("Network connection restored! 🌐", {
      autoClose: 3000,
    });
  }
}

export const showToast = ToastService;
