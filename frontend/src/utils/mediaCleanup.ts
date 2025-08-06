/**
 * Utility functions for cleaning up media resources
 */

export interface MediaCleanupOptions {
  force?: boolean;
  includeVideoElements?: boolean;
  log?: boolean;
}

/**
 * Clean up all media streams and video elements
 */
export function cleanupAllMedia(options: MediaCleanupOptions = {}) {
  const { force = false, includeVideoElements = true, log = true } = options;

  if (log) {
    console.log("Starting media cleanup...", { force, includeVideoElements });
  }

  let cleanedCount = 0;

  try {
    // Clean up all video elements
    if (includeVideoElements) {
      const videoElements = document.querySelectorAll("video");
      videoElements.forEach((video, index) => {
        if (video.srcObject) {
          const stream = video.srcObject as MediaStream;
          if (stream && stream.getTracks) {
            stream.getTracks().forEach((track) => {
              if (log) {
                console.log(
                  `Stopping track from video element ${index}:`,
                  track.kind,
                  track.id
                );
              }
              track.stop();
            });
            cleanedCount++;
          }
          video.srcObject = null;
        }
      });
    }

    // Force stop any remaining active streams if requested
    if (force && typeof navigator !== "undefined" && navigator.mediaDevices) {
      // This is a bit of a hack but helps ensure cleanup
      navigator.mediaDevices
        .getUserMedia({ video: false, audio: false })
        .then(() => {
          if (log) console.log("Emergency stream cleanup completed");
        })
        .catch(() => {
          if (log) console.log("Emergency stream cleanup - ignoring errors");
        });
    }

    if (log) {
      console.log(`Media cleanup completed. Cleaned ${cleanedCount} streams.`);
    }

    return { success: true, cleanedCount };
  } catch (error) {
    if (log) {
      console.error("Error during media cleanup:", error);
    }
    return { success: false, error, cleanedCount };
  }
}

/**
 * Clean up a specific MediaStream
 */
export function cleanupMediaStream(
  stream: MediaStream | null,
  label = "stream"
) {
  if (!stream) return;

  console.log(`Cleaning up ${label}:`, stream.id);

  try {
    stream.getTracks().forEach((track, index) => {
      console.log(`Stopping ${track.kind} track ${index} (${track.id})`);
      track.stop();
      track.enabled = false;
    });
  } catch (error) {
    console.error(`Error cleaning up ${label}:`, error);
  }
}

/**
 * Setup automatic cleanup on page unload
 */
export function setupPageUnloadCleanup() {
  if (typeof window === "undefined") return;

  const cleanup = () => {
    cleanupAllMedia({
      force: true,
      includeVideoElements: true,
      log: true,
    });
  };

  // Multiple event listeners to catch all unload scenarios
  window.addEventListener("beforeunload", cleanup);
  window.addEventListener("unload", cleanup);
  window.addEventListener("pagehide", cleanup);

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      cleanup();
    }
  });

  console.log("Page unload cleanup handlers registered");

  // Return cleanup function for manual removal
  return () => {
    window.removeEventListener("beforeunload", cleanup);
    window.removeEventListener("unload", cleanup);
    window.removeEventListener("pagehide", cleanup);
    document.removeEventListener("visibilitychange", cleanup);
  };
}

/**
 * Check if browser supports required media APIs
 */
export function checkMediaSupport() {
  const support = {
    getUserMedia: !!(
      navigator.mediaDevices && navigator.mediaDevices.getUserMedia
    ),
    getDisplayMedia: !!(
      navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia
    ),
    webRTC: !!window.RTCPeerConnection,
    mediaDevices: !!navigator.mediaDevices,
  };

  console.log("Media support check:", support);
  return support;
}

/**
 * Get current media permissions status
 */
export async function checkMediaPermissions() {
  if (!navigator.permissions) {
    return { camera: "unavailable", microphone: "unavailable" };
  }

  try {
    const [camera, microphone] = await Promise.all([
      navigator.permissions.query({ name: "camera" as PermissionName }),
      navigator.permissions.query({ name: "microphone" as PermissionName }),
    ]);

    return {
      camera: camera.state,
      microphone: microphone.state,
    };
  } catch (error) {
    console.error("Error checking media permissions:", error);
    return { camera: "unavailable", microphone: "unavailable" };
  }
}
