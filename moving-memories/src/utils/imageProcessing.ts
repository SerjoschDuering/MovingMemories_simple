import imageCompression from 'browser-image-compression';

export interface ImageProcessingOptions {
  maxSizeMB: number;
  maxWidthOrHeight: number;
  useWebWorker: boolean;
  fileType?: string;
  quality?: number;
}

export const DEFAULT_PROCESSING_OPTIONS: ImageProcessingOptions = {
  maxSizeMB: 4,
  maxWidthOrHeight: 1024,
  useWebWorker: true,
  fileType: 'image/jpeg',
  quality: 0.9,
};

/**
 * Processes and resizes an image to meet Gemini API requirements
 * Resizes to max 1024px and converts to JPEG format
 */
export async function processImageForGemini(
  file: File, 
  options: Partial<ImageProcessingOptions> = {}
): Promise<{ processedFile: File; dataUrl: string; base64: string }> {
  const opts = { ...DEFAULT_PROCESSING_OPTIONS, ...options };
  
  try {
    // Compress and resize the image
    const compressedFile = await imageCompression(file, opts);
    
    // Convert to data URL for preview
    const dataUrl = await fileToDataUrl(compressedFile);
    
    // Extract base64 for API calls
    const base64 = dataUrl.split(',')[1];
    
    return {
      processedFile: compressedFile,
      dataUrl,
      base64,
    };
  } catch (error) {
    console.error('Image processing failed:', error);
    throw new Error('Failed to process image. Please try a different image.');
  }
}

/**
 * Converts a File to a data URL
 */
export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result && typeof e.target.result === 'string') {
        resolve(e.target.result);
      } else {
        reject(new Error('Failed to read file'));
      }
    };
    reader.onerror = () => reject(new Error('File reading error'));
    reader.readAsDataURL(file);
  });
}

/**
 * Converts a File to base64 string (without data URL prefix)
 */
export async function fileToBase64(file: File): Promise<string> {
  const dataUrl = await fileToDataUrl(file);
  return dataUrl.split(',')[1] || '';
}

/**
 * Validates if a file is a supported image format
 */
export function validateImageFile(file: File): { isValid: boolean; error?: string } {
  const supportedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 10 * 1024 * 1024; // 10MB
  
  if (!supportedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Unsupported file type. Please use JPEG, PNG, or WebP images.',
    };
  }
  
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: 'File is too large. Please use an image under 10MB.',
    };
  }
  
  return { isValid: true };
}

/**
 * Creates a canvas for image manipulation
 */
export function createImageCanvas(
  image: HTMLImageElement,
  targetWidth?: number,
  targetHeight?: number
): { canvas: HTMLCanvasElement; ctx: CanvasRenderingContext2D } {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }
  
  // Calculate dimensions
  let { width, height } = image;
  
  if (targetWidth || targetHeight) {
    const aspectRatio = width / height;
    
    if (targetWidth && targetHeight) {
      width = targetWidth;
      height = targetHeight;
    } else if (targetWidth) {
      width = targetWidth;
      height = targetWidth / aspectRatio;
    } else if (targetHeight) {
      height = targetHeight;
      width = targetHeight * aspectRatio;
    }
  }
  
  canvas.width = width;
  canvas.height = height;
  
  return { canvas, ctx };
}

/**
 * Adds a watermark to an image
 */
export async function addWatermark(
  imageUrl: string,
  watermarkText: string = 'Made with AI',
  options: {
    position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
    fontSize?: number;
    opacity?: number;
    color?: string;
  } = {}
): Promise<string> {
  const {
    position = 'bottom-right',
    fontSize = 16,
    opacity = 0.7,
    color = '#ffffff',
  } = options;
  
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    
    img.onload = () => {
      try {
        const { canvas, ctx } = createImageCanvas(img);
        
        // Draw the original image
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Set up text style
        ctx.font = `${fontSize}px system-ui, -apple-system, sans-serif`;
        ctx.fillStyle = color;
        ctx.globalAlpha = opacity;
        
        // Calculate position
        const textMetrics = ctx.measureText(watermarkText);
        const textWidth = textMetrics.width;
        const textHeight = fontSize;
        const margin = 12;
        
        let x: number, y: number;
        
        switch (position) {
          case 'bottom-right':
            x = canvas.width - textWidth - margin;
            y = canvas.height - margin;
            break;
          case 'bottom-left':
            x = margin;
            y = canvas.height - margin;
            break;
          case 'top-right':
            x = canvas.width - textWidth - margin;
            y = textHeight + margin;
            break;
          case 'top-left':
            x = margin;
            y = textHeight + margin;
            break;
        }
        
        // Add subtle background for better readability
        ctx.globalAlpha = opacity * 0.5;
        ctx.fillStyle = '#000000';
        ctx.fillRect(x - 4, y - textHeight - 2, textWidth + 8, textHeight + 6);
        
        // Draw the text
        ctx.globalAlpha = opacity;
        ctx.fillStyle = color;
        ctx.fillText(watermarkText, x, y);
        
        // Convert to data URL
        const watermarkedDataUrl = canvas.toDataURL('image/jpeg', 0.9);
        resolve(watermarkedDataUrl);
      } catch (error) {
        reject(error);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imageUrl;
  });
}

/**
 * Downloads a data URL or blob URL as a file
 */
export function downloadFile(url: string, filename: string): void {
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Creates a blob URL from a data URL
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, data] = dataUrl.split(',');
  const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
  const binary = atob(data);
  const array = new Uint8Array(binary.length);
  
  for (let i = 0; i < binary.length; i++) {
    array[i] = binary.charCodeAt(i);
  }
  
  return new Blob([array], { type: mimeType });
}

/**
 * Generates a filename with timestamp
 */
export function generateFilename(prefix: string, extension: string): string {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  return `${prefix}-${timestamp}.${extension}`;
}