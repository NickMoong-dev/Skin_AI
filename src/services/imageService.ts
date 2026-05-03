import { addWatermarkToImage as watermarkUtil } from '../utils';
import { compressBase64Image } from '../utils/imageCompressor';

export const imageService = {
  /**
   * Processes a raw image: Watermarks and Compresses
   */
  async processForStorage(base64: string, userInfo?: { email: string, name?: string }): Promise<string> {
    try {
      // 1. Add Watermark
      const watermarked = await watermarkUtil(base64, userInfo);
      
      // 2. Compress to keep document size under 1MB limit
      const compressed = await compressBase64Image(watermarked);
      
      return compressed;
    } catch (error) {
      console.error("Image processing failed:", error);
      throw new Error("이미지 처리 중 오류가 발생했습니다.");
    }
  },

  /**
   * Captures a frame from a video element and returns base64
   */
  captureFrame(video: HTMLVideoElement): string {
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error("Could not get canvas context");

    ctx.drawImage(video, 0, 0);
    return canvas.toDataURL('image/jpeg', 0.8);
  },

  /**
   * Converts File to Base64
   */
  fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }
};
