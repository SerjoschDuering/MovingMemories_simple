import { GoogleGenAI } from '@google/genai';

class VeoService {
  private ai: GoogleGenAI | null = null;
  private apiKey: string | null = null;

  /**
   * Initialize the service with an API key
   */
  init(apiKey: string): void {
    this.ai = new GoogleGenAI({ apiKey });
    this.apiKey = apiKey;
  }

  /**
   * Generate a video from an image using VEO 3
   */
  async generateVideo(
    imageBytes: string, // base64 encoded image
    prompt: string,
    onProgress?: (status: string) => void,
    mimeType: string = 'image/jpeg'
  ): Promise<string> {
    if (!this.ai || !this.apiKey) {
      throw new Error('VEO service not initialized. Please provide an API key.');
    }

    try {
      if (onProgress) onProgress('Starting video generation...');
      
      // VEO API expects the request in a specific format
      const requestBody = {
        instances: [
          {
            prompt: prompt,
            image: {
              bytesBase64Encoded: imageBytes,
              mimeType: mimeType
            }
          }
        ]
      };

      // Make direct API call to VEO
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/veo-3.0-generate-preview:predictLongRunning?key=${this.apiKey}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[VEO] API error response:', errorText);
        throw new Error(`ApiError: ${errorText}`);
      }

      const operation = await response.json();

      // Poll until video is ready
      let pollCount = 0;
      const maxPolls = 30; // Maximum 5 minutes (10 sec intervals)
      let currentOperation = operation;
      
      while (!currentOperation.done && pollCount < maxPolls) {
        if (onProgress) {
          onProgress(`Generating video... (${pollCount * 10}s elapsed)`);
        }
        await new Promise((resolve) => setTimeout(resolve, 10000)); // 10 sec
        
        // Poll the operation status
        const pollResponse = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/${currentOperation.name}?key=${this.apiKey}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
            }
          }
        );
        
        if (pollResponse.ok) {
          currentOperation = await pollResponse.json();
        }
        pollCount++;
      }

      if (!currentOperation.done) {
        throw new Error('Video generation timed out. Please try again.');
      }

      // Get the video file reference
      const videoFile: any = currentOperation.response?.generatedVideos?.[0]?.video;
      if (!videoFile) {
        throw new Error('No video was generated.');
      }

      // In browser, download the protected file and return a Blob URL
      const fileUri: string | undefined = videoFile.uri;
      if (!fileUri) {
        throw new Error('No downloadable video URI was returned.');
      }

      // Prefer API key as query parameter for browser download
      const downloadUrl = fileUri.includes('key=')
        ? fileUri
        : `${fileUri}${fileUri.includes('?') ? '&' : '?'}key=${encodeURIComponent(this.apiKey || '')}`;

      if (onProgress) onProgress('Downloading video...');
      const res = await fetch(downloadUrl);
      if (!res.ok) {
        throw new Error(`Failed to download video (HTTP ${res.status})`);
      }
      const blob = await res.blob();
      const objectUrl = URL.createObjectURL(blob);

      if (onProgress) onProgress('Video ready!');
      return objectUrl;
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes('quota')) {
          throw new Error('API quota exceeded. Please check your API usage limits.');
        }
        if (error.message.includes('safety')) {
          throw new Error('Content was rejected for safety reasons. Please try different content.');
        }
        throw error;
      }
      throw new Error('Failed to generate video. Please try again.');
    }
  }

  /**
   * Replicate fallback: Seedance 1 Pro (image optional)
   */
  async generateVideoWithReplicate(
    prompt: string,
    imageUrl?: string,
    duration: number = 5,
    resolution: '480p' | '720p' | '1080p' = '480p',
    aspectRatio: '16:9' | '4:3' | '1:1' | '3:4' | '9:16' | '21:9' | '9:21' = '16:9',
  ): Promise<string> {
    const token = localStorage.getItem('REPLICATE_API_TOKEN');
    if (!token) throw new Error('Missing Replicate API token. Set REPLICATE_API_TOKEN in localStorage.');

    const body = {
      input: {
        prompt,
        duration,
        resolution,
        aspect_ratio: aspectRatio,
        image: imageUrl || null,
        fps: 24,
        camera_fixed: false,
      },
    } as const;

    const res = await fetch('/replicate/v1/models/bytedance/seedance-1-pro/predictions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'wait',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text();
      throw new Error(`Replicate failed (${res.status}): ${text}`);
    }

    const data = await res.json();
    // API returns output as a URL string according to the provided schema
    const outputUrl: string | undefined = data.output;
    if (!outputUrl) throw new Error('Replicate did not return an output URL.');
    return outputUrl;
  }

  /**
   * Generate video with simpler API if available
   */
  async generateVideoSimple(
    imageDataUrl: string,
    prompt: string
  ): Promise<string> {
    // Handle both data URLs and regular URLs
    if (imageDataUrl.startsWith('data:')) {
      // It's a base64 data URL
      const mimeMatch = imageDataUrl.match(/^data:([^;]+);base64,/i);
      const mimeType = mimeMatch?.[1] || 'image/jpeg';
      const base64 = imageDataUrl.split(',')[1];
      if (!base64) {
        throw new Error('Invalid data URL: missing base64 data');
      }
      return this.generateVideo(base64, prompt, undefined, mimeType);
    } else if (imageDataUrl.startsWith('http')) {
      // It's a regular URL - need to fetch and convert to base64
      try {
        const response = await fetch(imageDataUrl);
        if (!response.ok) {
          throw new Error(`Failed to fetch image: ${response.status}`);
        }
        const blob = await response.blob();
        const mimeType = blob.type || 'image/jpeg';
        
        // Convert blob to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onloadend = async () => {
            const dataUrl = reader.result as string;
            const base64 = dataUrl.split(',')[1];
            try {
              const result = await this.generateVideo(base64, prompt, undefined, mimeType);
              resolve(result);
            } catch (error) {
              reject(error);
            }
          };
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
      } catch (error) {
        console.error('[VEO] Failed to fetch and convert image URL:', error);
        throw new Error('Failed to process image URL for video generation');
      }
    } else {
      throw new Error('Invalid image format: must be either a data URL or HTTP URL');
    }
  }
}

// Export singleton instance
export const veoService = new VeoService();