// Quick utility to set the API key for testing
export const setApiKey = (key: string) => {
  localStorage.setItem('GEMINI_API_KEY', key);
  localStorage.setItem('moving-memories-store', JSON.stringify({
    state: {
      apiKey: key,
      userNote: ''
    },
    version: 0
  }));
  console.log('API key set successfully! Refresh the page.');
};

export const setReplicateToken = (token: string) => {
  localStorage.setItem('REPLICATE_API_TOKEN', token);
  console.log('Replicate token set.');
};

// Expose to window for easy access
if (typeof window !== 'undefined') {
  (window as any).setApiKey = setApiKey;
  (window as any).setReplicateToken = setReplicateToken;
}

// API keys must be provided by the user for security
// No default keys are stored in the codebase