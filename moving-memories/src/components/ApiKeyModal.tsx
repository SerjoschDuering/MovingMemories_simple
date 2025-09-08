import React, { useState, useEffect } from 'react';
import { useMemoryStore } from '../store/memoryStore';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
  required?: boolean;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose, required = false }) => {
  const [geminiKey, setGeminiKey] = useState('');
  const [replicateToken, setReplicateToken] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showReplicateToken, setShowReplicateToken] = useState(false);
  const [showReplicateSetup, setShowReplicateSetup] = useState(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  const { apiKey, setApiKey } = useMemoryStore();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate Gemini key
    if (!geminiKey.trim()) {
      setValidationError('Please enter your Gemini API key');
      return;
    }
    if (!geminiKey.startsWith('AIza')) {
      setValidationError('Invalid Gemini API key format. Keys should start with "AIza"');
      return;
    }
    
    // Save Gemini key
    setApiKey(geminiKey);
    localStorage.setItem('GEMINI_API_KEY', geminiKey);
    
    // Save Replicate token if provided
    if (replicateToken.trim()) {
      if (!replicateToken.startsWith('r8_')) {
        setValidationError('Invalid Replicate token format. Tokens should start with "r8_"');
        return;
      }
      localStorage.setItem('REPLICATE_API_TOKEN', replicateToken);
    }
    
    setGeminiKey('');
    setReplicateToken('');
    setShowReplicateSetup(false);
    onClose();
  };

  const handleClearKeys = () => {
    useMemoryStore.getState().clearApiKey();
    localStorage.removeItem('GEMINI_API_KEY');
    localStorage.removeItem('REPLICATE_API_TOKEN');
    setGeminiKey('');
    setReplicateToken('');
    setValidationError(null);
    setShowReplicateSetup(false);
  };

  useEffect(() => {
    if (isOpen) {
      // Load existing keys
      const existingGeminiKey = apiKey || localStorage.getItem('GEMINI_API_KEY') || '';
      const existingReplicateToken = localStorage.getItem('REPLICATE_API_TOKEN') || '';
      
      setGeminiKey(existingGeminiKey);
      setReplicateToken(existingReplicateToken);
      
      // Show Replicate setup if token exists
      if (existingReplicateToken) {
        setShowReplicateSetup(true);
      }
    }
  }, [isOpen, apiKey]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={!required ? onClose : undefined} />
      <div className="relative w-full max-w-md rounded-lg border bg-white p-5">
        <div className="mb-4">
          <h2 className="text-base font-semibold">API Configuration</h2>
          <p className="text-xs text-neutral-600">Your API keys are stored locally in your browser.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Gemini API Key - Primary */}
          <div>
            <label htmlFor="gemini-key" className="mb-1 block text-xs font-medium">
              Gemini API Key <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                id="gemini-key"
                type={showGeminiKey ? 'text' : 'password'}
                value={geminiKey}
                onChange={(e) => { setGeminiKey(e.target.value); setValidationError(null); }}
                placeholder="AIza..."
                className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
                required
              />
              <button 
                type="button" 
                onClick={() => setShowGeminiKey(!showGeminiKey)} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500"
              >
                {showGeminiKey ? 'Hide' : 'Show'}
              </button>
            </div>
            <a
              href="https://makersuite.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-1 inline-block text-xs text-neutral-600 hover:underline"
            >
              Get a Gemini API key →
            </a>
          </div>

          {/* Advanced Setup Button */}
          {!showReplicateSetup && (
            <div className="border-t pt-3">
              <button
                type="button"
                onClick={() => setShowReplicateSetup(true)}
                className="text-xs text-neutral-600 hover:text-neutral-900 hover:underline"
              >
                Advanced setup (optional) →
              </button>
            </div>
          )}

          {/* Replicate Token - Hidden by default */}
          {showReplicateSetup && (
            <div className="border-t pt-3">
              <div className="mb-2 flex items-center justify-between">
                <label htmlFor="replicate-token" className="block text-xs font-medium">
                  Replicate API Token (Optional)
                </label>
                <button
                  type="button"
                  onClick={() => setShowReplicateSetup(false)}
                  className="text-xs text-neutral-500 hover:text-neutral-700"
                >
                  Hide
                </button>
              </div>
              <p className="mb-2 text-xs text-neutral-600">
                Used as backup for video generation if Gemini VEO is unavailable
              </p>
              <div className="relative">
                <input
                  id="replicate-token"
                  type={showReplicateToken ? 'text' : 'password'}
                  value={replicateToken}
                  onChange={(e) => { setReplicateToken(e.target.value); setValidationError(null); }}
                  placeholder="r8_..."
                  className="w-full rounded border px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-neutral-400"
                />
                <button 
                  type="button" 
                  onClick={() => setShowReplicateToken(!showReplicateToken)} 
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-neutral-500"
                >
                  {showReplicateToken ? 'Hide' : 'Show'}
                </button>
              </div>
              <a
                href="https://replicate.com/account/api-tokens"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-1 inline-block text-xs text-neutral-600 hover:underline"
              >
                Get a Replicate API token →
              </a>
            </div>
          )}

          {validationError && (
            <div className="rounded border border-red-200 bg-red-50 p-2 text-xs text-red-700">
              {validationError}
            </div>
          )}

          <div className="flex gap-2 pt-2">
            {!required && (
              <button 
                type="button" 
                onClick={onClose} 
                className="rounded border bg-white px-3 py-2 text-sm hover:bg-neutral-50"
              >
                Cancel
              </button>
            )}
            {(geminiKey || replicateToken) && (
              <button 
                type="button" 
                onClick={handleClearKeys} 
                className="rounded border border-red-200 bg-white px-3 py-2 text-sm text-red-600 hover:bg-red-50"
              >
                Clear All
              </button>
            )}
            <button 
              type="submit" 
              className="flex-1 rounded bg-neutral-900 px-3 py-2 text-sm text-white hover:bg-neutral-800"
            >
              Save Configuration
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};