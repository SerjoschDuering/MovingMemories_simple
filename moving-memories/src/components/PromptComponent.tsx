import React, { useState, useEffect } from 'react';
import { useMemoryStore } from '../store/memoryStore';
import { geminiService } from '../services/geminiService';
import { getVideoPrompt } from '../config/prompts';

export const PromptComponent: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [promptError, setPromptError] = useState<string | null>(null);
  const [streamedPrompt, setStreamedPrompt] = useState('');
  const [editablePrompt, setEditablePrompt] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const {
    enhancedImageCaption,
    enhancedImageUrl,
    originalImageDataUrl,
    userNote,
    setMotionPrompt,
    motionPrompt,
    setCurrentStep,
  } = useMemoryStore();

  useEffect(() => {
    // Start generation automatically when component mounts
    if (!motionPrompt) {
      generatePrompt();
    } else {
      setEditablePrompt(motionPrompt);
    }
  }, []);

  const generatePrompt = async () => {
    setIsGenerating(true);
    setPromptError(null);
    setStreamedPrompt('');

    try {
      // Use streaming for better UX
      const generator = geminiService.generateMotionPromptStream(
        enhancedImageCaption || 'A meaningful photograph',
        userNote || ''
      );

      let finalPrompt = '';
      for await (const chunk of generator) {
        setStreamedPrompt(chunk);
        finalPrompt = chunk;
      }

      setEditablePrompt(finalPrompt);
      setMotionPrompt(finalPrompt);
      setIsGenerating(false);
    } catch (error) {
      setPromptError(error instanceof Error ? error.message : 'Failed to generate prompt');
      setIsGenerating(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setMotionPrompt(editablePrompt);
    setIsEditing(false);
  };

  const handleProceed = () => {
    if (editablePrompt) {
      setMotionPrompt(editablePrompt);
      setCurrentStep('generate');
    }
  };

  const mediaSrc = enhancedImageUrl || originalImageDataUrl || '';

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Media Container: always show the current image in a stable spot */}
      {mediaSrc && (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="relative rounded-t-2xl overflow-hidden bg-gray-50">
            <img
              src={mediaSrc}
              alt="Memory"
              className="w-full h-auto"
            />
          </div>
        </div>
      )}

      {/* Prompt Generation Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-xl font-semibold text-gray-900">Creating Motion Prompt</h2>
          <p className="text-sm text-gray-600 mt-1">
            AI is crafting the perfect description to bring your photo to life
          </p>
        </div>

        {/* Prompt Display */}
        <div className="p-6 space-y-4">
          {/* User's Note Display */}
          {userNote && (
            <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-xs font-medium text-gray-500 mb-1">Your memory note:</p>
              <p className="text-sm text-gray-700 italic">"{userNote}"</p>
            </div>
          )}

          {/* Generated Prompt */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Motion Description</label>
              {!isGenerating && !isEditing && editablePrompt && (
                <button
                  onClick={handleEdit}
                  className="text-sm text-orange-600 hover:text-orange-700 font-medium"
                >
                  Edit
                </button>
              )}
              {isEditing && (
                <button
                  onClick={handleSave}
                  className="text-sm text-green-600 hover:text-green-700 font-medium"
                >
                  Save
                </button>
              )}
            </div>

            {isGenerating ? (
              <div className="bg-gray-50 rounded-lg p-4 min-h-[100px]">
                <p className="text-sm text-gray-700 font-mono leading-relaxed">
                  {streamedPrompt || (
                    <span className="text-gray-400">Generating motion description...</span>
                  )}
                  <span className="inline-block w-1 h-4 bg-gray-400 animate-pulse ml-1" />
                </p>
              </div>
            ) : isEditing ? (
              <textarea
                value={editablePrompt}
                onChange={(e) => setEditablePrompt(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm font-mono leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                rows={4}
                maxLength={150}
              />
            ) : (
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm text-gray-700 font-mono leading-relaxed">
                  {editablePrompt || 'No prompt generated yet'}
                </p>
              </div>
            )}

            {isEditing && (
              <div className="text-right">
                <span className="text-xs text-gray-400">{editablePrompt.length}/150 characters</span>
              </div>
            )}
          </div>

          {/* Error state */}
          {promptError && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{promptError}</p>
              <button
                onClick={generatePrompt}
                className="mt-2 text-sm font-medium text-red-700 hover:text-red-800"
              >
                Regenerate →
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="px-6 pb-6">
          <div className="flex gap-3">
            <button
              onClick={generatePrompt}
              disabled={isGenerating}
              className="flex-1 px-4 py-2.5 bg-white border border-gray-300 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Regenerate
            </button>
            <button
              onClick={handleProceed}
              disabled={!editablePrompt || isGenerating}
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-lg font-medium text-sm hover:from-orange-600 hover:to-amber-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Generate Video →
            </button>
          </div>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-700">
              <span className="font-medium">Motion Prompt:</span> This description guides how your still photo will be transformed into a moving video. You can edit it to better capture the feeling you want.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};