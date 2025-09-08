import React, { useState } from 'react';
import { useMemoryStore } from '../store/memoryStore';

export const CompleteComponent: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  
  const {
    videoUrl,
    enhancedImageUrl,
    originalImage,
    userNote,
    motionPrompt,
    resetWorkflow,
  } = useMemoryStore();

  const handleDownloadVideo = () => {
    if (videoUrl) {
      const a = document.createElement('a');
      a.href = videoUrl;
      a.download = `memory-${Date.now()}.mp4`;
      a.click();
    }
  };

  const handleDownloadImage = () => {
    if (enhancedImageUrl) {
      const a = document.createElement('a');
      a.href = enhancedImageUrl;
      a.download = `enhanced-memory-${Date.now()}.jpg`;
      a.click();
    }
  };

  const handleStartOver = () => {
    resetWorkflow();
  };

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Compact Success Message with Animation */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-100">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-20"></div>
            <div className="relative inline-flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-900">Your Memory is Ready!</h2>
            <p className="text-sm text-gray-600">Your photo has been transformed into a beautiful moving memory</p>
          </div>
        </div>
      </div>

      {/* Media Container: show image until video is available, then show video */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="relative bg-black">
          {videoUrl ? (
            <video
              src={videoUrl}
              controls
              autoPlay
              loop
              className="w-full h-auto"
              poster={enhancedImageUrl || undefined}
            >
              Your browser does not support the video tag.
            </video>
          ) : (
            enhancedImageUrl && (
              <img
                src={enhancedImageUrl}
                alt="Enhanced memory"
                className="w-full h-auto"
              />
            )
          )}
        </div>

        {/* Memory Details */}
        <div className="p-6 space-y-4">
          {userNote && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Your memory:</p>
              <p className="text-sm text-gray-700 italic">"{userNote}"</p>
            </div>
          )}

          {motionPrompt && (
            <div className="bg-blue-50 rounded-lg p-4">
              <p className="text-xs font-medium text-blue-600 mb-1">Motion description:</p>
              <p className="text-sm text-gray-700 font-mono">{motionPrompt}</p>
            </div>
          )}

          {/* Download Options */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={handleDownloadVideo}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium text-sm hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              Download Video
            </button>
            <button
              onClick={handleDownloadImage}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Download Photo
            </button>
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-center">
        <button
          onClick={handleStartOver}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg font-medium hover:from-purple-600 hover:to-pink-600 transition-all flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Another Memory
        </button>
      </div>

      {/* Footer Info */}
      <div className="text-center space-y-2">
        <p className="text-xs text-gray-500">
          Created with AI
        </p>
        <p className="text-xs text-gray-400">
          Your memories are processed privately and not stored on our servers
        </p>
      </div>
    </div>
  );
};