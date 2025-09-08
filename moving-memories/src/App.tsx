import { useEffect, useState } from 'react';
import { useMemoryStore } from './store/memoryStore';
import { geminiService } from './services/geminiService';
import { ApiKeyModal } from './components/ApiKeyModal';
import { UploadComponent } from './components/UploadComponent';
import { EnhanceComponent } from './components/EnhanceComponent';
import { GenerateComponent } from './components/GenerateComponent';
import { CompleteComponent } from './components/CompleteComponent';
import './utils/setApiKey'; // Auto-configure API key
import { Background } from './components/Background';
import { HighlightLine } from './components/HighlightLine';
 

function App() {
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const { currentStep, apiKey, error } = useMemoryStore();
  const displayStep = currentStep === 'prompt' ? 'generate' : currentStep;

  useEffect(() => {
    // Initialize with user-provided API key
    if (!isInitialized && apiKey) {
      try {
        geminiService.init(apiKey);
        setIsInitialized(true);
      } catch (err) {
        console.error('Failed to initialize Gemini service:', err);
      }
    }
  }, [isInitialized, apiKey]);

  const requiresApiKey = !apiKey || apiKey.trim() === ''; // Require API key from user

  useEffect(() => {
    if (requiresApiKey) setShowApiKeyModal(true);
  }, [requiresApiKey]);

  const renderCurrentStep = () => {
    switch (displayStep) {
      case 'upload':
        return <UploadComponent />;
      case 'enhance':
        return <EnhanceComponent />;
      case 'generate':
        return <GenerateComponent />;
      case 'complete':
        return <CompleteComponent />;
      default:
        return <GenerateComponent />; // Fallback to stable media container
    }
  };

  return (
    <Background>
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm">
        <div className="mx-auto max-w-4xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center">
                <span className="text-white text-lg">❤️</span>
              </div>
              <h1 className="text-xl font-semibold text-gray-900">Moving Memories</h1>
              <p className="hidden sm:block text-sm text-gray-500 ml-2">
                <HighlightLine>Transform photos into living memories</HighlightLine>
              </p>
            </div>
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {apiKey ? 'Update Key' : 'Setup'}
            </button>
          </div>
        </div>
      </header>

      {/* Progress Steps (Prompt removed, treat prompt as generate) */}
      <div className="border-b border-orange-100 bg-white/60">
        <div className="mx-auto max-w-4xl px-4 py-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between text-xs">
            <div className={`flex-1 text-center ${displayStep === 'upload' ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
              Upload
            </div>
            <div className={`flex-1 text-center ${displayStep === 'enhance' ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
              Enhance
            </div>
            <div className={`flex-1 text-center ${displayStep === 'generate' ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
              Generate
            </div>
            <div className={`flex-1 text-center ${displayStep === 'complete' ? 'text-orange-600 font-semibold' : 'text-gray-400'}`}>
              Done
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        {renderCurrentStep()}
        
        {error && (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-8 text-center">
        <p className="text-sm text-gray-500">
          Made with <span className="text-red-500">❤️</span> using{' '}
          <span className="font-medium">Gemini AI</span>
        </p>
      </footer>

      {/* Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => !requiresApiKey && setShowApiKeyModal(false)}
        required={requiresApiKey}
      />
    </Background>
  );
}

export default App;