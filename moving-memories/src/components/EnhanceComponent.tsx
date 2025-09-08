import React, { useState, useEffect, useRef } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { geminiService } from '../services/geminiService';
import { replicateService } from '../services/replicateService';

export const EnhanceComponent: React.FC = () => {
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhanceError, setEnhanceError] = useState<string | null>(null);
  const [userNote, setUserNote] = useState('');
  const [enhanceProgress, setEnhanceProgress] = useState(0);
  const [imageLoaded, setImageLoaded] = useState(false);
  const enhancementStarted = useRef(false);
  const autoAdvanceTimer = useRef<number | null>(null);
  const hasEnhanced = useRef(false);

  const {
    originalImageDataUrl,
    setEnhancedImage,
    enhancedImageUrl,
    setCurrentStep,
    setUserNote: storeUserNote,
  } = useMemoryStore();

  useEffect(() => {
    // Start enhancement automatically when component mounts
    // Use ref to prevent double execution in React StrictMode
    if (originalImageDataUrl && !enhancedImageUrl && !enhancementStarted.current) {
      enhancementStarted.current = true;
      // Clear local user note state for new image
      setUserNote('');
      storeUserNote('');
      startEnhancement();
    }
    
    // Cleanup timer on unmount
    return () => {
      if (autoAdvanceTimer.current) {
        clearTimeout(autoAdvanceTimer.current);
      }
    };
  }, []);

  const startEnhancement = async () => {
    if (!originalImageDataUrl) return;

    setIsEnhancing(true);
    setEnhanceError(null);
    setEnhanceProgress(0);

    // Simulate progress for better UX
    const progressInterval = setInterval(() => {
      setEnhanceProgress(prev => Math.min(prev + 10, 90));
    }, 400);

    try {
      // Try Replicate first if token is available (same token used for video)
      const replicateToken = localStorage.getItem('REPLICATE_API_TOKEN');
      
      let enhancedImageUrl: string;
      let caption: string;
      
      if (replicateToken) {
        try {
          console.log('[Enhancement] Using Replicate Nano Banana with existing token...');
          replicateService.init(replicateToken);
          const replicateResult = await replicateService.enhanceImage(originalImageDataUrl);
          enhancedImageUrl = replicateResult.imageUrl;
          caption = replicateResult.caption || 'Enhanced with AI';
          console.log('[Enhancement] Replicate successful!');
        } catch (replicateError) {
          console.error('[Enhancement] Replicate failed, falling back to Gemini:', replicateError);
          // Fall back to Gemini (which might not actually enhance)
          const base64 = originalImageDataUrl.split(',')[1];
          const mimeType = originalImageDataUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
          const geminiResult = await geminiService.enhanceImage(base64, mimeType);
          enhancedImageUrl = geminiResult.images[0];
          caption = geminiResult.caption;
        }
      } else {
        // No Replicate token, use Gemini (might just return original)
        console.log('[Enhancement] No Replicate token, using Gemini (may not enhance)...');
        const base64 = originalImageDataUrl.split(',')[1];
        const mimeType = originalImageDataUrl.match(/data:([^;]+)/)?.[1] || 'image/jpeg';
        const geminiResult = await geminiService.enhanceImage(base64, mimeType);
        enhancedImageUrl = geminiResult.images[0];
        caption = geminiResult.caption;
      }
      
      clearInterval(progressInterval);
      setEnhanceProgress(100);

      // Use the enhanced image
      if (enhancedImageUrl) {
        setImageLoaded(false); // Reset for the new image to load
        setEnhancedImage(enhancedImageUrl, caption);
        hasEnhanced.current = true;

        // Start auto-advance timer (3.5 seconds to see the animation)
        if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
        autoAdvanceTimer.current = window.setTimeout(() => {
          setCurrentStep('generate');
        }, 3500);
      } else {
        throw new Error('No enhanced image was generated');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setEnhanceProgress(0);
      setEnhanceError(error instanceof Error ? error.message : 'Enhancement failed');
      setIsEnhancing(false);
    }
  };

  const retry = () => {
    startEnhancement();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Enhancement Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-800">Enhancing your photo</h2>
          <p className="text-sm text-gray-600 mt-1">
            Subtle adjustments for a warmer, clearer memory
          </p>
        </div>

        {/* Image Display */}
        <div className="p-6">
          <div className="relative rounded-xl overflow-hidden bg-gray-50">
            {/* Display original or enhanced image */}
            {(enhancedImageUrl || originalImageDataUrl) && (
              <div className="relative">
                <img
                  key={enhancedImageUrl || originalImageDataUrl || ''}
                  src={enhancedImageUrl || originalImageDataUrl || ''}
                  alt="Memory"
                  className={`w-full h-auto transition-all duration-1000 ${
                    enhancedImageUrl 
                      ? 'scale-100 brightness-100 contrast-100' 
                      : 'scale-[1.02] brightness-95'
                  }`}
                  onLoad={() => {
                    if (enhancedImageUrl && !imageLoaded) {
                      setTimeout(() => setImageLoaded(true), 100);
                    }
                  }}
                />
              </div>
            )}
            
            {/* Enhancement overlay */}
            {isEnhancing && !enhancedImageUrl && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent flex items-center justify-center">
                <div className="text-center">
                  <div className="mb-4">
                    <div className="h-12 w-12 mx-auto rounded-full border-2 border-white border-t-transparent animate-spin" />
                  </div>
                  <p className="text-white text-sm font-medium">Enhancing...</p>
                  <div className="mt-2 w-32 h-1 bg-white/30 rounded-full mx-auto overflow-hidden">
                    <div 
                      className="h-full bg-white rounded-full transition-all duration-300"
                      style={{ width: `${enhanceProgress}%` }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Success overlay - simpler animation */}
            {enhancedImageUrl && imageLoaded && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Simple sparkle effect */}
                <div className="absolute inset-0 animate-pulse">
                  <div className="absolute top-1/3 left-1/3 w-2 h-2 bg-yellow-300 rounded-full opacity-60 animate-ping" />
                  <div className="absolute bottom-1/3 right-1/3 w-2 h-2 bg-yellow-200 rounded-full opacity-60 animate-ping" style={{animationDelay: '0.5s'}} />
                  <div className="absolute top-1/2 right-1/4 w-1.5 h-1.5 bg-white rounded-full opacity-80 animate-ping" style={{animationDelay: '1s'}} />
                </div>
                
                {/* Enhanced Badge */}
                <div className="absolute top-4 right-4 bg-green-500 text-white px-3 py-1.5 rounded-full text-sm font-medium flex items-center gap-1.5 animate-fadeIn">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Enhanced
                </div>
              </div>
            )}
          </div>
        </div>

        {/* User Note Input */}
        <div className="px-6 pb-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-400">
              Tell us something about this memory <span className="font-normal text-gray-300">(optional)</span>
            </label>
            <textarea
              value={userNote}
              onChange={(e) => {
                setUserNote(e.target.value);
                // Also store in the global store for motion prompt generation
                storeUserNote(e.target.value);
                
                // If enhancement is done, reset the auto-advance timer on each keystroke
                if (hasEnhanced.current) {
                  if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
                  autoAdvanceTimer.current = window.setTimeout(() => {
                    setCurrentStep('generate');
                  }, 2000);
                }
              }}
              placeholder="Share what makes this moment special..."
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent placeholder:text-gray-300"
              rows={3}
              maxLength={200}
            />
            <div className="text-right">
              <span className="text-xs text-gray-400">{userNote.length}/200</span>
            </div>
          </div>
        </div>

        {/* Error state */}
        {enhanceError && (
          <div className="px-6 pb-6">
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{enhanceError}</p>
              <button
                onClick={retry}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
              >
                Try again →
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};