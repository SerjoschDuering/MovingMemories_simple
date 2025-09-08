import React, { useState, useCallback, useRef } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { validateImageFile, processImageForGemini } from '../utils/imageProcessing';

export const UploadComponent: React.FC = () => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const { setOriginalImage, originalImage, originalImageUrl } = useMemoryStore();

  const handleFile = useCallback(async (file: File) => {
    setUploadError(null);
    setIsProcessing(true);
    try {
      const validation = validateImageFile(file);
      if (!validation.isValid) {
        setUploadError(validation.error || 'Invalid file');
        return;
      }
      const { dataUrl } = await processImageForGemini(file);
      setOriginalImage(file, dataUrl);
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : 'Failed to process image.');
    } finally {
      setIsProcessing(false);
    }
  }, [setOriginalImage]);

  const onDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) await handleFile(files[0]);
  }, [handleFile]);

  const onSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) await handleFile(files[0]);
    if (e.target) e.target.value = '';
  }, [handleFile]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div
        className={`
          relative rounded-2xl border-2 border-dashed p-12 text-center transition-all
          ${isDragOver 
            ? 'border-orange-400 bg-orange-50 scale-105' 
            : 'border-gray-300 bg-white hover:border-orange-300'
          }
          ${isProcessing ? 'opacity-70 pointer-events-none' : 'cursor-pointer'}
        `}
        onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
        onDragLeave={(e) => { e.preventDefault(); setIsDragOver(false); }}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Icon */}
        <div className="mb-4 flex justify-center">
          <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-100 to-amber-100 flex items-center justify-center">
            <svg className="h-8 w-8 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
        </div>

        {/* Text */}
        <h3 className="mb-2 text-lg font-semibold text-gray-900">Share a Memory</h3>
        <p className="mb-1 text-sm text-gray-600">
          Upload a photo to transform it into a beautiful moving memory.
        </p>
        <p className="text-xs text-gray-500">JPEG, PNG, or WebP • Max 10MB</p>
        
        {/* Drag text */}
        <p className="mt-4 text-sm text-gray-400">
          Drag & drop your photo, or click to browse
        </p>

        {/* Preview */}
        {originalImage && originalImageUrl && (
          <div className="mt-8">
            <img 
              src={originalImageUrl} 
              alt="Uploaded memory" 
              className="mx-auto h-64 w-64 object-cover rounded-xl shadow-lg border-4 border-white"
            />
            <p className="mt-3 text-sm text-green-600 font-medium">✓ Photo uploaded successfully</p>
          </div>
        )}

        {/* Processing overlay */}
        {isProcessing && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-2xl">
            <div className="text-center">
              <div className="mb-2 h-8 w-8 animate-spin rounded-full border-2 border-orange-500 border-t-transparent mx-auto"></div>
              <p className="text-sm text-gray-600">Processing your memory...</p>
            </div>
          </div>
        )}
      </div>

      {/* Buttons */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <button
          onClick={() => fileInputRef.current?.click()}
          className="rounded-lg bg-white border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
          disabled={isProcessing}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          Browse Files
        </button>
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 px-4 py-3 text-sm font-medium text-white hover:from-orange-600 hover:to-amber-600 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          disabled={isProcessing}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Take Photo
        </button>
      </div>

      {/* Error message */}
      {uploadError && (
        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-3">
          <p className="text-sm text-red-700">{uploadError}</p>
        </div>
      )}

      {/* Hidden inputs */}
      <input ref={fileInputRef} type="file" accept="image/*" onChange={onSelect} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={onSelect} className="hidden" />
    </div>
  );
};