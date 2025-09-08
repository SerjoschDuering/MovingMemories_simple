import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { MemoryState, ProcessingStep, ProcessingError } from '../types';

interface MemoryStore extends MemoryState {
  // State management actions
  setCurrentStep: (step: ProcessingStep) => void;
  setOriginalImage: (file: File, url: string) => void;
  setEnhancedImage: (url: string, caption?: string) => void;
  setVideoUrl: (url: string) => void;
  setUserNote: (note: string) => void;
  setMotionPrompt: (prompt: string) => void;
  
  // Processing state actions
  setProcessing: (isProcessing: boolean) => void;
  setProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  
  // API configuration
  setApiKey: (key: string) => void;
  clearApiKey: () => void;
  
  // Processing metadata
  startProcessing: () => void;
  completeProcessing: () => void;
  setEstimatedTime: (seconds: number) => void;
  
  // Reset and cleanup
  resetWorkflow: () => void;
  clearMedia: () => void;
  
  // Helper methods
  canProceedToStep: (step: ProcessingStep) => boolean;
  getStepProgress: () => number;
}

const initialState: MemoryState = {
  currentStep: 'upload',
  originalImage: null,
  originalImageUrl: null,
  originalImageDataUrl: null,
  enhancedImageUrl: null,
  enhancedImageCaption: null,
  videoUrl: null,
  userNote: '',
  motionPrompt: '',
  isProcessing: false,
  progress: 0,
  error: null,
  apiKey: null,
  processingStartTime: null,
  estimatedTimeRemaining: null,
};

export const useMemoryStore = create<MemoryStore>()(
  persist(
    (set, get) => ({
      ...initialState,

      // State management actions
      setCurrentStep: (step) =>
        set((state) => ({ 
          currentStep: step,
          error: null, // Clear error when moving to next step
        })),

      setOriginalImage: (file, url) =>
        set({
          originalImage: file,
          originalImageUrl: url,
          originalImageDataUrl: url,
          // Clear downstream states when new image is uploaded
          enhancedImageUrl: null,
          enhancedImageCaption: null,
          videoUrl: null,
          motionPrompt: '',
          userNote: '', // Clear user note for new upload
          error: null,
          currentStep: 'enhance',
        }),

      setEnhancedImage: (url, caption) =>
        set({
          enhancedImageUrl: url,
          enhancedImageCaption: caption || null,
          currentStep: 'generate',
        }),

      setVideoUrl: (url) =>
        set({
          videoUrl: url,
          currentStep: 'complete',
          isProcessing: false,
          progress: 100,
        }),

      setUserNote: (note) =>
        set({ userNote: note }),

      setMotionPrompt: (prompt) =>
        set({ motionPrompt: prompt }),

      // Processing state actions
      setProcessing: (isProcessing) =>
        set({ isProcessing }),

      setProgress: (progress) =>
        set({ progress: Math.max(0, Math.min(100, progress)) }),

      setError: (error) =>
        set({ 
          error,
          isProcessing: false,
        }),

      // API configuration
      setApiKey: (key) =>
        set({ apiKey: key.trim() }),

      clearApiKey: () =>
        set({ apiKey: null }),

      // Processing metadata
      startProcessing: () =>
        set({
          isProcessing: true,
          processingStartTime: Date.now(),
          error: null,
          progress: 0,
        }),

      completeProcessing: () =>
        set({
          isProcessing: false,
          processingStartTime: null,
          estimatedTimeRemaining: null,
          progress: 100,
        }),

      setEstimatedTime: (seconds) =>
        set({ estimatedTimeRemaining: seconds }),

      // Reset and cleanup
      resetWorkflow: () => {
        // Clean up blob URLs to prevent memory leaks
        const state = get();
        if (state.originalImageUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(state.originalImageUrl);
        }
        if (state.videoUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(state.videoUrl);
        }
        
        set({
          ...initialState,
          apiKey: state.apiKey, // Preserve API key
        });
      },

      clearMedia: () => {
        const state = get();
        if (state.originalImageUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(state.originalImageUrl);
        }
        if (state.videoUrl?.startsWith('blob:')) {
          URL.revokeObjectURL(state.videoUrl);
        }
        
        set({
          originalImage: null,
          originalImageUrl: null,
          enhancedImageUrl: null,
          videoUrl: null,
          currentStep: 'upload',
          progress: 0,
          error: null,
        });
      },

      // Helper methods
      canProceedToStep: (step) => {
        const state = get();
        
        switch (step) {
          case 'upload':
            return true;
          case 'enhance':
            return !!state.originalImage; // Removed API key check
          case 'prompt':
            return !!state.enhancedImageUrl;
          case 'generate':
            return !!state.motionPrompt;
          case 'complete':
            return !!state.videoUrl;
          default:
            return false;
        }
      },

      getStepProgress: () => {
        const state = get();
        const stepValues = {
          upload: 0,
          enhance: 25,
          prompt: 50,
          generate: 75,
          complete: 100,
        };
        
        return stepValues[state.currentStep] || 0;
      },
    }),
    {
      name: 'moving-memories-store',
      storage: createJSONStorage(() => localStorage),
      // Only persist certain fields
      partialize: (state) => ({
        apiKey: state.apiKey,
        userNote: state.userNote,
      }),
    }
  )
);

// Utility function to validate step transitions
export const getNextStep = (currentStep: ProcessingStep): ProcessingStep | null => {
  const stepOrder: ProcessingStep[] = ['upload', 'enhance', 'prompt', 'generate', 'complete'];
  const currentIndex = stepOrder.indexOf(currentStep);
  
  if (currentIndex === -1 || currentIndex === stepOrder.length - 1) {
    return null;
  }
  
  return stepOrder[currentIndex + 1];
};

// Error handling utilities
export const createProcessingError = (
  step: ProcessingStep,
  message: string,
  retryable = true,
  code?: string
): ProcessingError => ({
  step,
  message,
  code,
  retryable,
});

// Common error messages
export const ERROR_MESSAGES = {
  NO_API_KEY: 'Please provide your Gemini API key to continue',
  INVALID_IMAGE: 'Please upload a valid image file (JPEG, PNG, or WebP)',
  IMAGE_TOO_LARGE: 'Image file is too large. Please use an image under 10MB',
  NETWORK_ERROR: 'Network error. Please check your connection and try again',
  API_ERROR: 'API error occurred. Please try again',
  QUOTA_EXCEEDED: 'API quota exceeded. Please check your Gemini API usage',
  PROCESSING_TIMEOUT: 'Processing took too long. Please try again with a different image',
} as const;