import React, { useState, useEffect, useRef } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { veoService } from '../services/veoService';
import { geminiService } from '../services/geminiService';

export const GenerateComponent: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState('Initializing...');
  const timerRef = useRef<number | null>(null);
  const generationStarted = useRef(false);

  const {
    enhancedImageUrl,
    motionPrompt,
    setVideoUrl,
    videoUrl,
    setCurrentStep,
    userNote,
    enhancedImageCaption,
  } = useMemoryStore();

  useEffect(() => {
    // Start generation automatically when component mounts
    // Since we're in the Generate step, the user can no longer type
    if (!videoUrl && enhancedImageUrl && !generationStarted.current) {
      generationStarted.current = true;
      
      // If user has provided a note, give a small delay to show we're using it
      if (userNote && userNote.trim().length > 0) {
        setStatusMessage('Processing your note...');
        setTimeout(() => {
          startGeneration();
        }, 500);
      } else {
        // No note, start immediately
        startGeneration();
      }
    }

    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, []);

  // Gentle progress animation: reach ~90% over ~50s while generating
  const startGentleProgress = () => {
    if (timerRef.current) window.clearInterval(timerRef.current);
    
    const startTime = Date.now();
    const startProgress = 10;
    const endProgress = 90;
    const duration = 50000; // 50 seconds in milliseconds
    
    timerRef.current = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      const percentComplete = Math.min(elapsed / duration, 1);
      
      // Use easeInOut for smoother animation
      const eased = percentComplete < 0.5
        ? 2 * percentComplete * percentComplete
        : 1 - Math.pow(-2 * percentComplete + 2, 2) / 2;
      
      const newProgress = startProgress + (endProgress - startProgress) * eased;
      setProgress(Math.min(90, newProgress));
      
      // Stop when we reach 90%
      if (newProgress >= 90) {
        if (timerRef.current) window.clearInterval(timerRef.current);
      }
    }, 100); // Update every 100ms for smooth animation
  };

  const stopGentleProgress = () => {
    if (timerRef.current) {
      window.clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const startGeneration = async () => {
    if (!enhancedImageUrl) {
      setGenerateError('Missing required image for video generation');
      return;
    }

    setIsGenerating(true);
    setGenerateError(null);
    setProgress(10);
    setStatusMessage('Analyzing image for motion...');
    startGentleProgress();

    let prompt = motionPrompt;

    try {
      // Generate motion prompt if not already present
      if (!prompt || prompt.trim().length === 0) {
        console.log('[Generating motion prompt from image with user note:', userNote || 'none', ']');
        
        try {
          // Call Gemini to analyze the image and generate a motion prompt
          prompt = await geminiService.generateVideoPromptFromImage(
            enhancedImageUrl,
            userNote || undefined
          );
          
          console.log('[Generated motion prompt]:', prompt);
          setStatusMessage('Preparing video generation...');
        } catch (promptError) {
          console.error('Motion prompt generation failed:', promptError);
          // Use fallback prompt if generation fails
          prompt = 'A gentle, cinematic motion around this cherished memory.';
          console.log('[Using fallback prompt]:', prompt);
        }
      }

      // Log the final movement prompt being sent to the AI
      console.log('[FINAL MOVEMENT PROMPT]:', prompt);
      console.log('[USER NOTE]:', userNote || 'none');
      
      // Check if we have Replicate token - if yes, use it directly
      const replicateToken = localStorage.getItem('REPLICATE_API_TOKEN');
      
      if (replicateToken) {
        // Skip VEO entirely and use Replicate
        setStatusMessage('Generating video...');
        
        const videoUrl = await veoService.generateVideoWithReplicate(
          prompt,
          enhancedImageUrl,
          5,
          '480p',
          '16:9'
        );
        
        stopGentleProgress();
        setProgress(100);
        setStatusMessage('Your memory is ready!');
        setVideoUrl(videoUrl);
        
        setTimeout(() => {
          setCurrentStep('complete');
        }, 1200);
      } else {
        // Try VEO if no Replicate token
        const veoApiKey = localStorage.getItem('VEO_API_KEY') || localStorage.getItem('GEMINI_API_KEY');
        if (!veoApiKey) {
          throw new Error('API key not found. Please set your API key.');
        }
        
        veoService.init(veoApiKey);
        setStatusMessage('Generating video...');
        
        const videoResult = await veoService.generateVideoSimple(
          enhancedImageUrl,
          prompt
        );
        
        stopGentleProgress();
        setProgress(100);
        setStatusMessage('Your memory is ready!');
        setVideoUrl(videoResult);
        
        setTimeout(() => {
          setCurrentStep('complete');
        }, 1200);
      }
    } catch (error) {
      console.error('Video generation error:', error);
      const message = error instanceof Error ? error.message : String(error);

      // If Replicate fails too, or if VEO fails and we have no Replicate token
      const replicateToken = localStorage.getItem('REPLICATE_API_TOKEN');
      
      if (replicateToken && !message.includes('Replicate')) {
        // Try Replicate as fallback
        try {
          const fallbackUrl = await veoService.generateVideoWithReplicate(
            prompt,
            enhancedImageUrl,
            5,
            '480p',
            '16:9'
          );

          stopGentleProgress();
          setProgress(100);
          setStatusMessage('Your memory is ready!');
          setVideoUrl(fallbackUrl);

          setTimeout(() => {
            setCurrentStep('complete');
          }, 1200);
          return;
        } catch (repErr) {
          stopGentleProgress();
          console.error('Replicate fallback failed:', repErr);
          setGenerateError(repErr instanceof Error ? repErr.message : 'Video generation failed');
          setIsGenerating(false);
          return;
        }
      }

      stopGentleProgress();
      setGenerateError(message || 'Video generation failed');
      setIsGenerating(false);
    }
  };

  const retry = () => {
    startGeneration();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Generation Card with consistent layout: header then media */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Creating Your Moving Memory</h2>
          <p className="text-sm text-gray-600 mt-1">
            We are transforming your photo into a short video memory
          </p>
        </div>

        {/* Media */}
        {enhancedImageUrl && (
          <div className="relative overflow-hidden bg-gray-50">
            <img
              src={enhancedImageUrl}
              alt="Enhanced memory"
              className="w-full h-auto"
            />
          </div>
        )}

        {/* Progress Display */}
        <div className="p-6">
          <div className="space-y-3">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">{statusMessage}</span>
              <span className="text-gray-500">{Math.round(progress)}%</span>
            </div>
            <div className="h-1 bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-orange-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Error State */}
            {generateError && (
              <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                <p className="text-xs text-red-700">{generateError}</p>
                <button
                  onClick={retry}
                  className="mt-2 text-xs font-medium text-red-700 hover:text-red-800"
                >
                  Try again →
                </button>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Info Cards */}
      <div className="space-y-3">
        <div className="bg-gradient-to-r from-orange-50 to-yellow-50 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700">
                <span className="font-medium">Video:</span> We generate a short clip (≈ 5s, 480p).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};