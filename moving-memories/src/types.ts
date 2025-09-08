// Core application types for Moving Memories

export type ProcessingStep = 'upload' | 'enhance' | 'prompt' | 'generate' | 'complete';

export interface MemoryState {
  // Current processing step
  currentStep: ProcessingStep;
  
  // Media assets
  originalImage: File | null;
  originalImageUrl: string | null; // blob URL for display
  originalImageDataUrl: string | null; // data URL for API calls
  enhancedImageUrl: string | null; // base64 data URL from Gemini
  enhancedImageCaption: string | null; // caption from Gemini
  videoUrl: string | null; // URL from VEO
  
  // User inputs
  userNote: string;
  motionPrompt: string;
  
  // Processing state
  isProcessing: boolean;
  progress: number; // 0-100
  error: string | null;
  
  // API configuration
  apiKey: string | null;
  
  // Processing metadata
  processingStartTime: number | null;
  estimatedTimeRemaining: number | null;
}

export interface GeminiImageResponse {
  images: string[]; // base64 data URLs
  caption: string;
}

export interface VideoGenerationJob {
  id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  videoUrl?: string;
  error?: string;
}

export interface ProcessingError {
  step: ProcessingStep;
  message: string;
  code?: string;
  retryable: boolean;
}

// Animation and UI types
export interface AnimationConfig {
  duration: number;
  ease: string;
  delay?: number;
}

export interface RevealAnimationProps {
  isVisible: boolean;
  direction?: 'up' | 'down' | 'left' | 'right';
  duration?: number;
  delay?: number;
}

// Component state types
export interface UploadComponentState {
  isDragOver: boolean;
  isUploading: boolean;
  uploadProgress: number;
}

export interface PromptGenerationState {
  isGenerating: boolean;
  streamingText: string;
  isComplete: boolean;
}

// Configuration and settings
export interface AppSettings {
  theme: 'light' | 'dark' | 'auto';
  animationsEnabled: boolean;
  autoProcessing: boolean;
  qualitySettings: {
    imageQuality: number; // 0-1
    maxImageSize: number; // pixels
    videoQuality: 'low' | 'medium' | 'high';
  };
}

// API types matching Gemini documentation
export interface GeminiRequest {
  model: string;
  contents: Array<{
    text?: string;
    inlineData?: {
      data: string;
      mimeType: string;
    };
  }>;
}

export interface GeminiStreamResponse {
  candidates: Array<{
    content: {
      parts: Array<{
        text?: string;
        inlineData?: {
          data: string;
          mimeType: string;
        };
      }>;
    };
  }>;
}

// VEO 3 API types (to be confirmed with actual API)
export interface VEORequest {
  image: string; // base64
  prompt: string;
  duration: number;
  resolution: 'low' | 'medium' | 'high';
}

export interface VEOResponse {
  jobId: string;
  status: string;
  videoUrl?: string;
}