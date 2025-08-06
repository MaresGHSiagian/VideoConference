// Background Effect Service
// Provides background effects for video streams

interface BackgroundEffect {
  id: string;
  name: string;
  type: "none" | "blur" | "image" | "gradient";
  value?: string;
}

class BackgroundEffectService {
  private canvas: HTMLCanvasElement | null = null;
  private context: CanvasRenderingContext2D | null = null;
  private animationId: number | null = null;
  private currentEffect: BackgroundEffect | null = null;
  private videoElement: HTMLVideoElement | null = null;

  private defaultEffects: BackgroundEffect[] = [
    { id: "none", name: "No Background", type: "none" },
    { id: "blur", name: "Blur Background", type: "blur" },
    {
      id: "gradient1",
      name: "Ocean Gradient",
      type: "gradient",
      value: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
    },
    {
      id: "gradient2",
      name: "Sunset Gradient",
      type: "gradient",
      value: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
    },
    {
      id: "gradient3",
      name: "Forest Gradient",
      type: "gradient",
      value: "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
    },
    {
      id: "gradient4",
      name: "Purple Gradient",
      type: "gradient",
      value: "linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)",
    },
  ];

  getAvailableEffects(): BackgroundEffect[] {
    return this.defaultEffects;
  }

  async applyEffect(
    effectId: string,
    canvas: HTMLCanvasElement,
    video: HTMLVideoElement
  ): Promise<void> {
    const effect = this.defaultEffects.find((e) => e.id === effectId);
    if (!effect) return;

    this.canvas = canvas;
    this.context = canvas.getContext("2d");
    this.videoElement = video;
    this.currentEffect = effect;

    if (!this.context) return;

    // Set canvas size to match video
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    if (effect.type === "none") {
      this.stopEffect();
      return;
    }

    // Start the animation loop
    this.startAnimation();
  }

  private startAnimation(): void {
    if (
      !this.canvas ||
      !this.context ||
      !this.videoElement ||
      !this.currentEffect
    )
      return;

    const animate = () => {
      if (
        !this.canvas ||
        !this.context ||
        !this.videoElement ||
        !this.currentEffect
      )
        return;

      // Clear canvas
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

      if (this.currentEffect.type === "blur") {
        // Apply blur effect
        this.context.filter = "blur(10px)";
        this.context.drawImage(
          this.videoElement,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
        this.context.filter = "none";
      } else if (this.currentEffect.type === "gradient") {
        // Create gradient background
        this.drawGradientBackground();

        // Draw the video with some blend mode or effect
        this.context.globalCompositeOperation = "multiply";
        this.context.drawImage(
          this.videoElement,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
        this.context.globalCompositeOperation = "source-over";
      } else if (this.currentEffect.type === "image") {
        // For custom images, draw the background first then the video
        this.drawImageBackground();
        this.context.globalCompositeOperation = "multiply";
        this.context.drawImage(
          this.videoElement,
          0,
          0,
          this.canvas.width,
          this.canvas.height
        );
        this.context.globalCompositeOperation = "source-over";
      }

      this.animationId = requestAnimationFrame(animate);
    };

    animate();
  }

  private drawGradientBackground(): void {
    if (!this.context || !this.canvas || !this.currentEffect?.value) return;

    // Parse gradient value and create canvas gradient
    const gradient = this.context.createLinearGradient(
      0,
      0,
      this.canvas.width,
      this.canvas.height
    );

    // Simple gradient parsing for demo purposes
    if (this.currentEffect.value.includes("#667eea")) {
      gradient.addColorStop(0, "#667eea");
      gradient.addColorStop(1, "#764ba2");
    } else if (this.currentEffect.value.includes("#f093fb")) {
      gradient.addColorStop(0, "#f093fb");
      gradient.addColorStop(1, "#f5576c");
    } else if (this.currentEffect.value.includes("#4facfe")) {
      gradient.addColorStop(0, "#4facfe");
      gradient.addColorStop(1, "#00f2fe");
    } else if (this.currentEffect.value.includes("#a8edea")) {
      gradient.addColorStop(0, "#a8edea");
      gradient.addColorStop(1, "#fed6e3");
    }

    this.context.fillStyle = gradient;
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  private drawImageBackground(): void {
    if (!this.context || !this.canvas) return;

    // For now, just fill with a solid color as placeholder
    this.context.fillStyle = "#1a1a1a";
    this.context.fillRect(0, 0, this.canvas.width, this.canvas.height);
  }

  stopEffect(): void {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }

    if (this.canvas && this.context) {
      this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    this.currentEffect = null;
  }

  createCustomEffect(name: string, imageUrl: string): BackgroundEffect {
    return {
      id: `custom-${Date.now()}`,
      name,
      type: "image",
      value: imageUrl,
    };
  }
}

// Export singleton instance
export const backgroundEffectService = new BackgroundEffectService();
